export const mockDevis = [
  {
    id: 1,
    clientId: 1,
    quoteNumber: 'UC-2026-0620-KM',
    title: 'Faux plafond salon',
    description: 'Installation faux plafond BA13 dans salon 25m²',
    type: 'Faux plafond',
    surface: 25,
    pricePerM2: 15000,
    totalTTC: 375000,
    localisation: 'Dakar',
    urgence: 'ASAP',
    status: 'Approuvé',
    createdAt: '2026-06-20',
    expiryDate: '2026-07-20'
  },
  {
    id: 2,
    clientId: 1,
    quoteNumber: 'UC-2026-0622-BT',
    title: 'Cloisons sèches',
    description: 'Création 2 cloisons sèches avec isolation',
    type: 'Cloison',
    surface: 30,
    pricePerM2: 15000,
    totalTTC: 450000,
    localisation: 'Dakar',
    urgence: '1 semaine',
    status: 'En attente',
    createdAt: '2026-06-22',
    expiryDate: '2026-07-22'
  },
  {
    id: 3,
    clientId: 1,
    quoteNumber: 'UC-2026-0625-RN',
    title: 'Peinture complète',
    description: 'Peinture et décoration appartement complet',
    type: 'Peinture',
    surface: 80,
    pricePerM2: 15000,
    totalTTC: 1200000,
    localisation: 'Dakar',
    urgence: 'Pas pressé',
    status: 'Rejeté',
    createdAt: '2026-06-25',
    expiryDate: '2026-07-25'
  }
]

export const mockProjets = [
  {
    id: 1,
    name: 'Cuisine Moderne',
    description: 'Rénovation complète cuisine avec faux plafond',
    status: 'En cours',
    progress: 75,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    responsable: 'Ousmane Diop',
    montant: 1050000
  },
  {
    id: 2,
    name: 'Salon Luxe',
    description: 'Transformation salon avec faux plafond design',
    status: 'Finalisé',
    progress: 100,
    startDate: '2026-05-01',
    endDate: '2026-06-15',
    responsable: 'Ousmane Diop',
    montant: 1500000
  }
]

export const mockFactures = [
  {
    id: 1,
    invoiceNumber: 'FAC-2026-001',
    amount: 1050000,
    status: 'Payée',
    issueDate: '2026-06-01',
    dueDate: '2026-06-15'
  },
  {
    id: 2,
    invoiceNumber: 'FAC-2026-002',
    amount: 1500000,
    status: 'En attente',
    issueDate: '2026-06-15',
    dueDate: '2026-06-29'
  }
]

export const mockMessages = [
  { id: 1, sender: 'Ousmane', text: 'Bonjour! Comment allez-vous?', time: '10:30', read: true },
  { id: 2, sender: 'Vous', text: 'Bien merci! Où en sont les travaux?', time: '10:35', read: true },
  { id: 3, sender: 'Ousmane', text: 'Très bien! 75% d\'avancement.', time: '10:40', read: true }
]
