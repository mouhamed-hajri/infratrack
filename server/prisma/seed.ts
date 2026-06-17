import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PrismaClient, Role, Category, Severity } from '@prisma/client'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const here = dirname(fileURLToPath(import.meta.url))

function govFeatureAt(lat: number, lng: number, fc: any) {
  return fc.features.find((f: any) => booleanPointInPolygon([lng, lat], f.geometry))
}

async function main() {
  // 1. Seed the 24 governorates
  const fc = JSON.parse(readFileSync(join(here, 'data', 'tunisia-governorates.geojson'), 'utf-8'))
  for (const feature of fc.features) {
    const name: string = feature.properties.shapeName
    await prisma.governorate.upsert({
      where: { name },
      update: { boundary: feature.geometry },
      create: { name, boundary: feature.geometry },
    })
  }
  console.log(`Seeded ${await prisma.governorate.count()} governorates`)

  // 2. Demo users with real bcrypt hashes (password: demo1234)
  const hash = await bcrypt.hash('demo1234', 10)

  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@demo.tn' },
    update: { passwordHash: hash },
    create: { name: 'Demo Citizen', email: 'citizen@demo.tn', passwordHash: hash, role: Role.CITIZEN },
  })

  const monFeature = govFeatureAt(35.778, 10.826, fc)
  const monastir = monFeature
    ? await prisma.governorate.findUnique({ where: { name: monFeature.properties.shapeName } })
    : null

  await prisma.user.upsert({
    where: { email: 'authority@demo.tn' },
    update: { passwordHash: hash, governorateId: monastir?.id ?? null },
    create: {
      name: 'Demo Authority',
      email: 'authority@demo.tn',
      passwordHash: hash,
      role: Role.AUTHORITY,
      governorateId: monastir?.id ?? null,
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@demo.tn' },
    update: { passwordHash: hash },
    create: { name: 'Demo Admin', email: 'admin@demo.tn', passwordHash: hash, role: Role.ADMIN },
  })

  console.log('Seeded demo users (citizen / authority@monastir / admin) — password: demo1234')

  // 3. Demo municipality: Commune de Monastir (small polygon in central Monastir)
  if (monastir) {
    // Approximate polygon around central Monastir city (inside the Monastir governorate)
    const monastirCommuneBoundary = {
      type: 'Polygon',
      coordinates: [[
        [10.780, 35.755],
        [10.850, 35.755],
        [10.850, 35.800],
        [10.780, 35.800],
        [10.780, 35.755],
      ]],
    }
    await prisma.municipality.upsert({
      where: { id: 'demo-monastir-commune' },
      update: {},
      create: {
        id: 'demo-monastir-commune',
        name: 'Commune de Monastir',
        boundary: monastirCommuneBoundary,
        governorateId: monastir.id,
      },
    })
    console.log('Seeded Commune de Monastir municipality')
  }

  // 4. Sample issues (only if none exist)
  if ((await prisma.issue.count()) === 0) {
    const samples = [
      { title: 'Large pothole near the Ribat', description: 'Deep pothole on the main road, risk to motorbikes.', category: Category.POTHOLE, severity: Severity.HIGH, latitude: 35.778, longitude: 10.826 },
      { title: 'Broken traffic light', description: 'Traffic light stuck on red at a busy junction.', category: Category.TRAFFIC_LIGHT, severity: Severity.CRITICAL, latitude: 36.451, longitude: 10.735 },
    ]
    for (const s of samples) {
      const feature = govFeatureAt(s.latitude, s.longitude, fc)
      if (!feature) { console.warn(`No governorate matched for "${s.title}" — skipping`); continue }
      const gov = await prisma.governorate.findUnique({ where: { name: feature.properties.shapeName } })
      await prisma.issue.create({ data: { ...s, reporterId: citizen.id, governorateId: gov!.id } })
    }
    console.log('Seeded sample issues')
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
