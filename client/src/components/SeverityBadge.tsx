const MAP: Record<string, { fg: string; bg: string }> = {
  LOW:      { fg: '#3F7D5B', bg: '#3F7D5B14' },
  MEDIUM:   { fg: '#B8861E', bg: '#B8861E14' },
  HIGH:     { fg: '#C4622D', bg: '#C4622D17' },
  CRITICAL: { fg: '#A8321F', bg: '#A8321F17' },
}

export function SeverityBadge({ severity }: { severity: string }) {
  const s = MAP[severity] ?? { fg: '#6B6356', bg: '#6B635614' }
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: s.fg, backgroundColor: s.bg }}
    >
      {severity}
    </span>
  )
}
