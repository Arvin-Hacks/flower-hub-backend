#!/usr/bin/env node

/**
 * Complete Database Setup Script
 * 
 * This script handles the complete database setup process:
 * 1. Generates Prisma client
 * 2. Runs migrations
 * 3. Seeds the database with sample data
 * 
 * Usage:
 *   node scripts/setup-db.js
 *   npm run db:setup
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Flower Hub Database Setup');
console.log('=============================\n');

const steps = [
  {
    name: 'Generate Prisma Client',
    command: 'npm run db:generate',
    description: 'Generating Prisma client from schema...'
  },
  {
    name: 'Reset Database Schema',
    command: 'npx prisma db push --force-reset',
    description: 'Resetting database schema (clears existing data)...'
  },
  {
    name: 'Seed Database',
    command: 'npm run db:seed',
    description: 'Seeding database with sample data...'
  }
];

async function runStep(step, index) {
  console.log(`\n📋 Step ${index + 1}/${steps.length}: ${step.name}`);
  console.log(`   ${step.description}`);
  
  try {
    execSync(step.command, { stdio: 'inherit' });
    console.log(`   ✅ ${step.name} completed successfully`);
  } catch (error) {
    console.error(`   ❌ ${step.name} failed:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔧 Starting complete database setup...\n');
    
    for (let i = 0; i < steps.length; i++) {
      await runStep(steps[i], i);
    }
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 What was created:');
    console.log('  • Database schema with all tables');
    console.log('  • 2 users (admin + test user)');
    console.log('  • 10 product categories');
    console.log('  • 20+ sample products');
    console.log('  • Sample addresses and coupons');
    
    console.log('\n🔑 Test Accounts:');
    console.log('  Admin: admin@flowerhub.com / admin123');
    console.log('  User:  user@flowerhub.com / user123');
    
    console.log('\n🎁 Sample Coupons:');
    console.log('  WELCOME10 - 10% off orders over $25');
    console.log('  SAVE20    - $20 off orders over $100');
    
    console.log('\n🌐 Next Steps:');
    console.log('  1. Start the server: npm run dev');
    console.log('  2. Visit: http://localhost:5000/api/products');
    console.log('  3. Use Prisma Studio: npm run db:studio');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Make sure MongoDB is running');
    console.log('  2. Check your DATABASE_URL in .env file');
    console.log('  3. Ensure all dependencies are installed: npm install');
    console.log('  4. Check the error message above for specific issues');
    process.exit(1);
  }
}

main();
