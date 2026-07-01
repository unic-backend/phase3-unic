/**
 * Connecteur futur : DCMP Sénégal (Direction Centrale des Marchés Publics)
 *
 * STATUT : Non encore implémenté.
 *
 * Pour l'activer quand un accès fiable sera disponible :
 * 1. Implémenter la méthode collecter() ci-dessous
 * 2. Changer disponible: true
 * 3. L'enregistrer dans src/connectors/index.js
 * 4. Aucun autre changement dans l'application n'est nécessaire.
 *
 * Options d'intégration possibles (dans l'ordre de facilité) :
 * a) RSS/Atom feed si disponible sur https://www.dcmp.sn
 * b) Netlify Function qui scrape la page publique (risque : dépendant du HTML)
 * c) Partenariat officiel / API privée
 */

const DcmpConnecteur = {
  id: 'dcmp_sn',
  nom: 'DCMP Sénégal',
  description: 'Direction Centrale des Marchés Publics — appels d\'offres publics sénégalais.',
  logo: '🇸🇳',
  disponible: false, // ← changer à true une fois implémenté
  lienSource: 'https://www.dcmp.sn/marches/avis',
  pays: ['SN'],
  automatique: true,
  async collecter() {
    // TODO: implémenter quand un accès fiable sera disponible
    // Retourner un tableau d'OpportuniteBrute[] normalisées
    throw new Error('Connecteur DCMP non encore implémenté')
  },
}

export default DcmpConnecteur
