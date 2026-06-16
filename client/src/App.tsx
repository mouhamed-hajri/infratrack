import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { getIssues, type Issue } from './lib/api'
import { GlassProvider } from './ui/GlassProvider'
import { Background } from './ui/Background'
import { Nav } from './ui/Nav'
import { Footer } from './ui/Footer'
import { GlassButton } from './ui/GlassButton'
import { GlassCard } from './ui/GlassCard'
import { ReportForm } from './components/ReportForm'
import { IssueList } from './components/IssueList'

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
}

const features = [
  { icon: '📸', title: 'Snap & locate', desc: 'A photo and your GPS — a full report takes seconds.' },
  { icon: '✨', title: 'AI severity', desc: 'Damage is graded automatically and pre-prioritized.' },
  { icon: '🔔', title: 'Tracked openly', desc: 'Every status change, visible on a public timeline.' },
]

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

export default function App() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [govOptions, setGovOptions] = useState<{ id: string; name: string }[]>([])
  const [filter, setFilter] = useState('')

  const refresh = useCallback(async () => {
    setIssues(await getIssues(filter || undefined))
  }, [filter])

  const loadOptions = useCallback(async () => {
    const all = await getIssues()
    const map = new Map<string, string>()
    all.forEach((i) => i.governorate && map.set(i.governorate.id, i.governorate.name))
    setGovOptions([...map].map(([id, name]) => ({ id, name })))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])
  useEffect(() => {
    loadOptions()
  }, [loadOptions])

  async function handleCreated() {
    await refresh()
    await loadOptions()
  }

  return (
    <GlassProvider>
      <Background />
      <Nav />

      <main className="mx-auto max-w-6xl px-6 pb-12 pt-36">
        {/* Hero */}
        <motion.section {...fadeUp} className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-7">
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Tunisia's roads,{' '}
              <span className="bg-gradient-to-r from-[#4f8ef7] to-[#a78bfa] bg-clip-text text-transparent">
                fixed faster
              </span>
              .
            </h1>
            <p className="max-w-md text-lg font-light text-slate-400">
              Snap a problem. We grade its severity and route it to the right authority — then track it
              transparently to resolution.
            </p>
            <div className="flex flex-wrap gap-4">
              <GlassButton onClick={() => scrollTo('report')}>Report an issue</GlassButton>
              <GlassButton variant="secondary" onClick={() => scrollTo('issues')}>
                View issues
              </GlassButton>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <GlassCard className="w-full max-w-xs">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#4f8ef7]" /> Live
              </div>
              <div className="mt-3 text-6xl font-semibold text-white">{issues.length}</div>
              <div className="text-sm text-slate-400">issues tracked</div>
              <div className="mt-5 text-sm font-light text-slate-300">
                across <span className="text-[#a78bfa]">24 governorates</span>
              </div>
            </GlassCard>
          </div>
        </motion.section>

        {/* How it works */}
        <motion.section id="how" {...fadeUp} className="py-20">
          <h2 className="mb-10 text-3xl font-semibold md:text-4xl">How it works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="transition-transform duration-300 hover:-translate-y-1">
                <GlassCard>
                  <div className="text-3xl">{f.icon}</div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm font-light text-slate-300">{f.desc}</p>
                </GlassCard>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Report */}
        <motion.section id="report" {...fadeUp} className="py-20">
          <h2 className="mb-8 text-3xl font-semibold md:text-4xl">Report a problem</h2>
          <div className="max-w-2xl">
            <ReportForm onCreated={handleCreated} />
          </div>
        </motion.section>

        {/* Issues */}
        <motion.section id="issues" {...fadeUp} className="py-20">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold md:text-4xl">Reported issues</h2>
            <select
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white outline-none"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="" className="bg-[#0a0f1e]">All governorates</option>
              {govOptions.map((g) => (
                <option key={g.id} value={g.id} className="bg-[#0a0f1e]">
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <IssueList issues={issues} />
        </motion.section>
      </main>

      <Footer />
    </GlassProvider>
  )
}
