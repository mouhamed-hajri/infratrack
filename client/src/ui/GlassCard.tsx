import LiquidGlass from 'liquid-glass-react'
import type { ReactNode } from 'react'
import { useGlassContainer } from './GlassProvider'

// Showcase card — true liquid-glass refraction. Used for hero stat + feature cards.
// (Dense / repeating surfaces use the lighter `.glass` CSS class instead.)
export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  const mouseContainer = useGlassContainer()
  return (
    <LiquidGlass
      cornerRadius={24}
      displacementScale={60}
      blurAmount={0.06}
      saturation={130}
      mode="polar"
      overLight={false}
      mouseContainer={mouseContainer ?? undefined}
      className={className}
    >
      <div className="p-7 text-white">{children}</div>
    </LiquidGlass>
  )
}
