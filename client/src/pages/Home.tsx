import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIssues, type Issue } from '../lib/api'
import { Button } from '../ui/Button'
import { Surface } from '../ui/Surface'
import { Eyebrow } from '../ui/Eyebrow'
import { Reveal } from '../ui/Reveal'
import { ReportForm } from '../components/ReportForm'
import { IssueList } from '../components/IssueList'
import { useAuth } from '../auth/AuthContext'

const steps = [
  {
    num: '01',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    title: 'Snap & locate',
    desc: 'A photo and your GPS — a full report takes seconds.',
    span: 'md:col-span-5',
  },
  {
    num: '02',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'AI severity grading',
    desc: 'Damage is classified and pre-prioritized automatically.',
    span: 'md:col-span-7',
  },
  {
    num: '03',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
      </svg>
    ),
    title: 'Tracked openly',
    desc: 'Every status change is visible on a public timeline.',
    span: 'md:col-span-12',
  },
]

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

export function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [issues, setIssues] = useState<Issue[]>([])
  const [govOptions, setGovOptions] = useState<{ id: string; name: string }[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => { getIssues(filter || undefined).then(setIssues) }, [filter])
  useEffect(() => {
    getIssues().then((all) => {
      const map = new Map<string, string>()
      all.forEach((i) => i.governorate && map.set(i.governorate.id, i.governorate.name))
      setGovOptions([...map].map(([id, name]) => ({ id, name })))
    })
  }, [])

  async function handleCreated(issue: Issue) {
    const updated = await getIssues(filter || undefined)
    setIssues(updated)
    if (issue.governorate && !govOptions.some((g) => g.id === issue.governorate!.id)) {
      setGovOptions((prev) => [...prev, { id: issue.governorate!.id, name: issue.governorate!.name }])
    }
  }

  function handleReportClick() {
    if (!user) { navigate('/login'); return }
    scrollTo('report')
  }

  return (
    <main className="mx-auto max-w-[1200px] px-5 pb-28 md:px-8 md:pb-16">

      {/* Hero */}
      <Reveal className="grid items-center gap-10 pt-20 pb-24 md:grid-cols-2 md:pt-36 md:pb-32">
        <div className="space-y-6">
          <Eyebrow>Tunisia · Smart Cities</Eyebrow>
          <h1 className="text-4xl leading-[1.06] md:text-6xl lg:text-7xl">
            Report the road.<br />Track the fix.
          </h1>
          <p className="max-w-[50ch] text-base leading-relaxed text-muted md:text-lg">
            Snap a problem, we grade its severity and route it to the right authority — then track it transparently to resolution.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleReportClick}>Report an issue</Button>
            <Button variant="ghost" onClick={() => scrollTo('issues')}>See issues</Button>
          </div>
        </div>
        <div className="flex justify-center md:justify-end">
          <Surface className="w-full max-w-xs p-8">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" /> Live
            </div>
            <div className="mt-4 font-display text-7xl font-semibold tabular-nums text-ink">{issues.length}</div>
            <div className="mt-1 text-sm text-muted">issues tracked</div>
            <div className="mt-5 text-sm text-muted">across <span className="font-medium text-brand">24 governorates</span></div>
          </Surface>
        </div>
      </Reveal>

      {/* How it works */}
      <Reveal id="how" className="py-24 md:py-32">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-4 mb-10 text-3xl md:text-4xl">Three steps to a fixed road</h2>
        <div className="grid gap-4 md:grid-cols-12">
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.08} className={s.span}>
              <Surface className="p-7 h-full">
                <span className="font-display text-sm font-medium text-clay">{s.num}</span>
                <div className="mt-4 text-muted">{s.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
              </Surface>
            </Reveal>
          ))}
        </div>
      </Reveal>

      {/* Report */}
      {user && (
        <Reveal id="report" className="py-24 md:py-32">
          <Eyebrow>Report a problem</Eyebrow>
          <h2 className="mt-4 mb-8 text-3xl md:text-4xl">What did you find?</h2>
          <div className="max-w-2xl">
            <ReportForm onCreated={handleCreated} />
          </div>
        </Reveal>
      )}

      {/* Issues */}
      <Reveal id="issues" className="py-24 md:py-32">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <h2 className="flex-1 text-3xl md:text-4xl">Reported issues</h2>
          <select
            className="w-full rounded-full bg-card px-4 py-2 text-sm text-ink ring-1 ring-ink/15 outline-none sm:w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="" className="bg-card">All governorates</option>
            {govOptions.map((g) => (
              <option key={g.id} value={g.id} className="bg-card">{g.name}</option>
            ))}
          </select>
        </div>
        <IssueList issues={issues} />
      </Reveal>
    </main>
  )
}
