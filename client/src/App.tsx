import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Background } from './ui/Background'
import { Nav } from './ui/Nav'
import { BottomNav } from './ui/BottomNav'
import { Footer } from './ui/Footer'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { MyReports } from './pages/MyReports'
import { Dashboard } from './pages/Dashboard'
import { Admin } from './pages/Admin'
import { Profile } from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Background />
        <Nav />
        <BottomNav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute roles={['AUTHORITY', 'ADMIN']}><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><Admin /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  )
}
