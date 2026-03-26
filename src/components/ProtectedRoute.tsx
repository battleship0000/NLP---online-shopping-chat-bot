import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import type { UserRole } from '../types'

interface Props {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { profile, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!profile) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/" replace />

  return <>{children}</>
}
