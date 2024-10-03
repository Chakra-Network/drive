import { PrismaClient } from '@prisma/client';

// eslint-disable-next-line no-var
var globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
