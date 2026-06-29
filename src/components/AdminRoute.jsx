import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAdminEmail } from '../config/admins'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A3FA0]">
        <div className="text-white text-2xl font-bold">Chargement...</div>
      </div>
    )
  }

  if (!isAdminEmail(user?.email)) {
    return <Navigate to="/login" replace />
  }

  return children
}
