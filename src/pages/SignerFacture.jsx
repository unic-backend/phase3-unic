import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getFactureParToken, signerFactureClient } from '../services/invoiceService'
import PadSignature from '../components/PadSignature'
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import logo from '../assets/logo.webp'

function fmtFCFA(n) {
  return Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'
}

export default function SignerFacture() {
  const { token } = useParams()
  const [facture, setFacture] = useState(null)
  const [etape, setEtape] = useState('chargement') // chargement | resume | signe | erreur
  const [erreur, setErreur] = useState('')
  const [signatureEnCours, setSignatureEnCours] = useState(false)

  useEffect(() => {
    if (!token) { setEtape('erreur'); setErreur('Lien invalide.'); return }
    getFactureParToken(token).then((f) => {
      if (!f) { setEtape('erreur'); setErreur('Ce lien est invalide ou a expiré.'); return }
      if (f.status === 'Signée' || f.signatureClient) { setFacture(f); setEtape('signe'); return }
      if (f.status !== 'En attente de signature') { setEtape('erreur'); setErreur('Cette facture n\'est plus disponible pour signature.'); return }
      setFacture(f)
      setEtape('resume')
    }).catch(() => { setEtape('erreur'); setErreur('Impossible de charger la facture. Réessaie.') })
  }, [token])

  const signer = async (signatureBase64) => {
    setSignatureEnCours(true)
    const ok = await signerFactureClient(facture.id, token, signatureBase64)
    if (ok) {
      setEtape('signe')
    } else {
      setErreur('Erreur lors de la signature. Réessaie.')
    }
    setSignatureEnCours(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: 'var(--dark-bg)' }}>
      {/* En-tête */}
      <div className="w-full px-4 py-3 flex items-center gap-3 glass-dark shrink-0"
        style={{ borderBottom: '1px solid var(--dark-border)', paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <img src={logo} alt="UniC Plaquiste" className="h-9 w-auto" />
        <div>
          <p className="text-sm font-bold text-white">UniC Plaquiste</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Signature électronique — Facture</p>
        </div>
      </div>

      <div className="w-full max-w-lg px-4 py-6 space-y-4 flex-1">
        {/* Chargement */}
        {etape === 'chargement' && (
          <div className="flex justify-center items-center h-40">
            <Sparkles size={28} className="animate-pulse" style={{ color: 'var(--gold)' }} />
          </div>
        )}

        {/* Erreur */}
        {etape === 'erreur' && (
          <div className="card-dark p-6 text-center space-y-3">
            <AlertCircle size={36} className="mx-auto" style={{ color: '#F87171' }} />
            <p className="font-bold text-white">Lien non valide</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{erreur}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Contacte UniC Plaquiste sur WhatsApp : <a href="https://wa.me/221777085092" style={{ color: 'var(--gold)' }}>+221 77 708 50 92</a></p>
          </div>
        )}

        {/* Déjà signée */}
        {etape === 'signe' && (
          <div className="card-dark p-8 text-center space-y-4">
            <CheckCircle2 size={48} className="mx-auto" style={{ color: '#34D399' }} />
            <p className="text-xl font-bold text-white">Facture signée ✓</p>
            {facture && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>N° {facture.invoiceNumber} — {fmtFCFA(facture.amount)}</p>}
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Merci {facture?.clientNom || ''} ! Votre facture est validée. UniC Plaquiste vous recontacte rapidement sur WhatsApp.
            </p>
          </div>
        )}

        {/* Résumé de la facture */}
        {etape === 'resume' && facture && (
          <>
            <div className="animate-fade-in">
              <h1 className="text-xl font-bold text-white mb-1">Facture à signer</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Vérifie les informations ci-dessous, puis signe pour valider.
              </p>
            </div>

            <div className="card-dark p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>N° Facture</span>
                <span className="text-sm font-bold text-white">{facture.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Client</span>
                <span className="text-sm font-bold text-white">{facture.clientNom || facture.clientEmail || '—'}</span>
              </div>
              {facture.issueDate && (
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Date d'émission</span>
                  <span className="text-sm font-bold text-white">{facture.issueDate}</span>
                </div>
              )}
              {facture.dueDate && (
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Échéance</span>
                  <span className="text-sm font-bold text-white">{facture.dueDate}</span>
                </div>
              )}
              {facture.designation && (
                <div style={{ borderTop: '1px solid var(--dark-border)', paddingTop: '10px' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Désignation</p>
                  <p className="text-sm mt-1 text-white whitespace-pre-wrap">{facture.designation}</p>
                </div>
              )}
              <div className="rounded-xl px-4 py-3 flex justify-between items-center" style={{ background: 'rgba(246,195,68,0.08)', borderTop: '1px solid var(--dark-border)', marginTop: '8px' }}>
                <span className="font-bold text-white">MONTANT À PAYER</span>
                <span className="font-bold text-lg" style={{ color: 'var(--gold)' }}>{fmtFCFA(facture.amount)}</span>
              </div>
              {facture.modalitesPaiement && (
                <div style={{ borderTop: '1px solid var(--dark-border)', paddingTop: '10px' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Modalités de paiement</p>
                  {facture.modalitesPaiement.split('\n').filter(Boolean).map((l, i) => (
                    <p key={i} className="text-xs" style={{ color: 'var(--text-secondary)' }}>• {l}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="card-dark p-4">
              <p className="text-sm font-semibold text-white mb-1">Signature du client</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Dessine ta signature ci-dessous pour valider cette facture.</p>
              <PadSignature onSave={signer} enregistrementEnCours={signatureEnCours} />
            </div>

            {erreur && (
              <p className="text-sm text-center" style={{ color: '#F87171' }}>⚠️ {erreur}</p>
            )}

            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              En signant, tu valides la facture N° {facture.invoiceNumber} établie par UniC Plaquiste.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
