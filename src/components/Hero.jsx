export default function Hero() {
  return (
    <section className="pt-32 pb-20 bg-gradient-to-br from-[#1A3FA0] via-[#0D1B4B] to-[#1A3FA0] text-white min-h-screen flex items-center justify-center overflow-hidden relative">
      {/* Animated background circles */}
      <div className="absolute w-96 h-96 bg-[#F2C200] opacity-10 rounded-full -top-48 -left-48 animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-[#F2C200] opacity-10 rounded-full -bottom-48 -right-48 animate-pulse animation-delay-2000"></div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="text-7xl md:text-8xl font-bold mb-6 animate-fade-in">
          UNIC <span className="text-[#F2C200] drop-shadow-lg">PLAQUISTE</span>
        </h1>
        
        <p className="text-2xl md:text-3xl mb-4 text-gray-200 animate-fade-in animation-delay-200">
          Rénovation & Décoration à Dakar, Sénégal
        </p>

        <p className="text-lg md:text-xl mb-12 text-gray-300 animate-fade-in animation-delay-400">
          BA13 • Faux plafonds • Cloisons • Peinture • Décoration intérieure
        </p>

        <div className="flex gap-6 justify-center flex-wrap mb-12 animate-fade-in animation-delay-600">
          <a href="#contact" className="bg-[#F2C200] text-[#1A3FA0] px-10 py-4 rounded-lg font-bold text-lg hover:bg-yellow-400 transition transform hover:scale-105 shadow-lg">
            Demander un Devis
          </a>
          <a href="#galerie" className="border-2 border-[#F2C200] text-[#F2C200] px-10 py-4 rounded-lg font-bold text-lg hover:bg-[#F2C200] hover:text-[#1A3FA0] transition">
            Voir nos projets
          </a>
        </div>

        <div className="flex justify-center gap-6 animate-fade-in animation-delay-800">
          <div className="text-center">
            <div className="text-4xl font-bold text-[#F2C200]">8+</div>
            <p className="text-sm text-gray-300">Ans d'expérience</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#F2C200]">100+</div>
            <p className="text-sm text-gray-300">Projets réalisés</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#F2C200]">98%</div>
            <p className="text-sm text-gray-300">Clients satisfaits</p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-[#F2C200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
