// Prisma client types are generated after `prisma generate`.
// The runtime import stays lazy so the workspace can typecheck before generation.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaPg } = require('@prisma/adapter-pg');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pool } = require('pg');

let prismaClient: InstanceType<typeof PrismaClient> | undefined;
let prismaPool: InstanceType<typeof Pool> | undefined;

export function getPrismaClient() {
  if (!prismaClient) {
    prismaPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    prismaClient = new PrismaClient({
      adapter: new PrismaPg(prismaPool),
    });
  }

  return prismaClient;
}