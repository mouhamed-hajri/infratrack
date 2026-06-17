import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import type { Issue } from '../lib/api'
import { severityColor } from '../lib/severity'
import { SeverityBadge } from './SeverityBadge'

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

interface Props {
  issues: Issue[]
  className?: string
  showLocate?: boolean
}

export function IssueMap({ issues, className = 'h-[70vh]', showLocate }: Props) {
  const valid = issues.filter((i) => i.latitude && i.longitude)

  return (
    // ponytail: z-0 + isolate contains Leaflet's z-700 panes beneath fixed z-50 navbars
    <div className={`relative z-0 isolate overflow-hidden rounded-[1.375rem] ${className}`}>
      <MapContainer
        center={[34.0, 9.5]}
        zoom={6}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitBounds issues={valid} />
        {showLocate && <LocateButton />}
        {valid.map((issue) => (
          <Marker key={issue.id} position={[issue.latitude, issue.longitude]} icon={iconFor(issue.severity)}>
            <Popup>
              <div className="min-w-[200px] space-y-1.5 p-1">
                <p className="font-semibold text-ink leading-tight">{issue.title}</p>
                <SeverityBadge severity={issue.severity} />
                <p className="text-xs text-muted">
                  {issue.category.replace(/_/g, ' ')} · {issue.status.replace(/_/g, ' ')}
                </p>
                {issue.address && <p className="text-xs text-muted">{issue.address}</p>}
                {issue.photoUrl && (
                  <img src={issue.photoUrl} alt="issue" className="mt-2 h-24 w-full rounded-lg object-cover" />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
