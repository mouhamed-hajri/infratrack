import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getIssue, type Issue } from '../lib/api'
import { SeverityBadge } from '../components/SeverityBadge'
import { AiSuggestion } from '../components/AiSuggestion'
import { StatusBadge } from '../components/StatusBadge'
import { StatusTimeline } from '../components/StatusTimeline'
import { StatusControl } from '../components/StatusControl'
import { PhotoLightbox } from '../components/PhotoLightbox'
import { Surface } from '../ui/Surface'
import { Eyebrow } from '../ui/Eyebrow'
import { Reveal } from '../ui/Reveal'
import { useAuth } from '../auth/AuthContext'

export function IssueDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    getIssue(id)
      .then(setIssue)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const [lightbox, setLightbox] = useState(false)

  const canTriage =
    user &&
    (user.role === 'ADMIN' ||
      (user.role === 'AUTHORITY' && issue?.governorate?.id === user.governorateId))

  if (loading) {
    return (
      <main className="mx-auto max-w-[760px] px-5 pb-28 pt-24 md:px-8 md:pt-32">
        <p className="text-sm text-muted">Loading…</p>
      </main>
    )
  }

  if (notFound || !issue) {
    return (
      <main className="mx-auto max-w-[760px] px-5 pb-28 pt-24 md:px-8 md:pt-32">
        <p className="text-sm text-muted">Issue not found. <Link to="/" className="text-brand underline">Go home</Link></p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[760px] px-5 pb-28 pt-24 md:px-8 md:pt-32">
      <Reveal>
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-ink">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </Link>

        <Surface className="overflow-hidden p-0">
          {issue.photoUrl && (
            <>
              <img
                src={issue.photoUrl}
                alt={issue.title}
                className="w-full cursor-zoom-in object-contain bg-paper-2"
                onClick={() => setLightbox(true)}
              />
              {lightbox && <PhotoLightbox src={issue.photoUrl} alt={issue.title} onClose={() => setLightbox(false)} />}
            </>
          )}
          <div className="p-6 md:p-8 space-y-5">
            <div>
              <Eyebrow>{issue.category.replace(/_/g, ' ')} · {issue.governorate?.name ?? 'Unassigned'}</Eyebrow>
              <h1 className="mt-3 text-2xl font-display font-semibold md:text-3xl leading-snug">{issue.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SeverityBadge severity={issue.severity} />
                <StatusBadge status={issue.status} />
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted">{issue.description}</p>

            {issue.address && (
              <p className="text-xs text-muted">📍 {issue.address}</p>
            )}

            {/* AI assessment block — shown when the issue has AI data */}
            {issue.aiSeverity && (
              <AiSuggestion
                status="done"
                result={{
                  category: issue.aiCategory ?? '',
                  severity: issue.aiSeverity,
                  confidence: issue.aiConfidence ?? 0,
                  summary: issue.aiSummary ?? '',
                }}
              />
            )}

            {/* Timeline */}
            {(issue.statusEvents?.length ?? 0) > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Timeline</p>
                <StatusTimeline events={issue.statusEvents!} />
              </div>
            )}

            {/* Triage controls — authority/admin only, in-jurisdiction */}
            {canTriage && (
              <StatusControl issue={issue} onUpdated={setIssue} />
            )}
          </div>
        </Surface>
      </Reveal>
    </main>
  )
}
