import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prisma: PrismaClient;

if (!globalForPrisma.prisma) {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 2, // Limit to 2 connections per instance to avoid EMAXCONNSESSION (15 max)
    idleTimeoutMillis: 10000, // Close idle connections after 10s
  });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
} else {
  prisma = globalForPrisma.prisma;
}

export { prisma };
