import { useState, useEffect } from 'react'
import { getAvisPublics } from '../services/reviewService'
import { Star, Quote } from 'lucide-react'

// Étoiles pleines/vides selon la note
function Etoiles({ note }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={16}
          fill={i <= note ? '#F2C200' : 'none'}
          style={{ color: i <= note ? '#F2C200' : '#D1D5DB' }} />
      ))}
    </div>
  )
}

export default function Temoignages() {
  const [avis, setAvis] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAvisPublics().then(list => { setAvis(list); setLoading(false) })
  }, [])

  // On n'affiche rien tant qu'il n'y a pas d'avis (section masquée proprement)
  if (loading || avis.length === 0) return null

  const noteMoyenne = (avis.reduce((s, a) => s + (a.note || 0), 0) / avis.length).toFixed(1)

  return (
    <section id="temoignages" className="py-16 px-4" style={{ background: '#F8FAFC' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: '#1A3FA0' }}>
            Ils nous ont fait confiance
          </h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Etoiles note={Math.round(noteMoyenne)} />
            <span className="font-bold text-gray-800">{noteMoyenne}/5</span>
            <span className="text-gray-500 text-sm">· {avis.length} avis client{avis.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {avis.slice(0, 6).map(a => (
            <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
              <Quote size={24} style={{ color: '#F2C200' }} className="mb-2" />
              <p className="text-gray-700 text-sm flex-1 leading-relaxed">
                {a.commentaire || 'Très satisfait du travail réalisé.'}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Etoiles note={a.note} />
                <p className="font-semibold text-gray-800 text-sm mt-2">{a.clientNom}</p>
                {a.projetNom && <p className="text-xs text-gray-400">{a.projetNom}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
