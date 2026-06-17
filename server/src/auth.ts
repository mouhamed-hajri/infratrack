import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { prisma } from './db'

const SECRET = process.env.JWT_SECRET ?? (() => {
  // ponytail: fallback is dev-only; set JWT_SECRET in production
  console.warn('JWT_SECRET not set — using insecure dev fallback')
  return 'dev-fallback-secret'
})()

type JwtPayload = { sub: string; role: string }

export type AuthedRequest = Request & {
  user: { id: string; role: string; governorateId: string | null; municipalityId: string | null; cin: string | null; cinVerified: boolean }
}

export function signToken(user: { id: string; role: string }) {
  return jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '7d' })
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing or invalid token' })
    return
  }
  let payload: JwtPayload
  try {
    payload = jwt.verify(header.slice(7), SECRET) as JwtPayload
  } catch {
    res.status(401).json({ error: 'invalid or expired token' })
    return
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, governorateId: true, municipalityId: true, cin: true, cinVerified: true },
  })
  if (!user) {
    res.status(401).json({ error: 'user not found' })
    return
  }
  ;(req as AuthedRequest).user = user
  next()
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthedRequest).user
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: 'forbidden' })
      return
    }
    next()
  }
}
