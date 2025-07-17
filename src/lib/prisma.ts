import { PrismaClient } from "@prisma/client";

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not defined. Database operations will fail.');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Lazy initialization function
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    if (!process.env.DATABASE_URL) {
      // During build time, return a mock client to prevent errors
      if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
        console.warn('DATABASE_URL not available during build, using mock client');
        return {} as PrismaClient;
      }
      throw new Error('DATABASE_URL is not defined. Cannot initialize Prisma client.');
    }
    
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  
  return globalForPrisma.prisma;
}

// Export a function that returns the Prisma client only when called
export const prisma = getPrismaClient;

// Add a safe database operation wrapper
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not defined, returning fallback');
      return fallback;
    }
    return await operation();
  } catch (error) {
    console.error('Database operation failed:', error);
    return fallback;
  }
} 