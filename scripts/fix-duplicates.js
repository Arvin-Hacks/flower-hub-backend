#!/usr/bin/env node

/**
 * Fix Duplicate Key Issues
 * 
 * This script fixes duplicate key issues in MongoDB collections
 * by cleaning up conflicting data before applying schema changes.
 */

const { execSync } = require('child_process');

console.log('🔧 Fixing Duplicate Key Issues');
console.log('===============================\n');

try {
  console.log('📋 Step 1: Connecting to MongoDB...');
  
  // Use MongoDB shell to fix duplicates
  const fixScript = `
    // Connect to the database
    use flower-hub-db;
    
    // Remove duplicate cart items (keep only the latest)
    print("Cleaning up cart_items duplicates...");
    db.cart_items.aggregate([
      {
        $group: {
          _id: {
            userId: "$userId",
            productId: "$productId", 
            selectedColor: { $ifNull: ["$selectedColor", null] },
            selectedSize: { $ifNull: ["$selectedSize", null] }
          },
          docs: { $push: "$$ROOT" },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).forEach(function(group) {
      // Keep the most recent document, remove others
      var sortedDocs = group.docs.sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      // Remove all but the first (most recent)
      for (var i = 1; i < sortedDocs.length; i++) {
        db.cart_items.deleteOne({ _id: sortedDocs[i]._id });
      }
    });
    
    // Remove duplicate wishlist items (keep only the latest)
    print("Cleaning up wishlist_items duplicates...");
    db.wishlist_items.aggregate([
      {
        $group: {
          _id: {
            userId: "$userId",
            productId: "$productId"
          },
          docs: { $push: "$$ROOT" },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).forEach(function(group) {
      // Keep the most recent document, remove others
      var sortedDocs = group.docs.sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      // Remove all but the first (most recent)
      for (var i = 1; i < sortedDocs.length; i++) {
        db.wishlist_items.deleteOne({ _id: sortedDocs[i]._id });
      }
    });
    
    print("✅ Duplicate cleanup completed!");
  `;

  // Write script to temporary file
  const fs = require('fs');
  const path = require('path');
  const scriptPath = path.join(__dirname, 'temp-fix-duplicates.js');
  fs.writeFileSync(scriptPath, fixScript);

  console.log('📋 Step 2: Cleaning up duplicate records...');
  
  // Execute the MongoDB script
  execSync(`mongosh --file "${scriptPath}"`, { stdio: 'inherit' });
  
  // Clean up temporary file
  fs.unlinkSync(scriptPath);
  
  console.log('\n📋 Step 3: Applying schema changes...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('\n✅ Database fixed successfully!');
  console.log('\n🚀 You can now run: npm run db:seed');
  
} catch (error) {
  console.error('\n❌ Error fixing duplicates:', error.message);
  console.log('\n🔧 Alternative solution:');
  console.log('  1. Clear database: npx prisma db push --force-reset');
  console.log('  2. Seed database: npm run db:seed');
  process.exit(1);
}
