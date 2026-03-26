import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import StudentEnquiryPage from './pages/StudentEnquiryPage'
import LoginPage from './pages/LoginPage'
import CounsellorDashboard from './pages/CounsellorDashboard'
import AdminPanel from './pages/AdminPanel'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<StudentEnquiryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/counsellor"
          element={
            <ProtectedRoute allowedRoles={['counsellor']}>
              <CounsellorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  )
}
