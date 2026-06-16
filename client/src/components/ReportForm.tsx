import { useState, type FormEvent } from 'react'
import { CATEGORIES, SEVERITIES, createIssue, type Issue } from '../lib/api'

const field =
  'w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none transition focus:border-[#4f8ef7]/70'
const opt = 'bg-[#0a0f1e] text-white'

// CSS-glass panel (not LiquidGlass): a LiquidGlass panel can't reliably size to a
// tall form and breaks when it contains another glass element (the submit button).
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
    <div className="glass p-8" style={{ borderRadius: '32px' }}>
      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Report an issue</h2>
        {error && <p className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p>}
        <input className={field} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          className={field}
          placeholder="Describe the problem"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className={opt}>
                {c}
              </option>
            ))}
          </select>
          <select className={field} value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s} className={opt}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={field} placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
          <input className={field} placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
        </div>
        <button type="submit" disabled={busy} className="glass-btn px-7 py-3 text-sm font-medium disabled:opacity-50">
          {busy ? 'Submitting…' : 'Submit report'}
        </button>
      </form>
    </div>
  )
}
