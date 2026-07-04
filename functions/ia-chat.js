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
  const isAdmin = body.isAdmin === true

  if (!question) {
    return new Response(JSON.stringify({ error: 'Question vide' }), { status: 400 })
  }

  if (!process.env.CLAUDE_API_KEY) {
    console.error('CLAUDE_API_KEY manquante dans les variables d\'environnement Netlify')
    return new Response(JSON.stringify({ error: 'Assistant IA non configuré côté serveur' }), { status: 500 })
  }

  // ── System prompt — différencié admin vs client ──────────────────────────
  const baseInfo = `## INFORMATIONS ENTREPRISE
- Nom : UniC Plaquiste
- Gérant : Ousmane Diop
- Localisation : Guelle Tapée, Rue 59x60 et 62, Dakar, Sénégal
- Téléphone : +221 77 708 50 92
- Email : Unicplaquiste@gmail.com
- Site : unicplaquiste.com
- Spécialités : Faux plafonds BA13, cloisons sèches, doublage, isolation, décoration intérieure, peinture
- Zone : Dakar et tout le Sénégal, disponible à l'international
- Fondée en 2019, plus de 100 projets réalisés
- Devis gratuit, garantie 1 an

## TARIFS OFFICIELS
- Faux plafond BA13 pose + fourniture (sans peinture) : 11 000 FCFA / m²
- Faux plafond BA13 pose + fourniture + peinture : 15 000 FCFA / m²
- Pose seule (client fournit matériaux) : prix personnalisé par Ousmane
- Cloisons, doublage, décoration, rénovation : sur devis personnalisé

${contexte.length ? '## CONNAISSANCES INTERNES\n' + contexte.join('\n---\n') : ''}`

  const adminPrompt = `Tu es l'assistant personnel d'Ousmane Diop, gérant de UniC Plaquiste.

## TON RÔLE
Tu es le bras droit intelligent d'Ousmane. Tu l'aides à :
- Gérer son entreprise (devis, factures, clients, projets)
- Calculer des estimations et préparer des chiffrages
- Analyser son activité et identifier les opportunités
- Rédiger des messages professionnels pour ses clients
- Prendre des décisions business (tarifs, stratégie, planning)

## COMMENT TU PARLES À OUSMANE
- Tu le tutoies (c'est ton patron, mais vous êtes proches)
- Tu es direct, concis, sans chichis
- Tu donnes des conseils business concrets
- Tu peux critiquer positivement si une idée peut être améliorée
- Tu rappelles les tâches importantes quand il te le demande

## RÈGLES
- Sois honnête. Ne fabrique jamais de chiffres.
- Utilise uniquement les données qu'Ousmane te donne.
- Tu as accès à toute l'information de l'entreprise.
- Tu peux proposer des stratégies et des idées proactives.

${baseInfo}`

  const clientPrompt = `Tu es l'assistant IA de UniC Plaquiste, disponible pour les clients.

## TON RÔLE
Tu accueilles les clients, réponds à leurs questions, et les aides à comprendre les services et tarifs de UniC Plaquiste.

## COMMENT TU PARLES AUX CLIENTS
- Tu les vouvoies
- Tu es chaleureux, professionnel, rassurant
- Tu donnes des estimations claires basées sur LEURS données
- Tu ne donnes JAMAIS de prix pour la pose seule → tu dis : "Pour la pose seule, je transmets votre dossier à Ousmane pour qu'il vous donne un prix personnalisé."

## RÈGLES ABSOLUES
1. N'invente JAMAIS de dimensions, surfaces ou prix. Utilise UNIQUEMENT ce que le client te donne.
2. Si le client donne 100 m², calcule avec 100 m². Si un autre dit 120 m², calcule avec 120 m².
3. Chaque client est unique — ne mélange jamais les données.
4. Précise toujours que ton estimation est indicative et que le devis final sera confirmé par Ousmane.
5. Pour les cloisons, doublage, décoration : dis "Ce type de travaux nécessite une étude personnalisée. Ousmane vous préparera un devis sur mesure."
6. Ne dis jamais que tu es ChatGPT ou un autre modèle. Tu es l'assistant UniC Plaquiste.
7. Sois concis. Pas de blabla.

${baseInfo}`

  const systemPrompt = isAdmin ? adminPrompt : clientPrompt

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
