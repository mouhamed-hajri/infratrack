import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { prisma } from './db'

// Jurisdiction boundaries are loaded into memory once at startup. There are only
// ~24 governorates and municipalities are onboarded rarely, so we re-load on
// restart rather than per request.
// ponytail: in-memory scan over a few dozen polygons; switch to PostGIS only at national scale.
type Zone = { id: string; geometry: unknown }

let governorates: Zone[] = []
let municipalities: Zone[] = []

export async function loadBoundaries() {
  const govs = await prisma.governorate.findMany({ select: { id: true, boundary: true } })
  governorates = govs.map((g) => ({ id: g.id, geometry: g.boundary }))

  const munis = await prisma.municipality.findMany({ select: { id: true, boundary: true } })
  municipalities = munis.map((m) => ({ id: m.id, geometry: m.boundary }))

  console.log(`Loaded ${governorates.length} governorates, ${municipalities.length} municipalities`)
}

// Attribute a point to its governorate (always, since they cover all of Tunisia)
// and to an onboarded municipality if one contains it.
// NOTE: GeoJSON / Turf use [longitude, latitude] order.
export function attribute(latitude: number, longitude: number) {
  const point: [number, number] = [longitude, latitude]
  const gov = governorates.find((g) => booleanPointInPolygon(point, g.geometry as never))
  const muni = municipalities.find((m) => booleanPointInPolygon(point, m.geometry as never))
  return { governorateId: gov?.id ?? null, municipalityId: muni?.id ?? null }
}
