import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'ghost'
  icon?: boolean
  disabled?: boolean
}

export function Button({ children, onClick, type = 'button', variant = 'primary', icon = true, disabled }: Props) {
  const base =
    `group inline-flex items-center justify-center gap-3 rounded-full ${icon ? 'pl-6 pr-2' : 'px-6'} py-2 text-sm font-medium ` +
    'transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/60 disabled:opacity-50'
  const skin =
    variant === 'primary'
      ? 'bg-brand text-paper hover:bg-brand-deep shadow-[0_2px_4px_rgba(40,30,15,.05),0_16px_40px_-16px_rgba(15,92,91,.5)]'
      : 'bg-transparent text-ink ring-1 ring-ink/15 hover:ring-ink/30'
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${skin}`}>
      <span className="py-1">{children}</span>
      {icon && (
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] ${
            variant === 'primary' ? 'bg-paper/15' : 'bg-ink/5'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      )}
    </button>
  )
}
