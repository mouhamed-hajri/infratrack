type Item = { label: string; value: number; color?: string }

export function BarList({ items, max: maxProp }: { items: Item[]; max?: number }) {
  const max = maxProp ?? Math.max(1, ...items.map(i => i.value))
  if (items.length === 0) return <p className="py-4 text-xs text-muted">No data</p>
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2">
          <span className="w-28 shrink-0 truncate text-xs text-muted" title={item.label}>
            {item.label.replace(/_/g, ' ')}
          </span>
          <div className="relative flex-1 h-2 rounded-full bg-ink/8 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: item.color ?? '#0F5C5B',
              }}
            />
          </div>
          <span className="w-6 text-right text-xs font-semibold text-ink">{item.value}</span>
        </li>
      ))}
    </ul>
  )
}
