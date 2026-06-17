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
  photoUrl: string | null
  address: string | null
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
  phone: string | null
  cin: string | null
  cinVerified: boolean
  emailVerified: boolean
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

export async function register(name: string, email: string, password: string, phone: string): Promise<{ message: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Registration failed') }
  return res.json()
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Verification failed') }
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
  photoUrl?: string
  address?: string
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

// --- Profile management ---

export async function updateProfile(data: { name?: string; email?: string; phone?: string; currentPassword?: string; newPassword?: string }): Promise<AuthUser> {
  const res = await fetch('/api/auth/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Update failed') }
  return res.json()
}

export async function verifyCin(selfieBase64: string, cinPhotoBase64: string): Promise<AuthUser> {
  const res = await fetch('/api/auth/verify-cin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ selfieBase64, cinPhotoBase64 }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Verification failed') }
  return res.json()
}

// --- Cloudinary photo upload ---
// Set VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET in client/.env to enable.
// ponytail: unsigned upload preset — simplest, no server round-trip, fine for an MVP.
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined

export async function uploadPhoto(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('Cloudinary not configured')
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error('Photo upload failed')
  const data = await res.json()
  return data.secure_url as string
}

export const cloudinaryConfigured = !!(CLOUD_NAME && UPLOAD_PRESET)

export async function updateIssue(id: string, data: { title?: string; description?: string; category?: string; severity?: string }): Promise<Issue> {
  const res = await fetch(`/api/issues/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Update failed') }
  return res.json()
}

export async function deleteIssue(id: string): Promise<void> {
  const res = await fetch(`/api/issues/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let msg = 'Delete failed'
    try { msg = JSON.parse(text).error ?? msg } catch { /* non-JSON */ }
    throw new Error(msg)
  }
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
