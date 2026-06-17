import { useState, type FormEvent } from 'react'
import { CATEGORIES, SEVERITIES, createIssue, type Issue } from '../lib/api'
import { Surface } from '../ui/Surface'
import { Button } from '../ui/Button'
import { SeverityBadge } from './SeverityBadge'

const CATEGORY_LABELS: Record<string, string> = {
  POTHOLE: 'Pothole',
  ROAD_DAMAGE: 'Road damage',
  TRAFFIC_LIGHT: 'Traffic light',
  FLOODING: 'Flooding',
  SIGNAGE: 'Signage',
  OTHER: 'Other',
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW:      '#3F7D5B',
  MEDIUM:   '#B8861E',
  HIGH:     '#C4622D',
  CRITICAL: '#A8321F',
}

const inputCls = 'w-full rounded-2xl bg-paper-2/50 px-4 py-3.5 text-sm text-ink placeholder-muted outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-clay/50'

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
    <Surface className="p-7">
      <form onSubmit={submit} className="space-y-6">

        {error && (
          <p className="rounded-xl px-4 py-3 text-sm" style={{ color: '#A8321F', backgroundColor: '#A8321F12' }}>
            {error}
          </p>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Title</label>
          <input
            className={inputCls}
            placeholder="e.g. Large pothole on Avenue Habib Bourguiba"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Description</label>
          <textarea
            className={inputCls}
            placeholder="Describe the problem in a few words"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Category choice chips */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Category</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  category === c
                    ? 'bg-brand text-paper shadow-[0_2px_8px_rgba(15,92,91,.25)]'
                    : 'bg-paper-2/60 text-muted ring-1 ring-ink/10 hover:ring-ink/20'
                }`}
              >
                {CATEGORY_LABELS[c] ?? c}
              </button>
            ))}
          </div>
        </div>

        {/* Severity segmented control */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Severity</label>
          <div className="flex rounded-2xl bg-paper-2/50 p-1 ring-1 ring-ink/10">
            {SEVERITIES.map((s) => {
              const active = severity === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    active ? 'shadow-[0_1px_4px_rgba(40,30,15,.1)]' : 'text-muted hover:text-ink'
                  }`}
                  style={active ? { backgroundColor: SEVERITY_COLORS[s] + '18', color: SEVERITY_COLORS[s] } : {}}
                >
                  {s}
                </button>
              )
            })}
          </div>
          <div className="flex justify-end">
            <SeverityBadge severity={severity} />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Location (auto-filled in Week 3)</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              className={`${inputCls} tabular-nums`}
              placeholder="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <input
              className={`${inputCls} tabular-nums`}
              placeholder="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit report'}
        </Button>
      </form>
    </Surface>
  )
}
