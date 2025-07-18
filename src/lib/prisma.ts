import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Lazy initialization function
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    if (!process.env.DATABASE_URL) {
      // During build time or when DATABASE_URL is missing, throw a clear error
      throw new Error('DATABASE_URL is missing. Check Vercel environment variables.');
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