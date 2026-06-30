export default function Services() {
  const services = [
    {
      image: "/photos/1-cuisine-moderne.jpg",
      title: "Cuisine Moderne",
      desc: "Rénovation complète de cuisine avec faux plafond et finitions haut de gamme"
    },
    {
      image: "/photos/2-salon-luxe.jpg",
      title: "Salon Luxe",
      desc: "Transformation de salon avec faux plafond design et décoration élégante"
    },
    {
      image: "/photos/3-station-service.jpg",
      title: "Station Service",
      desc: "Aménagement commercial avec plafonds décoratifs et éclairage moderne"
    },
    {
      image: "/photos/4-bureau-professionnel.jpg",
      title: "Bureau Professionnel",
      desc: "Installation de cloisons et faux plafonds pour espaces de travail"
    },
    {
      image: "/photos/5-chambre-elegante.jpg",
      title: "Chambre Élégante",
      desc: "Peinture décorative et finitions soignées pour chambres à coucher"
    },
    {
      image: "/photos/6-escalier-design.jpg",
      title: "Escalier Design",
      desc: "Doublage mural et habillage design autour des escaliers"
    }
  ]

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-[#1A3FA0] mb-4 text-center">Nos Services</h2>
        <p className="text-gray-600 text-center mb-12">Des solutions complètes pour tous vos travaux de rénovation</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <div key={idx} className="bg-gray-50 rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 card-premium">
              <div className="h-48 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#1A3FA0] mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
