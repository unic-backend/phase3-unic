import { webcrypto } from 'node:crypto'
import { jwtVerify, createRemoteJWKSet } from 'jose'

// Même polyfill que ia-chat.js — voir ce fichier pour l'explication.
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto
}

const FIREBASE_PROJECT_ID = 'unic-plaquiste'

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

// Vérifie juste que le token Firebase est valide (y compris anonyme).
// Contrairement à ia-chat.js, PAS de vérification admin ici : cette fonction
// doit répondre à n'importe quel visiteur public du lien WhatsApp.
async function verifierToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token manquant')
  }
  const token = authHeader.slice(7)
  await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  })
}

const SYSTEM_PROMPT = `Tu es l'assistant en ligne de UniC Plaquiste, entreprise de plaquisterie (BA13), cloisons et décoration intérieure à Dakar, Sénégal.
Tu discutes avec un prospect qui arrive depuis WhatsApp pour décrire un projet de travaux.
Pose des questions simples, une à la fois, pour récolter progressivement : type de projet, localisation, surface approximative (m²), souhait peinture incluse ou non, budget indicatif, délai souhaité, et toute exigence particulière.
Reste chaleureux, concis, professionnel, en français.
Ne donne JAMAIS de prix précis toi-même — dis que Ousmane (le gérant) étudiera la demande et reviendra avec un devis personnalisé.
Quand tu juges avoir assez d'informations pour permettre un devis, remercie le prospect et explique qu'Ousmane va examiner sa demande et le recontacter rapidement, sur WhatsApp ou via cette même page.`

const SYSTEM_EXTRACTION = `Tu lis une conversation entre l'assistant de UniC Plaquiste et un prospect.
Utilise l'outil fourni pour renvoyer l'état le plus complet possible des informations connues sur le projet, en te basant sur TOUTE la conversation (pas seulement le dernier message).
Omets un champ si l'information n'a pas été mentionnée. N'invente jamais une valeur.`

const OUTIL_EXTRACTION = {
  name: 'enregistrer_profil_projet',
  description: "Renvoie l'ensemble des informations connues sur le projet du prospect, déduites de toute la conversation.",
  input_schema: {
    type: 'object',
    properties: {
      typeProjet: { type: 'string', description: "Identifiant si possible : faux-plafond, cloison, peinture, doublage, corniche, renovation. Sinon description libre." },
      localisation: { type: 'string', description: 'Ville ou quartier du chantier' },
      surfaceM2: { type: 'number', description: 'Surface approximative en m²' },
      avecPeinture: { type: 'boolean', description: 'true si peinture incluse souhaitée, false sinon (surtout pertinent pour faux-plafond)' },
      budgetIndicatif: { type: 'string', description: 'Budget mentionné par le client, tel quel' },
      delaiSouhaite: { type: 'string', description: 'Délai souhaité pour les travaux' },
      exigencesParticulieres: { type: 'string', description: 'Détails ou exigences particulières mentionnées' },
    },
  },
}

// Appel 1 : la réponse conversationnelle normale, affichée au prospect.
async function appelConversation(messages) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages,
    }),
  })
  if (!r.ok) {
    const errText = await r.text()
    console.error('Erreur API Claude (conversation):', r.status, errText)
    throw new Error('Erreur du service IA')
  }
  const data = await r.json()
  return (data?.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
}

// Appel 2 : extraction structurée FORCÉE (tool_choice) — contrairement à un appel
// où l'outil est juste "disponible", ici Claude DOIT s'en servir, donc on a toujours
// un résultat, peu importe le tour de conversation. Coût supplémentaire faible
// (peu de tokens), largement justifié par la fiabilité.
async function appelExtraction(messages, derniereReponseIA) {
  const historiqueComplet = [...messages, { role: 'assistant', content: derniereReponseIA || '(pas de réponse)' }]
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: SYSTEM_EXTRACTION,
      tools: [OUTIL_EXTRACTION],
      tool_choice: { type: 'tool', name: 'enregistrer_profil_projet' },
      messages: historiqueComplet,
    }),
  })
  if (!r.ok) {
    const errText = await r.text()
    console.error('Erreur API Claude (extraction):', r.status, errText)
    return null // l'extraction est un bonus : si elle échoue, la conversation continue quand même
  }
  const data = await r.json()
  const appelOutil = (data?.content || []).find((b) => b.type === 'tool_use' && b.name === 'enregistrer_profil_projet')
  return appelOutil ? appelOutil.input : null
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), { status: 405 })
  }

  try {
    await verifierToken(req.headers.get('authorization'))
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Session invalide, recharge la page.' }), { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Requête invalide' }), { status: 400 })
  }

  // Filet de sécurité côté serveur en plus de la limite Firestore (défense en profondeur)
  const messages = Array.isArray(body.messages) ? body.messages.slice(-30) : []
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Conversation vide' }), { status: 400 })
  }

  if (!process.env.CLAUDE_API_KEY) {
    console.error('CLAUDE_API_KEY manquante dans les variables d\'environnement Netlify')
    return new Response(JSON.stringify({ error: 'Assistant non configuré côté serveur' }), { status: 500 })
  }

  try {
    const reponse = await appelConversation(messages)
    const infosExtraites = await appelExtraction(messages, reponse)

    return new Response(JSON.stringify({ reponse, infosExtraites }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (e) {
    console.error('Erreur fonction prospect-chat:', e)
    return new Response(JSON.stringify({ error: e.message || 'Erreur serveur' }), { status: 500 })
  }
}
