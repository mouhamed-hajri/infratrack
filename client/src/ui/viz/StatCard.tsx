import type { ReactNode } from 'react'
import { Surface } from '../Surface'
import { useCountUp } from './useCountUp'

type Props = {
  label: string
  value: number
  sub?: string
  delta?: number
  tone?: 'default' | 'danger' | 'success'
  icon?: ReactNode
  format?: 'number' | 'percent'
}

export function StatCard({ label, value, sub, delta, tone = 'default', icon, format = 'number' }: Props) {
  const animated = useCountUp(value)
  const display = format === 'percent' ? `${Math.round(animated)}%` : animated.toLocaleString()

  return (
    <Surface
      className="flex flex-col gap-2 p-5"
      style={tone === 'danger' ? { background: 'rgba(168,50,31,0.05)', borderColor: 'rgba(168,50,31,0.15)' } : {}}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
        {icon && <span className="text-muted opacity-50">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span
          className="font-display text-3xl font-bold leading-none"
          style={{ color: tone === 'danger' ? '#A8321F' : tone === 'success' ? '#3F7D5B' : undefined }}
        >
          {display}
        </span>
        {delta !== undefined && delta !== 0 && (
          <span className={`mb-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold ${delta > 0 ? 'bg-clay/10 text-clay' : 'bg-brand-tint text-brand'}`}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </Surface>
  )
}
