// ponytail: keep in sync with server/src/lib/analytics.ts
export const OPEN_STATUSES = ['REPORTED', 'ACKNOWLEDGED', 'IN_PROGRESS'] as const
export const SLA_HOURS: Record<string, number> = { CRITICAL: 24, HIGH: 72, MEDIUM: 168, LOW: 720 }
export const SEVERITY_WEIGHT: Record<string, number> = { CRITICAL: 8, HIGH: 4, MEDIUM: 2, LOW: 1 }

export function ageDays(issue: { createdAt: string }): number {
  return (Date.now() - new Date(issue.createdAt).getTime()) / 86_400_000
}

export function isOverdue(issue: { severity: string; status: string; createdAt: string }): boolean {
  if (!(OPEN_STATUSES as readonly string[]).includes(issue.status)) return false
  const ageH = (Date.now() - new Date(issue.createdAt).getTime()) / 3.6e6
  return ageH > (SLA_HOURS[issue.severity] ?? Infinity)
}

export function priorityOf(issue: { severity: string; createdAt: string }): number {
  return (SEVERITY_WEIGHT[issue.severity] ?? 1) * (1 + ageDays(issue) / 7)
}
