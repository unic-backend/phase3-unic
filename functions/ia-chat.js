import { webcrypto } from 'node:crypto'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { ADMIN_EMAILS } from '../src/config/admins.js'
import { SYSTEM_PROMPT } from '../src/ia/systemPrompt.js'
console.log("IA-CHAT DEMARREE")

// Polyfill : certains environnements Netlify utilisent une version de Node
// où l'API Web Crypto (globalThis.crypto) n'est pas définie globalement.
// La librairie "jose" en a besoin pour vérifier les tokens. Sans risque :
// c'est la même implémentation native de Node, juste rendue accessible.
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto
}

const FIREBASE_PROJECT_ID = 'unic-plaquiste'

// Clés publiques Google utilisées pour vérifier les tokens Firebase Auth
// (pas besoin d'un compte de service : ce sont des clés publiques)
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

// Vérifie que la requête vient bien d'un compte admin connecté.
// Lève une erreur sinon (token absent, invalide, expiré, ou email non-admin).
async function verifierAdmin(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token manquant')
  }
  const token = authHeader.slice(7)
console.log("=== IA-CHAT ===")

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  })
console.log("Email du token :", payload.email)
console.log("Clé Claude présente :", !!process.env.CLAUDE_API_KEY)

  const email = (payload.email || '').toLowerCase()
  if (!ADMIN_EMAILS.includes(email)) {
    throw new Error('Accès refusé : compte non-admin')
  }
  return email
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), { status: 405 })
  }

  let email = ''

try {
  email = await verifierAdmin(req.headers.get('authorization'))
} catch (e) {
  console.log('Utilisateur non admin, accès autorisé en mode client')
}

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Requête invalide' }), { status: 400 })
  }

  const question = (body.question || '').trim()
const historique = Array.isArray(body.historique) ? body.historique : []

  if (!question) {
    return new Response(JSON.stringify({ error: 'Question vide' }), { status: 400 })
  }

  if (!process.env.CLAUDE_API_KEY) {
    console.error('CLAUDE_API_KEY manquante dans les variables d\'environnement Netlify')
    return new Response(JSON.stringify({ error: 'Assistant IA non configuré côté serveur' }), { status: 500 })
  }

 const systemPrompt = SYSTEM_PROMPT
 const messages = []

if (historique.length > 0) {
  for (const msg of historique) {
    messages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    })
  }
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
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    })
console.log("Appel API Claude...")

    if (!r.ok) {
  const errText = await r.text()
  console.error("===== ERREUR CLAUDE =====")
  console.error(r.status)
  console.error(errText)

  return new Response(
    JSON.stringify({ error: errText }),
    { status: r.status }
  )
}

    const data = await r.json()
    const reponse = data?.content?.find((b) => b.type === 'text')?.text || ''

    return new Response(JSON.stringify({ reponse }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (e) {
    console.error('Erreur fonction ia-chat:', e)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 })
  }
}
