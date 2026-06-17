export function Eyebrow({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-ink/10 bg-brand-tint px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-brand">
      {children}
    </span>
  )
}
