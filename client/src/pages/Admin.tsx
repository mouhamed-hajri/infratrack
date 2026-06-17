import { useEffect, useState, type FormEvent } from 'react'
import { createMunicipality, getIssues } from '../lib/api'
import { Surface } from '../ui/Surface'
import { Button } from '../ui/Button'
import { Eyebrow } from '../ui/Eyebrow'
import { Reveal } from '../ui/Reveal'

const inputCls = 'w-full rounded-2xl bg-paper-2/50 px-4 py-3.5 text-sm text-ink placeholder-muted outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-clay/50'

export function Admin() {
  const [govOptions, setGovOptions] = useState<{ id: string; name: string }[]>([])
  const [name, setName] = useState('')
  const [governorateId, setGovernorateId] = useState('')
  const [boundary, setBoundary] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getIssues().then((all) => {
      const map = new Map<string, string>()
      all.forEach((i) => i.governorate && map.set(i.governorate.id, i.governorate.name))
      const opts = [...map].map(([id, n]) => ({ id, name: n }))
      setGovOptions(opts)
      if (opts.length > 0) setGovernorateId(opts[0].id)
    })
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      let parsedBoundary: object
      try { parsedBoundary = JSON.parse(boundary) } catch { throw new Error('Boundary must be valid GeoJSON') }
      await createMunicipality({ name, governorateId, boundary: parsedBoundary })
      setSuccess(`Municipality "${name}" created. Reports inside its polygon now route to it.`)
      setName('')
      setBoundary('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create municipality')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-[1200px] px-5 pb-28 pt-24 md:px-8 md:pb-16 md:pt-32">
      <Reveal>
        <Eyebrow>Admin</Eyebrow>
        <h1 className="mt-4 mb-8 text-3xl md:text-4xl">Onboard a municipality</h1>
        <div className="max-w-2xl">
          <Surface className="p-7">
            <form onSubmit={submit} className="space-y-5">
              {error && <p className="rounded-xl px-4 py-3 text-sm" style={{ color: '#A8321F', backgroundColor: '#A8321F12' }}>{error}</p>}
              {success && <p className="rounded-xl px-4 py-3 text-sm" style={{ color: '#3F7D5B', backgroundColor: '#3F7D5B12' }}>{success}</p>}
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted">Municipality name</label>
                <input className={inputCls} placeholder="e.g. Commune de Sfax" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted">Parent governorate</label>
                <select className={inputCls} value={governorateId} onChange={(e) => setGovernorateId(e.target.value)}>
                  {govOptions.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted">GeoJSON boundary (Polygon)</label>
                <textarea className={inputCls} placeholder='{"type":"Polygon","coordinates":[[[lng,lat],...]]}' rows={5} value={boundary} onChange={(e) => setBoundary(e.target.value)} required />
              </div>
              <Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create municipality'}</Button>
            </form>
          </Surface>
        </div>
      </Reveal>
    </main>
  )
}
