import { useState } from 'react'
import { Link } from 'react-router-dom'
import { type Issue } from '../lib/api'
import { SeverityBadge } from './SeverityBadge'
import { StatusBadge } from './StatusBadge'
import { PhotoLightbox } from './PhotoLightbox'
import { isOverdue } from '../lib/priority'

const RAIL_COLORS: Record<string, string> = {
  LOW:      '#3F7D5B',
  MEDIUM:   '#B8861E',
  HIGH:     '#C4622D',
  CRITICAL: '#A8321F',
}

export function IssueList({ issues }: { issues: Issue[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (issues.length === 0) {
    return <p className="text-sm text-muted">No issues yet — report one above.</p>
  }
  return (
    <>
      {lightbox && <PhotoLightbox src={lightbox} onClose={() => setLightbox(null)} />}
      <div className="grid gap-4 md:grid-cols-2">
        {issues.map((issue, i) => (
          <Link
            key={issue.id}
            to={`/issues/${issue.id}`}
            className={`group relative flex overflow-visible rounded-2xl bg-card ring-1 ring-ink/5 shadow-[0_1px_2px_rgba(40,30,15,.04),0_12px_32px_-12px_rgba(40,30,15,.12)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 ${
              i === 0 ? 'md:col-span-2' : ''
            }`}
          >
            {/* Photo hover popup */}
            {issue.photoUrl && (
              <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-72 -translate-x-1/2 opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100">
                <img
                  src={issue.photoUrl}
                  alt={issue.title}
                  className="w-full rounded-2xl object-contain bg-paper-2 shadow-2xl ring-1 ring-ink/10"
                />
              </div>
            )}
            {/* Severity rail */}
            <div
              className="w-1 shrink-0 rounded-l-2xl"
              style={{ backgroundColor: RAIL_COLORS[issue.severity] ?? '#6B6356' }}
            />
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-base font-semibold text-ink leading-snug">{issue.title}</h3>
                <SeverityBadge severity={issue.severity} />
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{issue.description}</p>
              {issue.address && (
                <p className="mt-1 text-xs text-muted truncate" title={issue.address}>📍 {issue.address}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={issue.status} />
                {isOverdue(issue) && (
                  <span className="rounded-md bg-[#A8321F12] px-1.5 py-0.5 text-xs font-semibold text-[#A8321F]">Overdue</span>
                )}
                <span className="text-xs text-muted">{issue.category.replace(/_/g, ' ')}</span>
                <span className="text-xs text-brand">
                  {issue.governorate?.name ?? 'Unassigned'}
                  {issue.municipality ? ` / ${issue.municipality.name}` : ''}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
