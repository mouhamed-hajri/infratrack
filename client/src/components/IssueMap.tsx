import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect, useState } from 'react'
import type { Issue } from '../lib/api'
import { severityColor } from '../lib/severity'
import { SeverityBadge } from './SeverityBadge'
import { StatusBadge } from './StatusBadge'
import { PhotoLightbox } from './PhotoLightbox'
import { HeatLayer } from './HeatLayer'

// ponytail: divIcon avoids the Vite marker-PNG 404 and gives severity color
const iconFor = (severity: string) =>
  L.divIcon({
    className: 'infratrack-pin',
    html: `<span style="background:${severityColor(severity)}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  })


function FitBounds({ issues }: { issues: Issue[] }) {
  const map = useMap()
  useEffect(() => {
    const pts = issues.filter((i) => i.latitude && i.longitude).map((i) => [i.latitude, i.longitude] as [number, number])
    if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 })
  }, [issues, map])
  return null
}

function LocateButton() {
  const map = useMap()
  return (
    <button
      onClick={() =>
        navigator.geolocation.getCurrentPosition((pos) =>
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 15)
        )
      }
      title="Locate me"
      className="absolute bottom-4 right-4 z-[1000] flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-md ring-1 ring-ink/10 transition hover:bg-paper-2"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
      </svg>
    </button>
  )
}

const SEV_LEGEND = [
  { label: 'Critical', color: '#A8321F' },
  { label: 'High', color: '#C4622D' },
  { label: 'Medium', color: '#B8861E' },
  { label: 'Low', color: '#3F7D5B' },
]

interface Props {
  issues: Issue[]
  className?: string
  showLocate?: boolean
  mode?: 'pins' | 'heat'
  onModeChange?: (m: 'pins' | 'heat') => void
}

export function IssueMap({ issues, className = 'h-[70vh]', showLocate, mode, onModeChange }: Props) {
  const valid = issues.filter((i) => i.latitude && i.longitude && i.status !== 'RESOLVED' && i.status !== 'REJECTED')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const controlled = mode !== undefined

  return (
    // ponytail: z-0 + isolate contains Leaflet's z-700 panes beneath fixed z-50 navbars
    <div className={`relative z-0 isolate overflow-hidden rounded-[1.375rem] ${className}`}>
      <MapContainer
        center={[34.0, 9.5]}
        zoom={6}
        minZoom={5}
        maxBounds={[[29.5, 7.0], [38.0, 12.5]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitBounds issues={valid} />
        {showLocate && <LocateButton />}
        {(!controlled || mode === 'pins') && valid.map((issue) => (
          <Marker key={issue.id} position={[issue.latitude, issue.longitude]} icon={iconFor(issue.severity)}>
            <Popup minWidth={240} maxWidth={280}>
              <div style={{ width: 240 }} className="space-y-1.5 py-0.5">
                {issue.photoUrl && (
                  <img
                    src={issue.photoUrl}
                    alt="issue"
                    style={{ width: 'calc(100% + 24px)', objectFit: 'contain', background: '#F2EBDF', borderRadius: 8, display: 'block', margin: '0 -12px 8px', cursor: 'zoom-in' }}
                    onClick={() => setLightbox(issue.photoUrl!)}
                  />
                )}
                <p style={{ fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>{issue.title}</p>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                  <SeverityBadge severity={issue.severity} />
                  <StatusBadge status={issue.status} />
                </div>
                <p style={{ fontSize: 11, color: '#6B6356' }}>
                  {issue.category.replace(/_/g, ' ')}
                </p>
                {issue.address && <p style={{ fontSize: 11, color: '#6B6356' }}>{issue.address}</p>}
                <a href={`/issues/${issue.id}`} style={{ fontSize: 12, color: '#0F5C5B', marginTop: 6, display: 'inline-block' }}>
                  View timeline →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
        {controlled && mode === 'heat' && <HeatLayer issues={valid} />}
      </MapContainer>

      {/* Severity legend — shown in heat mode */}
      {controlled && mode === 'heat' && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] flex flex-col gap-1 rounded-xl bg-card/90 px-3 py-2 shadow-md backdrop-blur-sm">
          {SEV_LEGEND.map(s => (
            <span key={s.label} className="flex items-center gap-1.5 text-xs text-ink">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      {/* Mode toggle (passed from parent if controlled) */}
      {controlled && onModeChange && (
        <div className="absolute right-4 top-4 z-[1000] flex rounded-xl bg-card/90 p-0.5 shadow-md backdrop-blur-sm ring-1 ring-ink/10">
          {(['pins', 'heat'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${mode === m ? 'bg-white/80 text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
            >
              {m === 'pins' ? 'Pins' : 'Heatmap'}
            </button>
          ))}
        </div>
      )}

      {lightbox && <PhotoLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}
