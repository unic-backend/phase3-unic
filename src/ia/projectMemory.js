export function createProjectMemory() {
  return {
    typeTravaux: null,
    surface: null,
    longueur: null,
    largeur: null,
    hauteur: null,
    typeBatiment: null,
    ville: null,
    materiaux: null,
    peinture: null,
    isolation: null,
    decoration: null,
    spots: null,
    trappe: null,
    dateDebut: null,
  }
}

export function updateProjectMemory(memory, message) {
  const text = message.toLowerCase()

  if (text.includes('faux plafond')) {
    memory.typeTravaux = 'Faux plafond'
  }

  if (text.includes('cloison')) {
    memory.typeTravaux = 'Cloison'
  }

  if (text.includes('doublage')) {
    memory.typeTravaux = 'Doublage'
  }

 const surface =
  text.match(/(\d+(?:[.,]\d+)?)\s*m²/i) ||
  text.match(/(\d+(?:[.,]\d+)?)\s*m2/i)

if (surface) {
  memory.surface = Number(surface[1].replace(',', '.'))
}

const dimensions = text.match(
  /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/i
)

if (dimensions) {
  memory.longueur = Number(dimensions[1].replace(',', '.'))
  memory.largeur = Number(dimensions[2].replace(',', '.'))

  if (!memory.surface) {
    memory.surface = memory.longueur * memory.largeur
  }
}

  if (text.includes('maison')) {
    memory.typeBatiment = 'Maison'
  }

  if (text.includes('bureau')) {
    memory.typeBatiment = 'Bureau'
  }

  if (text.includes('appartement')) {
    memory.typeBatiment = 'Appartement'
  }

  if (
    text.includes('j’ai déjà les matériaux') ||
    text.includes("j'ai déjà les matériaux") ||
    text.includes('materiaux deja')
  ) {
    memory.materiaux = 'Client'
  }

  if (text.includes('pose + fourniture')) {
    memory.materiaux = 'UniC Plaquiste'
  }

  if (text.includes('avec peinture')) {
    memory.peinture = 'Oui'
  }

  if (text.includes('sans peinture')) {
    memory.peinture = 'Non'
  }

  return memory
}

export function memoryToText(memory) {
  return `
PROJET EN COURS

Type de travaux : ${memory.typeTravaux || 'Inconnu'}
Surface : ${memory.surface || 'Inconnue'}
Longueur : ${memory.longueur || 'Inconnue'}
Largeur : ${memory.largeur || 'Inconnue'}
Hauteur : ${memory.hauteur || 'Inconnue'}
Bâtiment : ${memory.typeBatiment || 'Inconnu'}
Ville : ${memory.ville || 'Inconnue'}
Matériaux : ${memory.materiaux || 'Inconnus'}
Peinture : ${memory.peinture || 'Inconnue'}
Isolation : ${memory.isolation || 'Inconnue'}
Décoration : ${memory.decoration || 'Inconnue'}
Spots LED : ${memory.spots || 'Inconnus'}
Trappe : ${memory.trappe || 'Inconnue'}
Date souhaitée : ${memory.dateDebut || 'Inconnue'}
`
}