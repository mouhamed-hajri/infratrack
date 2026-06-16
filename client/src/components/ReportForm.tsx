import { useState, type FormEvent } from 'react'
import { CATEGORIES, SEVERITIES, createIssue, type Issue } from '../lib/api'

export function ReportForm({ onCreated }: { onCreated: (issue: Issue) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [severity, setSeverity] = useState<string>('MEDIUM')
  const [latitude, setLatitude] = useState('35.778')
  const [longitude, setLongitude] = useState('10.826')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const issue = await createIssue({
        title,
        description,
        category,
        severity,
        latitude: Number(latitude),
        longitude: Number(longitude),
      })
      onCreated(issue)
      setTitle('')
      setDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Report an issue</h2>
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <input
        className="w-full rounded border border-gray-300 p-2"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full rounded border border-gray-300 p-2"
        placeholder="Description"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex gap-2">
        <select className="flex-1 rounded border border-gray-300 p-2" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className="flex-1 rounded border border-gray-300 p-2" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <input className="flex-1 rounded border border-gray-300 p-2" placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
        <input className="flex-1 rounded border border-gray-300 p-2" placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
      </div>
      <button disabled={busy} className="w-full rounded bg-blue-600 p-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {busy ? 'Submitting…' : 'Submit report'}
      </button>
    </form>
  )
}
