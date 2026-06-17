import 'leaflet.heat'
import L from 'leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { Issue } from '../lib/api'

const WEIGHT: Record<string, number> = { CRITICAL: 1, HIGH: 0.7, MEDIUM: 0.4, LOW: 0.2 }

export function HeatLayer({ issues }: { issues: Issue[] }) {
  const map = useMap()

  useEffect(() => {
    const points = issues
      .filter(i => i.latitude && i.longitude)
      .map(i => [i.latitude, i.longitude, WEIGHT[i.severity] ?? 0.3] as [number, number, number])

    // @ts-expect-error leaflet.heat augments L at runtime
    const layer = L.heatLayer(points, {
      radius: 40,
      blur: 25,
      max: 0.6,       // most HIGH/CRITICAL points exceed this → rendered at full intensity
      minOpacity: 0.45, // ensures every point is visible regardless of density
      gradient: { 0: '#3F7D5B', 0.4: '#B8861E', 0.7: '#C4622D', 1: '#A8321F' },
    }).addTo(map)

    return () => { map.removeLayer(layer) }
  }, [issues, map])

  return null
}
