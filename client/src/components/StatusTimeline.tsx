import { type StatusEvent } from '../lib/api'
import { STATUS_COLOR, STATUS_LABEL } from '../lib/status'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function StatusTimeline({ events }: { events: StatusEvent[] }) {
  if (events.length === 0) return null
  return (
    <ol className="space-y-0">
      {events.map((ev, i) => {
        const color = STATUS_COLOR[ev.status]?.fg ?? '#6B6356'
        const last = i === events.length - 1
        return (
          <li key={ev.id} className="flex gap-4">
            {/* dot + connector */}
            <div className="flex flex-col items-center">
              <span
                className="mt-0.5 flex h-3 w-3 shrink-0 rounded-full ring-2 ring-paper"
                style={{ backgroundColor: color }}
              />
              {!last && <span className="mt-1 w-px flex-1 bg-ink/10" />}
            </div>
            {/* content */}
            <div className={`pb-5 ${last ? '' : ''}`}>
              <p className="text-sm font-semibold" style={{ color }}>
                {STATUS_LABEL[ev.status] ?? ev.status}
              </p>
              {ev.note && (
                <p className="mt-0.5 text-sm text-ink leading-snug">{ev.note}</p>
              )}
              <p className="mt-0.5 text-xs text-muted">
                {ev.actor ? `${ev.actor.name}` : 'Citizen'}
                {' · '}
                {timeAgo(ev.createdAt)}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
