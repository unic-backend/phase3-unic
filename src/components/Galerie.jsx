const photos = [
    { id: 1, title: "Faux Plafonds BA13", category: "Plafond", image: '/images/services/1-ba13-ceiling.jpg' },
    { id: 2, title: "Cloisons Sèches", category: "Cloison", image: '/images/services/2-dry-walls.jpg' },
    { id: 3, title: "Doublage Mural", category: "Mur", image: '/images/services/3-wall-doubling.jpg' },
    { id: 4, title: "Peinture & Décoration", category: "Peinture", image: '/images/services/4-painting.jpg' },
    { id: 5, title: "Rénovation Complète", category: "Rénovation", image: '/photos/5-cafe-lounge.jpg' },
    { id: 6, title: "Corniches Décoratives", category: "Décoration", image: '/images/services/6-cornices.jpg' },
  ]

export default function Galerie() {
  return (
    <section id="realisations" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A3FA0] mb-4">
            Nos Réalisations
          </h2>
          <p className="text-xl text-gray-600">
            Découvrez nos projets avant et après
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map(photo => (
            <div
              key={photo.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition"
            >
              <img
                src={photo.image}
                alt={photo.title}
                className="w-full h-64 object-cover"
                loading="lazy"
              />
              <div className="p-5">
                <h3 className="text-xl font-bold text-[#1A3FA0] mb-1">
                  {photo.title}
                </h3>
                <p className="text-gray-600">
                  {photo.category}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
