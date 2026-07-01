/**
 * Connecteur : Saisie manuelle
 *
 * Chaque connecteur doit exporter un objet respectant cette interface :
 *
 *   id          : string     — identifiant unique, stable dans le temps
 *   nom         : string     — nom affiché à l'utilisateur
 *   description : string     — description courte
 *   logo        : string     — emoji ou initiales
 *   disponible  : boolean    — true = connecteur opérationnel
 *   lienSource  : string     — URL vers la source officielle
 *   pays        : string[]   — pays couverts ('SN' = Sénégal, '*' = mondial)
 *   automatique : boolean    — true = collecte sans intervention humaine
 *   async collecter()        — retourne un tableau d'objets OpportuniteBrute[]
 *                              ou [] si pas de collecte automatique
 *
 * OpportuniteBrute = {
 *   titre: string,
 *   description: string,
 *   type: string,
 *   localisation: { pays, ville, region },
 *   montantEstime: number,
 *   devise: string,
 *   deadline: string (ISO),
 *   datePublication: string (ISO),
 *   lienOriginal: string,
 *   sourceId: string,  // ← id du connecteur
 * }
 */

const ManuelConnecteur = {
  id: 'manual',
  nom: 'Saisie manuelle',
  description: 'Opportunités ajoutées directement par l\'administrateur. Toujours disponible.',
  logo: '✏️',
  disponible: true,
  lienSource: null,
  pays: ['*'],
  automatique: false,
  async collecter() {
    // La saisie manuelle n'a pas de collecte automatique — les données
    // sont créées directement dans Firestore via l'interface admin.
    return []
  },
}

export default ManuelConnecteur
