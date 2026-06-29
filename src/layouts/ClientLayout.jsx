import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAdminEmail } from '../config/admins'
import SideDrawer from '../components/SideDrawer'
import NotificationBell from '../components/NotificationBell'
import PullToRefresh from '../components/PullToRefresh'
import {
  LayoutDashboard, FileText, Building2, MessageSquare,
  Receipt, User, ShieldCheck, LogOut, Menu,
  ChevronLeft, ChevronRight, Bell
} from 'lucide-react'
import logo from '../assets/logo.webp'

export default function ClientLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = async () => {
    setRefreshKey(k => k + 1)
    await new Promise(r => setTimeout(r, 400))
  }

  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Accueil', path: '/client/dashboard' },
    { icon: FileText, label: 'Mes Devis', path: '/client/devis' },
    { icon: Building2, label: 'Mes Projets', path: '/client/projets' },
    { icon: MessageSquare, label: 'Chat', path: '/client/chat' },
    { icon: Receipt, label: 'Factures', path: '/client/factures' },
    { icon: User, label: 'Profil', path: '/client/profil' },
  ]

  const mobileNavItems = [
    { icon: LayoutDashboard, label: 'Accueil', path: '/client/dashboard' },
    { icon: FileText, label: 'Devis', path: '/client/devis' },
    { icon: MessageSquare, label: 'Chat', path: '/client/chat' },
    { icon: Receipt, label: 'Factures', path: '/client/factures' },
    { icon: User, label: 'Profil', path: '/client/profil' },
  ]

  const handleLogout = () => { logout(); navigate('/') }
  const isActive = (path) => location.pathname === path
  const showAdminButton = isAdminEmail(user?.email)
  const activeIndex = mobileNavItems.findIndex(item => isActive(item.path))
  const n = mobileNavItems.length

  return (
    <div className="flex h-screen" style={{ background: 'var(--dark-bg)' }}>

      {/* Sidebar Desktop */}
      <div className={`hidden md:flex ${sidebarOpen ? 'w-60' : 'w-[72px]'} flex-col transition-all duration-300 ease-out border-r`}
        style={{ background: 'var(--dark-surface)', borderColor: 'var(--dark-border)' }}>

        <div className="p-4 flex items-center justify-center h-16" style={{ borderBottom: '1px solid var(--dark-border)' }}>
          <img src={logo} alt="UniC" className={`${sidebarOpen ? 'h-10' : 'h-8'} w-auto transition-all`} />
        </div>

        <nav className="flex-1 overflow-y-auto py-3 dark-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 transition-all duration-200 btn-press
                  ${sidebarOpen ? 'px-4 py-3 mx-2 my-0.5 rounded-2xl' : 'px-0 py-3 justify-center mx-1 my-0.5 rounded-xl'}
                  ${active ? 'font-semibold' : 'text-muted hover:text-white'}`}
                style={active ? { background: 'var(--gold)', color: '#060D18', boxShadow: '0 4px 16px rgba(246,195,68,0.25)' } : {}}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </button>
            )
          })}

          {showAdminButton && (
            <button onClick={() => navigate('/admin/dashboard')}
              className={`w-full flex items-center gap-3 mt-3 btn-press ${sidebarOpen ? 'px-4 py-3 mx-2 rounded-2xl' : 'px-0 py-3 justify-center mx-1 rounded-xl'}`}
              style={{ borderTop: '1px solid var(--dark-border)', color: 'var(--gold)' }}>
              <ShieldCheck size={20} strokeWidth={2} />
              {sidebarOpen && <span className="text-sm font-semibold">Espace Admin</span>}
            </button>
          )}
        </nav>

        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mx-auto mb-2 w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-dark-700"
          style={{ color: 'var(--text-muted)' }}>
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="p-3" style={{ borderTop: '1px solid var(--dark-border)' }}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>
                {(user?.nom || user?.email || 'C').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.nom || 'Client'}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
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

      {/* Contenu */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-40 glass-dark"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <img src={logo} alt="UniC" className="md:hidden h-8 w-auto" />
          <span className="hidden md:inline text-sm font-medium text-white">Espace Client</span>
          <div className="flex items-center gap-2">
            <NotificationBell mode="client" userId={user?.id} />
            <button onClick={() => setDrawerOpen(true)} className="md:hidden p-2 rounded-xl transition active:scale-90" style={{ color: 'var(--text-secondary)' }}>
              <Menu size={24} strokeWidth={2} />
            </button>
          </div>
        </div>

        <PullToRefresh onRefresh={handleRefresh} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8 dark-scrollbar">
          <Outlet key={refreshKey} />
        </PullToRefresh>
      </div>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-dark" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="relative flex justify-around items-stretch h-16">
          {activeIndex >= 0 && (
            <span className="absolute top-0 h-[3px] rounded-full transition-transform duration-300 ease-out"
              style={{ background: 'var(--gold)', width: `${100/n}%`, transform: `translateX(${activeIndex*100}%)`, boxShadow: '0 0 12px rgba(246,195,68,0.4)' }} />
          )}
          {mobileNavItems.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-200 active:scale-90">
                <Icon size={22} strokeWidth={active ? 2.2 : 1.6} style={{ color: active ? 'var(--gold)' : 'var(--text-muted)', transition: 'color 0.2s' }} />
                <span className="text-[10px] font-medium" style={{ color: active ? 'var(--gold)' : 'var(--text-muted)', transition: 'color 0.2s' }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} mode="client" />
    </div>
  )
}
