import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import rateLimit from 'express-rate-limit'
import { prisma } from '../db'
import { signToken, requireAuth, type AuthedRequest } from '../auth'
import { verifyIdentity } from '../lib/verifyIdentity'
import { sendVerificationEmail } from '../lib/email'

const router = Router()

const safeUser = {
  id: true, name: true, email: true, role: true,
  governorateId: true, municipalityId: true,
  phone: true, cin: true, cinVerified: true, emailVerified: true,
}

// 5 registration attempts per 15 minutes per IP
const registerLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many registration attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// POST /api/auth/register
router.post('/register', registerLimit, async (req, res) => {
  const { name, email, password, phone } = req.body ?? {}
  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email and password are required' }); return
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'password must be at least 8 characters' }); return
  }
  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    res.status(400).json({ error: 'a valid phone number is required' }); return
  }
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    res.status(409).json({ error: 'an account with this email already exists' }); return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const emailVerificationToken = randomBytes(32).toString('hex')

  await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      phone: phone.trim(),
      role: 'CITIZEN',
      emailVerified: false,
      emailVerificationToken,
    },
  })

  await sendVerificationEmail(email.trim().toLowerCase(), name.trim(), emailVerificationToken)

  res.status(201).json({ message: 'Account created. Please check your email to verify your account before signing in.' })
})

// GET /api/auth/verify-email?token=...
router.get('/verify-email', async (req, res) => {
  const { token } = req.query
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'invalid token' }); return
  }
  const user = await prisma.user.findUnique({ where: { emailVerificationToken: token } })
  if (!user) {
    res.status(400).json({ error: 'Verification link is invalid or has already been used.' }); return
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationToken: null },
  })
  res.json({ success: true, message: 'Email verified! You can now sign in.' })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' }); return
  }
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'invalid email or password' }); return
  }
  if (!user.emailVerified) {
    res.status(403).json({ error: 'Please verify your email address before signing in. Check your inbox for the verification link.' }); return
  }
  const { passwordHash: _, emailVerificationToken: __, ...safeFields } = user
  res.json({ token: signToken(user), user: safeFields })
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const { id } = (req as AuthedRequest).user
  const user = await prisma.user.findUnique({ where: { id }, select: safeUser })
  res.json(user)
})

// PATCH /api/auth/me — update name, email, phone, or password
router.patch('/me', requireAuth, async (req, res) => {
  const { id } = (req as AuthedRequest).user
  const { name, email, phone, currentPassword, newPassword } = req.body ?? {}
  const updates: Record<string, unknown> = {}

  if (name) updates.name = name
  if (phone) updates.phone = phone
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
    if (newPassword.length < 8) { res.status(400).json({ error: 'new password must be at least 8 characters' }); return }
    updates.passwordHash = await bcrypt.hash(newPassword, 12)
  }

  const updated = await prisma.user.update({ where: { id }, data: updates, select: safeUser })
  res.json(updated)
})

// POST /api/auth/verify-cin — AI face + CIN card verification
router.post('/verify-cin', requireAuth, async (req, res) => {
  const { id } = (req as AuthedRequest).user
  const { selfieBase64, cinPhotoBase64, cin: manualCin } = req.body ?? {}

  let cin: string
  let cinVerified = false

  if (process.env.GROQ_API_KEY) {
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
