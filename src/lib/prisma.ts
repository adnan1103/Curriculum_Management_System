import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

type GlobalForPrisma = typeof globalThis & {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const globalForPrisma = globalThis as GlobalForPrisma;

function createPrismaClient() {
  // One Pool + one PrismaClient (prevents too many connections during Next.js HMR in dev)
  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
    });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  return prisma;
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
export { prisma };