import { useEffect, useState } from 'react'
import { getIssues, type Issue, CATEGORIES, SEVERITIES } from '../lib/api'
import { IssueMap } from '../components/IssueMap'
import { Eyebrow } from '../ui/Eyebrow'
import { Reveal } from '../ui/Reveal'

const STATUSES = ['REPORTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const

const selCls = 'rounded-xl bg-paper-2/60 px-3 py-2 text-sm text-ink ring-1 ring-ink/10 outline-none transition focus:ring-2 focus:ring-brand/40'

export function MapPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  const [govFilter, setGovFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [sevFilter, setSevFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    getIssues().then(setIssues).finally(() => setLoading(false))
  }, [])

  const governorates = [...new Map(
    issues.filter((i) => i.governorate).map((i) => [i.governorate!.id, i.governorate!])
  ).values()].sort((a, b) => a.name.localeCompare(b.name))

  const filtered = issues.filter((i) => {
    if (govFilter && i.governorate?.id !== govFilter) return false
    if (catFilter && i.category !== catFilter) return false
    if (sevFilter && i.severity !== sevFilter) return false
    if (statusFilter && i.status !== statusFilter) return false
    return true
  })

  return (
    <main className="mx-auto max-w-[1200px] px-5 pb-28 pt-24 md:px-8 md:pb-16 md:pt-32">
      <Reveal>
        <Eyebrow>Public map</Eyebrow>
        <h1 className="mt-4 mb-6 text-3xl md:text-4xl">Infrastructure issues</h1>

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select className={selCls} value={govFilter} onChange={(e) => setGovFilter(e.target.value)}>
            <option value="">All governorates</option>
            {governorates.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select className={selCls} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </select>
          <select className={selCls} value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
            <option value="">All severities</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className={selCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <span className="ml-auto text-sm text-muted">{filtered.length} issue{filtered.length !== 1 ? 's' : ''} shown</span>
        </div>

        {loading ? (
          <div className="flex h-[70vh] items-center justify-center rounded-[1.375rem] bg-paper-2/40 text-sm text-muted">
            Loading map…
          </div>
        ) : (
          <IssueMap issues={filtered} className="h-[70vh]" showLocate />
        )}
      </Reveal>
    </main>
  )
}
