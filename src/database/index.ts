import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma || new PrismaClient({
  // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed');
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed due to SIGINT');
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed due to SIGTERM');
});

export { prisma };
export default prisma;
