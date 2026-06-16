import { createContext, useContext, useRef, type ReactNode, type RefObject } from 'react'

// Shares the page-level element that all LiquidGlass components track the mouse
// against, so the whole viewport drives the refraction (no prop-drilling).
const GlassContext = createContext<RefObject<HTMLDivElement | null> | null>(null)

// Cast to the element type liquid-glass-react's `mouseContainer` expects.
export function useGlassContainer() {
  return useContext(GlassContext) as RefObject<HTMLElement> | null
}

export function GlassProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <GlassContext.Provider value={ref}>
      <div ref={ref} className="relative min-h-screen">
        {children}
      </div>
    </GlassContext.Provider>
  )
}
