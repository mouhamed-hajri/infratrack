import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../db'
import { signToken, requireAuth, type AuthedRequest } from '../auth'

const router = Router()

const safeUser = { id: true, name: true, email: true, role: true, governorateId: true, municipalityId: true }

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body ?? {}
  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email and password are required' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'password must be at least 6 characters' })
    return
  }
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    res.status(409).json({ error: 'email already registered' })
    return
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: 'CITIZEN' },
    select: safeUser,
  })
  res.status(201).json({ token: signToken(user), user })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' })
    return
  }
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'invalid email or password' })
    return
  }
  const { passwordHash: _, ...safeFields } = user
  res.json({ token: signToken(user), user: safeFields })
})

// GET /api/me
router.get('/me', requireAuth, (req, res) => {
  res.json((req as AuthedRequest).user)
})

export default router
