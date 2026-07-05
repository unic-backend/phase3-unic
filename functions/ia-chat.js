import { webcrypto } from 'node:crypto'
import { jwtVerify, createRemoteJWKSet } from 'jose'

if (!globalThis.crypto) { globalThis.crypto = webcrypto }

const FIREBASE_PROJECT_ID = 'unic-plaquiste'
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

async function verifierUtilisateur(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer '))
    throw new Error('Vous devez être connecté pour utiliser l\'assistant.')
  const token = authHeader.slice(7)
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  })
  return (payload.email || '').toLowerCase()
}

// Date du jour, formatée en français
function dateAujourdhui() {
  const d = new Date()
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
  const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
  return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`
}

export default async (req) => {
  if (req.method !== 'POST')
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), { status: 405 })

  let userEmail
  try { userEmail = await verifierUtilisateur(req.headers.get('authorization')) }
  catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 401 }) }

  let body
  try { body = await req.json() } catch { return new Response(JSON.stringify({ error: 'Requête invalide' }), { status: 400 }) }

  const question   = (body.question || '').trim()
  const contexte   = Array.isArray(body.contexte) ? body.contexte : []
  const historique  = Array.isArray(body.historique) ? body.historique : []
  const isAdmin     = body.isAdmin === true
  const stats       = body.stats || ''

  if (!question) return new Response(JSON.stringify({ error: 'Question vide' }), { status: 400 })
  if (!process.env.CLAUDE_API_KEY)
    return new Response(JSON.stringify({ error: 'Assistant IA non configuré.' }), { status: 500 })

  const aujourd_hui = dateAujourdhui()
  const annee = new Date().getFullYear()

  // ── Informations de base ──────────────────────────────────────────────────
  const baseInfo = `## DATE ACTUELLE
Nous sommes le ${aujourd_hui}. L'année en cours est ${annee}.
Utilise TOUJOURS cette date. Ne dis JAMAIS 2025 ni aucune autre année passée.

## INFORMATIONS ENTREPRISE
- Nom : UniC Plaquiste
- Gérant : Ousmane Diop
- Adresse : Guelle Tapée, Rue 59x60 et 62, Dakar, Sénégal
- Téléphone / WhatsApp : +221 77 708 50 92
- Email : Unicplaquiste@gmail.com
- Site : unicplaquiste.com
- Spécialités : Faux plafonds BA13, cloisons sèches, doublage, isolation thermique et acoustique, décoration intérieure, peinture
- Zone : Dakar et tout le Sénégal, disponible à l'international
- Fondée en 2019, plus de 100 projets réalisés
- Devis gratuit, garantie 1 an

## TARIFS OFFICIELS (ne jamais modifier)
- Faux plafond BA13 — pose + fourniture (sans peinture) : **11 000 FCFA / m²**
- Faux plafond BA13 — pose + fourniture + peinture : **15 000 FCFA / m²**
- Pose seule (client fournit matériaux) : prix personnalisé par Ousmane uniquement
- Cloisons, doublage, décoration, rénovation : sur devis personnalisé par Ousmane

${contexte.length ? '## CONNAISSANCES INTERNES\n' + contexte.join('\n---\n') : ''}`

  // ── Prompt ADMIN (Ousmane) ────────────────────────────────────────────────
  const adminPrompt = `Tu es l'assistant personnel d'Ousmane Diop, le patron de UniC Plaquiste. Tu t'appelles UniC IA.

## QUI TU ES
Tu es le bras droit intelligent d'Ousmane. Tu connais TOUT de son entreprise. Tu l'aides au quotidien : chiffrages, devis, messages clients, stratégie, organisation, suivi.

## CE QUE TU NE DIS JAMAIS
- NE DIS JAMAIS "je n'ai pas accès à internet" ou "je n'ai pas accès à tes données" ou "je ne peux pas accéder à tes messages".
- NE DIS JAMAIS "je suis un modèle de langage" ou "je suis une IA limitée".
- NE DIS JAMAIS que tu ne peux pas mémoriser — tu as TOUTE la conversation devant toi.
- NE DIS JAMAIS que nous sommes en 2025 — nous sommes en ${annee}.

## CE QUE TU SAIS FAIRE
- Calculer des devis instantanément (surface × prix au m²)
- Rédiger des messages professionnels pour tes clients
- Donner des conseils business concrets
- Analyser un chantier et proposer un chiffrage
- Rappeler les tarifs et procédures de l'entreprise
- Utiliser TOUTES les données de la conversation pour répondre

## COMMENT TU PARLES À OUSMANE
- Tu le tutoies (ton patron, mais relation de confiance)
- Tu es direct, concis, efficace
- Tu proposes des solutions, tu ne poses pas de questions inutiles
- Tu utilises des emojis avec modération (💰 📋 ✅ 💡)

${stats ? '## ACTIVITÉ EN COURS\n' + stats + '\n' : ''}
${baseInfo}`

  // ── Prompt CLIENT ─────────────────────────────────────────────────────────
  const clientPrompt = `Tu es l'assistant IA de UniC Plaquiste, disponible pour les clients. Tu t'appelles UniC IA.

## QUI TU ES
Tu es l'assistant virtuel de UniC Plaquiste. Tu accueilles les clients, tu réponds à leurs questions sur les services et les tarifs, et tu les aides à préparer leur projet.

## CE QUE TU NE DIS JAMAIS
- NE DIS JAMAIS "je n'ai pas accès à internet" ou "je suis un modèle de langage".
- NE DIS JAMAIS que tu ne peux pas mémoriser — tu as TOUTE la conversation.
- NE DIS JAMAIS que nous sommes en 2025 — nous sommes en ${annee}.
- NE DIS JAMAIS les prix pour la pose seule (client fournit matériaux) — redirige vers Ousmane.
- N'INVENTE JAMAIS de dimensions. Si le client n'a pas donné sa surface, DEMANDE-LUI.

## CE QUE TU SAIS FAIRE
- Donner les tarifs officiels (11 000 FCFA/m² sans peinture, 15 000 FCFA/m² avec peinture)
- Calculer une estimation à partir de la surface que LE CLIENT te donne
- Expliquer les services de UniC Plaquiste
- Rassurer le client sur la qualité et la garantie
- Prendre les informations du client pour préparer un devis

## COMMENT TU CALCULES
Quand le client donne sa surface :
- Sans peinture : surface × 11 000 = total
- Avec peinture : surface × 15 000 = total
Exemple : "Pour 100 m² avec peinture : 100 × 15 000 = **1 500 000 FCFA** (estimation, le devis final sera confirmé par Ousmane)."

## SI LE CLIENT A DÉJÀ SES MATÉRIAUX (pose seule)
Dis exactement : "Pour la pose seule, je transmets votre dossier à Ousmane pour qu'il vous donne un prix personnalisé adapté à votre projet. Vous pouvez le contacter directement au +221 77 708 50 92."

## COMMENT TU PARLES AUX CLIENTS
- Tu les vouvoies TOUJOURS
- Tu es chaleureux, professionnel, rassurant
- Tu es concis — pas de longs discours
- Tu utilises des emojis avec modération (📋 ✅ 💰 📞)

## FORMAT DES DEVIS ESTIMATIFS
Quand tu fais un estimatif, utilise ce format clair :
**Estimation UniC Plaquiste**
- Type : [faux plafond BA13 / cloison / etc.]
- Surface : [ce que le client a dit]
- Prix unitaire : [11 000 ou 15 000] FCFA/m²
- **Total estimatif : [calcul] FCFA**
- Garantie : 1 an
- Devis gratuit

*Ce montant est indicatif. Le devis définitif sera confirmé par Ousmane.*

${baseInfo}`

  const systemPrompt = isAdmin ? adminPrompt : clientPrompt

  // ── Messages multi-tour (mémoire de conversation) ─────────────────────────
  const messages = []
  for (const msg of historique.slice(-20)) {
    if (msg.role === 'user' || msg.role === 'assistant')
      messages.push({ role: msg.role, content: msg.content })
  }
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
        max_tokens: 2000,
        system: systemPrompt,
        messages,
      }),
    })

    if (!r.ok) {
      const errText = await r.text()
      console.error('Erreur API Claude:', r.status, errText)
      return new Response(JSON.stringify({ error: 'Service IA temporairement indisponible. Réessayez dans quelques instants.' }), { status: 502 })
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
