import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Add debugging for database connection
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not defined');
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'], // Log errors and warnings for debugging
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 