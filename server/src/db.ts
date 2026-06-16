import { PrismaClient } from '@prisma/client'

// One shared Prisma client for the whole server.
export const prisma = new PrismaClient()
