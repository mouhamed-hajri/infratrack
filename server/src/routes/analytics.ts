import { Router } from 'express'
import { requireAuth, requireRole, type AuthedRequest } from '../auth'
import { loadScopedIssues, computeAnalytics } from '../lib/analytics'
import { generateBriefing } from '../lib/briefing'
import { prisma } from '../db'
import type { Request } from 'express'

const router = Router()

router.get('/', requireAuth, requireRole('AUTHORITY', 'ADMIN'), async (req: Request, res) => {
  const { role, governorateId } = (req as AuthedRequest).user
  const isAdmin = role === 'ADMIN'

  let scopeLabel = 'All Tunisia'
  if (!isAdmin && governorateId) {
    const gov = await prisma.governorate.findUnique({ where: { id: governorateId }, select: { name: true } })
    scopeLabel = gov?.name ?? 'Your region'
  }

  const issues = await loadScopedIssues(role, governorateId)
  res.json(computeAnalytics(issues, scopeLabel, isAdmin))
})

router.post('/briefing', requireAuth, requireRole('AUTHORITY', 'ADMIN'), async (req: Request, res) => {
  const { role, governorateId } = (req as AuthedRequest).user
  const isAdmin = role === 'ADMIN'

  let scopeLabel = 'All Tunisia'
  if (!isAdmin && governorateId) {
    const gov = await prisma.governorate.findUnique({ where: { id: governorateId }, select: { name: true } })
    scopeLabel = gov?.name ?? 'Your region'
  }

  const issues = await loadScopedIssues(role, governorateId)
  const analytics = computeAnalytics(issues, scopeLabel, isAdmin)
  res.json(await generateBriefing(analytics))
})

export default router
