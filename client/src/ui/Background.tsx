// The rich, slowly drifting background the glass refracts. Fixed behind everything.
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="orb"
        style={{ width: 560, height: 560, top: '-8%', left: '-6%', background: '#4f8ef7', animation: 'drift1 26s ease-in-out infinite' }}
      />
      <div
        className="orb"
        style={{ width: 520, height: 520, top: '28%', right: '-10%', background: '#a78bfa', animation: 'drift2 30s ease-in-out infinite' }}
      />
      <div
        className="orb"
        style={{ width: 460, height: 460, bottom: '-14%', left: '22%', background: '#0ea5e9', animation: 'drift3 24s ease-in-out infinite' }}
      />
    </div>
  )
}
