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

    // ── 50 Monastir reports — varied priorities for demo analytics ───────────
    // CRITICAL (weight 8) — indices 15–22
    { reporter: citizen,  daysAgo: 55, title: 'Bridge subsidence on RR82', description: 'Regional road bridge showing 8 cm vertical displacement; trucks banned.', category: Category.ROAD_DAMAGE, severity: Severity.CRITICAL, latitude: 35.6500, longitude: 10.8850, address: 'RR82, Ksar Hellal' },
    { reporter: citizen2, daysAgo: 45, title: 'Sinkhole on Route de Sahline', description: 'Sinkhole ~1.5 m diameter opened overnight, utility cables exposed.', category: Category.ROAD_DAMAGE, severity: Severity.CRITICAL, latitude: 35.6800, longitude: 10.7550, address: 'Route de Sahline, Monastir' },
    { reporter: citizen3, daysAgo: 35, title: 'Flooding underpass, Route Côtière', description: 'Underpass fully flooded, 60 cm water depth blocking traffic.', category: Category.FLOODING, severity: Severity.CRITICAL, latitude: 35.7760, longitude: 10.8230, address: 'Route Côtière, Monastir' },
    { reporter: citizen4, daysAgo: 25, title: 'Traffic light failure at airport junction', description: 'All lights dark at the busiest junction near Monastir airport; near-miss reported.', category: Category.TRAFFIC_LIGHT, severity: Severity.CRITICAL, latitude: 35.7600, longitude: 10.8100, address: 'Airport junction, Monastir' },
    { reporter: citizen,  daysAgo: 18, title: 'Road collapse near Moknine industrial zone', description: 'Heavy vehicle load caused partial lane collapse, 2 m wide crater.', category: Category.ROAD_DAMAGE, severity: Severity.CRITICAL, latitude: 35.6310, longitude: 10.9550, address: 'Zone industrielle, Moknine' },
    { reporter: citizen2, daysAgo: 10, title: 'Missing stop signs at blind intersection', description: 'Three stop signs missing after accident last week; daily near-misses reported.', category: Category.SIGNAGE, severity: Severity.CRITICAL, latitude: 35.7100, longitude: 10.7700, address: 'Ksibet el-Mediouni crossroads' },
    { reporter: citizen3, daysAgo: 5,  title: 'Deep pothole causing tyre blowouts', description: 'Pothole 35 cm deep, 60 cm wide; three tyre blowouts confirmed this week.', category: Category.POTHOLE, severity: Severity.CRITICAL, latitude: 35.7610, longitude: 10.8120, address: 'Av. Bembla, Monastir' },
    { reporter: citizen4, daysAgo: 1,  title: 'Burst water main flooding carriageway', description: 'Burst pipe flooding the main carriageway, 80 m of road impassable.', category: Category.FLOODING, severity: Severity.CRITICAL, latitude: 35.7500, longitude: 10.8250, address: 'Av. de la République, Monastir' },

    // HIGH (weight 4) — indices 23–36
    { reporter: citizen,  daysAgo: 56, title: 'Eroded road edge on coastal road', description: 'Sea erosion removed 1.5 m of road shoulder; guard rail missing.', category: Category.ROAD_DAMAGE, severity: Severity.HIGH, latitude: 35.7700, longitude: 10.8160, address: 'Route littorale, Monastir' },
    { reporter: citizen2, daysAgo: 48, title: 'Pothole row on Avenue de Carthage', description: 'Row of 8 potholes in 70 m stretch, average 15 cm deep.', category: Category.POTHOLE, severity: Severity.HIGH, latitude: 35.7800, longitude: 10.8260, address: 'Av. de Carthage, Monastir' },
    { reporter: citizen3, daysAgo: 40, title: 'Traffic light stuck on amber, Jemmal', description: 'Amber-flashing light at 4-way junction causing confusion and minor accidents.', category: Category.TRAFFIC_LIGHT, severity: Severity.HIGH, latitude: 35.6210, longitude: 10.7610, address: 'Carrefour central, Jemmal' },
    { reporter: citizen4, daysAgo: 35, title: 'Damaged road surface near hospital', description: 'Large cracked section near Fattouma Bourguiba hospital access road.', category: Category.ROAD_DAMAGE, severity: Severity.HIGH, latitude: 35.7780, longitude: 10.8270, address: 'Rue Fattouma Bourguiba, Monastir' },
    { reporter: citizen,  daysAgo: 30, title: 'Flash flood damage on RR67', description: 'Recent flood deposited large mud layer across 150 m of road.', category: Category.FLOODING, severity: Severity.HIGH, latitude: 35.5960, longitude: 10.8340, address: 'RR67, Zéramdine' },
    { reporter: citizen2, daysAgo: 25, title: 'Speed bump collapsed on school road', description: 'Speed bump fully collapsed near primary school — risk to children.', category: Category.ROAD_DAMAGE, severity: Severity.HIGH, latitude: 35.7100, longitude: 10.7650, address: 'Rue des Écoles, Sayada' },
    { reporter: citizen3, daysAgo: 20, title: 'Pothole on Route de Téboulba', description: 'Two potholes >20 cm deep causing vehicles to swerve dangerously.', category: Category.POTHOLE, severity: Severity.HIGH, latitude: 35.6400, longitude: 10.9400, address: 'Route de Téboulba, Monastir' },
    { reporter: citizen4, daysAgo: 15, title: 'Signage missing on freeway on-ramp', description: 'Yield and speed signs missing from motorway on-ramp after repair works.', category: Category.SIGNAGE, severity: Severity.HIGH, latitude: 35.7580, longitude: 10.8110, address: 'Autoroute A1 on-ramp, Monastir' },
    { reporter: citizen,  daysAgo: 12, title: 'Road flooding near Lamta port', description: 'Recurring storm drain overflow floods 200 m of access road to port.', category: Category.FLOODING, severity: Severity.HIGH, latitude: 35.6640, longitude: 10.7760, address: 'Port de Lamta, Monastir' },
    { reporter: citizen2, daysAgo: 8,  title: 'Broken traffic light on Route GP1', description: 'Primary light head smashed; cars running the junction on guesswork.', category: Category.TRAFFIC_LIGHT, severity: Severity.HIGH, latitude: 35.6450, longitude: 10.8950, address: 'GP1, Ksar Hellal' },
    { reporter: citizen3, daysAgo: 6,  title: 'Multiple potholes near Ribat walls', description: '5 potholes in tourist area near Ribat, hazardous for rental scooters.', category: Category.POTHOLE, severity: Severity.HIGH, latitude: 35.7760, longitude: 10.8265, address: 'Rue du Ribat, Monastir' },
    { reporter: citizen4, daysAgo: 4,  title: 'Collapsed kerb on Avenue Bourguiba', description: 'Kerb stone collapsed into the lane; sharp edges visible, tyre risk.', category: Category.ROAD_DAMAGE, severity: Severity.HIGH, latitude: 35.7770, longitude: 10.8240, address: 'Av. Habib Bourguiba, Monastir' },
    { reporter: citizen,  daysAgo: 2,  title: 'Pavement crack blocking wheelchair access', description: 'Large cracked section blocks accessible ramp near the municipality building.', category: Category.ROAD_DAMAGE, severity: Severity.HIGH, latitude: 35.7755, longitude: 10.8255, address: 'Municipalité, Monastir' },
    { reporter: citizen2, daysAgo: 1,  title: 'Storm debris blocking road, Bembla', description: 'Last night\'s storm deposited tree limbs across two lanes; not yet cleared.', category: Category.OTHER, severity: Severity.HIGH, latitude: 35.7450, longitude: 10.8140, address: 'Route de Bembla, Monastir' },

    // MEDIUM (weight 2) — indices 37–53
    { reporter: citizen3, daysAgo: 56, title: 'Faded road markings on RR81', description: 'Lane markings and pedestrian crossing invisible at night, worn away.', category: Category.SIGNAGE, severity: Severity.MEDIUM, latitude: 35.6980, longitude: 10.8200, address: 'RR81, Ksibet el-Mediouni' },
    { reporter: citizen4, daysAgo: 50, title: 'Pothole cluster near Monastir marina', description: 'Cluster of 4 shallow potholes, ~8 cm depth, forming near marina entrance.', category: Category.POTHOLE, severity: Severity.MEDIUM, latitude: 35.7740, longitude: 10.8270, address: 'Marina, Monastir' },
    { reporter: citizen,  daysAgo: 45, title: 'Minor road damage after utility works', description: 'Telecom trench backfill subsided; rough patch 5 m long across a lane.', category: Category.ROAD_DAMAGE, severity: Severity.MEDIUM, latitude: 35.6380, longitude: 10.9420, address: 'Rue du Marché, Moknine' },
    { reporter: citizen2, daysAgo: 40, title: 'Broken pavement near train station', description: 'Cracked and uneven pavement causing trips outside Monastir station.', category: Category.ROAD_DAMAGE, severity: Severity.MEDIUM, latitude: 35.7660, longitude: 10.8205, address: 'Gare Monastir, Monastir' },
    { reporter: citizen3, daysAgo: 35, title: 'Missing speed limit sign on bypass', description: 'Speed limit sign fallen; no indication of 60 km/h limit on this stretch.', category: Category.SIGNAGE, severity: Severity.MEDIUM, latitude: 35.7550, longitude: 10.8220, address: 'Rocade Monastir' },
    { reporter: citizen4, daysAgo: 28, title: 'Pothole on Rue du 1er Juin, Sahline', description: 'Pothole ~12 cm deep near a school bus stop.', category: Category.POTHOLE, severity: Severity.MEDIUM, latitude: 35.6780, longitude: 10.7630, address: 'Rue du 1er Juin, Sahline' },
    { reporter: citizen,  daysAgo: 22, title: 'Cracked asphalt near Ksar Hellal market', description: 'Asphalt cracking around market roundabout; widening cracks after rain.', category: Category.ROAD_DAMAGE, severity: Severity.MEDIUM, latitude: 35.6480, longitude: 10.8920, address: 'Rond-point marché, Ksar Hellal' },
    { reporter: citizen2, daysAgo: 18, title: 'Waterlogged road near Téboulba beach', description: 'Road surface holds water after rain; drainage blocked.', category: Category.FLOODING, severity: Severity.MEDIUM, latitude: 35.6410, longitude: 10.9430, address: 'Route de la plage, Téboulba' },
    { reporter: citizen3, daysAgo: 14, title: 'Faded pedestrian crossing near school', description: 'Crosswalk at primary school invisible after sun fading. Repainting needed.', category: Category.SIGNAGE, severity: Severity.MEDIUM, latitude: 35.7730, longitude: 10.8230, address: 'Rue Ibn Khaldoun, Monastir' },
    { reporter: citizen4, daysAgo: 10, title: 'Pothole forming on Jemmal ring road', description: 'Early-stage pothole appearing on recently resurfaced ring road; act before it deepens.', category: Category.POTHOLE, severity: Severity.MEDIUM, latitude: 35.6250, longitude: 10.7550, address: 'Route de ceinture, Jemmal' },
    { reporter: citizen,  daysAgo: 8,  title: 'Damaged guard rail on coastal bend', description: 'Guard rail bent outward after collision, no longer protective.', category: Category.ROAD_DAMAGE, severity: Severity.MEDIUM, latitude: 35.7720, longitude: 10.8200, address: 'Route littorale nord, Monastir' },
    { reporter: citizen2, daysAgo: 6,  title: 'Minor pothole on Av. Ali Belhouane', description: 'Pothole ~7 cm deep, 30 cm wide — growing after rainfall.', category: Category.POTHOLE, severity: Severity.MEDIUM, latitude: 35.7760, longitude: 10.8225, address: 'Av. Ali Belhouane, Monastir' },
    { reporter: citizen3, daysAgo: 4,  title: 'Broken street light leaving road dark', description: 'Broken overhead lamp leaves 80 m stretch unlit at night — safety risk.', category: Category.OTHER, severity: Severity.MEDIUM, latitude: 35.7430, longitude: 10.8150, address: 'Route Bembla-Monastir' },
    { reporter: citizen4, daysAgo: 3,  title: 'Cracked pavement near university campus', description: 'Uneven slabs near ISIMM campus entrance after heavy truck traffic.', category: Category.ROAD_DAMAGE, severity: Severity.MEDIUM, latitude: 35.7635, longitude: 10.8190, address: 'ISIMM, Route de Ouardanine, Monastir' },
    { reporter: citizen,  daysAgo: 2,  title: 'Pothole on roundabout exit, Moknine', description: 'Pothole on roundabout exit lane; vehicles swerving into oncoming traffic.', category: Category.POTHOLE, severity: Severity.MEDIUM, latitude: 35.6330, longitude: 10.9650, address: 'Rond-point Moknine sortie GP1' },
    { reporter: citizen2, daysAgo: 1,  title: 'Wet road marking — slip hazard', description: 'Freshly painted road marking not dry, causing motorbike skid.', category: Category.SIGNAGE, severity: Severity.MEDIUM, latitude: 35.7770, longitude: 10.8235, address: 'Av. de l\'Indépendance, Monastir' },
    { reporter: citizen3, daysAgo: 1,  title: 'Water pooling at Ksibet junction', description: 'Standing water 30 cm deep at main junction after blocked drain.', category: Category.FLOODING, severity: Severity.MEDIUM, latitude: 35.6980, longitude: 10.8100, address: 'Carrefour Ksibet el-Mediouni' },

    // LOW (weight 1) — indices 54–63
    { reporter: citizen4, daysAgo: 55, title: 'Faded kerb paint near bus stop', description: 'Yellow no-parking kerb paint fully faded; buses blocked by parked cars.', category: Category.SIGNAGE, severity: Severity.LOW, latitude: 35.7740, longitude: 10.8245, address: 'Station bus Av. Bourguiba, Monastir' },
    { reporter: citizen,  daysAgo: 48, title: 'Minor crack near roundabout, Lamta', description: 'Hairline cracks appearing at roundabout edge — early preventive fix warranted.', category: Category.ROAD_DAMAGE, severity: Severity.LOW, latitude: 35.6620, longitude: 10.7770, address: 'Rond-point, Lamta' },
    { reporter: citizen2, daysAgo: 40, title: 'Broken direction sign, Zéramdine', description: 'Direction arrow snapped in storm; one arm pointing wrong way.', category: Category.SIGNAGE, severity: Severity.LOW, latitude: 35.5980, longitude: 10.8330, address: 'Route nationale, Zéramdine' },
    { reporter: citizen3, daysAgo: 30, title: 'Shallow pothole near Ouerdanine', description: 'Shallow pothole 5 cm deep — low priority but should be patched soon.', category: Category.POTHOLE, severity: Severity.LOW, latitude: 35.5780, longitude: 10.7760, address: 'Route de Ouerdanine' },
    { reporter: citizen4, daysAgo: 25, title: 'Worn speed bump near clinic', description: 'Speed bump asphalt worn flat; effectively useless in front of clinic.', category: Category.ROAD_DAMAGE, severity: Severity.LOW, latitude: 35.7690, longitude: 10.8200, address: 'Clinique El Manar, Monastir' },
    { reporter: citizen,  daysAgo: 18, title: 'Missing street name plate, Ksar Hellal', description: 'Street name plate fallen off post; residents reporting confusion for deliveries.', category: Category.SIGNAGE, severity: Severity.LOW, latitude: 35.6470, longitude: 10.8880, address: 'Rue Mongi Slim, Ksar Hellal' },
    { reporter: citizen2, daysAgo: 12, title: 'Pothole in car park, Sayada beach', description: 'Small pothole in public beach car park, cosmetic issue but worth fixing.', category: Category.POTHOLE, severity: Severity.LOW, latitude: 35.7090, longitude: 10.7530, address: 'Parking plage, Sayada' },
    { reporter: citizen3, daysAgo: 8,  title: 'Faded line markings on GP1', description: 'Centre line markings faded over 300 m stretch; rain makes them invisible.', category: Category.SIGNAGE, severity: Severity.LOW, latitude: 35.6610, longitude: 10.7790, address: 'GP1, Lamta–Sahline section' },
    { reporter: citizen4, daysAgo: 4,  title: 'Minor subsidence near Jemmal park', description: 'Tiny subsidence dimple near park entrance; no hazard currently.', category: Category.ROAD_DAMAGE, severity: Severity.LOW, latitude: 35.6240, longitude: 10.7640, address: 'Parc municipal, Jemmal' },
    { reporter: citizen,  daysAgo: 1,  title: 'Loose manhole cover, Monastir centre', description: 'Manhole cover slightly loose — rattles when driven over but still in place.', category: Category.OTHER, severity: Severity.LOW, latitude: 35.7750, longitude: 10.8250, address: 'Av. du 7 Novembre, Monastir' },
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

    // ── Monastir batch lifecycles ────────────────────────────────────────────
    // Index 15: bridge subsidence → resolved (old)
    15: [
      { status: Status.ACKNOWLEDGED, note: 'Structural inspection ordered.', actorId: authority!.id, daysAfter: 1 },
      { status: Status.IN_PROGRESS, note: 'Engineer on site. Temporary load restriction applied.', actorId: authority!.id, daysAfter: 4 },
      { status: Status.RESOLVED, note: 'Temporary repairs complete; permanent fix scheduled.', actorId: authority!.id, daysAfter: 10 },
    ],
    // Index 16: sinkhole → resolved
    16: [
      { status: Status.ACKNOWLEDGED, note: 'Emergency team dispatched.', actorId: authority!.id, daysAfter: 1 },
      { status: Status.IN_PROGRESS, note: 'Excavation and backfill underway.', actorId: authority!.id, daysAfter: 2 },
      { status: Status.RESOLVED, note: 'Sinkhole filled and compacted.', actorId: authority!.id, daysAfter: 3 },
    ],
    // Index 17: coastal flooding → in progress
    17: [
      { status: Status.ACKNOWLEDGED, note: 'Drainage survey commissioned.', actorId: authority!.id, daysAfter: 2 },
      { status: Status.IN_PROGRESS, note: 'Pump stationed; new culvert being installed.', actorId: authority!.id, daysAfter: 5 },
    ],
    // Index 18: airport traffic light → resolved
    18: [
      { status: Status.ACKNOWLEDGED, note: 'Electrician booked as priority.', actorId: authority!.id, daysAfter: 1 },
      { status: Status.IN_PROGRESS, note: 'Light controller being replaced.', actorId: authority!.id, daysAfter: 1 },
      { status: Status.RESOLVED, note: 'Traffic light fully operational.', actorId: authority!.id, daysAfter: 1 },
    ],
    // Index 19: road collapse Moknine → acknowledged
    19: [
      { status: Status.ACKNOWLEDGED, note: 'Site cordoned off. Assessment team sent.', actorId: authority!.id, daysAfter: 1 },
    ],
    // Index 22: eroded road edge → resolved (old)
    22: [
      { status: Status.ACKNOWLEDGED, note: 'Road crew notified.', actorId: authority!.id, daysAfter: 3 },
      { status: Status.IN_PROGRESS, note: 'Shoulder being rebuilt.', actorId: authority!.id, daysAfter: 7 },
      { status: Status.RESOLVED, note: 'Shoulder rebuilt, new guard rail installed.', actorId: authority!.id, daysAfter: 5 },
    ],
    // Index 23: pothole row Av. Carthage → resolved
    23: [
      { status: Status.ACKNOWLEDGED, note: 'Scheduled for patch crew Friday.', actorId: authority!.id, daysAfter: 2 },
      { status: Status.IN_PROGRESS, note: 'Patching in progress.', actorId: authority!.id, daysAfter: 3 },
      { status: Status.RESOLVED, note: 'All 8 potholes patched and surface sealed.', actorId: authority!.id, daysAfter: 1 },
    ],
    // Index 24: Jemmal traffic light → in progress
    24: [
      { status: Status.ACKNOWLEDGED, note: 'Traffic management team alerted.', actorId: authority!.id, daysAfter: 2 },
      { status: Status.IN_PROGRESS, note: 'Controller module ordered, manual control in place.', actorId: authority!.id, daysAfter: 4 },
    ],
    // Index 25: road near hospital → resolved
    25: [
      { status: Status.ACKNOWLEDGED, note: 'Confirmed — affects hospital access.', actorId: authority!.id, daysAfter: 1 },
      { status: Status.IN_PROGRESS, note: 'Milling and resurfacing crew on site.', actorId: authority!.id, daysAfter: 2 },
      { status: Status.RESOLVED, note: 'Road surface fully repaired.', actorId: authority!.id, daysAfter: 2 },
    ],
    // Index 26: Zéramdine flood damage → acknowledged
    26: [
      { status: Status.ACKNOWLEDGED, note: 'Mud removal scheduled.', actorId: authority!.id, daysAfter: 3 },
    ],
    // Index 28: Téboulba pothole → in progress
    28: [
      { status: Status.ACKNOWLEDGED, note: 'Noted. Crew visiting this week.', actorId: authority!.id, daysAfter: 3 },
      { status: Status.IN_PROGRESS, note: 'Crew on site patching.', actorId: authority!.id, daysAfter: 4 },
    ],
    // Index 37: faded markings → resolved (old)
    37: [
      { status: Status.ACKNOWLEDGED, note: 'Re-marking scheduled.', actorId: authority!.id, daysAfter: 5 },
      { status: Status.IN_PROGRESS, note: 'Road marking machine deployed.', actorId: authority!.id, daysAfter: 7 },
      { status: Status.RESOLVED, note: 'All markings refreshed.', actorId: authority!.id, daysAfter: 1 },
    ],
    // Index 39: Moknine road damage → resolved
    39: [
      { status: Status.ACKNOWLEDGED, note: 'Trench subsidence confirmed.', actorId: authority!.id, daysAfter: 3 },
      { status: Status.IN_PROGRESS, note: 'Re-compaction and patch applied.', actorId: authority!.id, daysAfter: 5 },
      { status: Status.RESOLVED, note: 'Trench patch complete.', actorId: authority!.id, daysAfter: 2 },
    ],
    // Index 40: broken pavement near station → resolved
    40: [
      { status: Status.ACKNOWLEDGED, note: 'Station area prioritised.', actorId: authority!.id, daysAfter: 4 },
      { status: Status.IN_PROGRESS, note: 'Pavement slabs being replaced.', actorId: authority!.id, daysAfter: 6 },
      { status: Status.RESOLVED, note: 'New paving installed.', actorId: authority!.id, daysAfter: 2 },
    ],
    // Index 54: faded kerb → resolved (very old)
    54: [
      { status: Status.ACKNOWLEDGED, note: 'Kerb repainting scheduled.', actorId: authority!.id, daysAfter: 7 },
      { status: Status.RESOLVED, note: 'Kerb repainted yellow.', actorId: authority!.id, daysAfter: 3 },
    ],
    // Index 55: minor crack Lamta → resolved
    55: [
      { status: Status.ACKNOWLEDGED, note: 'Preventive crack sealing ordered.', actorId: authority!.id, daysAfter: 10 },
      { status: Status.RESOLVED, note: 'Cracks sealed.', actorId: authority!.id, daysAfter: 5 },
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
