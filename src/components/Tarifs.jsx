import { useState } from 'react'
import { Calculator, Check, Info, ClipboardList } from 'lucide-react'

export default function Tarifs() {
  const [surface, setSurface] = useState(25)

  const prixUnitaire = 11000
  const totalHT = surface * prixUnitaire
  const totalTTC = totalHT

  return (
    <section id="tarifs" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-2xl md:text-4xl font-bold text-[#1A3FA0] mb-4 text-center">Tarifs</h2>
        <p className="text-gray-600 text-center mb-12">Transparent et compétitif</p>

        {/* Tarif unitaire */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-2">Prix unitaire</p>
            <p className="text-5xl font-bold text-[#F2C200]">11,000 FCFA</p>
            <p className="text-gray-600 text-sm mt-2">par m² — pose + fourniture sans peinture</p>
            <p className="text-gray-500 text-xs mt-1">Avec finition peinture : 15 000 FCFA/m²</p>
          </div>

          {/* Description du prix */}
          <div className="bg-blue-50 border-l-4 border-[#1A3FA0] p-6 mb-8 rounded">
            <h3 className="font-bold text-[#1A3FA0] mb-3 flex items-center gap-2"><Check size={18} className="text-green-600" /> Ce prix inclut:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2"><Check size={16} className="text-green-600 mt-1 shrink-0" /><span><strong>Achat des matériaux</strong> (BA13, vis, joints, etc.)</span></li>
              <li className="flex items-start gap-2"><Check size={16} className="text-green-600 mt-1 shrink-0" /><span><strong>Pose complète</strong> (installation professionnelle)</span></li>
              <li className="flex items-start gap-2"><Check size={16} className="text-green-600 mt-1 shrink-0" /><span><strong>Fournitures</strong> (vis, joints, adhésif, etc.)</span></li>
              <li className="flex items-start gap-2"><Check size={16} className="text-green-600 mt-1 shrink-0" /><span><strong>Main-d'œuvre</strong> (équipe qualifiée)</span></li>
              <li className="flex items-start gap-2"><Check size={16} className="text-green-600 mt-1 shrink-0" /><span><strong>Nettoyage du chantier</strong></span></li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">💡 Option finition peinture (2 couches minimum) : 15 000 FCFA/m² au lieu de 11 000.</p>
          </div>

          {/* Calculatrice */}
          <div className="bg-[#0D1B4B] text-white p-8 rounded-lg">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Calculator size={20} /> Calculez votre budget</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-bold mb-2">Surface en m²:</label>
              <input
                type="number"
                value={surface}
                onChange={(e) => setSurface(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-3 border-2 border-[#F2C200] rounded-lg text-black text-lg font-bold"
                min="1"
              />
            </div>

            {/* Résultat */}
            <div className="space-y-3 bg-white bg-opacity-10 p-6 rounded-lg">
              <div className="flex justify-between text-lg">
                <span>Montant TTC:</span>
                <span className="font-bold text-[#F2C200]">{totalTTC.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <p className="text-sm text-gray-300 mt-4">
                Prix sans TVA (Sénégal). Devis détaillé fourni après consultation.
              </p>
            </div>
          </div>
        </div>

        {/* Notes importantes */}
        <div className="bg-yellow-50 border-2 border-[#F2C200] p-6 rounded-lg">
          <h3 className="font-bold text-[#1A3FA0] mb-3 flex items-center gap-2"><ClipboardList size={18} /> Important:</h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li>• Le prix peut varier selon les finitions spéciales demandées</li>
            <li>• Un devis personnalisé vous sera proposé après visite du chantier</li>
            <li>• Acompte 50% à la signature du contrat</li>
            <li>• Délai de réalisation: 2-4 semaines selon la surface</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
