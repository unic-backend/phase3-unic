/**
 * Service des opportunités d'affaires
 *
 * SCHÉMA FIRESTORE (collection: opportunites)
 * ─────────────────────────────────────────────
 * id              : string      (auto Firestore)
 * titre           : string
 * description     : string      — description complète
 * type            : string      — voir TYPES_OPPORTUNITE
 * sourceId        : string      — id du connecteur (voir src/connectors/index.js)
 * sourceNom       : string      — nom lisible de la source
 * lienOriginal    : string      — URL vers l'annonce source
 * localisation    : { pays, ville, region }
 * montantEstime   : number      — en FCFA (0 = non précisé)
 * devise          : string      — 'FCFA' | 'EUR' | 'USD'
 * deadline        : string      — ISO date (YYYY-MM-DD)
 * datePublication : string      — ISO date
 * statut          : string      — voir STATUTS_OPPORTUNITE
 * priorite        : string      — 'haute' | 'normale' | 'faible'
 * tags            : string[]
 * documents       : { nom, url }[]
 * notes           : string
 * analyseIA       : { texte, score, recommandation, dateAnalyse } | null
 * rappels         : { date, message, declenche }[]
 * createdAt       : Timestamp
 * updatedAt       : Timestamp
 */

import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, getDoc, query, orderBy, where, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/init'

export const TYPES_OPPORTUNITE = [
  'Appel d\'offres public',
  'Marché privé',
  'Sous-traitance',
  'Contrat direct',
  'Projet international',
  'Appel à manifestation d\'intérêt',
  'Autre',
]

export const STATUTS_OPPORTUNITE = [
  'Nouveau',
  'En étude',
  'En préparation',
  'Soumis',
  'Gagné',
  'Perdu',
  'Annulé',
]

export const PRIORITES = ['Haute', 'Normale', 'Faible']

export const COULEURS_STATUT = {
  'Nouveau': '#F2C200',
  'En étude': '#60A5FA',
  'En préparation': '#A78BFA',
  'Soumis': '#FB923C',
  'Gagné': '#34D399',
  'Perdu': '#F87171',
  'Annulé': '#6B7280',
}

export const COULEURS_PRIORITE = { 'Haute': '#F87171', 'Normale': '#F2C200', 'Faible': '#6B7280' }

function fmtFCFA(n) {
  return Math.round(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ')
}

// Normalise une OpportuniteBrute venant d'un connecteur
// ou les données d'un formulaire admin en un document Firestore propre.
function normaliser(data, sourceId = 'manual', sourceNom = 'Saisie manuelle') {
  return {
    titre: data.titre || '',
    description: data.description || '',
    type: data.type || TYPES_OPPORTUNITE[0],
    sourceId,
    sourceNom: data.sourceNom || sourceNom,
    lienOriginal: data.lienOriginal || data.lien || '',
    localisation: {
      pays: data.localisation?.pays || data.pays || 'SN',
      ville: data.localisation?.ville || data.ville || '',
      region: data.localisation?.region || '',
    },
    montantEstime: Number(data.montantEstime) || 0,
    devise: data.devise || 'FCFA',
    deadline: data.deadline || '',
    datePublication: data.datePublication || new Date().toISOString().slice(0, 10),
    statut: data.statut || 'Nouveau',
    priorite: data.priorite || 'Normale',
    tags: Array.isArray(data.tags) ? data.tags : [],
    documents: Array.isArray(data.documents) ? data.documents : [],
    notes: data.notes || '',
    analyseIA: data.analyseIA || null,
    rappels: Array.isArray(data.rappels) ? data.rappels : [],
  }
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

export const ajouterOpportunite = async (data, sourceId = 'manual', sourceNom = 'Saisie manuelle') => {
  try {
    const doc_ = { ...normaliser(data, sourceId, sourceNom), createdAt: Timestamp.now(), updatedAt: Timestamp.now() }
    const ref = await addDoc(collection(db, 'opportunites'), doc_)
    return { id: ref.id, ...doc_ }
  } catch (e) { console.error('ajouterOpportunite:', e); return null }
}

export const getToutesOpportunites = async () => {
  try {
    const snap = await getDocs(query(collection(db, 'opportunites'), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) { console.error('getToutesOpportunites:', e); return [] }
}

export const getOpportunite = async (id) => {
  try {
    const snap = await getDoc(doc(db, 'opportunites', id))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (e) { console.error('getOpportunite:', e); return null }
}

export const modifierOpportunite = async (id, data) => {
  try {
    await updateDoc(doc(db, 'opportunites', id), { ...data, updatedAt: Timestamp.now() })
    return true
  } catch (e) { console.error('modifierOpportunite:', e); return false }
}

export const supprimerOpportunite = async (id) => {
  try { await deleteDoc(doc(db, 'opportunites', id)); return true }
  catch (e) { console.error('supprimerOpportunite:', e); return false }
}

// ─── Actions métier ──────────────────────────────────────────────────────────

export const changerStatut = async (id, statut) =>
  modifierOpportunite(id, { statut })

export const changerPriorite = async (id, priorite) =>
  modifierOpportunite(id, { priorite })

export const enregistrerAnalyseIA = async (id, { texte, score, recommandation }) =>
  modifierOpportunite(id, {
    analyseIA: { texte, score: Number(score)||0, recommandation, dateAnalyse: Timestamp.now() }
  })

export const ajouterNote = async (id, note) =>
  modifierOpportunite(id, { notes: note })

export const ajouterRappel = async (id, { date, message }) => {
  const opp = await getOpportunite(id)
  if (!opp) return false
  const rappels = [...(opp.rappels || []), { date, message, declenche: false }]
  return modifierOpportunite(id, { rappels })
}

// Vérifie les rappels dont la date est dépassée (à appeler au chargement de la page)
export const getRappelsEchus = (opportunites) => {
  const aujourd = new Date().toISOString().slice(0, 10)
  const echus = []
  opportunites.forEach(o => {
    (o.rappels || []).forEach(r => {
      if (!r.declenche && r.date <= aujourd) {
        echus.push({ opportunite: o, rappel: r })
      }
    })
    // Rappel automatique : deadline dans 3 jours ou moins
    if (o.deadline && o.statut !== 'Gagné' && o.statut !== 'Perdu' && o.statut !== 'Annulé') {
      const joursRestants = Math.ceil((new Date(o.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      if (joursRestants >= 0 && joursRestants <= 3) {
        echus.push({
          opportunite: o,
          rappel: { date: o.deadline, message: `Deadline dans ${joursRestants} jour(s) : ${o.titre}`, auto: true }
        })
      }
    }
  })
  return echus
}

// Texte de prompt standard pour l'analyse IA d'une opportunité
export const construirePromptAnalyse = (o) => {
  const loc = [o.localisation?.ville, o.localisation?.pays].filter(Boolean).join(', ')
  return `Analyse cette opportunité d'affaires pour UniC Plaquiste (spécialiste plaquisterie BA13, faux plafonds, cloisons sèches, décoration intérieure — basé à Dakar, Sénégal, disponible à l'international) :

Titre : ${o.titre}
Type : ${o.type}
Source : ${o.sourceNom}
Localisation : ${loc || 'non précisé'}
Montant estimé : ${o.montantEstime > 0 ? fmtFCFA(o.montantEstime) + ' ' + (o.devise || 'FCFA') : 'non précisé'}
Deadline : ${o.deadline || 'non précisé'}
Description : ${o.description || 'non précisée'}
Notes : ${o.notes || 'aucune'}

Réponds en 3 parties :
1. PERTINENCE (0-10 avec justification) : à quel point cette opportunité correspond-elle à l'expertise de UniC Plaquiste ?
2. POINTS DE VIGILANCE : risques, conditions préalables, points à vérifier.
3. RECOMMANDATION : une action concrète immédiate à faire (GO / NO-GO / À ÉTUDIER + raison en une phrase).

Sois direct et concis.`
}
