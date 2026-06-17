type Week = { week: string; reported: number; resolved: number }

const W = 520
const H = 160
const PAD = { top: 16, right: 16, bottom: 32, left: 32 }

function polyline(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x},${y}`).join(' ')
}

function areaPath(pts: [number, number][], bottom: number): string {
  if (pts.length === 0) return ''
  const first = pts[0]
  const last = pts[pts.length - 1]
  return `M${first[0]},${bottom} L${polyline(pts).replace(/,/g, ',')} L${last[0]},${bottom}Z`
    .replace('M', 'M').replace(/L(\d)/g, 'L$1')
}

export function TrendArea({ weeks }: { weeks: Week[] }) {
  if (weeks.length === 0) return null

  const inner = { w: W - PAD.left - PAD.right, h: H - PAD.top - PAD.bottom }
  const peak = Math.max(1, ...weeks.map(w => Math.max(w.reported, w.resolved)))

  const xOf = (i: number) => PAD.left + (i / Math.max(weeks.length - 1, 1)) * inner.w
  const yOf = (v: number) => PAD.top + inner.h - (v / peak) * inner.h

  const repPts = weeks.map<[number, number]>((w, i) => [xOf(i), yOf(w.reported)])
  const resPts = weeks.map<[number, number]>((w, i) => [xOf(i), yOf(w.resolved)])
  const bottom = PAD.top + inner.h

  const allZero = weeks.every(w => w.reported === 0 && w.resolved === 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="inline-block h-2 w-4 rounded-full" style={{ background: '#0F5C5B' }} /> Reported
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="inline-block h-2 w-4 rounded-full" style={{ background: '#3F7D5B' }} /> Resolved
        </span>
      </div>
      {allZero ? (
        <p className="py-8 text-center text-xs text-muted">No trend data yet</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
          <defs>
            <linearGradient id="grad-rep" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F5C5B" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0F5C5B" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="grad-res" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3F7D5B" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3F7D5B" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f}
              x1={PAD.left} y1={PAD.top + inner.h * (1 - f)}
              x2={PAD.left + inner.w} y2={PAD.top + inner.h * (1 - f)}
              stroke="currentColor" strokeOpacity="0.06" strokeWidth="1"
            />
          ))}

          {/* Areas */}
          <path d={areaPath(repPts, bottom)} fill="url(#grad-rep)" />
          <path d={areaPath(resPts, bottom)} fill="url(#grad-res)" />

          {/* Lines */}
          <polyline points={polyline(repPts)} fill="none" stroke="#0F5C5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={polyline(resPts)} fill="none" stroke="#3F7D5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots */}
          {repPts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#0F5C5B" />)}
          {resPts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#3F7D5B" />)}

          {/* X labels — every other to avoid crowding */}
          {weeks.map((w, i) => i % 2 === 0 && (
            <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.45">
              {w.week}
            </text>
          ))}
        </svg>
      )}
    </div>
  )
}
