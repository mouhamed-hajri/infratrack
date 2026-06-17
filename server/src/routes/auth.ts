import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../db'
import { signToken, requireAuth, type AuthedRequest } from '../auth'
import { verifyIdentity } from '../lib/verifyIdentity'

const router = Router()

const safeUser = { id: true, name: true, email: true, role: true, governorateId: true, municipalityId: true, cin: true, cinVerified: true }

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body ?? {}
  if (!name || !email || !password) { res.status(400).json({ error: 'name, email and password are required' }); return }
  if (password.length < 6) { res.status(400).json({ error: 'password must be at least 6 characters' }); return }
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) { res.status(409).json({ error: 'email already registered' }); return }
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { name, email, passwordHash, role: 'CITIZEN' }, select: safeUser })
  res.status(201).json({ token: signToken(user), user })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password) { res.status(400).json({ error: 'email and password are required' }); return }
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'invalid email or password' }); return
  }
  const { passwordHash: _, ...safeFields } = user
  res.json({ token: signToken(user), user: safeFields })
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const { id } = (req as AuthedRequest).user
  const user = await prisma.user.findUnique({ where: { id }, select: safeUser })
  res.json(user)
})

// PATCH /api/auth/me — update name, email, or password
router.patch('/me', requireAuth, async (req, res) => {
  const { id } = (req as AuthedRequest).user
  const { name, email, currentPassword, newPassword } = req.body ?? {}
  const updates: Record<string, unknown> = {}

  if (name) updates.name = name
  if (email) {
    const taken = await prisma.user.findFirst({ where: { email, NOT: { id } } })
    if (taken) { res.status(409).json({ error: 'email already in use' }); return }
    updates.email = email
  }
  if (newPassword) {
    if (!currentPassword) { res.status(400).json({ error: 'current password required to set a new one' }); return }
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      res.status(401).json({ error: 'current password is incorrect' }); return
    }
    if (newPassword.length < 6) { res.status(400).json({ error: 'new password must be at least 6 characters' }); return }
    updates.passwordHash = await bcrypt.hash(newPassword, 10)
  }

  const updated = await prisma.user.update({ where: { id }, data: updates, select: safeUser })
  res.json(updated)
})

// POST /api/auth/verify-cin — AI face + CIN card verification
// Body: { selfieBase64: string, cinPhotoBase64: string }
// Falls back to manual { cin } entry when ANTHROPIC_API_KEY is unset.
router.post('/verify-cin', requireAuth, async (req, res) => {
  const { id } = (req as AuthedRequest).user
  const { selfieBase64, cinPhotoBase64, cin: manualCin } = req.body ?? {}

  let cin: string
  let cinVerified = false

  if (process.env.ANTHROPIC_API_KEY) {
    if (!selfieBase64 || !cinPhotoBase64) {
      res.status(400).json({ error: 'selfie and CIN card photo are required' }); return
    }
    let result
    try {
      result = await verifyIdentity(selfieBase64, cinPhotoBase64)
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'AI verification failed' }); return
    }
    if (!result.cinNumber || !/^\d{8}$/.test(result.cinNumber)) {
      res.status(400).json({ error: 'Could not read a valid 8-digit CIN from the card photo. Make sure the number is visible and in focus.' }); return
    }
    if (!result.faceMatch || result.confidence < 0.7) {
      res.status(400).json({ error: `Face verification failed: ${result.reason}` }); return
    }
    cin = result.cinNumber
    cinVerified = true
  } else {
    // ponytail: no AI key — fall back to manual CIN entry
    if (!manualCin || typeof manualCin !== 'string' || !/^\d{8}$/.test(manualCin)) {
      res.status(400).json({ error: 'CIN must be exactly 8 digits' }); return
    }
    cin = manualCin
    cinVerified = true
  }

  const user = await prisma.user.update({
    where: { id },
    data: { cin, cinVerified },
    select: safeUser,
  })
  res.json(user)
})

export default router
