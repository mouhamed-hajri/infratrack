import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyIssues, updateIssue, deleteIssue, CATEGORIES, SEVERITIES, type Issue } from '../lib/api'
import { SeverityBadge } from '../components/SeverityBadge'
import { StatusBadge } from '../components/StatusBadge'
import { PhotoLightbox } from '../components/PhotoLightbox'
import { Eyebrow } from '../ui/Eyebrow'
import { Reveal } from '../ui/Reveal'
import { Surface } from '../ui/Surface'

const RAIL: Record<string, string> = { LOW: '#3F7D5B', MEDIUM: '#B8861E', HIGH: '#C4622D', CRITICAL: '#A8321F' }
const CAT_LABEL: Record<string, string> = { POTHOLE: 'Pothole', ROAD_DAMAGE: 'Road damage', TRAFFIC_LIGHT: 'Traffic light', FLOODING: 'Flooding', SIGNAGE: 'Signage', OTHER: 'Other' }
const inputCls = 'w-full rounded-xl bg-paper-2/50 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-clay/50'

type Draft = { title: string; description: string; category: string; severity: string }

function ClickablePhoto({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="group/photo relative mb-4 inline-block">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs text-brand hover:underline"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
          </svg>
          View photo
        </button>
        <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-0 z-50 w-72 opacity-0 scale-95 transition-all duration-200 group-hover/photo:opacity-100 group-hover/photo:scale-100">
          <img src={src} alt={alt} className="w-full rounded-2xl object-contain bg-paper-2 shadow-2xl ring-1 ring-ink/10" />
        </div>
      </div>
      {open && <PhotoLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  )
}

function IssueCard({
  issue, onUpdated, onDeleted,
}: {
  issue: Issue
  onUpdated: (updated: Issue) => void
  onDeleted: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Draft>({ title: issue.title, description: issue.description, category: issue.category, severity: issue.severity })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const canMutate = issue.status === 'REPORTED'

  async function save() {
    setBusy(true); setErr('')
    try {
      const updated = await updateIssue(issue.id, draft)
      onUpdated(updated); setEditing(false)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(false) }
  }

  async function remove() {
    setBusy(true); setErr('')
    try { await deleteIssue(issue.id); onDeleted(issue.id) }
    catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); setBusy(false) }
  }

  return (
    <div className="flex overflow-hidden rounded-2xl bg-card ring-1 ring-ink/5 shadow-[0_1px_2px_rgba(40,30,15,.04),0_12px_32px_-12px_rgba(40,30,15,.12)]">
      <div className="w-1 shrink-0" style={{ backgroundColor: RAIL[issue.severity] ?? '#6B6356' }} />
      <div className="flex-1 p-5">

        {editing ? (
          <div className="space-y-3">
            {err && <p className="rounded-lg px-3 py-2 text-xs" style={{ color: '#A8321F', background: '#A8321F12' }}>{err}</p>}
            <input className={inputCls} value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Title" />
            <textarea className={inputCls} rows={2} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="Description" />
            {/* Category chips */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setDraft(d => ({ ...d, category: c }))}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${draft.category === c ? 'bg-brand text-paper' : 'bg-paper-2/60 text-muted ring-1 ring-ink/10 hover:ring-ink/20'}`}>
                  {CAT_LABEL[c] ?? c}
                </button>
              ))}
            </div>
            {/* Severity */}
            <div className="flex rounded-xl bg-paper-2/50 p-0.5 ring-1 ring-ink/10">
              {SEVERITIES.map(s => (
                <button key={s} type="button" onClick={() => setDraft(d => ({ ...d, severity: s }))}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold uppercase tracking-wide transition ${draft.severity === s ? 'bg-white/80 shadow-sm' : 'text-muted hover:text-ink'}`}
                  style={draft.severity === s ? { color: RAIL[s] } : {}}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={save} disabled={busy}
                className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-paper transition hover:bg-brand-deep disabled:opacity-50">
                {busy ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setEditing(false); setDraft({ title: issue.title, description: issue.description, category: issue.category, severity: issue.severity }); setErr('') }}
                className="rounded-xl bg-paper-2/60 px-4 py-2 text-xs font-medium text-muted ring-1 ring-ink/10 transition hover:text-ink">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {issue.photoUrl && <ClickablePhoto src={issue.photoUrl} alt={issue.title} />}
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-base font-semibold text-ink leading-snug">{issue.title}</h3>
              <SeverityBadge severity={issue.severity} />
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{issue.description}</p>
            {issue.address && <p className="mt-1 text-xs text-muted truncate">📍 {issue.address}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={issue.status} />
              <span className="text-xs text-muted">{CAT_LABEL[issue.category] ?? issue.category}</span>
              <span className="text-xs text-brand">{issue.governorate?.name ?? 'Unassigned'}</span>
            </div>
            <Link to={`/issues/${issue.id}`} className="mt-3 inline-flex items-center gap-1 text-xs text-brand hover:underline">
              View timeline →
            </Link>

            {canMutate && (
              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => { setEditing(true); setConfirmDelete(false) }}
                  className="flex items-center gap-1.5 rounded-xl bg-paper-2/60 px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-ink/10 transition hover:text-ink">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
                {confirmDelete ? (
                  <>
                    <button onClick={remove} disabled={busy}
                      className="rounded-xl bg-[#A8321F] px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-[#8a2819] disabled:opacity-50">
                      {busy ? 'Deleting…' : 'Confirm delete'}
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted hover:text-ink transition">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-paper-2/60 px-3 py-1.5 text-xs font-medium text-clay ring-1 ring-clay/20 transition hover:bg-clay/8">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                    Delete
                  </button>
                )}
                {err && <p className="text-xs text-clay">{err}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function MyReports() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getMyIssues().then(setIssues).finally(() => setLoading(false)) }, [])

  return (
    <main className="mx-auto max-w-[1200px] px-5 pb-28 pt-24 md:px-8 md:pb-16 md:pt-32">
      <Reveal>
        <Eyebrow>My activity</Eyebrow>
        <h1 className="mt-4 mb-8 text-3xl md:text-4xl">My reports</h1>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : issues.length === 0 ? (
          <Surface className="p-8 text-center text-sm text-muted">No reports yet — submit one from the home page.</Surface>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {issues.map((issue, i) => (
              <div key={issue.id} className={i === 0 ? 'md:col-span-2' : ''}>
                <IssueCard
                  issue={issue}
                  onUpdated={updated => setIssues(prev => prev.map(iss => iss.id === updated.id ? updated : iss))}
                  onDeleted={id => setIssues(prev => prev.filter(iss => iss.id !== id))}
                />
              </div>
            ))}
          </div>
        )}
      </Reveal>
    </main>
  )
}
