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

function loadUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem('user') ?? 'null') } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  function applyUser(u: AuthUser | null) {
    setUser(u)
    if (u) localStorage.setItem('user', JSON.stringify(u))
    else localStorage.removeItem('user')
  }

  // On mount: re-validate token and get fresh user from server
  useEffect(() => {
    if (!token) return
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(applyUser)
      .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setToken(null); setUser(null) })
  }, [token])

  async function login(email: string, password: string) {
    const { token: t, user: u } = await apiLogin(email, password)
    localStorage.setItem('token', t)
    setToken(t)
    applyUser(u)
  }

  async function register(name: string, email: string, password: string) {
    const { token: t, user: u } = await apiRegister(name, email, password)
    localStorage.setItem('token', t)
    setToken(t)
    applyUser(u)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
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
