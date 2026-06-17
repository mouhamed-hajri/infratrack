import { useEffect, useState } from 'react'
import { getJurisdictionIssues, getAnalytics, type Issue, type Analytics } from '../lib/api'
import { IssueMap } from '../components/IssueMap'
import { IssueList } from '../components/IssueList'
import { Eyebrow } from '../ui/Eyebrow'
import { Reveal } from '../ui/Reveal'
import { Surface } from '../ui/Surface'
import { StatCard } from '../ui/viz/StatCard'
import { TrendArea } from '../ui/viz/TrendArea'
import { BarList } from '../ui/viz/BarList'
import { Donut } from '../ui/viz/Donut'
import { AiBriefing } from '../components/AiBriefing'
import { priorityOf, OPEN_STATUSES } from '../lib/priority'

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtHours(h: number | null): { value: number; sub: string } {
  if (h === null) return { value: 0, sub: 'no data yet' }
  if (h < 48) return { value: Math.round(h), sub: 'hours avg resolution' }
  return { value: Math.round(h / 24), sub: 'days avg resolution' }
}

export function Dashboard() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapMode, setMapMode] = useState<'pins' | 'heat'>('pins')

  useEffect(() => {
    Promise.all([getJurisdictionIssues(), getAnalytics()])
      .then(([iss, a]) => { setIssues(iss); setAnalytics(a) })
      .finally(() => setLoading(false))
  }, [])

  const kpis = analytics?.kpis
  const delta = kpis ? kpis.newThisWeek - kpis.newLastWeek : 0
  const resPct = kpis ? Math.round(kpis.resolutionRate * 100) : 0
  const res = fmtHours(kpis?.avgResolutionHours ?? null)

  return (
    <main className="mx-auto max-w-[1200px] px-5 pb-28 pt-24 md:px-8 md:pb-16 md:pt-32">
      <Reveal>
        <Eyebrow>Command center</Eyebrow>
        <h1 className="mt-4 mb-1 text-3xl md:text-4xl">
          {analytics ? `${analytics.scope} operations` : 'Operations'}
        </h1>
        {analytics && (
          <p className="mb-8 text-sm text-muted">
            Updated {fmtTime(analytics.generatedAt)} · {analytics.kpis.total} reports
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <>
            {/* AI briefing — crown jewel */}
            <AiBriefing />

            {/* KPI row */}
            {kpis && (
              <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
                <StatCard
                  label="Open reports"
                  value={kpis.open}
                  delta={delta}
                  sub={`${kpis.newThisWeek} new this week`}
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>}
                />
                <StatCard
                  label="Critical & high"
                  value={kpis.criticalOpen}
                  tone={kpis.criticalOpen > 0 ? 'danger' : 'default'}
                  sub="open issues"
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                />
                <StatCard
                  label="Overdue"
                  value={kpis.overdue}
                  tone={kpis.overdue > 0 ? 'danger' : 'default'}
                  sub="past SLA deadline"
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                />
                <StatCard
                  label="Avg resolution"
                  value={res.value}
                  sub={res.sub}
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                />
                <StatCard
                  label="Resolution rate"
                  value={resPct}
                  format="percent"
                  tone={resPct >= 50 ? 'success' : 'default'}
                  sub={`${kpis.resolved} resolved of ${kpis.total - kpis.rejected}`}
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
                />
              </div>
            )}

            {/* Map */}
            <IssueMap issues={issues} className="h-[460px] mb-8" showLocate mode={mapMode} onModeChange={setMapMode} />

            {/* Charts grid */}
            {analytics && (
              <div className="mb-8 grid gap-4 md:grid-cols-2">
                <Surface className="p-5 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Reports vs resolutions — 8 weeks</p>
                  <TrendArea weeks={analytics.weekly} />
                </Surface>
                <Surface className="p-5 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Active severity mix</p>
                  <Donut items={analytics.bySeverity} />
                </Surface>
                <Surface className="p-5 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Active by category</p>
                  <BarList items={analytics.byCategory.map(i => ({ label: i.key, value: i.count }))} />
                </Surface>
                <Surface className="p-5 space-y-4">
                  {analytics.worstZones.length > 0 ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Worst governorates by score</p>
                      <BarList
                        items={analytics.worstZones.map(z => ({ label: z.name, value: z.score }))}
                      />
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Status funnel</p>
                      <BarList items={analytics.byStatus.map(i => ({ label: i.key, value: i.count }))} />
                    </>
                  )}
                </Surface>
              </div>
            )}

            {/* Dispatch priority queue */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Dispatch priority — fix these first</p>
                <p className="mt-0.5 text-xs text-muted">Open issues ranked by severity × age</p>
              </div>
              <IssueList
                issues={[...issues]
                  .filter(i => (OPEN_STATUSES as readonly string[]).includes(i.status))
                  .sort((a, b) => priorityOf(b) - priorityOf(a))
                }
              />
            </div>
          </>
        )}
      </Reveal>
    </main>
  )
}
