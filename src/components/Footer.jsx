import { Facebook, Instagram, Music2, MessageCircle, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#0D1B4B] text-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="animate-fade-in">
            <h3 className="font-bold text-[#F2C200] mb-4 text-lg">UNIC Plaquiste</h3>
            <p className="text-gray-400 leading-relaxed">
              Votre partenaire de confiance pour tous vos travaux de rénovation et décoration intérieure à Dakar.
            </p>
          </div>

          <div className="animate-fade-in">
            <h4 className="font-bold mb-6 text-lg">Services</h4>
            <ul className="text-gray-400 space-y-3">
              <li><a href="#services" className="hover:text-[#F2C200] transition">Faux plafonds</a></li>
              <li><a href="#services" className="hover:text-[#F2C200] transition">Cloisons</a></li>
              <li><a href="#services" className="hover:text-[#F2C200] transition">Peinture</a></li>
              <li><a href="#services" className="hover:text-[#F2C200] transition">Décoration</a></li>
            </ul>
          </div>

          <div className="animate-fade-in">
            <h4 className="font-bold mb-6 text-lg">Infos Légales</h4>
            <ul className="text-gray-400 space-y-3 text-sm">
              <li>NINEA: 013141677</li>
              <li>RCCM: SN.DKR.2026.A.22010</li>
              <li>Depuis: 2019</li>
              <li>8+ ans d'expérience</li>
            </ul>
          </div>

          <div className="animate-fade-in">
            <h4 className="font-bold mb-6 text-lg">Nous Suivre</h4>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook UniC Plaquiste" className="hover:text-[#F2C200] transition p-1.5 -m-1.5 rounded-full"><Facebook size={22} /></a>
              <a href="https://instagram.com/unic_plaquiste" target="_blank" rel="noopener noreferrer" aria-label="Instagram UniC Plaquiste" className="hover:text-[#F2C200] transition p-1.5 -m-1.5 rounded-full"><Instagram size={22} /></a>
              <a href="https://tiktok.com/@unic_plaquiste" target="_blank" rel="noopener noreferrer" aria-label="TikTok UniC Plaquiste" className="hover:text-[#F2C200] transition p-1.5 -m-1.5 rounded-full"><Music2 size={22} /></a>
              <a href="https://wa.me/221777085092" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp UniC Plaquiste" className="hover:text-[#F2C200] transition p-1.5 -m-1.5 rounded-full"><MessageCircle size={22} /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <p className="text-center text-gray-400">
            © 2026 UNIC Plaquiste. Tous droits réservés. | Créé avec <Heart size={14} className="inline text-red-500 fill-red-500" /> à Dakar
          </p>
        </div>
      </div>
    </footer>
  )
}
