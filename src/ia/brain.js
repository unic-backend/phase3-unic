import { ENTREPRISE } from './entreprise'
import { SERVICES } from './services'
import { MATERIAUX } from './materiaux'
import { TARIFS } from './tarifs'
import { CALCULS } from './calculs'
import { ZONES } from './zones'
import { FAQ } from './faq'
import { CONSEILS } from './conseils'
import { NORMES } from './normes'
import { REALISATIONS } from './realisations'
import { PORTFOLIO } from './portfolio'
import { DEVIS } from './devis'
import { SIGNATURES } from './signatures'
import { FINANCES } from './finances'
import { NOTIFICATIONS } from './notifications'
import { APPELS_OFFRES } from './appelsOffres'
import { PROSPECTION } from './prospection'
import { SECURITE } from './securite'
import { ASSISTANT_CLIENT } from './assistantClient'

export function construireContexte(question, connaissances = [], portfolio = []) {
  const q = question.toLowerCase()

  const contexte = []

  // Toujours présent
  contexte.push(ENTREPRISE)
contexte.push(SECURITE)
contexte.push(ASSISTANT_CLIENT)

  // Services
  if (
    q.includes('service') ||
    q.includes('travaux') ||
    q.includes('plafond') ||
    q.includes('cloison')
  ) {
    contexte.push(SERVICES)
  }

  // Matériaux
  if (
  q.includes('ba13') ||
  q.includes('plaque') ||
  q.includes('rail') ||
  q.includes('montant') ||
  q.includes('laine') ||
  q.includes('fourrure') ||
  q.includes('cornière') ||
  q.includes('corniere') ||
  q.includes('vis') ||
  q.includes('enduit')
) {
  contexte.push(MATERIAUX)
}

  // Tarifs
  if (
    q.includes('prix') ||
q.includes('coût') ||
q.includes('tarif') ||
q.includes('devis') ||
q.includes('estimation') ||
q.includes('m²') ||
q.includes('m2') ||
q.includes('ml')
  ) {
    contexte.push(TARIFS)
contexte.push(CALCULS)
  }

  // Zones
  if (
    q.includes('où') ||
    q.includes('zone') ||
    q.includes('dakar') ||
    q.includes('sénégal')
  ) {
    contexte.push(ZONES)
  }

  // FAQ
  contexte.push(FAQ)
// Conseils et normes
contexte.push(CONSEILS)
contexte.push(NORMES)
// Réalisations et portfolio
contexte.push(REALISATIONS)
contexte.push(PORTFOLIO)
contexte.push(SIGNATURES)
// Devis
if (
  q.includes('devis') ||
  q.includes('prix') ||
  q.includes('estimation') ||
  q.includes('coût')
) {
  contexte.push(DEVIS)
}

// Finances
if (
  q.includes('facture') ||
  q.includes('paiement') ||
  q.includes('budget') ||
  q.includes('finance')
) {
  contexte.push(FINANCES)
}

// Appels d'offres et prospection
if (
  q.includes('appel d\'offres') ||
  q.includes('marché') ||
  q.includes('sous-traitance') ||
  q.includes('prospection')
) {
  contexte.push(APPELS_OFFRES)
  contexte.push(PROSPECTION)
}

// Notifications
if (
  q.includes('notification') ||
  q.includes('rappel')
) {
  contexte.push(NOTIFICATIONS)
}
  // Base de connaissances Firebase
  contexte.push(...connaissances)

  // Portfolio
  contexte.push(...portfolio)

  return contexte
}