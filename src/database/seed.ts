import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/utils/auth';
import { logger } from '@/utils/logger';
import { generateSlug } from '@/utils/helpers';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flowerhub.com' },
    update: {},
    create: {
      email: 'admin@flowerhub.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
    },
  });

  logger.info('✅ Admin user created:', admin.email);

  // Create test user
  const userPassword = await hashPassword('user123');
  const user = await prisma.user.upsert({
    where: { email: 'user@flowerhub.com' },
    update: {},
    create: {
      email: 'user@flowerhub.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      isEmailVerified: true,
    },
  });

  logger.info('✅ Test user created:', user.email);

  // Create product categories
  const categories = [
    {
      name: 'Roses',
      slug: generateSlug('Roses'),
      description: 'Beautiful roses in various colors and arrangements',
      image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500',
      sortOrder: 1,
    },
    {
      name: 'Tulips',
      slug: generateSlug('Tulips'),
      description: 'Elegant tulips perfect for any occasion',
      image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=500',
      sortOrder: 2,
    },
    {
      name: 'Lilies',
      slug: generateSlug('Lilies'),
      description: 'Fragrant lilies that bring elegance to any space',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
      sortOrder: 3,
    },
    {
      name: 'Sunflowers',
      slug: generateSlug('Sunflowers'),
      description: 'Bright and cheerful sunflowers to brighten your day',
      image: 'https://images.unsplash.com/photo-1597848212624-e17eb5d2e0b4?w=500',
      sortOrder: 4,
    },
    {
      name: 'Orchids',
      slug: generateSlug('Orchids'),
      description: 'Exotic orchids for the sophisticated flower lover',
      image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500',
      sortOrder: 5,
    },
  ];

  const createdCategories = [];
  for (const categoryData of categories) {
    const category = await prisma.productCategory.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData,
    });
    createdCategories.push(category);
    logger.info('✅ Category created:', category.name);
  }

  // Create sample products
  const products = [
    {
      name: 'Red Rose Bouquet',
      slug: generateSlug('Red Rose Bouquet'),
      description: 'A stunning bouquet of 12 red roses, perfect for expressing love and romance. Each rose is carefully selected for its beauty and freshness.',
      price: 45.99,
      originalPrice: 55.99,
      categoryId: createdCategories[0].id,
      subcategory: 'Bouquets',
      images: [
        'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800',
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800',
      ],
      colors: ['Red'],
      sizes: ['Small', 'Medium', 'Large'],
      stockCount: 50,
      rating: 4.8,
      reviewCount: 24,
      tags: ['romance', 'valentine', 'anniversary'],
      features: ['Fresh cut', 'Long lasting', 'Beautiful presentation'],
      care: ['Keep in cool place', 'Change water daily', 'Trim stems'],
      isActive: true,
      isFeatured: true,
      weight: 0.5,
      length: 30,
      width: 20,
      height: 40,
      dimensionUnit: 'cm',
    },
    {
      name: 'Mixed Tulip Arrangement',
      slug: generateSlug('Mixed Tulip Arrangement'),
      description: 'A colorful arrangement of mixed tulips in various colors. Perfect for spring celebrations and home decoration.',
      price: 32.99,
      categoryId: createdCategories[1].id,
      subcategory: 'Arrangements',
      images: [
        'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800',
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800',
      ],
      colors: ['Red', 'Yellow', 'Pink', 'Purple'],
      sizes: ['Medium', 'Large'],
      stockCount: 30,
      rating: 4.6,
      reviewCount: 18,
      tags: ['spring', 'colorful', 'home decor'],
      features: ['Mixed colors', 'Seasonal', 'Fresh cut'],
      care: ['Keep in cool place', 'Change water every 2 days'],
      isActive: true,
      isFeatured: false,
      weight: 0.3,
      length: 25,
      width: 15,
      height: 35,
      dimensionUnit: 'cm',
    },
    {
      name: 'White Lily Centerpiece',
      slug: generateSlug('White Lily Centerpiece'),
      description: 'Elegant white lilies arranged in a beautiful centerpiece. Perfect for weddings, anniversaries, and special occasions.',
      price: 65.99,
      originalPrice: 75.99,
      categoryId: createdCategories[2].id,
      subcategory: 'Centerpieces',
      images: [
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
        'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
      ],
      colors: ['White'],
      sizes: ['Large', 'Extra Large'],
      stockCount: 20,
      rating: 4.9,
      reviewCount: 12,
      tags: ['elegant', 'wedding', 'anniversary', 'white'],
      features: ['Premium quality', 'Elegant design', 'Long lasting'],
      care: ['Keep away from direct sunlight', 'Change water daily'],
      isActive: true,
      isFeatured: true,
      weight: 1.2,
      length: 40,
      width: 30,
      height: 50,
      dimensionUnit: 'cm',
    },
    {
      name: 'Sunflower Bouquet',
      slug: generateSlug('Sunflower Bouquet'),
      description: 'Bright and cheerful sunflowers arranged in a beautiful bouquet. Perfect for bringing joy and warmth to any space.',
      price: 28.99,
      categoryId: createdCategories[3].id,
      subcategory: 'Bouquets',
      images: [
        'https://images.unsplash.com/photo-1597848212624-e17eb5d2e0b4?w=800',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      ],
      colors: ['Yellow'],
      sizes: ['Medium', 'Large'],
      stockCount: 40,
      rating: 4.7,
      reviewCount: 15,
      tags: ['cheerful', 'bright', 'summer'],
      features: ['Bright yellow', 'Large blooms', 'Fresh cut'],
      care: ['Keep in bright area', 'Change water every 2 days'],
      isActive: true,
      isFeatured: false,
      weight: 0.8,
      length: 35,
      width: 25,
      height: 45,
      dimensionUnit: 'cm',
    },
    {
      name: 'Purple Orchid Plant',
      slug: generateSlug('Purple Orchid Plant'),
      description: 'Exotic purple orchid plant in a decorative pot. Perfect for adding elegance and sophistication to any room.',
      price: 89.99,
      originalPrice: 99.99,
      categoryId: createdCategories[4].id,
      subcategory: 'Plants',
      images: [
        'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
      ],
      colors: ['Purple'],
      sizes: ['Medium', 'Large'],
      stockCount: 15,
      rating: 4.5,
      reviewCount: 8,
      tags: ['exotic', 'elegant', 'plant', 'purple'],
      features: ['Live plant', 'Decorative pot', 'Long blooming'],
      care: ['Water weekly', 'Bright indirect light', 'High humidity'],
      isActive: true,
      isFeatured: true,
      weight: 2.0,
      length: 20,
      width: 20,
      height: 60,
      dimensionUnit: 'cm',
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: productData,
    });
    logger.info('✅ Product created:', product.name);
  }

  // Create sample addresses for the test user
  const addresses = [
    {
      userId: user.id,
      type: 'SHIPPING' as const,
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States',
      phone: '+1-555-0123',
      isDefault: true,
    },
    {
      userId: user.id,
      type: 'BILLING' as const,
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States',
      phone: '+1-555-0123',
      isDefault: true,
    },
  ];

  for (const addressData of addresses) {
    const address = await prisma.address.create({
      data: addressData,
    });
    logger.info('✅ Address created for user:', address.type);
  }

  // Create sample coupons
  const coupons = [
    {
      code: 'WELCOME10',
      description: 'Welcome discount for new customers',
      type: 'percentage',
      value: 10,
      minimumAmount: 25,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      usageLimit: 1000,
    },
    {
      code: 'SAVE20',
      description: 'Save $20 on orders over $100',
      type: 'fixed',
      value: 20,
      minimumAmount: 100,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
      usageLimit: 500,
    },
  ];

  for (const couponData of coupons) {
    const coupon = await prisma.coupon.create({
      data: couponData,
    });
    logger.info('✅ Coupon created:', coupon.code);
  }

  logger.info('🎉 Database seeding completed successfully!');
  logger.info('\n📋 Test Accounts:');
  logger.info('Admin: admin@flowerhub.com / admin123');
  logger.info('User: user@flowerhub.com / user123');
  logger.info('\n🎁 Sample Coupons:');
  logger.info('WELCOME10 - 10% off orders over $25');
  logger.info('SAVE20 - $20 off orders over $100');
}

main()
  .catch((e) => {
    logger.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
