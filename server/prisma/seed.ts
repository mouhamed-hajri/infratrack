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

  const verified = { emailVerified: true, cinVerified: true, cin: '12345678' }

  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@demo.tn' },
    update: { passwordHash: hash, ...verified },
    create: { name: 'Demo Citizen', email: 'citizen@demo.tn', passwordHash: hash, role: Role.CITIZEN, phone: '+21620000001', ...verified },
  })

  const monFeature = govFeatureAt(35.778, 10.826, fc)
  const monastir = monFeature
    ? await prisma.governorate.findUnique({ where: { name: monFeature.properties.shapeName } })
    : null

  await prisma.user.upsert({
    where: { email: 'authority@demo.tn' },
    update: { passwordHash: hash, governorateId: monastir?.id ?? null, ...verified },
    create: {
      name: 'Demo Authority', email: 'authority@demo.tn', passwordHash: hash,
      role: Role.AUTHORITY, governorateId: monastir?.id ?? null, phone: '+21620000002', ...verified,
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@demo.tn' },
    update: { passwordHash: hash, ...verified },
    create: { name: 'Demo Admin', email: 'admin@demo.tn', passwordHash: hash, role: Role.ADMIN, phone: '+21620000003', ...verified },
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

  // 4. Extra demo citizens
  const citizen2 = await prisma.user.upsert({
    where: { email: 'ali@demo.tn' },
    update: { passwordHash: hash, ...verified },
    create: { name: 'Ali Ben Salah', email: 'ali@demo.tn', passwordHash: hash, role: Role.CITIZEN, phone: '+21620000004', ...verified },
  })
  const citizen3 = await prisma.user.upsert({
    where: { email: 'sarra@demo.tn' },
    update: { passwordHash: hash, ...verified },
    create: { name: 'Sarra Makhlouf', email: 'sarra@demo.tn', passwordHash: hash, role: Role.CITIZEN, phone: '+21620000005', ...verified },
  })
  const citizen4 = await prisma.user.upsert({
    where: { email: 'youssef@demo.tn' },
    update: { passwordHash: hash, ...verified },
    create: { name: 'Youssef Trabelsi', email: 'youssef@demo.tn', passwordHash: hash, role: Role.CITIZEN, phone: '+21620000006', ...verified },
  })
  console.log('Seeded extra citizens (ali / sarra / youssef) — password: demo1234')

  // 5. Demo issues — wipe and recreate so re-running stays idempotent
  await prisma.issue.deleteMany({})
  const samples = [
    // Tunis
    { reporter: citizen,  title: 'Pothole on Avenue Habib Bourguiba', description: 'Large pothole in the middle lane causing traffic swerves.', category: Category.POTHOLE, severity: Severity.HIGH, latitude: 36.8065, longitude: 10.1815, address: 'Av. Habib Bourguiba, Tunis' },
    { reporter: citizen2, title: 'Flood on Rue de Marseille', description: 'Street completely flooded after last night\'s rain, cars stuck.', category: Category.FLOODING, severity: Severity.CRITICAL, latitude: 36.8190, longitude: 10.1660, address: 'Rue de Marseille, Tunis' },
    { reporter: citizen3, title: 'Damaged road surface near Bab Bhar', description: 'Cracked asphalt spanning entire lane, dangerous for cyclists.', category: Category.ROAD_DAMAGE, severity: Severity.MEDIUM, latitude: 36.7990, longitude: 10.1735, address: 'Bab Bhar, Tunis' },
    // Sfax
    { reporter: citizen4, title: 'Traffic light out near Sfax city centre', description: 'Two consecutive traffic lights non-functional since Monday.', category: Category.TRAFFIC_LIGHT, severity: Severity.CRITICAL, latitude: 34.7400, longitude: 10.7600, address: 'Centre-ville, Sfax' },
    { reporter: citizen,  title: 'Missing road sign on Route de Tunis', description: 'Speed limit sign knocked down by a truck, not replaced.', category: Category.SIGNAGE, severity: Severity.LOW, latitude: 34.7300, longitude: 10.7680, address: 'Route de Tunis, Sfax' },
    // Sousse
    { reporter: citizen2, title: 'Deep pothole on Route de la Corniche', description: 'Pothole ~30 cm deep, two motorbikes already fell.', category: Category.POTHOLE, severity: Severity.CRITICAL, latitude: 35.8288, longitude: 10.6350, address: 'Route de la Corniche, Sousse' },
    { reporter: citizen3, title: 'Collapsed road shoulder near Sahloul', description: 'Road shoulder eroded and collapsed, 5 m long section.', category: Category.ROAD_DAMAGE, severity: Severity.HIGH, latitude: 35.8500, longitude: 10.5900, address: 'Sahloul, Sousse' },
    // Monastir
    { reporter: citizen,  title: 'Large pothole near the Ribat', description: 'Deep pothole on the main road, risk to motorbikes.', category: Category.POTHOLE, severity: Severity.HIGH, latitude: 35.7780, longitude: 10.8260, address: 'Near Ribat, Monastir' },
    { reporter: citizen4, title: 'Broken pavement near Marina', description: 'Severely cracked pavement causing tripping hazard for pedestrians.', category: Category.ROAD_DAMAGE, severity: Severity.MEDIUM, latitude: 35.7735, longitude: 10.8310, address: 'Marina, Monastir' },
    // Bizerte
    { reporter: citizen2, title: 'Flooding on RN7 after heavy rain', description: 'National road flooded for 200 m, impassable by regular cars.', category: Category.FLOODING, severity: Severity.HIGH, latitude: 37.2700, longitude: 9.8740, address: 'RN7, Bizerte' },
    { reporter: citizen3, title: 'Traffic light stuck on red, Bizerte centre', description: 'Busy 4-way intersection with stuck light causing tailbacks.', category: Category.TRAFFIC_LIGHT, severity: Severity.HIGH, latitude: 37.2740, longitude: 9.8730, address: 'Centre, Bizerte' },
    // Nabeul
    { reporter: citizen,  title: 'Pothole cluster on Route de Hammamet', description: 'Series of 6 potholes in 50 m stretch.', category: Category.POTHOLE, severity: Severity.MEDIUM, latitude: 36.4510, longitude: 10.7350, address: 'Route de Hammamet, Nabeul' },
    // Kairouan
    { reporter: citizen4, title: 'Signage missing at dangerous crossroads', description: 'No stop sign or yield sign at a blind junction, near-miss accidents daily.', category: Category.SIGNAGE, severity: Severity.CRITICAL, latitude: 35.6745, longitude: 10.1015, address: 'Near Medina entrance, Kairouan' },
    // Gafsa
    { reporter: citizen2, title: 'Road collapse on Route Minière', description: 'Heavy trucks caused partial road collapse, 1 m subsidence.', category: Category.ROAD_DAMAGE, severity: Severity.CRITICAL, latitude: 34.4250, longitude: 8.7840, address: 'Route Minière, Gafsa' },
    // Gabès
    { reporter: citizen3, title: 'Pothole on Avenue Farhat Hached', description: 'Pothole in a busy commercial street, leaking oil visible.', category: Category.POTHOLE, severity: Severity.HIGH, latitude: 33.8840, longitude: 10.0980, address: 'Av. Farhat Hached, Gabès' },
  ]

  let seeded = 0
  for (const s of samples) {
    const feature = govFeatureAt(s.latitude, s.longitude, fc)
    if (!feature) { console.warn(`No governorate matched for "${s.title}" — skipping`); continue }
    const gov = await prisma.governorate.findUnique({ where: { name: feature.properties.shapeName } })
    if (!gov) continue
    const { reporter, ...data } = s
    await prisma.issue.create({ data: { ...data, reporterId: reporter.id, governorateId: gov.id } })
    seeded++
  }
  console.log(`Seeded ${seeded} demo issues across Tunisia`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
