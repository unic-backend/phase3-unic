import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import ClientLayout from './layouts/ClientLayout'
import AdminLayout from './admin/AdminLayout'

// Pages publiques
import HomePage from './pages/HomePage'
import Discussion from './pages/Discussion'
import SignerDevis from './pages/SignerDevis'
import Login from './pages/Login'
import InitAdmin from './pages/InitAdmin'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'

// Pages client (privées)
import DashboardAvance from './pages/DashboardAvance'
import DevisAvance from './pages/DevisAvance'
import NewDevis from './pages/NewDevis'
import FacturesAvance from './pages/FacturesAvance'
import Chat from './pages/Chat'
import Projets from './pages/Projets'
import Profil from './pages/Profil'

// Pages admin (privées)
import AdminDashboard from './admin/AdminDashboard'
import AdminClients from './admin/AdminClients'
import AdminDevis from './admin/AdminDevis'
import AdminProjets from './admin/AdminProjets'
import AdminFactures from './admin/AdminFactures'
import AdminMessages from './admin/AdminMessages'
import AdminBaseConnaissances from './admin/AdminBaseConnaissances'
import AdminProspects from './admin/AdminProspects'
import AdminSignature from './admin/AdminSignature'
import AdminDashboardFinancier from './admin/AdminDashboardFinancier'
import AdminDepenses from './admin/AdminDepenses'
import AdminPortfolio from './admin/AdminPortfolio'
import AdminCalendrier from './admin/AdminCalendrier'
import AdminOpportunites from './admin/AdminOpportunites'

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<HomePage />} />
          <Route path="/discussion" element={<Discussion />} />
          <Route path="/signer/:token" element={<SignerDevis />} />
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
            <Route path="finances" element={<AdminDashboardFinancier />} />
            <Route path="depenses" element={<AdminDepenses />} />
            <Route path="portfolio" element={<AdminPortfolio />} />
            <Route path="calendrier" element={<AdminCalendrier />} />
            <Route path="opportunites" element={<AdminOpportunites />} />
          </Route>

          {/* Redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
