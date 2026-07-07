import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import SideDrawer from '../components/SideDrawer'
import NotificationBell from '../components/NotificationBell'
import GlobalSearch from '../components/GlobalSearch'
import PullToRefresh from '../components/PullToRefresh'
import {
  LayoutDashboard, Users, FileText, Building2,
  Receipt, MessageSquare, User, LogOut, Menu,
  ChevronLeft, ChevronRight, Bell, Search,
  Settings, Plus, Brain, Users2, PenTool,
  TrendingUp, Images, Calendar
} from 'lucide-react'
import logo from '../assets/logo.webp'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Raccourci Ctrl/Cmd+K pour ouvrir la recherche globale
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = async () => {
    setRefreshKey(k => k + 1)
    await new Promise(r => setTimeout(r, 400))
  }

  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Accueil', path: '/admin/dashboard' },
    { icon: FileText, label: 'Devis', path: '/admin/devis' },
    { icon: Receipt, label: 'Factures', path: '/admin/factures' },
    { icon: Users, label: 'Clients', path: '/admin/clients' },
    { icon: Building2, label: 'Projets', path: '/admin/projets' },
    { icon: MessageSquare, label: 'Messages', path: '/admin/messages' },
    { icon: Brain, label: 'Assistant IA', path: '/admin/connaissances' },
    { icon: Users2, label: 'Prospects', path: '/admin/prospects' },
    { icon: PenTool, label: 'Ma signature', path: '/admin/signature' },
    { icon: TrendingUp, label: 'Finances', path: '/admin/finances' },
    { icon: Receipt, label: 'Dépenses', path: '/admin/depenses' },
    { icon: Calendar, label: 'Calendrier', path: '/admin/calendrier' },
    { icon: Images, label: 'Portfolio', path: '/admin/portfolio' },
    { icon: Search, label: 'Appels d\'offres', path: '/admin/opportunites' },
  ]

  const mobileNavItems = [
    { icon: LayoutDashboard, label: 'Accueil', path: '/admin/dashboard' },
    { icon: FileText, label: 'Devis', path: '/admin/devis' },
    { icon: MessageSquare, label: 'Chat', path: '/admin/messages', badge: 2 },
    { icon: Receipt, label: 'Factures', path: '/admin/factures' },
    { icon: User, label: 'Profil', path: '/admin/profil' },
  ]

  const handleLogout = () => { logout(); navigate('/') }
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="flex h-screen" style={{ background: 'var(--dark-bg)' }}>

      {/* ========== SIDEBAR — Desktop ========== */}
      <div className={`hidden md:flex ${sidebarOpen ? 'w-60' : 'w-[72px]'} flex-col transition-all duration-300 ease-out border-r`}
        style={{ background: 'var(--dark-surface)', borderColor: 'var(--dark-border)' }}>

        {/* Logo */}
        <div className="p-4 flex items-center justify-center h-16" style={{ borderBottom: '1px solid var(--dark-border)' }}>
          <img src={logo} alt="UniC" className={`${sidebarOpen ? 'h-10' : 'h-8'} w-auto transition-all`} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 dark-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 transition-all duration-200 btn-press
                  ${sidebarOpen ? 'px-4 py-3 mx-2 my-0.5 rounded-2xl' : 'px-0 py-3 justify-center mx-1 my-0.5 rounded-xl'}
                  ${active
                    ? 'text-dark-900 font-semibold'
                    : 'text-muted hover:text-white'
                  }`}
                style={active ? {
                  background: 'var(--gold)',
                  color: '#060D18',
                  boxShadow: '0 4px 16px rgba(246,195,68,0.25)'
                } : {}}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Toggle sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mx-auto mb-2 w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-dark-700"
          style={{ color: 'var(--text-muted)' }}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* User / Logout */}
        <div className="p-3" style={{ borderTop: '1px solid var(--dark-border)' }}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'var(--gold)', color: '#060D18' }}>
                {(user?.displayName || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.displayName || 'Administrateur'}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Admin</p>
              </div>
              <button onClick={handleLogout} className="p-1.5 rounded-lg transition hover:bg-dark-700" style={{ color: 'var(--text-muted)' }}>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center p-2 rounded-xl transition hover:bg-dark-700" style={{ color: 'var(--text-muted)' }}>
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ========== CONTENU PRINCIPAL ========== */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header sticky */}
        <div className="px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-40 glass-dark"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>

          {/* Mobile: Logo */}
          <img src={logo} alt="UniC" className="md:hidden h-8 w-auto" />

          {/* Desktop: Search */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl flex-1 max-w-md"
            style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="bg-transparent border-none outline-none text-sm text-white placeholder-[#4A5B73] w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton Créer */}
            <button
              onClick={() => navigate('/admin/devis')}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold btn-press"
              style={{ background: 'var(--gold)', color: '#060D18' }}>
              <Plus size={16} strokeWidth={2.5} />
              Créer
            </button>

            <NotificationBell mode="admin" />

            {/* Recherche globale — bouton visible partout */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-xl transition active:scale-90 hover:bg-white/5"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--dark-border)' }}
              title="Rechercher (Ctrl+K)"
              aria-label="Rechercher"
            >
              <Search size={18} />
            </button>

            {/* Mobile: Hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl transition active:scale-90"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Menu"
            >
              <Menu size={24} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Page content */}
        <PullToRefresh onRefresh={handleRefresh} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8 dark-scrollbar">
          <Outlet key={refreshKey} />
        </PullToRefresh>
      </div>

      {/* ========== BOTTOM NAV — Mobile Premium Glass ========== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 nav-bottom-premium"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-[62px] px-2">
          {mobileNavItems.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center transition-all duration-300 active:scale-90 select-none"
                style={{ minWidth: '56px' }}>
                {/* Indicateur fin doré en haut */}
                <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 rounded-full transition-all duration-300"
                  style={{
                    width: active ? '16px' : '0px',
                    height: '2px',
                    background: active ? '#F6C344' : 'transparent',
                    boxShadow: active ? '0 0 10px rgba(246,195,68,0.5)' : 'none',
                  }} />
                {/* Pill glass derrière l'icône active */}
                <span className="relative flex flex-col items-center gap-[2px]"
                  style={active ? {
                    background: 'rgba(246,195,68,0.1)',
                    borderRadius: '12px',
                    padding: '5px 14px 3px',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  } : {
                    padding: '5px 14px 3px',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}>
                  <span className="relative">
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white z-10"
                        style={{ background: '#F87171', boxShadow: '0 2px 6px rgba(248,113,113,0.4)' }}>
                        {item.badge}
                      </span>
                    )}
                    <Icon size={20} strokeWidth={active ? 2 : 1.5}
                      style={{
                        color: active ? '#F6C344' : '#4A5B73',
                        transition: 'all 0.25s ease',
                        filter: active ? 'drop-shadow(0 0 4px rgba(246,195,68,0.3))' : 'none',
                      }} />
                  </span>
                  <span className="text-[9px] font-semibold tracking-wider transition-colors duration-200"
                    style={{ color: active ? '#F6C344' : '#4A5B73' }}>
                    {item.label}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} mode="admin" />
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
