export const CATEGORIES = ['POTHOLE', 'ROAD_DAMAGE', 'TRAFFIC_LIGHT', 'FLOODING', 'SIGNAGE', 'OTHER'] as const
export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

export type Issue = {
  id: string
  title: string
  description: string
  category: string
  status: string
  severity: string
  latitude: number
  longitude: number
  governorate: { id: string; name: string } | null
  municipality: { id: string; name: string } | null
  createdAt: string
}

export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  governorateId: string | null
  municipalityId: string | null
}

// Reads JWT from localStorage for authenticated requests
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// --- Public ---

export async function getIssues(governorateId?: string): Promise<Issue[]> {
  const qs = governorateId ? `?governorateId=${encodeURIComponent(governorateId)}` : ''
  const res = await fetch(`/api/issues${qs}`)
  if (!res.ok) throw new Error('Failed to load issues')
  return res.json()
}

// --- Auth ---

export async function register(name: string, email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Registration failed') }
  return res.json()
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Login failed') }
  return res.json()
}

export async function getMe(): Promise<AuthUser> {
  const res = await fetch('/api/auth/me', { headers: authHeaders() })
  if (!res.ok) throw new Error('Not authenticated')
  return res.json()
}

// --- Protected issue endpoints ---

export async function getMyIssues(): Promise<Issue[]> {
  const res = await fetch('/api/issues/mine', { headers: authHeaders() })
  if (!res.ok) throw new Error('Failed to load your issues')
  return res.json()
}

export async function getJurisdictionIssues(): Promise<Issue[]> {
  const res = await fetch('/api/issues/jurisdiction', { headers: authHeaders() })
  if (!res.ok) throw new Error('Failed to load jurisdiction issues')
  return res.json()
}

export type NewIssue = {
  title: string
  description: string
  category: string
  severity: string
  latitude: number
  longitude: number
}

export async function createIssue(input: NewIssue): Promise<Issue> {
  const res = await fetch('/api/issues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(input),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Failed to create issue') }
  return res.json()
}

// --- Admin ---

export async function createMunicipality(data: { name: string; governorateId: string; boundary: object }) {
  const res = await fetch('/api/municipalities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Failed to create municipality') }
  return res.json()
}
