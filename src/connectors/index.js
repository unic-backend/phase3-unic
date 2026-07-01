/**
 * REGISTRE DES CONNECTEURS
 *
 * Pour ajouter un nouveau connecteur :
 * 1. Créer le fichier src/connectors/mon_connecteur.js (respecter l'interface)
 * 2. L'importer ici et l'ajouter au tableau CONNECTEURS
 * C'est tout. L'interface se met à jour automatiquement.
 */

import ManuelConnecteur from './manual.js'
import DcmpConnecteur from './dcmp_sn.js'

// Tous les connecteurs, dans l'ordre d'affichage dans l'UI
export const CONNECTEURS = [
  ManuelConnecteur,
  DcmpConnecteur,
  // Exemples de futurs connecteurs à implémenter :
  // { id: 'armp_sn', nom: 'ARMP Sénégal', disponible: false, lienSource: 'https://www.armp.sn', ... }
  // { id: 'worldbank', nom: 'Banque Mondiale', disponible: false, lienSource: 'https://projects.worldbank.org', ... }
  // { id: 'afdb', nom: 'BAD', disponible: false, lienSource: 'https://www.afdb.org', ... }
  // { id: 'google_alerts', nom: 'Google Alerts', disponible: false, ... }
  // { id: 'email_parser', nom: 'Email (Gmail)', disponible: false, ... }
]

export const getConnecteur = (id) => CONNECTEURS.find(c => c.id === id) || ManuelConnecteur
export const getConnecteursActifs = () => CONNECTEURS.filter(c => c.disponible)
export const getConnecteursFuturs = () => CONNECTEURS.filter(c => !c.disponible)

/**
 * Lance la collecte depuis tous les connecteurs automatiques actifs.
 * Appelé par une Netlify Function planifiée (quand les connecteurs seront actifs).
 * Pour l'instant cette fonction ne fait rien — elle est prête pour le futur.
 */
export const collecterDepuisToutes = async () => {
  const actifs = CONNECTEURS.filter(c => c.disponible && c.automatique)
  const resultats = await Promise.allSettled(actifs.map(c => c.collecter()))
  const opportunites = []
  resultats.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      r.value.forEach(o => opportunites.push({ ...o, sourceId: actifs[i].id }))
    } else {
      console.warn(`Connecteur ${actifs[i].id} a échoué:`, r.reason)
    }
  })
  return opportunites
}
