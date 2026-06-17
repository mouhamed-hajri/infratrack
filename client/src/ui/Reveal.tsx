import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

export function Reveal({ children, delay = 0, className = '', id }: { children: ReactNode; delay?: number; className?: string; id?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <div id={id} className={className}>{children}</div>
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
    >
      {children}
    </motion.div>
  )
}
