import { useState, useRef, type FormEvent } from 'react'
import { CATEGORIES, SEVERITIES, createIssue, uploadPhoto, cloudinaryConfigured, type Issue } from '../lib/api'
import { Surface } from '../ui/Surface'
import { Button } from '../ui/Button'
import { SeverityBadge } from './SeverityBadge'

const CATEGORY_LABELS: Record<string, string> = {
  POTHOLE: 'Pothole', ROAD_DAMAGE: 'Road damage', TRAFFIC_LIGHT: 'Traffic light',
  FLOODING: 'Flooding', SIGNAGE: 'Signage', OTHER: 'Other',
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#3F7D5B', MEDIUM: '#B8861E', HIGH: '#C4622D', CRITICAL: '#A8321F',
}

const inputCls = 'w-full rounded-2xl bg-paper-2/50 px-4 py-3.5 text-sm text-ink placeholder-muted outline-none ring-1 ring-ink/10 transition focus:ring-2 focus:ring-clay/50'

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } },
    )
    if (!res.ok) return null
    const data = await res.json()
    return (data.display_name as string) ?? null
  } catch {
    return null
  }
}

export function ReportForm({ onCreated }: { onCreated: (issue: Issue) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [severity, setSeverity] = useState<string>('MEDIUM')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [address, setAddress] = useState('')
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPhoto(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
    } else {
      setPhotoPreview(null)
    }
  }

  function removePhoto() {
    setPhoto(null)
    setPhotoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoStatus('error')
      return
    }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLatitude(lat.toFixed(6))
        setLongitude(lng.toFixed(6))
        setGeoStatus('done')
        const addr = await reverseGeocode(lat, lng)
        if (addr) setAddress(addr)
      },
      () => setGeoStatus('error'),
      { timeout: 10000, maximumAge: 60000 },
    )
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const lat = Number(latitude)
    const lng = Number(longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !latitude || !longitude) {
      setError('Please detect your location or enter coordinates.')
      return
    }
    setBusy(true)
    try {
      let photoUrl: string | undefined
      if (photo) {
        if (cloudinaryConfigured) {
          photoUrl = await uploadPhoto(photo)
        }
        // ponytail: if Cloudinary not configured, skip photo — form still submits
      }
      const issue = await createIssue({
        title, description, category, severity,
        latitude: lat, longitude: lng,
        photoUrl, address: address || undefined,
      })
      onCreated(issue)
      setTitle('')
      setDescription('')
      setPhoto(null)
      setPhotoPreview(null)
      setLatitude('')
      setLongitude('')
      setAddress('')
      setGeoStatus('idle')
      if (fileRef.current) fileRef.current.value = ''
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

        {/* Photo capture */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Photo</label>
          {photoPreview ? (
            <div className="relative w-full overflow-hidden rounded-2xl bg-paper-2">
              <img src={photoPreview} alt="Preview" className="h-48 w-full object-cover" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/60 text-paper backdrop-blur-sm transition hover:bg-ink/80"
                aria-label="Remove photo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              {!cloudinaryConfigured && (
                <div className="absolute bottom-0 inset-x-0 bg-ink/60 px-3 py-1.5 text-center text-xs text-paper backdrop-blur-sm">
                  Photo preview only — configure Cloudinary to upload
                </div>
              )}
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-paper-2/40 py-8 transition hover:border-brand/40 hover:bg-brand-tint">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span className="text-sm text-muted">Tap to take a photo</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={handlePhoto}
              />
            </label>
          )}
        </div>

        {/* Title */}
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

        {/* Description */}
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

        {/* Category chips */}
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
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${active ? 'shadow-[0_1px_4px_rgba(40,30,15,.1)]' : 'text-muted hover:text-ink'}`}
                  style={active ? { backgroundColor: SEVERITY_COLORS[s] + '18', color: SEVERITY_COLORS[s] } : {}}
                >
                  {s}
                </button>
              )
            })}
          </div>
          <div className="flex justify-end"><SeverityBadge severity={severity} /></div>
        </div>

        {/* GPS location */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted">Location</label>
          {geoStatus === 'done' && address && (
            <p className="rounded-xl bg-brand-tint px-4 py-2.5 text-sm text-brand leading-snug">{address}</p>
          )}
          <div className="flex gap-2">
            <div className="grid flex-1 grid-cols-2 gap-2">
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
            <button
              type="button"
              onClick={detectLocation}
              disabled={geoStatus === 'loading'}
              className="flex shrink-0 items-center justify-center rounded-2xl bg-brand px-4 text-paper transition hover:bg-brand-deep disabled:opacity-50"
              title="Detect my location"
            >
              {geoStatus === 'loading' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  <path d="m4.93 4.93 2.12 2.12M16.95 16.95l2.12 2.12M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12" />
                </svg>
              )}
            </button>
          </div>
          {geoStatus === 'error' && (
            <p className="text-xs text-clay">Could not detect location — please enter coordinates manually.</p>
          )}
        </div>

        <Button type="submit" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit report'}
        </Button>
      </form>
    </Surface>
  )
}
