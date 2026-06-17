import { useState } from 'react'
import { updateIssueStatus, type Issue } from '../lib/api'
import { NEXT, ACTION_LABEL } from '../lib/status'

export function StatusControl({ issue, onUpdated }: { issue: Issue; onUpdated: (updated: Issue) => void }) {
  const nextStates = NEXT[issue.status] ?? []
  const [note, setNote] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (nextStates.length === 0) return null

  async function apply(target: string) {
    if (target === 'REJECTED' && !note.trim()) {
      setErr('A reason is required when rejecting.'); return
    }
    setBusy(true); setErr('')
    try {
      const updated = await updateIssueStatus(issue.id, target, note || undefined)
      onUpdated(updated)
      setNote(''); setPending(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const ACTION_COLOR: Record<string, string> = {
    ACKNOWLEDGED: '#0F5C5B',
    IN_PROGRESS:  '#B8861E',
    RESOLVED:     '#3F7D5B',
    REJECTED:     '#A8321F',
  }

  return (
    <div className="space-y-3 rounded-2xl bg-paper-2/50 p-4 ring-1 ring-ink/10">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Triage actions</p>
      {err && <p className="rounded-lg px-3 py-2 text-xs" style={{ color: '#A8321F', background: '#A8321F12' }}>{err}</p>}
      <div className="flex flex-wrap gap-2">
        {nextStates.map(target => (
          <button
            key={target}
            type="button"
            onClick={() => { setPending(target); setErr('') }}
            className="rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wide transition"
            style={{
              color: '#fff',
              backgroundColor: ACTION_COLOR[target] ?? '#6B6356',
              opacity: pending && pending !== target ? 0.4 : 1,
            }}
          >
            {ACTION_LABEL[target] ?? target}
          </button>
        ))}
      </div>
      {pending && (
        <div className="space-y-2">
          <textarea
            className="w-full rounded-xl bg-paper-2/60 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-clay/50"
            rows={2}
            placeholder={pending === 'REJECTED' ? 'Reason for rejection (required)' : 'Optional note…'}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => apply(pending)}
              disabled={busy}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-paper transition disabled:opacity-50"
              style={{ backgroundColor: ACTION_COLOR[pending] ?? '#6B6356' }}
            >
              {busy ? 'Saving…' : `Confirm — ${ACTION_LABEL[pending] ?? pending}`}
            </button>
            <button
              onClick={() => { setPending(null); setNote(''); setErr('') }}
              className="rounded-xl bg-paper-2/60 px-4 py-2 text-xs font-medium text-muted ring-1 ring-ink/10 transition hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
