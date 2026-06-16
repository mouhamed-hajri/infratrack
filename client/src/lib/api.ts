export const CATEGORIES = ['POTHOLE', 'ROAD_DAMAGE', 'TRAFFIC_LIGHT', 'FLOODING', 'SIGNAGE', 'OTHER'] as const
export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

// Mirrors the API's Issue response (Prisma Issue + included jurisdiction names).
// Duplicated from the server for the MVP; unify into a shared type later if it grows.
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

export async function getIssues(governorateId?: string): Promise<Issue[]> {
  const qs = governorateId ? `?governorateId=${encodeURIComponent(governorateId)}` : ''
  const res = await fetch(`/api/issues${qs}`)
  if (!res.ok) throw new Error('Failed to load issues')
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to create issue')
  }
  return res.json()
}
