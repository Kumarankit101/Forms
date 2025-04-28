import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Log database connection
console.log('Connecting to database with URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));

export const prisma = new PrismaClient();
