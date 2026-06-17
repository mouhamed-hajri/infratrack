import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PrismaClient, Role, Category, Severity, Status } from '@prisma/client'
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
  // daysAgo spreads issues across ~8 weeks so analytics trend/overdue flags are live
  const samples = [
    // Tunis — index 0: RESOLVED 42d ago
    { reporter: citizen,  daysAgo: 42, title: 'Pothole on Avenue Habib Bourguiba', description: 'Large pothole in the middle lane causing traffic swerves.', category: Category.POTHOLE, severity: Severity.HIGH, latitude: 36.8065, longitude: 10.1815, address: 'Av. Habib Bourguiba, Tunis' },
    // Tunis — index 1: CRITICAL in-progress 4d ago → overdue (>24h SLA)
    { reporter: citizen2, daysAgo: 4, title: 'Flood on Rue de Marseille', description: 'Street completely flooded after last night\'s rain, cars stuck.', category: Category.FLOODING, severity: Severity.CRITICAL, latitude: 36.8190, longitude: 10.1660, address: 'Rue de Marseille, Tunis' },
    // Tunis — index 2: MEDIUM reported 6d ago → not overdue (<7d SLA)
    { reporter: citizen3, daysAgo: 6, title: 'Damaged road surface near Bab Bhar', description: 'Cracked asphalt spanning entire lane, dangerous for cyclists.', category: Category.ROAD_DAMAGE, severity: Severity.MEDIUM, latitude: 36.7990, longitude: 10.1735, address: 'Bab Bhar, Tunis' },
    // Sfax — index 3: CRITICAL acknowledged 3d ago → overdue (>24h SLA)
    { reporter: citizen4, daysAgo: 3, title: 'Traffic light out near Sfax city centre', description: 'Two consecutive traffic lights non-functional since Monday.', category: Category.TRAFFIC_LIGHT, severity: Severity.CRITICAL, latitude: 34.7400, longitude: 10.7600, address: 'Centre-ville, Sfax' },
    // Sfax — index 4: LOW reported 10d ago → not overdue (<30d SLA)
    { reporter: citizen,  daysAgo: 10, title: 'Missing road sign on Route de Tunis', description: 'Speed limit sign knocked down by a truck, not replaced.', category: Category.SIGNAGE, severity: Severity.LOW, latitude: 34.7300, longitude: 10.7680, address: 'Route de Tunis, Sfax' },
    // Sousse — index 5: REJECTED 15d ago
    { reporter: citizen2, daysAgo: 15, title: 'Deep pothole on Route de la Corniche', description: 'Pothole ~30 cm deep, two motorbikes already fell.', category: Category.POTHOLE, severity: Severity.CRITICAL, latitude: 35.8288, longitude: 10.6350, address: 'Route de la Corniche, Sousse' },
    // Sousse — index 6: HIGH reported 5d ago → overdue (>72h SLA)
    { reporter: citizen3, daysAgo: 5, title: 'Collapsed road shoulder near Sahloul', description: 'Road shoulder eroded and collapsed, 5 m long section.', category: Category.ROAD_DAMAGE, severity: Severity.HIGH, latitude: 35.8500, longitude: 10.5900, address: 'Sahloul, Sousse' },
    // Monastir — index 7: RESOLVED 30d ago
    { reporter: citizen,  daysAgo: 30, title: 'Large pothole near the Ribat', description: 'Deep pothole on the main road, risk to motorbikes.', category: Category.POTHOLE, severity: Severity.HIGH, latitude: 35.7780, longitude: 10.8260, address: 'Near Ribat, Monastir' },
    // Monastir — index 8: MEDIUM reported 2d ago → not overdue
    { reporter: citizen4, daysAgo: 2, title: 'Broken pavement near Marina', description: 'Severely cracked pavement causing tripping hazard for pedestrians.', category: Category.ROAD_DAMAGE, severity: Severity.MEDIUM, latitude: 35.7735, longitude: 10.8310, address: 'Marina, Monastir' },
    // Bizerte — index 9: HIGH reported 1d ago → not overdue (<72h SLA)
    { reporter: citizen2, daysAgo: 1, title: 'Flooding on RN7 after heavy rain', description: 'National road flooded for 200 m, impassable by regular cars.', category: Category.FLOODING, severity: Severity.HIGH, latitude: 37.2700, longitude: 9.8740, address: 'RN7, Bizerte' },
    // Bizerte — index 10: HIGH reported 8d ago → overdue (>72h SLA)
    { reporter: citizen3, daysAgo: 8, title: 'Traffic light stuck on red, Bizerte centre', description: 'Busy 4-way intersection with stuck light causing tailbacks.', category: Category.TRAFFIC_LIGHT, severity: Severity.HIGH, latitude: 37.2740, longitude: 9.8730, address: 'Centre, Bizerte' },
    // Nabeul — index 11: MEDIUM reported 3d ago → not overdue
    { reporter: citizen,  daysAgo: 3, title: 'Pothole cluster on Route de Hammamet', description: 'Series of 6 potholes in 50 m stretch.', category: Category.POTHOLE, severity: Severity.MEDIUM, latitude: 36.4510, longitude: 10.7350, address: 'Route de Hammamet, Nabeul' },
    // Kairouan — index 12: CRITICAL in-progress 12d ago → overdue (>24h SLA)
    { reporter: citizen4, daysAgo: 12, title: 'Signage missing at dangerous crossroads', description: 'No stop sign or yield sign at a blind junction, near-miss accidents daily.', category: Category.SIGNAGE, severity: Severity.CRITICAL, latitude: 35.6745, longitude: 10.1015, address: 'Near Medina entrance, Kairouan' },
    // Gafsa — index 13: CRITICAL reported 55d ago → massively overdue
    { reporter: citizen2, daysAgo: 55, title: 'Road collapse on Route Minière', description: 'Heavy trucks caused partial road collapse, 1 m subsidence.', category: Category.ROAD_DAMAGE, severity: Severity.CRITICAL, latitude: 34.4250, longitude: 8.7840, address: 'Route Minière, Gafsa' },
    // Gabès — index 14: HIGH reported 1d ago → not overdue
    { reporter: citizen3, daysAgo: 1, title: 'Pothole on Avenue Farhat Hached', description: 'Pothole in a busy commercial street, leaking oil visible.', category: Category.POTHOLE, severity: Severity.HIGH, latitude: 33.8840, longitude: 10.0980, address: 'Av. Farhat Hached, Gabès' },
  ]

  // Helper to get the authority user for seeding lifecycle events
  const authority = await prisma.user.findUnique({ where: { email: 'authority@demo.tn' } })
  const admin = await prisma.user.findUnique({ where: { email: 'admin@demo.tn' } })

  // Lifecycle scripts: issue index → array of {status, note, actorId, daysAfter}
  // daysAfter is relative to the previous event
  type EventScript = { status: Status; note?: string; actorId: string; daysAfter: number }
  const lifecycles: Record<number, EventScript[]> = {
    // Tunis pothole → fully resolved
    0: [
      { status: Status.ACKNOWLEDGED, note: 'Confirmed on site. Repair crew scheduled.', actorId: admin!.id, daysAfter: 1 },
      { status: Status.IN_PROGRESS, note: 'Crew deployed, filling underway.', actorId: admin!.id, daysAfter: 2 },
      { status: Status.RESOLVED, note: 'Repair complete. Road surface restored.', actorId: admin!.id, daysAfter: 1 },
    ],
    // Tunis flooding → acknowledged + in progress
    1: [
      { status: Status.ACKNOWLEDGED, note: 'Drainage team notified.', actorId: admin!.id, daysAfter: 1 },
      { status: Status.IN_PROGRESS, note: 'Pumping equipment deployed.', actorId: admin!.id, daysAfter: 2 },
    ],
    // Sfax traffic light → acknowledged
    3: [
      { status: Status.ACKNOWLEDGED, note: 'Electrical team dispatched to assess.', actorId: admin!.id, daysAfter: 1 },
    ],
    // Sousse pothole → rejected (duplicate report)
    5: [
      { status: Status.REJECTED, note: 'Duplicate of an existing work order. Repair already scheduled.', actorId: admin!.id, daysAfter: 1 },
    ],
    // Monastir pothole → full lifecycle (authority scoped to Monastir)
    7: [
      { status: Status.ACKNOWLEDGED, note: 'Logged. Scheduled for next maintenance round.', actorId: authority!.id, daysAfter: 1 },
      { status: Status.IN_PROGRESS, note: 'Road crew on site.', actorId: authority!.id, daysAfter: 3 },
      { status: Status.RESOLVED, note: 'Pothole filled and surface sealed.', actorId: authority!.id, daysAfter: 1 },
    ],
    // Kairouan signage → acknowledged + in progress
    12: [
      { status: Status.ACKNOWLEDGED, note: 'Dangerous junction confirmed. Sign procurement in progress.', actorId: admin!.id, daysAfter: 2 },
      { status: Status.IN_PROGRESS, note: 'Signs installed on 3 of 4 approaches.', actorId: admin!.id, daysAfter: 3 },
    ],
  }

  let seeded = 0
  const createdIssues: Array<{ id: string; createdAt: Date }> = []

  for (const s of samples) {
    const feature = govFeatureAt(s.latitude, s.longitude, fc)
    if (!feature) { console.warn(`No governorate matched for "${s.title}" — skipping`); continue }
    const gov = await prisma.governorate.findUnique({ where: { name: feature.properties.shapeName } })
    if (!gov) continue
    const { reporter, daysAgo, ...data } = s
    const createdAt = new Date(Date.now() - daysAgo * 86_400_000)
    const issue = await prisma.issue.create({ data: { ...data, createdAt, reporterId: reporter.id, governorateId: gov.id } })
    // Initial REPORTED event backdated to match issue creation
    await prisma.statusEvent.create({
      data: { issueId: issue.id, status: Status.REPORTED, actorId: reporter.id, createdAt },
    })
    createdIssues.push({ id: issue.id, createdAt: issue.createdAt })
    seeded++
  }

  // Apply lifecycle scripts — advance status + create events with realistic timestamps
  for (const [idxStr, events] of Object.entries(lifecycles)) {
    const idx = Number(idxStr)
    const issueRef = createdIssues[idx]
    if (!issueRef) continue
    let t = new Date(issueRef.createdAt)
    let finalStatus: Status = Status.REPORTED
    for (const ev of events) {
      t = new Date(t.getTime() + ev.daysAfter * 86_400_000)
      await prisma.statusEvent.create({
        data: { issueId: issueRef.id, status: ev.status, note: ev.note, actorId: ev.actorId, createdAt: t },
      })
      finalStatus = ev.status
    }
    await prisma.issue.update({ where: { id: issueRef.id }, data: { status: finalStatus } })
  }

  console.log(`Seeded ${seeded} demo issues with lifecycle events across Tunisia`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
