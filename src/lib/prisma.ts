import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Add debugging for database connection
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not defined');
} else {
  console.log('DATABASE_URL is defined, attempting connection...');
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'], // Log errors and warnings for debugging
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Test the connection on startup
prisma.$connect()
  .then(() => {
    console.log('✅ Prisma connected to database successfully');
  })
  .catch((error) => {
    console.error('❌ Prisma failed to connect to database:', error);
  }); 