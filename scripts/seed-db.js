#!/usr/bin/env node

/**
 * Database Seeding Script
 * 
 * This script provides an easy way to seed the Flower Hub database
 * with comprehensive sample data including users, categories, products,
 * addresses, and coupons.
 * 
 * Usage:
 *   node scripts/seed-db.js
 *   npm run db:seed
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🌱 Flower Hub Database Seeder');
console.log('==============================\n');

try {
  console.log('📦 Checking dependencies...');
  
  // Check if tsx is available
  try {
    execSync('npx tsx --version', { stdio: 'pipe' });
    console.log('✅ tsx is available');
  } catch (error) {
    console.log('❌ tsx not found. Installing...');
    execSync('npm install tsx --save-dev', { stdio: 'inherit' });
  }

  console.log('\n🚀 Starting database seeding...');
  console.log('This will create:');
  console.log('  • 2 users (admin + test user)');
  console.log('  • 10 product categories');
  console.log('  • 20+ sample products');
  console.log('  • Sample addresses and coupons\n');

  // Run the seed script
  const seedPath = path.join(__dirname, '../src/database/seed.ts');
  execSync(`npx tsx "${seedPath}"`, { stdio: 'inherit' });

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('  Admin: admin@flowerhub.com / admin123');
  console.log('  User:  user@flowerhub.com / user123');
  console.log('\n🎁 Sample Coupons:');
  console.log('  WELCOME10 - 10% off orders over $25');
  console.log('  SAVE20    - $20 off orders over $100');
  console.log('\n🌐 You can now start the server with: npm run dev');

} catch (error) {
  console.error('\n❌ Error during seeding:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('  1. Make sure MongoDB is running');
  console.log('  2. Check your DATABASE_URL in .env file');
  console.log('  3. Run "npm run db:generate" first');
  console.log('  4. Run "npm run db:migrate" if needed');
  process.exit(1);
}
