#!/usr/bin/env node

/**
 * Script to reset the database (deletes all data)
 * 
 * Usage:
 *   node scripts/reset-database.js
 * 
 * Requirements:
 *   - SUPABASE_SERVICE_ROLE_KEY must be set in .env file
 * 
 * ⚠️ WARNING: This will delete ALL data from the database!
 */

const fs = require('fs');
const path = require('path');

// Robust .env loader
function parseAndSetEnv(content) {
  if (!content) return;
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  content.split(/\r?\n/).forEach(line => {
    if (!line || /^\s*#/.test(line)) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const rawKey = line.slice(0, idx).trim();
    let rawVal = line.slice(idx + 1).trim();
    if ((rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith('\'') && rawVal.endsWith('\''))) {
      rawVal = rawVal.slice(1, -1);
    }
    if (rawKey) {
      process.env[rawKey] = rawVal;
    }
  });
}

function tryLoadEnvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const envContent = fs.readFileSync(filePath, 'utf-8');
      parseAndSetEnv(envContent);
      return true;
    }
  } catch (_) {
    // ignore
  }
  return false;
}

const candidateEnvPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '.env.local'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local'),
];

let loadedEnvFrom = null;
for (const p of candidateEnvPaths) {
  if (tryLoadEnvFile(p)) {
    loadedEnvFrom = p;
    break;
  }
}

if (loadedEnvFrom) {
  console.log(`ℹ️  Loaded environment variables from: ${loadedEnvFrom}`);
} else {
  console.log('ℹ️  No .env file found; relying on process environment.');
}

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Required: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error(`   Detected: URL=${SUPABASE_URL ? 'present' : 'missing'}, SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY ? 'present' : 'missing'}`);
  process.exit(1);
}

console.log(`🔐 Using Supabase URL: ${SUPABASE_URL}`);

async function executeSQL(query) {
  // Use Supabase REST API to execute SQL
  // Note: This requires the service_role key and may need to be done via RPC or direct SQL endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return await response.json();
}


async function deleteTableData(tableName, condition) {
  const url = condition 
    ? `${SUPABASE_URL}/rest/v1/${tableName}?${condition}`
    : `${SUPABASE_URL}/rest/v1/${tableName}`;
    
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
      'Prefer': 'return=representation',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.warn(`⚠️  Warning deleting ${tableName}: ${error}`);
    return 0;
  }

  const deleted = await response.json();
  return Array.isArray(deleted) ? deleted.length : 1;
}

async function resetDatabase() {
  console.log('\n🗑️  Starting database reset (deleting all data)...\n');
  console.log('⚠️  WARNING: This will delete ALL data from the database!\n');

  try {
    // Delete data in order (respecting foreign key constraints)
    console.log('🗑️  Deleting data...\n');

    // 1. Notifications
    const notificationsDeleted = await deleteTableData('notifications', '');
    console.log(`   ✅ Deleted ${notificationsDeleted} notifications`);

    // 2. Reviews
    const reviewsDeleted = await deleteTableData('reviews', '');
    console.log(`   ✅ Deleted ${reviewsDeleted} reviews`);

    // 3. Customer favorites
    const favoritesDeleted = await deleteTableData('customer_favorites', '');
    console.log(`   ✅ Deleted ${favoritesDeleted} customer favorites`);

    // 4. Bag orders
    const ordersDeleted = await deleteTableData('bag_orders', '');
    console.log(`   ✅ Deleted ${ordersDeleted} bag orders`);

    // 5. Surprise bags
    const bagsDeleted = await deleteTableData('surprise_bags', '');
    console.log(`   ✅ Deleted ${bagsDeleted} surprise bags`);

    // 6. Bag schedules
    const schedulesDeleted = await deleteTableData('bag_schedules', '');
    console.log(`   ✅ Deleted ${schedulesDeleted} bag schedules`);

    // 7. Shop operating hours
    const hoursDeleted = await deleteTableData('shop_operating_hours', '');
    console.log(`   ✅ Deleted ${hoursDeleted} shop operating hours`);

    // 8. Shop analytics
    const analyticsDeleted = await deleteTableData('shop_analytics', '');
    console.log(`   ✅ Deleted ${analyticsDeleted} shop analytics entries`);

    // 9. Customer profiles
    const customerProfilesDeleted = await deleteTableData('customer_profiles', '');
    console.log(`   ✅ Deleted ${customerProfilesDeleted} customer profiles`);

    // 10. Shop profiles
    const shopProfilesDeleted = await deleteTableData('shop_profiles', '');
    console.log(`   ✅ Deleted ${shopProfilesDeleted} shop profiles`);

    // 11. Users
    const usersDeleted = await deleteTableData('users', '');
    console.log(`   ✅ Deleted ${usersDeleted} users\n`);

    console.log('✨ Database reset complete!\n');
    console.log('📊 Verification:');
    console.log('   Run this query in Supabase SQL Editor to verify:');
    console.log('   SELECT email, user_type, name FROM users;');
    console.log('   (Should return 0 rows)\n');

  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    process.exit(1);
  }
}

resetDatabase();






