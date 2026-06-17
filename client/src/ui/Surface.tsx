import type { ReactNode } from 'react'

// Double-bezel "machined" surface. inner_radius = outer_radius - padding → 1.75rem - 0.375rem = 1.375rem
export function Surface({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="rounded-[1.75rem] bg-paper-2/60 p-1.5 ring-1 ring-ink/5 shadow-[0_1px_2px_rgba(40,30,15,.04),0_12px_32px_-12px_rgba(40,30,15,.12)]">
      <div className={`rounded-[1.375rem] bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,.6)] ${className}`}>
        {children}
      </div>
    </div>
  )
}
