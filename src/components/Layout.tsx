import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-700 text-white px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">
          Admission Enquiry System
        </Link>
        <div className="flex items-center gap-4">
          {profile ? (
            <>
              <span className="text-indigo-200 text-sm">
                {profile.full_name} ({profile.role})
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm bg-indigo-800 hover:bg-indigo-900 px-3 py-1 rounded"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm bg-indigo-800 hover:bg-indigo-900 px-3 py-1 rounded">
              Staff Login
            </Link>
          )}
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
