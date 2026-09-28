import { Prisma, PrismaClient } from "@/generated/prisma/client";
//after installation of prisma and client  run "npx prisma generate" to get prisma client
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const schema = new URL(connectionString).searchParams.get("schema") ?? undefined;
const adapter = new PrismaPg({ connectionString }, { schema });

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const cachedPrisma = globalForPrisma.prisma;
// Prisma generation can add delegates while Next.js retains the old client across hot reloads.
const cachedClientIsCurrent = cachedPrisma && Object.values(Prisma.ModelName).every((modelName) => {
  const delegateName = `${modelName[0].toLowerCase()}${modelName.slice(1)}`;
  return delegateName in cachedPrisma;
});

export const prisma =
  (cachedClientIsCurrent ? cachedPrisma : undefined) ??
  new PrismaClient({
    adapter,
    transactionOptions: { maxWait: 10_000, timeout: 15_000 },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
