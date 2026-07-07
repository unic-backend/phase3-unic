/**
 * exportCSV — génération et téléchargement de fichiers CSV.
 *
 * Format CSV (RFC 4180) compatible Excel :
 *  - Séparateur virgule (l'Excel français reconnaît le BOM et interprète bien)
 *  - Guillemets doublés pour les valeurs contenant , " ou saut de ligne
 *  - BOM UTF-8 en tête pour préserver les accents dans Excel
 */

// Échappe une cellule selon RFC 4180 :
// wrapper de guillemets si contient virgule, guillemet ou saut de ligne.
function escapeCsvCell(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * Télécharge un CSV à partir d'un tableau d'objets.
 *
 * @param {Object[]} rows      Les lignes de données.
 * @param {Array<{key:string,label:string,format?:function}>} columns  Définition des colonnes.
 * @param {string}   filename  Nom du fichier (sans .csv).
 */
export function exporterCSV(rows, columns, filename) {
  if (!Array.isArray(rows) || !Array.isArray(columns) || columns.length === 0) {
    throw new Error('Données ou colonnes invalides')
  }

  const header = columns.map((c) => escapeCsvCell(c.label)).join(',')
  const lines = rows.map((row) =>
    columns.map((c) => {
      const raw = row[c.key]
      const value = typeof c.format === 'function' ? c.format(raw, row) : raw
      return escapeCsvCell(value)
    }).join(',')
  )

  // BOM UTF-8 pour Excel : sans lui, les accents deviennent illisibles.
  const csv = '\uFEFF' + [header, ...lines].join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `${filename}_${stamp}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Formatteur commun pour les Timestamps Firestore ou dates ISO
export function formatDate(v) {
  if (!v) return ''
  if (v.seconds) return new Date(v.seconds * 1000).toLocaleDateString('fr-FR')
  const d = new Date(v)
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('fr-FR')
}

// Formatteur monétaire — nombre brut (sans "FCFA") pour rester exploitable en calcul Excel
export function formatMontant(v) {
  const n = Number(v)
  return isNaN(n) ? '' : Math.round(n).toString()
}
