import { webcrypto } from 'node:crypto'

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), { status: 405 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Requête invalide' }), { status: 400 })
  }

  const question = (body.question || '').trim()
  let historique = Array.isArray(body.historique) ? body.historique : []

  if (!question) {
    return new Response(JSON.stringify({ error: 'Question vide' }), { status: 400 })
  }

  if (!process.env.CLAUDE_API_KEY) {
    console.error('CLAUDE_API_KEY manquante')
    return new Response(JSON.stringify({ error: 'Assistant non configuré' }), { status: 500 })
  }

  // Ajoute la question actuelle si l'historique est vide
  if (historique.length === 0) {
    historique.push({ role: 'user', content: question })
  }

  const SYSTEM_PROMPT = `Tu es l'assistant professionnel de UniC Plaquiste à Dakar.

RÈGLES DE PRIX OBLIGATOIRES :
- Fourniture + Pose SANS peinture = 11 000 FCFA par m²
- Fourniture + Pose AVEC peinture = 15 000 FCFA par m²

RÈGLES IMPORTANTES :
- Tu ne dois JAMAIS dire que la pose seule coûte 11 000 FCFA.
- Quand le client a déjà les matériaux, tu ne donnes aucun prix. Tu demandes les infos nécessaires puis tu dis : "Ousmane va vous contacter pour vous donner le prix de la pose seulement."
- Après chaque estimation, tu dis toujours : "Le devis final sera donné par Ousmane. Ousmane va vous contacter pour vous envoyer le devis final."
- Tu ne poses jamais deux fois la même question.
- Tu gardes en mémoire toute la conversation.
- Tu restes professionnel et clair.`

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: historique,
      }),
    })

    if (!r.ok) {
      const errText = await r.text()
      console.error("Erreur Claude:", r.status, errText)
      return new Response(JSON.stringify({ error: 'Erreur IA' }), { status: 500 })
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