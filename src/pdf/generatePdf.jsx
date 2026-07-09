// Génère et télécharge le PDF, en chargeant la librairie seulement à cet instant
// (elle est assez lourde — pas question de l'imposer à tous les visiteurs du site
// alors que seuls les admins/clients utilisent cette fonction).

import { getSignatureAdmin } from '../services/parametresService'

function declencherTelechargement(blob, nomFichier) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function formatDateAffichee(valeur) {
  let d
  if (valeur?.seconds) d = new Date(valeur.seconds * 1000)
  else if (valeur) d = new Date(valeur)
  else d = new Date()
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function telechargerDevisPDF(devis) {
  const { pdf } = await import('@react-pdf/renderer')
  const { default: DevisPDF } = await import('./DevisPDF.jsx')
  const signatureAdmin = await getSignatureAdmin()

  // Recharge le devis frais depuis Firestore : garantit d'avoir la signature
  // client la plus récente (le client a pu signer entre-temps). Si le
  // rechargement échoue, on retombe sur la version passée en paramètre.
  let devisAJour = devis
  if (devis?.id) {
    try {
      const { getDevisParId } = await import('../services/quoteService')
      const frais = await getDevisParId(devis.id)
      if (frais) devisAJour = frais
    } catch { /* on garde la version fournie */ }
  }

  const donnees = {
    ...devisAJour,
    dateAffichee: formatDateAffichee(devisAJour.createdAt),
    signatureAdmin,
  }
  const blob = await pdf(<DevisPDF devis={donnees} />).toBlob()
  declencherTelechargement(blob, `${devisAJour.quoteNumber || 'devis'}.pdf`)
}

export async function telechargerFacturePDF(facture) {
  const { pdf } = await import('@react-pdf/renderer')
  const { default: FacturePDF } = await import('./FacturePDF.jsx')
  const signatureAdmin = await getSignatureAdmin()

  // Recharge la facture fraîche : garantit la signature client à jour
  // (le client a pu signer entre-temps via le lien).
  let factureAJour = facture
  if (facture?.id) {
    try {
      const { getFactureParId } = await import('../services/invoiceService')
      const fraiche = await getFactureParId(facture.id)
      if (fraiche) factureAJour = fraiche
    } catch { /* on garde la version fournie */ }
  }

  const donnees = { ...factureAJour, dateAffichee: formatDateAffichee(factureAJour.issueDate || factureAJour.createdAt), signatureAdmin }
  const blob = await pdf(<FacturePDF facture={donnees} />).toBlob()
  declencherTelechargement(blob, `${factureAJour.invoiceNumber || 'facture'}.pdf`)
}
