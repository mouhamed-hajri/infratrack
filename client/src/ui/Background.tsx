export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-paper" />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(60% 50% at 15% 0%, #0F5C5B12 0%, transparent 60%),' +
            'radial-gradient(50% 40% at 100% 20%, #C4622D10 0%, transparent 55%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
