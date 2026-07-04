import { webcrypto } from 'node:crypto'
import { jwtVerify, createRemoteJWKSet } from 'jose'

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto
}

const FIREBASE_PROJECT_ID = 'unic-plaquiste'

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

// Vérifie que la requête vient d'un utilisateur connecté (admin OU client).
async function verifierUtilisateur(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Vous devez être connecté pour utiliser l\'assistant.')
  }
  const token = authHeader.slice(7)
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  })
  return (payload.email || '').toLowerCase()
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), { status: 405 })
  }

  let userEmail
  try {
    userEmail = await verifierUtilisateur(req.headers.get('authorization'))
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Requête invalide' }), { status: 400 })
  }

  const question = (body.question || '').trim()
  const contexte = Array.isArray(body.contexte) ? body.contexte : []
  const historique = Array.isArray(body.historique) ? body.historique : []

  if (!question) {
    return new Response(JSON.stringify({ error: 'Question vide' }), { status: 400 })
  }

  if (!process.env.CLAUDE_API_KEY) {
    console.error('CLAUDE_API_KEY manquante dans les variables d\'environnement Netlify')
    return new Response(JSON.stringify({ error: 'Assistant IA non configuré côté serveur' }), { status: 500 })
  }

  // ── System prompt — intelligent, honnête, adaptatif ──────────────────────
  const systemPrompt = `Tu es l'assistant IA officiel de UniC Plaquiste, entreprise spécialisée en plaquisterie (BA13), faux plafonds, cloisons sèches et décoration intérieure, basée à Dakar, Sénégal. Le gérant s'appelle Ousmane Diop.

## TES RÈGLES ABSOLUES

1. **Sois honnête** : si tu ne sais pas, dis-le. Ne fabrique JAMAIS de chiffres, dimensions, délais ou prix.
2. **Adapte-toi au client** : chaque client est différent. Utilise UNIQUEMENT les informations que le client te donne (surface, type de projet, budget). N'invente JAMAIS de dimensions.
3. **Garde le fil** : souviens-toi de tout ce que le client a dit dans la conversation. Si un client dit "j'ai 100 m²", utilise 100 m² dans tous tes calculs suivants. Si un autre dit "120 m²", utilise 120 m².
4. **Ne confonds pas les clients** : chaque conversation est indépendante. Ne mélange pas les données d'un client avec un autre.
5. **Sois concis** : réponds de façon claire et directe, sans blabla inutile.
6. **Parle en français** : toujours.

## TARIFS OFFICIELS UniC Plaquiste (ne jamais modifier ces prix)

### Faux plafond BA13 :
- **Pose + fourniture (sans peinture)** : 11 000 FCFA / m²
- **Pose + fourniture + peinture** : 15 000 FCFA / m²

### Si le client a déjà acheté ses matériaux (pose seule) :
- Tu ne donnes PAS de prix toi-même.
- Tu dis : "Pour la pose seule, je transmets votre dossier à Ousmane pour qu'il vous donne un prix personnalisé adapté à votre projet."

### Cloisons, doublage, décoration, rénovation :
- Prix sur devis uniquement.
- Tu dis : "Ce type de travaux nécessite une étude personnalisée. Ousmane vous préparera un devis sur mesure."

## COMMENT CALCULER UN DEVIS ESTIMATIF

Quand un client donne une surface, tu calcules :
- Total = surface × prix au m²
- Exemple : "Pour 100 m² de faux plafond BA13 avec peinture : 100 × 15 000 = 1 500 000 FCFA"
- Précise toujours que c'est un **estimatif** et que le devis final sera confirmé par Ousmane.

## CE QUE TU NE FAIS JAMAIS

- Ne donne JAMAIS un prix pour la pose seule — redirige vers Ousmane.
- Ne fabrique JAMAIS de dimensions si le client ne les a pas données. Demande-lui.
- Ne dis JAMAIS que tu es ChatGPT, OpenAI, ou un autre modèle. Tu es l'assistant UniC Plaquiste.
- Ne propose JAMAIS de services que UniC Plaquiste ne fait pas.
- Ne fais JAMAIS de promesses sur les délais sans que le client ait donné les détails du projet.

## INFORMATIONS SUR L'ENTREPRISE

- Nom : UniC Plaquiste
- Gérant : Ousmane Diop
- Localisation : Guelle Tapée, Rue 59x60 et 62, Dakar, Sénégal
- Téléphone : +221 77 708 50 92
- Email : Unicplaquiste@gmail.com
- Site : unicplaquiste.com
- Spécialités : Faux plafonds BA13, cloisons sèches, doublage, isolation, décoration intérieure, peinture
- Zone d'intervention : Dakar et tout le Sénégal, disponible aussi à l'international
- Fondée en 2019, plus de 100 projets réalisés
- Devis gratuit, garantie 1 an sur les travaux

${contexte.length ? '\n## CONNAISSANCES INTERNES (base de données UniC)\n' + contexte.join('\n---\n') : ''}`

  // ── Construction des messages multi-tour ──────────────────────────────────
  // L'historique permet à l'IA de se souvenir du contexte de la conversation.
  const messages = []

  // Ajouter l'historique (filtré : uniquement user et assistant)
  for (const msg of historique.slice(-20)) { // max 20 messages pour rester dans le budget tokens
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content })
    }
  }

  // Ajouter la question actuelle
  messages.push({ role: 'user', content: question })

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: systemPrompt,
        messages,
      }),
    })

    if (!r.ok) {
      const errText = await r.text()
      console.error('Erreur API Claude:', r.status, errText)
      return new Response(JSON.stringify({ error: 'Service IA temporairement indisponible. Réessayez.' }), { status: 502 })
    }

    const data = await r.json()
    const reponse = data?.content?.find((b) => b.type === 'text')?.text || ''

    return new Response(JSON.stringify({ reponse }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (e) {
    console.error('Erreur fonction ia-chat:', e)
    return new Response(JSON.stringify({ error: 'Erreur serveur. Réessayez.' }), { status: 500 })
  }
}
