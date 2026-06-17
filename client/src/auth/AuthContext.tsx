import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, type AuthUser } from '../lib/api'

type AuthState = {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  // On mount: if a token exists, hydrate user via /api/auth/me
  useEffect(() => {
    if (!token) return
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setUser)
      .catch(() => { localStorage.removeItem('token'); setToken(null) })
  }, [token])

  async function login(email: string, password: string) {
    const { token: t, user: u } = await apiLogin(email, password)
    localStorage.setItem('token', t)
    setToken(t)
    setUser(u)
  }

  async function register(name: string, email: string, password: string) {
    const { token: t, user: u } = await apiRegister(name, email, password)
    localStorage.setItem('token', t)
    setToken(t)
    setUser(u)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, token, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
