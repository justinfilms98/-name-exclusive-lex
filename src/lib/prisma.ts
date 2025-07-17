import { PrismaClient } from "@prisma/client";

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not defined. Database operations will fail.');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

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