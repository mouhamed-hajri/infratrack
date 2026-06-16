import { Router } from 'express'
import { prisma } from '../db'
import { attribute } from '../geo'

const router = Router()

const CATEGORIES = ['POTHOLE', 'ROAD_DAMAGE', 'TRAFFIC_LIGHT', 'FLOODING', 'SIGNAGE', 'OTHER']
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

// GET /api/issues?governorateId=...  — newest first
router.get('/', async (req, res) => {
  const { governorateId } = req.query
  const issues = await prisma.issue.findMany({
    where: governorateId ? { governorateId: String(governorateId) } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      governorate: { select: { id: true, name: true } },
      municipality: { select: { id: true, name: true } },
    },
  })
  res.json(issues)
})

// POST /api/issues — validate, attribute jurisdiction by location, create
router.post('/', async (req, res) => {
  const { title, description, category, severity, latitude, longitude } = req.body ?? {}

  if (!title || !description || !category) {
    return res.status(400).json({ error: 'title, description and category are required' })
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` })
  }
  if (severity && !SEVERITIES.includes(severity)) {
    return res.status(400).json({ error: `severity must be one of: ${SEVERITIES.join(', ')}` })
  }
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'latitude and longitude must be numbers' })
  }

  // Week 1 has no auth yet: attribute every report to the seeded demo citizen.
  const reporter = await prisma.user.findFirst({ where: { role: 'CITIZEN' } })
  if (!reporter) {
    return res.status(500).json({ error: 'no demo citizen seeded' })
  }

  const { governorateId, municipalityId } = attribute(lat, lng)
  if (!governorateId) {
    return res.status(400).json({ error: 'location is outside Tunisia (no governorate matched)' })
  }

  const issue = await prisma.issue.create({
    data: {
      title,
      description,
      category,
      severity: severity ?? 'MEDIUM',
      latitude: lat,
      longitude: lng,
      reporterId: reporter.id,
      governorateId,
      municipalityId,
    },
    include: {
      governorate: { select: { id: true, name: true } },
      municipality: { select: { id: true, name: true } },
    },
  })
  res.status(201).json(issue)
})

export default router
