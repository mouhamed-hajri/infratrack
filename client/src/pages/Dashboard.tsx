import { useEffect, useState } from 'react'
import { getJurisdictionIssues, type Issue } from '../lib/api'
import { IssueList } from '../components/IssueList'
import { IssueMap } from '../components/IssueMap'
import { Eyebrow } from '../ui/Eyebrow'
import { Reveal } from '../ui/Reveal'
import { useAuth } from '../auth/AuthContext'

export function Dashboard() {
  const { user } = useAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getJurisdictionIssues().then(setIssues).finally(() => setLoading(false))
  }, [])

  const scope = user?.role === 'ADMIN' ? 'all governorates' : 'your governorate'

  return (
    <main className="mx-auto max-w-[1200px] px-5 pb-28 pt-24 md:px-8 md:pb-16 md:pt-32">
      <Reveal>
        <Eyebrow>Authority view</Eyebrow>
        <h1 className="mt-4 mb-2 text-3xl md:text-4xl">Triage dashboard</h1>
        <p className="mb-8 text-sm text-muted">Showing issues from {scope}</p>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <>
            <IssueMap issues={issues} className="h-[460px] mb-8" />
            <IssueList issues={issues} />
          </>
        )}
      </Reveal>
    </main>
  )
}
