import { auth } from '../firebase/init'

export async function poserQuestion(question, historique = []) {
  const utilisateur = auth.currentUser

  if (!utilisateur) {
    throw new Error('Utilisateur non connecté')
  }

  const token = await utilisateur.getIdToken()

  const response = await fetch('/.netlify/functions/ia-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      question,
      historique,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Erreur IA')
  }

  return data.reponse
}