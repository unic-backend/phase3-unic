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
Quand tu juges avoir assez d'informations pour permettre un devis, remercie le prospect et explique qu'Ousmane va examiner sa demande et le recontacter rapidement, sur WhatsApp ou via cette même page.

IMPORTANT : chaque fois qu'une information pertinente est mentionnée ou confirmée (même partiellement), appelle l'outil "mettre_a_jour_profil_projet" avec TOUTES les informations connues jusqu'ici (pas seulement les nouvelles) — en plus de ta réponse conversationnelle normale.`

const OUTILS = [
  {
    name: 'mettre_a_jour_profil_projet',
    description: "Enregistre ou met à jour les informations connues sur le projet du prospect. À appeler chaque fois qu'une information pertinente est mentionnée, avec l'ensemble des informations connues jusqu'ici.",
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
  },
]

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
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        tools: OUTILS,
        messages,
      }),
    })

    if (!r.ok) {
      const errText = await r.text()
      console.error('Erreur API Claude (prospect-chat):', r.status, errText)
      return new Response(JSON.stringify({ error: 'Erreur du service IA' }), { status: 502 })
    }

    const data = await r.json()
    const reponse = (data?.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
    const appelOutil = (data?.content || []).find((b) => b.type === 'tool_use' && b.name === 'mettre_a_jour_profil_projet')
    const infosExtraites = appelOutil ? appelOutil.input : null

    return new Response(JSON.stringify({ reponse, infosExtraites }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (e) {
    console.error('Erreur fonction prospect-chat:', e)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 })
  }
}
