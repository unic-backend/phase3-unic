/**
 * AIChat — Composant partagé de conversation IA premium
 *
 * FIX CRITIQUE : chaque utilisateur a sa propre conversation isolée.
 * - La clé sessionStorage inclut le user.id Firebase
 * - Un useEffect recharge les messages quand l'utilisateur change
 * - Les messages ne sont sauvegardés que quand le user.id est connu
 *
 * Mode admin : l'IA traite Ousmane comme le patron, pas un client
 * Mode client : l'IA est professionnelle et redirige vers Ousmane
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { demanderAssistant } from '../services/iaService'
import { Send, FileText, Calculator, Lightbulb, Building2, Sparkles, Bell, Paperclip, X, ImageIcon, History, SquarePen, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { prepareImagePourIA } from '../utils/imageUpload'
import logo from '../assets/logo.webp'

// ── Markdown inline ──────────────────────────────────────────────────────────
function parseInline(text, kp = '') {
  if (!text) return null
  const parts = []
  let rem = text, k = 0
  while (rem.length > 0) {
    const bm = rem.match(/\*\*(.+?)\*\*/)
    const im = rem.match(/\*([^*]+)\*/)
    const bi = bm ? rem.indexOf(bm[0]) : Infinity
    const ii = im ? rem.indexOf(im[0]) : Infinity
    if (!bm && !im) { parts.push(rem); break }
    if (bi <= ii && bm) {
      if (bi > 0) parts.push(rem.slice(0, bi))
      parts.push(<strong key={`${kp}b${k++}`} className="font-semibold text-white">{bm[1]}</strong>)
      rem = rem.slice(bi + bm[0].length)
    } else if (im) {
      if (ii > 0) parts.push(rem.slice(0, ii))
      parts.push(<em key={`${kp}i${k++}`} className="italic">{im[1]}</em>)
      rem = rem.slice(ii + im[0].length)
    } else { parts.push(rem); break }
  }
  return parts
}

// ── Markdown bloc ────────────────────────────────────────────────────────────
function MarkdownContent({ text }) {
  if (!text) return null
  const normalized = text.replace(/([^\n])\s*---\s*([^\n])/g, '$1\n---\n$2').replace(/([^\n])\s*## /g, '$1\n## ').replace(/([^\n])\s*# /g, '$1\n# ')
  const lines = normalized.split('\n'), output = [], listBuf = [], tableBuf = []
  let key = 0

  function flushList() {
    if (!listBuf.length) return
    output.push(<ul key={key++} className="space-y-1.5 my-2">{listBuf.map((item, i) => (
      <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: 'var(--gold)' }} />
        <span style={{ color: '#D1DBF0' }}>{parseInline(item, `l${i}-`)}</span>
      </li>
    ))}</ul>)
    listBuf.length = 0
  }

  function flushTable() {
    if (!tableBuf.length) return
    const rows = tableBuf.filter(r => !r.match(/^\|[\s-:|]+\|$/)) // skip separator rows
    const parsed = rows.map(r => r.split('|').map(c => c.trim()).filter(Boolean))
    if (parsed.length === 0) { tableBuf.length = 0; return }
    const header = parsed[0]
    const body = parsed.slice(1)
    output.push(
      <div key={key++} className="my-3 rounded-xl overflow-hidden" style={{ border: '1px solid var(--dark-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(246,195,68,0.08)' }}>
              {header.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold text-white text-xs">{parseInline(h, `th${i}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} style={{ borderTop: '1px solid var(--dark-border)' }}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-xs" style={{ color: '#D1DBF0' }}>{parseInline(cell, `td${ri}${ci}`)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableBuf.length = 0
  }

  lines.forEach((raw) => {
    const line = raw.trimEnd()
    if (!line.trim()) return

    // Table rows (lines starting and ending with |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList()
      tableBuf.push(line.trim())
      return
    } else if (tableBuf.length > 0) {
      flushTable()
    }

    // Detection d'une URL image (le portfolio propose des liens .jpg/.png/ibb.co).
    // Si la ligne contient une URL d'image, on l'affiche comme photo.
    const imgUrlMatch = line.match(/(https?:\/\/[^\s)]+?(?:\.(?:jpg|jpeg|png|webp|gif)|ibb\.co\/[^\s)]+))/i)
    if (imgUrlMatch) {
      flushList()
      const url = imgUrlMatch[1]
      const texteAvant = line.slice(0, line.indexOf(url)).replace(/[:\-–—\s]+$/, '').trim()
      if (texteAvant) output.push(<p key={key++} className="text-sm leading-relaxed mb-1" style={{ color: '#D1DBF0' }}>{parseInline(texteAvant, `pt-${key}`)}</p>)
      output.push(
        <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className="block my-2">
          <img src={url} alt="Réalisation UniC Plaquiste" loading="lazy"
            className="rounded-xl max-w-full w-full object-cover"
            style={{ maxHeight: '220px', border: '1px solid var(--dark-border)' }} />
        </a>
      )
      return
    }

    if (line.trim() === '---') { flushList(); output.push(<hr key={key++} className="my-3 border-none h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />); return }
    if (line.trimStart().startsWith('# ')) { flushList(); output.push(<p key={key++} className="text-sm font-bold mt-3 mb-1 text-white">{parseInline(line.trimStart().slice(2), `h1-${key}`)}</p>); return }
    if (line.trimStart().startsWith('## ')) { flushList(); output.push(<p key={key++} className="text-sm font-semibold mt-2.5 mb-0.5" style={{ color: 'var(--gold)' }}>{parseInline(line.trimStart().slice(3), `h2-${key}`)}</p>); return }
    if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('* ')) { listBuf.push(line.trimStart().slice(2)); return }
    flushList()
    output.push(<p key={key++} className="text-sm leading-relaxed mb-0.5" style={{ color: '#D1DBF0' }}>{parseInline(line.trim(), `p-${key}`)}</p>)
  })
  flushList()
  flushTable()
  return output.length ? <div className="space-y-0.5">{output}</div> : <p className="text-sm leading-relaxed" style={{ color: '#D1DBF0' }}>{text}</p>
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-end gap-2.5 msg-pop">
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-lg" style={{ border: '2px solid rgba(246,195,68,0.3)' }}>
        <img src={logo} alt="UniC" className="w-full h-full object-contain" style={{ background: '#0C1829' }} />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
        <span className="text-[10px] font-bold mb-1 block" style={{ color: 'var(--gold)' }}>UniC IA réfléchit...</span>
        <div className="flex items-center gap-[5px]">
          {[0, 160, 320].map(d => (
            <span key={d} className="block w-1.5 h-1.5 rounded-full"
              style={{ background: '#8899B4', animation: `typingBounce 1.3s ease-in-out ${d}ms infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

const fmtTime = (ts) => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

// ── Quick Actions ────────────────────────────────────────────────────────────
const CLIENT_ACTIONS = [
  { icon: FileText,   color: '#F6C344', bg: 'rgba(246,195,68,0.12)',  label: 'Rédiger un devis',  desc: 'Devis professionnel personnalisé', prompt: 'Je voudrais un devis pour un faux plafond BA13' },
  { icon: Calculator, color: '#34D399', bg: 'rgba(52,211,153,0.12)',  label: 'Calculer un prix',  desc: 'Estimation selon vos surfaces',     prompt: 'Quel est le prix pour un faux plafond BA13 ?' },
  { icon: Lightbulb,  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  label: 'Conseil technique', desc: 'Matériaux et techniques',            prompt: 'Donne-moi un conseil technique sur le BA13' },
  { icon: Building2,  color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', label: 'Infos entreprise',  desc: 'Services de UniC Plaquiste',        prompt: 'Quels sont les services de UniC Plaquiste ?' },
]

const ADMIN_ACTIONS = [
  { icon: FileText,   color: '#F6C344', bg: 'rgba(246,195,68,0.12)',  label: 'Préparer un devis', desc: 'Chiffrage rapide pour un client',    prompt: 'Aide-moi à chiffrer un devis pour un client' },
  { icon: Calculator, color: '#34D399', bg: 'rgba(52,211,153,0.12)',  label: 'Calcul express',    desc: 'Surface × prix au m²',              prompt: 'Calcule-moi le prix pour 80m² de faux plafond avec peinture' },
  { icon: Lightbulb,  color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  label: 'Conseil business',  desc: 'Stratégie et gestion',              prompt: 'Donne-moi un conseil pour développer mon activité' },
  { icon: Building2,  color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', label: 'Rédiger message',   desc: 'Message pro pour un client',        prompt: 'Aide-moi à rédiger un message pour un client qui hésite' },
]

function QuickActionCard({ action, onSend, disabled }) {
  const Icon = action.icon
  return (
    <button onClick={() => onSend(action.prompt)} disabled={disabled}
      className="card-glass p-3.5 text-left flex flex-col gap-2 btn-press disabled:opacity-40 transition-all">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: action.bg }}>
        <Icon size={20} strokeWidth={1.6} style={{ color: action.color }} />
      </div>
      <div>
        <p className="text-xs font-bold text-white leading-tight">{action.label}</p>
        <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>{action.desc}</p>
      </div>
    </button>
  )
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  const isError = msg.role === 'error'

  if (isUser) return (
    <div className="flex justify-end gap-2.5 msg-pop">
      <div className="max-w-[80%] sm:max-w-[68%]">
        <div className="rounded-2xl rounded-br-sm chat-bubble-client overflow-hidden">
          {/* Image jointe par l'utilisateur */}
          {msg.image && (
            <img src={msg.image} alt="Image envoyée" className="w-full object-cover"
              style={{ maxHeight: '240px', display: 'block' }} />
          )}
          {!msg.image && msg.hadImage && (
            <p className="px-4 pt-3 text-xs font-medium flex items-center gap-1.5 opacity-70">
              📷 Photo envoyée
            </p>
          )}
          {msg.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words px-4 py-3">{msg.content}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-1 mt-1 pr-1">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{fmtTime(msg.ts)}</span>
          <span className="text-[11px] font-medium" style={{ color: '#34D399' }}>✓✓</span>
        </div>
      </div>
    </div>
  )

  if (isError) return (
    <div className="flex items-end gap-2.5 msg-pop">
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'rgba(248,113,113,0.15)', border: '2px solid rgba(248,113,113,0.3)' }}>
        <span className="text-xs font-bold" style={{ color: '#F87171' }}>!</span>
      </div>
      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm"
        style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: '#F87171' }}>
        {msg.content}
      </div>
    </div>
  )

  return (
    <div className="flex items-end gap-2.5 msg-pop">
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-lg self-start mt-1" style={{ border: '2px solid rgba(246,195,68,0.3)' }}>
        <img src={logo} alt="UniC IA" className="w-full h-full object-contain" style={{ background: '#0C1829' }} />
      </div>
      <div className="max-w-[84%] sm:max-w-[75%]">
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={11} style={{ color: 'var(--gold)' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--gold)' }}>UniC IA</span>
          </div>
          <MarkdownContent text={msg.content} />
        </div>
        <p className="text-[10px] mt-1 pl-1" style={{ color: 'var(--text-muted)' }}>{fmtTime(msg.ts)}</p>
      </div>
    </div>
  )
}

// ── Notification Card (admin only) ────────────────────────────────────────────
function NotificationCard({ notifications }) {
  if (!notifications || notifications.length === 0) return null
  return (
    <div className="card-glass p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={14} style={{ color: 'var(--gold)' }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--gold)' }}>Résumé du jour</span>
      </div>
      <div className="space-y-2">
        {notifications.map((n, i) => (
          <div key={i} className="flex items-center gap-2.5 text-sm">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: n.color || '#60A5FA' }} />
            <span style={{ color: '#D1DBF0' }}>{n.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function AIChat({
  storageKey     = 'unic-ia',
  welcomeTitle   = 'Bonjour',
  welcomeText    = 'Je suis votre assistant IA. Comment puis-je vous aider ?',
  placeholder    = 'Pose ta question ou demande quelque chose...',
  compact        = false,
  userName       = '',
  isAdmin        = false,
  notifications  = [],
}) {
  const { user } = useAuth()

  // ── Clé unique par utilisateur ────────────────────────────────────────────
  // CRITIQUE : cette clé change quand l'utilisateur change de compte.
  const userId = user?.id || null
  // localStorage (et non sessionStorage) : l'historique survit au refresh
  // et à la fermeture du navigateur — par appareil et par utilisateur.
  const fullKey = userId ? `${storageKey}-convs-${userId}` : null

  const [conversations, setConversations] = useState([]) // [{id,titre,messages,updatedAt}]
  const [activeConvId, setActiveConvId] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [streamingText, setStreamingText] = useState('')  // texte en cours de reveal
  const [isStreaming, setIsStreaming] = useState(false)    // animation en cours
  const [imageJointe, setImageJointe] = useState(null)     // { dataUrl, base64, mediaType }
  const [imageLoading, setImageLoading] = useState(false)  // preparation image en cours
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const loadedKeyRef = useRef(null)
  const streamIntervalRef = useRef(null)

  // ── Charger l'historique quand l'utilisateur change ────────────────────────
  // Isolation stricte par user.id (fix du bug de conversations mélangées) +
  // migration automatique de l'ancien format sessionStorage mono-conversation.
  useEffect(() => {
    if (!fullKey) { setConversations([]); setMessages([]); setActiveConvId(null); return }
    if (loadedKeyRef.current === fullKey) return
    loadedKeyRef.current = fullKey
    try {
      let convs = JSON.parse(localStorage.getItem(fullKey) || '[]')
      // Migration : ancien format (sessionStorage, une seule discussion)
      const ancienneCle = `${storageKey}-${userId}`
      const ancien = sessionStorage.getItem(ancienneCle)
      if (ancien) {
        const msgs = JSON.parse(ancien)
        if (Array.isArray(msgs) && msgs.length > 0) {
          convs.unshift({
            id: `c-${Date.now()}`,
            titre: (msgs.find(m => m.role === 'user')?.content || 'Discussion').slice(0, 42),
            messages: msgs.map(m => m.image ? { ...m, image: null, hadImage: true } : m),
            updatedAt: Date.now(),
          })
        }
        sessionStorage.removeItem(ancienneCle)
      }
      setConversations(convs)
      // Reprendre la discussion la plus récente (comportement "on continue")
      if (convs.length > 0) { setActiveConvId(convs[0].id); setMessages(convs[0].messages || []) }
      else { setActiveConvId(null); setMessages([]) }
    } catch {
      setConversations([]); setMessages([]); setActiveConvId(null)
    }
  }, [fullKey, storageKey, userId])

  // ── Persister l'historique à chaque changement de messages ─────────────────
  // Les images (base64 lourds) ne sont pas persistées : localStorage est
  // limité à ~5 Mo. À la reprise, un marqueur "Photo" remplace l'aperçu.
  useEffect(() => {
    if (!fullKey || loadedKeyRef.current !== fullKey || !activeConvId) return
    setConversations(prev => {
      const light = messages.map(m => m.image ? { ...m, image: null, hadImage: true } : m)
      const idx = prev.findIndex(c => c.id === activeConvId)
      let next
      if (idx === -1) {
        next = prev
      } else {
        const titre = prev[idx].titre || (messages.find(m => m.role === 'user')?.content || 'Discussion').slice(0, 42)
        next = [...prev]
        next[idx] = { ...next[idx], titre, messages: light, updatedAt: Date.now() }
        // La conversation active remonte en tête de liste
        const [conv] = next.splice(idx, 1)
        next.unshift(conv)
      }
      try { localStorage.setItem(fullKey, JSON.stringify(next.slice(0, 30))) } catch {}
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  // ── Actions historique ──────────────────────────────────────────────────────
  const nouvelleDiscussion = () => {
    if (streamIntervalRef.current) { clearInterval(streamIntervalRef.current); streamIntervalRef.current = null }
    setIsStreaming(false); setStreamingText(''); setIsTyping(false)
    const conv = { id: `c-${Date.now()}`, titre: '', messages: [], updatedAt: Date.now() }
    setConversations(prev => {
      const next = [conv, ...prev.filter(c => (c.messages || []).length > 0)] // purge les vides
      try { if (fullKey) localStorage.setItem(fullKey, JSON.stringify(next.slice(0, 30))) } catch {}
      return next
    })
    setActiveConvId(conv.id)
    setMessages([])
    setShowHistory(false)
    inputRef.current?.focus()
  }

  const ouvrirDiscussion = (conv) => {
    if (isTyping || isStreaming) return
    setActiveConvId(conv.id)
    setMessages(conv.messages || [])
    setShowHistory(false)
  }

  const supprimerDiscussion = (e, convId) => {
    e.stopPropagation()
    if (!window.confirm('Supprimer cette discussion ?')) return
    setConversations(prev => {
      const next = prev.filter(c => c.id !== convId)
      try { if (fullKey) localStorage.setItem(fullKey, JSON.stringify(next)) } catch {}
      return next
    })
    if (convId === activeConvId) { setActiveConvId(null); setMessages([]) }
  }

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping, streamingText])

  // ── Cleanup streaming interval on unmount ──────────────────────────────────
  useEffect(() => () => { if (streamIntervalRef.current) clearInterval(streamIntervalRef.current) }, [])

  // ── Selection d'une image ─────────────────────────────────────────────────
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de re-selectionner le meme fichier
    if (!file) return
    setImageLoading(true)
    try {
      const prepared = await prepareImagePourIA(file)
      setImageJointe(prepared)
    } catch (err) {
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'error', content: err.message || 'Image non supportée.', ts: Date.now() }])
    } finally {
      setImageLoading(false)
    }
  }

  const retirerImage = () => setImageJointe(null)

  // ── Envoi avec animation streaming (texte + image optionnelle) ─────────────
  const sendMessage = useCallback(async (text) => {
    const question = (text || input).trim()
    // On peut envoyer si : texte non vide, OU une image est jointe.
    if ((!question && !imageJointe) || isTyping || isStreaming || imageLoading) return

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: question,
      image: imageJointe?.dataUrl || null, // apercu affiche dans la bulle
      ts: Date.now(),
    }
    const imagePayload = imageJointe ? { base64: imageJointe.base64, mediaType: imageJointe.mediaType } : null

    // Premier message sans conversation active → en créer une automatiquement
    if (!activeConvId) {
      const conv = { id: `c-${Date.now()}`, titre: question.slice(0, 42) || 'Discussion', messages: [], updatedAt: Date.now() }
      setConversations(prev => [conv, ...prev])
      setActiveConvId(conv.id)
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setImageJointe(null)
    inputRef.current?.focus()
    setIsTyping(true)
    try {
      const allMessages = [...messages, userMsg]
      const statsText = isAdmin && notifications.length > 0
        ? notifications.map(n => n.text).join('\n')
        : ''
      const reponse = await demanderAssistant(question, allMessages, { isAdmin, stats: statsText, image: imagePayload })

      // ── Animation streaming : révéler mot par mot ─────────────────────────
      setIsTyping(false)
      setIsStreaming(true)
      setStreamingText('')
      const words = reponse.split(/(\s+)/) // split keeping whitespace
      let idx = 0
      const aiMsgData = { id: `a-${Date.now()}`, role: 'assistant', content: reponse, ts: Date.now() }

      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current)
      streamIntervalRef.current = setInterval(() => {
        idx += 3 // 3 tokens per step for smooth speed
        if (idx >= words.length) {
          clearInterval(streamIntervalRef.current)
          streamIntervalRef.current = null
          setStreamingText('')
          setIsStreaming(false)
          setMessages(prev => [...prev, aiMsgData])
        } else {
          setStreamingText(words.slice(0, idx).join(''))
        }
      }, 18) // ~18ms per step = fluide et rapide

    } catch (err) {
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'error', content: err.message || 'Erreur. Réessayez.', ts: Date.now() }])
      setIsTyping(false)
    }
  }, [input, isTyping, isStreaming, imageLoading, imageJointe, messages, isAdmin, notifications, activeConvId])

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }
  const autoResize = (e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }

  const hasUserMessages = messages.some(m => m.role === 'user')
  const displayName = userName || user?.nom?.split(' ')[0] || user?.email?.split('@')[0] || ''
  const actions = isAdmin ? ADMIN_ACTIONS : CLIENT_ACTIONS

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className={compact ? 'flex flex-col' : 'flex flex-col chat-container rounded-2xl overflow-hidden max-w-3xl mx-auto'}
      style={compact ? {} : { background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>

      {/* Header */}
      {!compact && (
        <div className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--dark-border)', background: 'linear-gradient(180deg, rgba(26,63,160,0.06) 0%, transparent 100%)' }}>
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg shrink-0" style={{ border: '2px solid rgba(246,195,68,0.25)' }}>
            <img src={logo} alt="UniC" className="w-full h-full object-contain" style={{ background: '#0C1829' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Assistant IA</p>
            <p className="text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#34D399' }} />
              <span style={{ color: '#34D399' }}>En ligne</span>
            </p>
          </div>
          {/* Actions historique */}
          <div className="flex items-center gap-1.5">
            <button onClick={nouvelleDiscussion} title="Nouvelle discussion" aria-label="Nouvelle discussion"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:bg-white/5 btn-press"
              style={{ color: 'var(--gold)', border: '1px solid var(--dark-border)' }}>
              <SquarePen size={16} />
            </button>
            <button onClick={() => setShowHistory(v => !v)} title="Historique des discussions" aria-label="Historique"
              className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:bg-white/5 btn-press relative"
              style={{ color: showHistory ? '#060D18' : 'var(--text-secondary)', background: showHistory ? 'var(--gold)' : 'transparent', border: '1px solid var(--dark-border)' }}>
              <History size={16} />
              {conversations.length > 0 && !showHistory && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: 'var(--gold)', color: '#060D18' }}>
                  {conversations.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Panneau historique des discussions ── */}
      {showHistory && !compact && (
        <div className="shrink-0 max-h-[45%] overflow-y-auto dark-scrollbar px-3 py-3 space-y-1.5 animate-fade-in"
          style={{ borderBottom: '1px solid var(--dark-border)', background: 'rgba(6,13,24,0.5)' }}>
          <div className="flex items-center justify-between px-1 mb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Discussions passées
            </p>
            <button onClick={nouvelleDiscussion}
              className="text-[11px] font-semibold flex items-center gap-1 btn-press"
              style={{ color: 'var(--gold)' }}>
              <SquarePen size={11} /> Nouvelle
            </button>
          </div>
          {conversations.filter(c => (c.messages || []).length > 0).length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
              Aucune discussion enregistrée pour l'instant.
            </p>
          )}
          {conversations.filter(c => (c.messages || []).length > 0).map((c) => (
            <button key={c.id} onClick={() => ouvrirDiscussion(c)}
              className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition group"
              style={{
                background: c.id === activeConvId ? 'rgba(246,195,68,0.08)' : 'var(--dark-elevated)',
                border: `1px solid ${c.id === activeConvId ? 'rgba(246,195,68,0.25)' : 'var(--dark-border)'}`,
              }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{c.titre || 'Discussion'}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {new Date(c.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {(c.messages || []).length} message{(c.messages || []).length > 1 ? 's' : ''}
                </p>
              </div>
              <span onClick={(e) => supprimerDiscussion(e, c.id)} role="button" aria-label="Supprimer la discussion"
                className="p-1.5 rounded-lg shrink-0 opacity-60 hover:opacity-100 transition"
                style={{ color: '#F87171' }}>
                <Trash2 size={13} />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 dark-scrollbar space-y-4" style={{ minHeight: 0 }}>

        {/* Carte bienvenue — seulement avant le 1er message */}
        {!hasUserMessages && (
          <div className="animate-fade-in space-y-4">
            <div className="text-center pt-2">
              <h2 className="text-xl font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>
                {welcomeTitle} {displayName} ! <span className="inline-block">👋</span>
              </h2>
              <p className="text-sm mt-2 mx-auto max-w-md" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {welcomeText}
              </p>
            </div>

            {/* Notifications admin */}
            {isAdmin && <NotificationCard notifications={notifications} />}

            {/* 4 cartes actions */}
            <div className="grid grid-cols-2 gap-2.5">
              {actions.map((a) => <QuickActionCard key={a.label} action={a} onSend={sendMessage} disabled={isTyping} />)}
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-3 select-none">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <span className="text-[10px] px-3 py-1 rounded-full flex items-center gap-1.5"
                style={{ background: 'var(--dark-elevated)', color: 'var(--text-muted)', border: '1px solid var(--dark-border)' }}>
                {isAdmin ? '🔑 Mode administrateur — accès complet' : '⦿ Je comprends votre projet et m\'adapte à vous.'}
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>

            {/* Message de bienvenue IA */}
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-lg mt-0.5" style={{ border: '2px solid rgba(246,195,68,0.3)' }}>
                <img src={logo} alt="UniC IA" className="w-full h-full object-contain" style={{ background: '#0C1829' }} />
              </div>
              <div className="flex-1">
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
                  {isAdmin ? (
                    <p className="text-sm leading-relaxed" style={{ color: '#D1DBF0' }}>
                      <strong className="text-white">Salut {displayName} !</strong> 👋<br />
                      Je suis ton assistant personnel. Dis-moi ce que tu veux faire — chiffrage, message client, analyse, planning...
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed" style={{ color: '#D1DBF0' }}>
                      <strong className="text-white">Bonjour {displayName} !</strong> 👋<br />
                      Je suis là pour vous aider. Devis, calculs de prix, conseils techniques — n'hésitez pas à me poser vos questions.
                    </p>
                  )}
                </div>
                <p className="text-[10px] mt-1 pl-1" style={{ color: 'var(--text-muted)' }}>{fmtTime(Date.now())}</p>
              </div>
            </div>
          </div>
        )}

        {/* Historique */}
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

        {/* Bulle de streaming — texte qui apparaît mot par mot */}
        {isStreaming && streamingText && (
          <div className="flex items-end gap-2.5 msg-pop">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-lg self-start mt-1" style={{ border: '2px solid rgba(246,195,68,0.3)' }}>
              <img src={logo} alt="UniC IA" className="w-full h-full object-contain" style={{ background: '#0C1829' }} />
            </div>
            <div className="max-w-[84%] sm:max-w-[75%]">
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={11} style={{ color: 'var(--gold)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--gold)' }}>UniC IA</span>
                  <span className="ml-1 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--gold)' }} />
                </div>
                <MarkdownContent text={streamingText} />
              </div>
            </div>
          </div>
        )}

        {isTyping && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pt-3 pb-3 shrink-0" style={{ borderTop: '1px solid var(--dark-border)' }}>

        {/* Apercu de l'image jointe (avant envoi) */}
        {(imageJointe || imageLoading) && (
          <div className="mb-2 flex items-center gap-2">
            {imageLoading ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--text-muted)' }}>
                <ImageIcon size={14} className="animate-pulse" style={{ color: 'var(--gold)' }} />
                Préparation de l'image...
              </div>
            ) : (
              <div className="relative inline-block">
                <img src={imageJointe.dataUrl} alt="Aperçu" className="h-16 w-16 object-cover rounded-xl"
                  style={{ border: '2px solid var(--gold)' }} />
                <button onClick={retirerImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: '#F87171', color: 'white' }} aria-label="Retirer l'image">
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            )}
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {isAdmin ? 'Photo à analyser' : 'Demande un avis sur cette photo'}
            </span>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-2xl px-1 py-1"
          style={{ background: 'var(--dark-elevated)', border: '1.5px solid var(--dark-border)' }}>

          {/* Input file cache */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

          {/* Bouton piece jointe */}
          <button onClick={() => fileInputRef.current?.click()} disabled={isTyping || isStreaming || imageLoading}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ml-1 transition disabled:opacity-40 hover:bg-white/5"
            style={{ color: 'var(--gold)' }} aria-label="Joindre une image" title="Joindre une image">
            <Paperclip size={17} />
          </button>

          <textarea ref={inputRef} value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(e) }}
            onKeyDown={handleKeyDown} placeholder={placeholder} disabled={isTyping || isStreaming} rows={1}
            className="flex-1 py-2.5 px-1 text-sm bg-transparent text-white outline-none resize-none disabled:opacity-50 placeholder-[#4A5B73]"
            style={{ minHeight: '38px', maxHeight: '120px' }} />

          <button onClick={() => sendMessage()} disabled={isTyping || isStreaming || imageLoading || (!input.trim() && !imageJointe)}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mr-0.5 transition-all duration-200 disabled:opacity-30 btn-press"
            style={{ background: (input.trim() || imageJointe) ? 'var(--gold)' : 'transparent', color: (input.trim() || imageJointe) ? '#060D18' : 'var(--text-muted)' }}>
            <Send size={16} strokeWidth={2.2} />
          </button>
        </div>
        <p className="text-[9px] text-center mt-2 select-none" style={{ color: 'var(--text-muted)' }}>
          L'IA peut se tromper, vérifiez toujours les informations importantes.
        </p>
      </div>
    </div>
  )
}
