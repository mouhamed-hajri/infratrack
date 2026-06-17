import 'leaflet/dist/leaflet.css'
import { useState, useRef, useEffect, type FormEvent } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { CATEGORIES, SEVERITIES, createIssue, uploadPhoto, cloudinaryConfigured, analyzePhoto, type Issue, type AiAssessment } from '../lib/api'
import { Surface } from '../ui/Surface'
import { Button } from '../ui/Button'
import { SeverityBadge } from './SeverityBadge'
import { AiSuggestion } from './AiSuggestion'

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

const pickerIcon = L.divIcon({
  className: 'infratrack-pin',
  html: '<span style="background:#0F5C5B"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

// Syncs the map view when GPS fires (coords change from outside the map)
function MapFlyTo({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap()
  const prev = useRef<string>('')
  useEffect(() => {
    if (lat === null || lng === null) return
    const key = `${lat},${lng}`
    if (key !== prev.current) { prev.current = key; map.flyTo([lat, lng], 15) }
  }, [lat, lng, map])
  return null
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onChange(e.latlng.lat, e.latlng.lng) })
  return null
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
  const [gpsCenter, setGpsCenter] = useState<[number, number] | null>(null) // only set by GPS, triggers map fly
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [aiStatus, setAiStatus] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle')
  const [aiResult, setAiResult] = useState<AiAssessment | undefined>(undefined)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPhoto(file)
    setAiStatus('idle')
    setAiResult(undefined)
    if (file) {
      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
      setAiStatus('analyzing')
      try {
        const result = await analyzePhoto(file)
        setAiResult(result)
        setAiStatus('done')
        setCategory(result.category)
        setSeverity(result.severity)
      } catch {
        setAiStatus('error')
      }
    } else {
      setPhotoPreview(null)
    }
  }

  function removePhoto() {
    setPhoto(null)
    setPhotoPreview(null)
    setAiStatus('idle')
    setAiResult(undefined)
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
        setGpsCenter([lat, lng])
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
      if (photo && cloudinaryConfigured) {
        photoUrl = await uploadPhoto(photo)
      }
      const issue = await createIssue({
        title, description, category, severity,
        latitude: lat, longitude: lng,
        photoUrl, address: address || undefined,
        aiCategory: aiResult?.category,
        aiSeverity: aiResult?.severity,
        aiConfidence: aiResult?.confidence,
        aiSummary: aiResult?.summary,
      })
      onCreated(issue)
      setTitle('')
      setDescription('')
      setPhoto(null)
      setPhotoPreview(null)
      setAiStatus('idle')
      setAiResult(undefined)
      setLatitude('')
      setLongitude('')
      setAddress('')
      setGeoStatus('idle')
      setGpsCenter(null)
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
                  Photo won't be saved — configure Cloudinary to enable uploads
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

        {/* AI suggestion panel */}
        {aiStatus !== 'idle' && <AiSuggestion status={aiStatus} result={aiResult} />}

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

        {/* Location — map picker + GPS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wide text-muted">Location</label>
            <button
              type="button"
              onClick={detectLocation}
              disabled={geoStatus === 'loading'}
              className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-medium text-paper transition hover:bg-brand-deep disabled:opacity-50"
            >
              {geoStatus === 'loading' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
              )}
              {geoStatus === 'loading' ? 'Detecting…' : 'Use my GPS'}
            </button>
          </div>

          {/* Interactive map picker */}
          <div className="relative z-0 isolate overflow-hidden rounded-2xl ring-1 ring-ink/10" style={{ height: 260 }}>
            <MapContainer
              center={[34.0, 9.5]}
              zoom={5}
              minZoom={5}
              maxBounds={[[29.5, 7.0], [38.0, 12.5]]}
              maxBoundsViscosity={1.0}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <ClickHandler onChange={(lat, lng) => {
                setLatitude(lat.toFixed(6))
                setLongitude(lng.toFixed(6))
                reverseGeocode(lat, lng).then(addr => { if (addr) setAddress(addr) })
              }} />
              <MapFlyTo lat={gpsCenter?.[0] ?? null} lng={gpsCenter?.[1] ?? null} />
              {latitude && longitude && (
                <Marker
                  position={[Number(latitude), Number(longitude)]}
                  icon={pickerIcon}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const { lat, lng } = (e.target as L.Marker).getLatLng()
                      setLatitude(lat.toFixed(6))
                      setLongitude(lng.toFixed(6))
                      reverseGeocode(lat, lng).then(addr => { if (addr) setAddress(addr) })
                    },
                  }}
                />
              )}
            </MapContainer>
            {!latitude && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="rounded-xl bg-ink/60 px-3 py-1.5 text-xs text-paper backdrop-blur-sm">
                  Tap the map or use GPS to pin your location
                </span>
              </div>
            )}
          </div>

          {address && (
            <p className="rounded-xl bg-brand-tint px-4 py-2.5 text-sm text-brand leading-snug">{address}</p>
          )}
          {geoStatus === 'error' && (
            <p className="text-xs text-clay">Could not detect location — tap the map to place a pin manually.</p>
          )}
        </div>

        <Button type="submit" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit report'}
        </Button>
      </form>
    </Surface>
  )
}
