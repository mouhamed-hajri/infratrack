import { Router } from 'express'
import { prisma } from '../db'
import { requireAuth, requireRole } from '../auth'
import { loadBoundaries } from '../geo'

const router = Router()

// POST /api/municipalities — admin only; refreshes geo cache so new reports immediately route to it
router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { name, governorateId, boundary } = req.body ?? {}
  if (!name || !governorateId || !boundary) {
    res.status(400).json({ error: 'name, governorateId and boundary are required' })
    return
  }
  const gov = await prisma.governorate.findUnique({ where: { id: governorateId } })
  if (!gov) {
    res.status(400).json({ error: 'governorate not found' })
    return
  }
  const municipality = await prisma.municipality.create({
    data: { name, governorateId, boundary },
    include: { governorate: { select: { id: true, name: true } } },
  })
  // Refresh in-memory polygon cache so the next POST /api/issues picks up this boundary
  await loadBoundaries()
  res.status(201).json(municipality)
})

export default router
