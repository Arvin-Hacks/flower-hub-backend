// Test setup file
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/flower_hub_test',
    },
  },
});

// eslint-disable-next-line no-undef
beforeAll(async () => {
  // Setup test database
  await prisma.$connect();
});

// eslint-disable-next-line no-undef
afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
});

// eslint-disable-next-line no-undef
afterEach(async () => {
  // Clean up test data after each test
  await prisma.refreshToken.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();
});

export { prisma };
