import { Router } from 'express'
import { prisma } from '../db'
import { attribute } from '../geo'
import { requireAuth, requireRole, type AuthedRequest } from '../auth'

const router = Router()

const CATEGORIES = ['POTHOLE', 'ROAD_DAMAGE', 'TRAFFIC_LIGHT', 'FLOODING', 'SIGNAGE', 'OTHER']
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const jurisdictionInclude = {
  governorate: { select: { id: true, name: true } },
  municipality: { select: { id: true, name: true } },
}

// GET /api/issues — public, newest first
router.get('/', async (req, res) => {
  const { governorateId } = req.query
  const issues = await prisma.issue.findMany({
    where: governorateId ? { governorateId: String(governorateId) } : undefined,
    orderBy: { createdAt: 'desc' },
    include: jurisdictionInclude,
  })
  res.json(issues)
})

// GET /api/issues/mine — my own reports
router.get('/mine', requireAuth, async (req, res) => {
  const { id } = (req as AuthedRequest).user
  const issues = await prisma.issue.findMany({
    where: { reporterId: id },
    orderBy: { createdAt: 'desc' },
    include: jurisdictionInclude,
  })
  res.json(issues)
})

// GET /api/issues/jurisdiction — authority/admin scoped view
router.get('/jurisdiction', requireAuth, requireRole('AUTHORITY', 'ADMIN'), async (req, res) => {
  const { role, governorateId } = (req as AuthedRequest).user
  const issues = await prisma.issue.findMany({
    where: role === 'ADMIN' ? undefined : { governorateId: governorateId ?? '' },
    orderBy: { createdAt: 'desc' },
    include: jurisdictionInclude,
  })
  res.json(issues)
})

// POST /api/issues — requires login
router.post('/', requireAuth, async (req, res) => {
  const { title, description, category, severity, latitude, longitude, photoUrl, address } = req.body ?? {}
  const { id: reporterId } = (req as AuthedRequest).user

  if (!title || !description || !category) {
    res.status(400).json({ error: 'title, description and category are required' })
    return
  }
  if (!CATEGORIES.includes(category)) {
    res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` })
    return
  }
  if (severity && !SEVERITIES.includes(severity)) {
    res.status(400).json({ error: `severity must be one of: ${SEVERITIES.join(', ')}` })
    return
  }
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ error: 'latitude and longitude must be numbers' })
    return
  }

  const { governorateId, municipalityId } = attribute(lat, lng)
  if (!governorateId) {
    res.status(400).json({ error: 'location is outside Tunisia (no governorate matched)' })
    return
  }

  const issue = await prisma.issue.create({
    data: { title, description, category, severity: severity ?? 'MEDIUM', latitude: lat, longitude: lng, photoUrl: photoUrl ?? null, address: address ?? null, reporterId, governorateId, municipalityId },
    include: jurisdictionInclude,
  })
  res.status(201).json(issue)
})

export default router
