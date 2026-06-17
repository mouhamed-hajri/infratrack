import { STATUS_COLOR, STATUS_LABEL } from '../lib/status'

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLOR[status] ?? { fg: '#6B6356', bg: '#6B635614' }
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: s.fg, backgroundColor: s.bg }}
    >
      {STATUS_LABEL[status] ?? status.replace(/_/g, ' ')}
    </span>
  )
}
