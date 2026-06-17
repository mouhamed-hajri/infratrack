import { useEffect, useState } from 'react'
import { getMyIssues, type Issue } from '../lib/api'
import { IssueList } from '../components/IssueList'
import { Eyebrow } from '../ui/Eyebrow'
import { Reveal } from '../ui/Reveal'

export function MyReports() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyIssues().then(setIssues).finally(() => setLoading(false))
  }, [])

  return (
    <main className="mx-auto max-w-[1200px] px-5 pb-28 pt-24 md:px-8 md:pb-16 md:pt-32">
      <Reveal>
        <Eyebrow>My activity</Eyebrow>
        <h1 className="mt-4 mb-8 text-3xl md:text-4xl">My reports</h1>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <IssueList issues={issues} />
        )}
      </Reveal>
    </main>
  )
}
