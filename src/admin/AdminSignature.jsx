import { useState, useEffect } from 'react'
import { getSignatureAdmin, enregistrerSignatureAdmin } from '../services/parametresService'
import PadSignature from '../components/PadSignature'
import { PenTool, CheckCircle2 } from 'lucide-react'

export default function AdminSignature() {
  const [signature, setSignature] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    getSignatureAdmin().then((img) => { setSignature(img); setLoading(false) })
  }, [])

  const sauvegarder = async (dataUrl) => {
    setEnregistrement(true)
    if (await enregistrerSignatureAdmin(dataUrl)) {
      setSignature(dataUrl)
      setMessage('Signature enregistrée ! Elle apparaîtra automatiquement sur tous les prochains PDF.')
      setTimeout(() => setMessage(''), 4000)
    } else {
      setMessage('Erreur lors de l\'enregistrement')
    }
    setEnregistrement(false)
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <PenTool size={26} style={{ color: 'var(--gold)' }} />
          Ma signature
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Dessine ta signature une seule fois — elle sera ajoutée automatiquement sur tous les devis et factures PDF générés ensuite, à la place de la ligne "Signature : ____".
        </p>
      </div>

      {message && (
        <div className="px-4 py-2.5 rounded-2xl text-sm font-semibold badge-success animate-scale-in flex items-center gap-2">
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {loading ? (
        <div className="skeleton-dark h-48 rounded-2xl" />
      ) : (
        <div className="card-dark p-5">
          {signature && (
            <div className="mb-4">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>SIGNATURE ACTUELLE</p>
              <div className="rounded-xl p-3" style={{ background: 'white' }}>
                <img src={signature} alt="Signature actuelle" className="h-16 mx-auto" />
              </div>
            </div>
          )}
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>
            {signature ? 'REDESSINER UNE NOUVELLE SIGNATURE' : 'DESSINE TA SIGNATURE'}
          </p>
          <PadSignature onSave={sauvegarder} enregistrementEnCours={enregistrement} />
        </div>
      )}
    </div>
  )
}
