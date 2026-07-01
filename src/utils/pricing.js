// ⚠️ SOURCE UNIQUE DES TARIFS — ne recopie ces chiffres nulle part ailleurs.
// Si un tarif change un jour, modifie-le UNIQUEMENT ici : NewDevis.jsx (estimation
// montrée au client) et quoteService.js (montant réellement enregistré) lisent
// tous les deux ce fichier, donc ils restent toujours synchronisés.

export const TARIFS = {
  'faux-plafond': { avecPeinture: 13500, sansPeinture: 11000 },
}

// Types pour lesquels le prix n'est pas encore fixé : pas d'estimation chiffrée
// affichée au client, l'admin propose un prix personnalisé après étude.
export const TYPES_SUR_DEVIS = ['cloison']

// Tarif générique pour les types pas encore détaillés ci-dessus
// (peinture décoration, doublage, corniches, rénovation complète).
const PRIX_PAR_DEFAUT = 15000

export function estSurDevis(type) {
  return TYPES_SUR_DEVIS.includes(type)
}

// Retourne le prix au m², ou null si le type est "sur devis" (pas de prix fixe)
export function calculerPrixUnitaire(type, avecPeinture) {
  if (estSurDevis(type)) return null
  const tarif = TARIFS[type]
  if (!tarif) return PRIX_PAR_DEFAUT
  return avecPeinture ? tarif.avecPeinture : tarif.sansPeinture
}

// Retourne le montant total (0 si "sur devis" — pas une vraie estimation à 0 FCFA)
export function calculerMontant(type, surface, avecPeinture) {
  const prixUnitaire = calculerPrixUnitaire(type, avecPeinture)
  if (prixUnitaire === null) return 0
  return (Number(surface) || 0) * prixUnitaire
}

// Affichage cohérent du montant d'un devis, qu'il ait un prix fixe ou "sur devis"
export function formatMontant(devis) {
  if (devis?.surDevis) return 'Sur devis personnalisé'
  return `${(devis?.totalTTC || 0).toLocaleString('fr-FR')} FCFA`
}
