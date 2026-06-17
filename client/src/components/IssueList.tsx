import { type Issue } from '../lib/api'
import { SeverityBadge } from './SeverityBadge'

const RAIL_COLORS: Record<string, string> = {
  LOW:      '#3F7D5B',
  MEDIUM:   '#B8861E',
  HIGH:     '#C4622D',
  CRITICAL: '#A8321F',
}

export function IssueList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) {
    return <p className="text-sm text-muted">No issues yet — report one above.</p>
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {issues.map((issue, i) => (
        <div
          key={issue.id}
          className={`flex overflow-hidden rounded-2xl bg-card ring-1 ring-ink/5 shadow-[0_1px_2px_rgba(40,30,15,.04),0_12px_32px_-12px_rgba(40,30,15,.12)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 ${
            i === 0 ? 'md:col-span-2' : ''
          }`}
        >
          {/* Severity rail */}
          <div
            className="w-1 shrink-0"
            style={{ backgroundColor: RAIL_COLORS[issue.severity] ?? '#6B6356' }}
          />

          <div className="flex-1 p-5">
            {issue.photoUrl && (
              <img
                src={issue.photoUrl}
                alt={issue.title}
                className="mb-4 h-40 w-full rounded-xl object-cover"
              />
            )}
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-base font-semibold text-ink leading-snug">{issue.title}</h3>
              <SeverityBadge severity={issue.severity} />
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{issue.description}</p>
            {issue.address && (
              <p className="mt-1 text-xs text-muted truncate" title={issue.address}>📍 {issue.address}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <span>{issue.category}</span>
              <span aria-hidden>·</span>
              <span>{issue.status}</span>
              <span aria-hidden>·</span>
              <span className="text-brand">
                {issue.governorate?.name ?? 'Unassigned'}
                {issue.municipality ? ` / ${issue.municipality.name}` : ''}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
