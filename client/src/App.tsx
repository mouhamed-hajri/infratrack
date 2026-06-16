import { useEffect, useState, useCallback } from 'react'
import { getIssues, type Issue } from './lib/api'
import { ReportForm } from './components/ReportForm'
import { IssueList } from './components/IssueList'

export default function App() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [govOptions, setGovOptions] = useState<{ id: string; name: string }[]>([])
  const [filter, setFilter] = useState('')

  const refresh = useCallback(async () => {
    setIssues(await getIssues(filter || undefined))
  }, [filter])

  // Build the governorate filter options from the full (unfiltered) issue list.
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
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <header>
        <h1 className="text-2xl font-bold text-blue-700">InfraTrack</h1>
        <p className="text-sm text-gray-500">Report and track urban infrastructure issues.</p>
      </header>

      <ReportForm onCreated={handleCreated} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reported issues</h2>
        <select
          className="rounded border border-gray-300 p-1.5 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All governorates</option>
          {govOptions.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <IssueList issues={issues} />
    </div>
  )
}
