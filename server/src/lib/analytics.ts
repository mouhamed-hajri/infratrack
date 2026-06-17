import type { Status, Severity, Category } from '@prisma/client'
import { prisma } from '../db'

export const OPEN_STATUSES = ['REPORTED', 'ACKNOWLEDGED', 'IN_PROGRESS'] as const
// ponytail: in-memory aggregation; move to SQL groupBy/materialized view past ~10k issues
export const SLA_HOURS: Record<string, number> = { CRITICAL: 24, HIGH: 72, MEDIUM: 168, LOW: 720 }
export const SEVERITY_WEIGHT: Record<string, number> = { CRITICAL: 8, HIGH: 4, MEDIUM: 2, LOW: 1 }

type ScopedIssue = {
  severity: Severity
  status: Status
  category: Category
  createdAt: Date
  governorate: { name: string } | null
  statusEvents: { status: Status; createdAt: Date }[]
}

export type Analytics = {
  scope: string
  generatedAt: string
  kpis: {
    total: number
    open: number
    resolved: number
    rejected: number
    resolutionRate: number
    criticalOpen: number
    overdue: number
    avgResolutionHours: number | null
    avgAckHours: number | null
    newThisWeek: number
    newLastWeek: number
  }
  byCategory: { key: string; count: number }[]
  bySeverity: { key: string; count: number }[]
  byStatus: { key: string; count: number }[]
  weekly: { week: string; reported: number; resolved: number }[]
  worstZones: { name: string; open: number; score: number }[]
}

export async function loadScopedIssues(role: string, governorateId: string | null) {
  const where = role === 'ADMIN' ? {} : { governorateId: governorateId ?? 'none' }
  return prisma.issue.findMany({
    where,
    select: {
      severity: true,
      status: true,
      category: true,
      createdAt: true,
      governorate: { select: { name: true } },
      statusEvents: { select: { status: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
    },
  }) as Promise<ScopedIssue[]>
}

function mondayOf(d: Date): Date {
  const diff = (d.getDay() + 6) % 7
  const m = new Date(d)
  m.setHours(0, 0, 0, 0)
  m.setDate(m.getDate() - diff)
  return m
}

function countBy<T>(items: T[], key: (i: T) => string): { key: string; count: number }[] {
  const map: Record<string, number> = {}
  for (const item of items) { const k = key(item); map[k] = (map[k] ?? 0) + 1 }
  return Object.entries(map).map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count)
}

export function computeAnalytics(issues: ScopedIssue[], scopeLabel: string, isAdmin: boolean): Analytics {
  const now = Date.now()
  const WEEK_MS = 7 * 86_400_000

  const open = issues.filter(i => (OPEN_STATUSES as readonly string[]).includes(i.status))
  const resolved = issues.filter(i => i.status === 'RESOLVED')
  const rejected = issues.filter(i => i.status === 'REJECTED')

  const denom = issues.length - rejected.length
  const resolutionRate = denom > 0 ? resolved.length / denom : 0

  const criticalOpen = open.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length

  const overdue = open.filter(i => {
    const ageH = (now - i.createdAt.getTime()) / 3.6e6
    return ageH > (SLA_HOURS[i.severity] ?? Infinity)
  }).length

  const mean = (nums: number[]) => nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null

  const resolutionTimes = resolved
    .map(i => { const ev = i.statusEvents.find(e => e.status === 'RESOLVED'); return ev ? (ev.createdAt.getTime() - i.createdAt.getTime()) / 3.6e6 : null })
    .filter((h): h is number => h !== null && h > 0)

  const ackTimes = issues
    .map(i => { const ev = i.statusEvents.find(e => e.status === 'ACKNOWLEDGED'); return ev ? (ev.createdAt.getTime() - i.createdAt.getTime()) / 3.6e6 : null })
    .filter((h): h is number => h !== null && h > 0)

  const newThisWeek = issues.filter(i => now - i.createdAt.getTime() < WEEK_MS).length
  const newLastWeek = issues.filter(i => { const age = now - i.createdAt.getTime(); return age >= WEEK_MS && age < 2 * WEEK_MS }).length

  // Last 8 Monday-anchored week buckets, oldest first
  const mondays = Array.from({ length: 8 }, (_, i) => mondayOf(new Date(now - i * WEEK_MS))).reverse()
  const weekly = mondays.map((monday, i) => {
    const start = monday.getTime()
    const end = i < 7 ? mondays[i + 1].getTime() : now + 1
    const reported = issues.filter(iss => { const t = iss.createdAt.getTime(); return t >= start && t < end }).length
    const resolvedCount = issues.filter(iss => {
      const ev = iss.statusEvents.find(e => e.status === 'RESOLVED')
      if (!ev) return false
      const t = ev.createdAt.getTime()
      return t >= start && t < end
    }).length
    const mm = String(monday.getMonth() + 1).padStart(2, '0')
    const dd = String(monday.getDate()).padStart(2, '0')
    return { week: `${mm}/${dd}`, reported, resolved: resolvedCount }
  })

  const worstZones = isAdmin
    ? (() => {
        const map: Record<string, { open: number; score: number }> = {}
        for (const i of open) {
          const name = i.governorate?.name ?? 'Unknown'
          if (!map[name]) map[name] = { open: 0, score: 0 }
          map[name].open++
          map[name].score += SEVERITY_WEIGHT[i.severity] ?? 1
        }
        return Object.entries(map)
          .map(([name, v]) => ({ name, ...v }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
      })()
    : []

  return {
    scope: scopeLabel,
    generatedAt: new Date().toISOString(),
    kpis: {
      total: issues.length,
      open: open.length,
      resolved: resolved.length,
      rejected: rejected.length,
      resolutionRate,
      criticalOpen,
      overdue,
      avgResolutionHours: mean(resolutionTimes),
      avgAckHours: mean(ackTimes),
      newThisWeek,
      newLastWeek,
    },
    byCategory: countBy(open, i => i.category),
    bySeverity: countBy(open, i => i.severity),
    byStatus: countBy(issues, i => i.status),
    weekly,
    worstZones,
  }
}
