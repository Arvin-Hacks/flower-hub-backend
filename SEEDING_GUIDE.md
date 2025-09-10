# 🌱 Database Seeding Guide

This guide explains how to seed your Flower Hub database with comprehensive sample data.

## 📋 What Gets Seeded

### 👥 Users
- **Admin User**: `admin@flowerhub.com` / `admin123` (SUPER_ADMIN role)
- **Test User**: `user@flowerhub.com` / `user123` (USER role)

### 🏷️ Categories (10 categories)
1. **Roses** - Beautiful roses in various colors and arrangements
2. **Tulips** - Elegant tulips perfect for any occasion
3. **Lilies** - Fragrant lilies that bring elegance to any space
4. **Sunflowers** - Bright and cheerful sunflowers to brighten your day
5. **Orchids** - Exotic orchids for the sophisticated flower lover
6. **Bouquets** - Beautiful flower bouquets for any occasion
7. **Arrangements** - Elegant flower arrangements for home and office
8. **Plants** - Live plants and potted flowers
9. **Centerpieces** - Beautiful centerpieces for special occasions
10. **Decorations** - Decorative flowers and arrangements

### 🌸 Products (20+ products)
- **Roses**: Red Rose Bouquet, Pink Rose Arrangement
- **Tulips**: Mixed Tulip Arrangement, Yellow Tulip Bouquet
- **Lilies**: White Lily Centerpiece, Pink Lily Arrangement
- **Sunflowers**: Sunflower Bouquet, Sunflower Centerpiece
- **Orchids**: Purple Orchid Plant, White Orchid Arrangement
- **Bouquets**: Mixed Spring Bouquet, Romantic Red Bouquet
- **Arrangements**: Modern White Arrangement, Tropical Arrangement
- **Plants**: Succulent Garden, Fiddle Leaf Fig
- **Centerpieces**: Wedding Centerpiece, Holiday Centerpiece
- **Decorations**: Floating Candles with Flowers, Dried Flower Wall Art

### 🏠 Addresses
- Sample shipping and billing addresses for the test user

### 🎫 Coupons
- **WELCOME10**: 10% off orders over $25
- **SAVE20**: $20 off orders over $100

## 🚀 How to Run the Seed

### Prerequisites
1. Make sure your database is running
2. Ensure your `.env` file has the correct `DATABASE_URL`
3. Run Prisma migrations first

### Step 1: Generate Prisma Client
```bash
npm run db:generate
```

### Step 2: Run Migrations (if needed)
```bash
npm run db:migrate
```

### Step 3: Seed the Database
```bash
npm run db:seed
```

### Alternative: Direct Execution
```bash
npx tsx src/database/seed.ts
```

## 🔄 Resetting the Database

If you want to start fresh:

### Option 1: Reset and Seed
```bash
# Reset the database (WARNING: This will delete all data!)
npx prisma migrate reset

# This will automatically run the seed after reset
```

### Option 2: Manual Reset
```bash
# Drop all data
npx prisma db push --force-reset

# Run seed
npm run db:seed
```

## 📊 What You'll See

After running the seed, you should see output like:

```
🌱 Starting database seed...
✅ Admin user created: admin@flowerhub.com
✅ Test user created: user@flowerhub.com
✅ Category created: Roses
✅ Category created: Tulips
✅ Category created: Lilies
✅ Category created: Sunflowers
✅ Category created: Orchids
✅ Category created: Bouquets
✅ Category created: Arrangements
✅ Category created: Plants
✅ Category created: Centerpieces
✅ Category created: Decorations
✅ Product created: Red Rose Bouquet
✅ Product created: Pink Rose Arrangement
✅ Product created: Mixed Tulip Arrangement
... (and more products)
✅ Address created for user: SHIPPING
✅ Address created for user: BILLING
✅ Coupon created: WELCOME10
✅ Coupon created: SAVE20
🎉 Database seeding completed successfully!

📋 Test Accounts:
Admin: admin@flowerhub.com / admin123
User: user@flowerhub.com / user123

🎁 Sample Coupons:
WELCOME10 - 10% off orders over $25
SAVE20 - $20 off orders over $100
```

## 🛠️ Customizing the Seed Data

To modify the seed data, edit `src/database/seed.ts`:

1. **Add more categories**: Add objects to the `categories` array
2. **Add more products**: Add objects to the `products` array
3. **Add more users**: Add user creation code
4. **Add more coupons**: Add objects to the `coupons` array

### Example: Adding a New Product
```typescript
{
  name: 'Custom Flower Arrangement',
  slug: generateSlug('Custom Flower Arrangement'),
  description: 'Your custom description here',
  price: 49.99,
  originalPrice: 59.99,
  categoryId: createdCategories[0].id, // Use appropriate category index
  subcategory: 'Custom',
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
  ],
  colors: ['Red', 'Blue'],
  sizes: ['Medium', 'Large'],
  stockCount: 25,
  rating: 4.5,
  reviewCount: 10,
  tags: ['custom', 'unique'],
  features: ['Custom design', 'Unique style'],
  care: ['Water daily', 'Keep in cool place'],
  isActive: true,
  isFeatured: false,
  weight: 0.6,
  length: 30,
  width: 20,
  height: 40,
  dimensionUnit: 'cm',
}
```

## 🔍 Verifying the Seed

After seeding, you can verify the data:

### Using Prisma Studio
```bash
npm run db:studio
```

### Using MongoDB Compass
Connect to your MongoDB instance and browse the collections.

### Using the API
- Visit `http://localhost:5000/api/products` to see products
- Visit `http://localhost:5000/api/categories` to see categories

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check your `DATABASE_URL` in `.env`
   - Ensure MongoDB is running

2. **Prisma Client Not Generated**
   - Run `npm run db:generate`

3. **Migration Issues**
   - Run `npm run db:migrate`

4. **Duplicate Key Errors**
   - The seed uses `upsert` operations, so it's safe to run multiple times
   - If you still get errors, try resetting the database first

### Getting Help

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your database connection
3. Ensure all dependencies are installed (`npm install`)
4. Check that your Prisma schema is up to date

## 📝 Notes

- The seed script uses `upsert` operations, so it's safe to run multiple times
- All products include realistic pricing, ratings, and descriptions
- Images are sourced from Unsplash for demonstration purposes
- The seed data is designed to showcase all features of the Flower Hub platform
- Categories and products are organized to provide a comprehensive e-commerce experience

Happy seeding! 🌱✨
