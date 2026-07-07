import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import ClientLayout from './layouts/ClientLayout'
import AdminLayout from './admin/AdminLayout'

// ── Pages publiques : chargement immédiat ─────────────────────────────────────
// La landing, le login et les pages de signature (liens WhatsApp) doivent
// s'afficher instantanément — pas de lazy ici.
import HomePage from './pages/HomePage'
import Discussion from './pages/Discussion'
import SignerDevis from './pages/SignerDevis'
import SignerFacture from './pages/SignerFacture'
import Login from './pages/Login'
import InitAdmin from './pages/InitAdmin'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'

// ── Pages privées : lazy loading (code-splitting par route) ───────────────────
// Chaque page devient un chunk séparé téléchargé à la première visite.
// Gain majeur : react-pdf (~1,4 Mo) n'est plus chargé au démarrage —
// seulement quand on ouvre Devis/Factures admin.
const DashboardAvance  = lazy(() => import('./pages/DashboardAvance'))
const DevisAvance      = lazy(() => import('./pages/DevisAvance'))
const NewDevis         = lazy(() => import('./pages/NewDevis'))
const FacturesAvance   = lazy(() => import('./pages/FacturesAvance'))
const Chat             = lazy(() => import('./pages/Chat'))
const Projets          = lazy(() => import('./pages/Projets'))
const Profil           = lazy(() => import('./pages/Profil'))
const PortfolioClient  = lazy(() => import('./pages/PortfolioClient'))
const AssistantIA      = lazy(() => import('./pages/AssistantIA'))

const AdminDashboard          = lazy(() => import('./admin/AdminDashboard'))
const AdminClients            = lazy(() => import('./admin/AdminClients'))
const AdminDevis              = lazy(() => import('./admin/AdminDevis'))
const AdminProjets            = lazy(() => import('./admin/AdminProjets'))
const AdminFactures           = lazy(() => import('./admin/AdminFactures'))
const AdminMessages           = lazy(() => import('./admin/AdminMessages'))
const AdminBaseConnaissances  = lazy(() => import('./admin/AdminBaseConnaissances'))
const AdminProspects          = lazy(() => import('./admin/AdminProspects'))
const AdminSignature          = lazy(() => import('./admin/AdminSignature'))
const AdminDashboardFinancier = lazy(() => import('./admin/AdminDashboardFinancier'))
const AdminDepenses           = lazy(() => import('./admin/AdminDepenses'))
const AdminPortfolio          = lazy(() => import('./admin/AdminPortfolio'))
const AdminCalendrier         = lazy(() => import('./admin/AdminCalendrier'))
const AdminOpportunites       = lazy(() => import('./admin/AdminOpportunites'))

// ── Loader affiché pendant le chargement d'un chunk ───────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: '50vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '14px',
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%',
        border: '3px solid rgba(246,195,68,0.15)',
        borderTopColor: '#F6C344',
        animation: 'spin-smooth 0.8s linear infinite',
      }} />
      <p style={{ color: '#4A5B73', fontSize: '12px', fontWeight: 600 }}>Chargement…</p>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<HomePage />} />
            <Route path="/discussion" element={<Discussion />} />
            <Route path="/signer/:token" element={<SignerDevis />} />
            <Route path="/signer-facture/:token" element={<SignerFacture />} />
            <Route path="/login" element={<Login />} />
            <Route path="/init-admin" element={<InitAdmin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Routes client (privées) */}
            <Route
              path="/client"
              element={
                <ProtectedRoute>
                  <ClientLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<DashboardAvance />} />
              <Route path="devis" element={<DevisAvance />} />
              <Route path="devis/new" element={<NewDevis />} />
              <Route path="projets" element={<Projets />} />
              <Route path="chat" element={<Chat />} />
              <Route path="factures" element={<FacturesAvance />} />
              <Route path="profil" element={<Profil />} />
              <Route path="portfolio" element={<PortfolioClient />} />
              <Route path="assistant" element={<AssistantIA />} />
            </Route>

            {/* Routes admin (privées) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="devis" element={<AdminDevis />} />
              <Route path="projets" element={<AdminProjets />} />
              <Route path="factures" element={<AdminFactures />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="connaissances" element={<AdminBaseConnaissances />} />
              <Route path="prospects" element={<AdminProspects />} />
              <Route path="signature" element={<AdminSignature />} />
              <Route path="profil" element={<Profil />} />
              <Route path="finances" element={<AdminDashboardFinancier />} />
              <Route path="depenses" element={<AdminDepenses />} />
              <Route path="portfolio" element={<AdminPortfolio />} />
              <Route path="calendrier" element={<AdminCalendrier />} />
              <Route path="opportunites" element={<AdminOpportunites />} />
            </Route>

            {/* Redirection */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  )
}
