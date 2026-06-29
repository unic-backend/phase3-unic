// Trie une liste selon une clé de tri standard, utilisée par Devis et Factures.
// dateField = nom du champ date (createdAt), amountField = nom du champ montant (totalTTC ou amount)
export function trierListe(liste, sortKey, dateField = 'createdAt', amountField = 'totalTTC') {
  const copie = [...liste]
  switch (sortKey) {
    case 'date_asc':
      return copie.sort((a, b) => (a[dateField]?.seconds || 0) - (b[dateField]?.seconds || 0))
    case 'montant_desc':
      return copie.sort((a, b) => (b[amountField] || 0) - (a[amountField] || 0))
    case 'montant_asc':
      return copie.sort((a, b) => (a[amountField] || 0) - (b[amountField] || 0))
    case 'date_desc':
    default:
      return copie.sort((a, b) => (b[dateField]?.seconds || 0) - (a[dateField]?.seconds || 0))
  }
}

export const OPTIONS_TRI = [
  { value: 'date_desc', label: 'Plus récent' },
  { value: 'date_asc', label: 'Plus ancien' },
  { value: 'montant_desc', label: 'Montant ↓' },
  { value: 'montant_asc', label: 'Montant ↑' },
]
