// Prisma client types are generated after `prisma generate`.
// The runtime import stays lazy so the workspace can typecheck before generation.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

let prismaClient: InstanceType<typeof PrismaClient> | undefined;

export function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }

  return prismaClient;
}