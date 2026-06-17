import 'leaflet.heat'
import L from 'leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { Issue } from '../lib/api'

const WEIGHT: Record<string, number> = { CRITICAL: 1, HIGH: 0.75, MEDIUM: 0.4, LOW: 0.15 }

export function HeatLayer({ issues }: { issues: Issue[] }) {
  const map = useMap()

  useEffect(() => {
    const points = issues
      .filter(i => i.latitude && i.longitude)
      .map(i => [i.latitude, i.longitude, WEIGHT[i.severity] ?? 0.3] as [number, number, number])

    // @ts-expect-error leaflet.heat augments L at runtime
    const layer = L.heatLayer(points, {
      radius: 35,
      blur: 22,
      max: 1,
      gradient: { 0.2: '#3F7D5B', 0.5: '#B8861E', 0.75: '#C4622D', 1: '#A8321F' },
    }).addTo(map)

    return () => { map.removeLayer(layer) }
  }, [issues, map])

  return null
}
