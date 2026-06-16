import LiquidGlass from 'liquid-glass-react'
import type { ReactNode } from 'react'
import { useGlassContainer } from './GlassProvider'

type Props = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary'
}

// Pill-shaped liquid-glass button. Wraps a real <button> so clicks, form submit,
// and keyboard focus all work natively — the glass is purely visual.
export function GlassButton({ children, onClick, type = 'button', variant = 'primary' }: Props) {
  const mouseContainer = useGlassContainer()
  return (
    <LiquidGlass
      cornerRadius={100}
      padding="0"
      displacementScale={64}
      aberrationIntensity={2}
      elasticity={0.35}
      overLight={false}
      mouseContainer={mouseContainer ?? undefined}
      style={{ display: 'inline-block' }}
    >
      <button
        type={type}
        onClick={onClick}
        className={`cursor-pointer whitespace-nowrap rounded-full bg-transparent px-7 py-3 text-sm font-medium tracking-wide outline-none ${
          variant === 'primary' ? 'text-white' : 'text-slate-300'
        }`}
      >
        {children}
      </button>
    </LiquidGlass>
  )
}
