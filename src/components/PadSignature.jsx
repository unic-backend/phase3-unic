import { useRef, useState, useEffect } from 'react'
import { Eraser, Check } from 'lucide-react'

export default function PadSignature({ onSave, signatureExistante, enregistrementEnCours }) {
  const canvasRef = useRef(null)
  const enTrain = useRef(false)
  const [aDessine, setADessine] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#0D1B4B'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (signatureExistante) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = signatureExistante
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const position = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const point = e.touches ? e.touches[0] : e
    return {
      x: ((point.clientX - rect.left) / rect.width) * canvasRef.current.width,
      y: ((point.clientY - rect.top) / rect.height) * canvasRef.current.height,
    }
  }

  const demarrer = (e) => {
    e.preventDefault()
    enTrain.current = true
    setADessine(true)
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = position(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const dessiner = (e) => {
    if (!enTrain.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = position(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const arreter = () => { enTrain.current = false }

  const effacer = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setADessine(false)
  }

  const enregistrer = () => {
    if (!aDessine) return
    onSave(canvasRef.current.toDataURL('image/png'))
  }

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={500}
        height={180}
        className="w-full rounded-xl"
        style={{ background: 'white', border: '2px dashed var(--dark-border-strong)', touchAction: 'none' }}
        onMouseDown={demarrer}
        onMouseMove={dessiner}
        onMouseUp={arreter}
        onMouseLeave={arreter}
        onTouchStart={demarrer}
        onTouchMove={dessiner}
        onTouchEnd={arreter}
      />
      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        Dessine ta signature ci-dessus (souris ou doigt)
      </p>
      <div className="flex gap-2">
        <button onClick={effacer} type="button"
          className="flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 btn-press"
          style={{ background: 'var(--dark-elevated)', color: 'var(--text-secondary)' }}>
          <Eraser size={15} /> Effacer
        </button>
        <button onClick={enregistrer} type="button" disabled={!aDessine || enregistrementEnCours}
          className="flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 btn-press disabled:opacity-50"
          style={{ background: 'var(--gold)', color: '#060D18' }}>
          <Check size={15} /> {enregistrementEnCours ? 'Enregistrement...' : 'Enregistrer la signature'}
        </button>
      </div>
    </div>
  )
}
