import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider }  from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout     from './components/Layout/Layout'
import Login      from './pages/Login'
import Executive  from './pages/Executive'
import Performance from './pages/Performance'
import HCPTracker from './pages/HCPTracker'
import Profile    from './pages/Profile'
import Alerts     from './pages/Alerts'
import Speakers   from './pages/Speakers'
import Vaccines   from './pages/Vaccines'
import './index.css'

/* Redirects to /login when not authenticated */
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

/* All authenticated pages wrapped in Layout */
function AppShell() {
  return (
    <AppProvider>
      <Layout>
        <Routes>
          <Route path="/"            element={<Executive />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/hcp-tracker" element={<HCPTracker />} />
          <Route path="/profile/:cid" element={<Profile />} />
          <Route path="/alerts"      element={<Alerts />} />
          <Route path="/speakers"    element={<Speakers />} />
          <Route path="/vaccines"    element={<Vaccines />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
