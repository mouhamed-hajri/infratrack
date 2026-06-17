const SEV_COLORS: Record<string, string> = {
  CRITICAL: '#A8321F',
  HIGH: '#C4622D',
  MEDIUM: '#B8861E',
  LOW: '#3F7D5B',
}

type Item = { key: string; count: number }

export function Donut({ items }: { items: Item[] }) {
  const total = items.reduce((s, i) => s + i.count, 0)

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4">
        <div className="h-28 w-28 rounded-full border-8 border-ink/8" />
        <p className="text-xs text-muted">No open issues</p>
      </div>
    )
  }

  // Build conic-gradient stops
  let acc = 0
  const stops = items.map(item => {
    const pct = (item.count / total) * 100
    const stop = `${SEV_COLORS[item.key] ?? '#6B6356'} ${acc.toFixed(1)}% ${(acc + pct).toFixed(1)}%`
    acc += pct
    return stop
  })
  const gradient = `conic-gradient(${stops.join(', ')})`

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0">
        <div className="h-28 w-28 rounded-full" style={{ background: gradient }} />
        <div className="absolute inset-3 rounded-full bg-card flex items-center justify-center">
          <span className="font-display text-lg font-bold text-ink">{total}</span>
        </div>
      </div>
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SEV_COLORS[item.key] ?? '#6B6356' }} />
            <span className="text-xs text-muted">{item.key}</span>
            <span className="text-xs font-semibold text-ink">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
