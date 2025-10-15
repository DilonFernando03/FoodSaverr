#!/usr/bin/env node

/**
 * Script to create demo accounts in Supabase
 * 
 * Usage:
 *   node scripts/create-demo-accounts.js
 * 
 * Requirements:
 *   - SUPABASE_SERVICE_ROLE_KEY must be set in .env file
 *   - Supabase project must be set up with the schema
 */

const fs = require('fs');
const path = require('path');

// Robust .env loader: searches multiple candidate files and handles BOM/quotes/CRLF
function parseAndSetEnv(content) {
  if (!content) return;
  // strip UTF-8 BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  content.split(/\r?\n/).forEach(line => {
    if (!line || /^\s*#/.test(line)) return; // skip empty and comments
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const rawKey = line.slice(0, idx).trim();
    let rawVal = line.slice(idx + 1).trim();
    // strip surrounding quotes if any
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

// Candidate env paths (from most specific to broader)
const candidateEnvPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '.env.local'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local'),
  path.join(__dirname, '..', '..', '.env'),
  path.join(__dirname, '..', '..', '.env.local'),
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
  console.log('ℹ️  No .env file found in expected locations; relying on process environment.');
}

// Resolve variables with fallbacks (support NEXT_PUBLIC_* for convenience)
const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Required: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Fallback supported for URL: NEXT_PUBLIC_SUPABASE_URL');
  console.error('   Get service_role from: Supabase Dashboard > Settings > API > service_role key');
  console.error(`   Detected keys: URL=${SUPABASE_URL ? 'present' : 'missing'}, SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY ? 'present' : 'missing'}`);
  process.exit(1);
}

console.log(`🔐 Using Supabase URL: ${SUPABASE_URL}`);

// Demo account data
const DEMO_ACCOUNTS = [
  {
    email: 'customer@demo.com',
    password: 'demo123',
    type: 'customer',
    userData: {
      name: 'Jane Doe',
      phone_number: '+94 77 987 6543',
    },
    profile: {
      dietary_preferences: ['meals', 'bread_pastries'],
      address: '456 Oak Avenue',
      city: 'Colombo',
      postal_code: '00300',
      coordinates: { lng: 79.8612, lat: 6.9271 },
    }
  },
  {
    email: 'shop@demo.com',
    password: 'demo123',
    type: 'shop',
    userData: {
      name: "John's Bakery",
      phone_number: '+94 77 123 4567',
    },
    profile: {
      business_name: "John's Bakery",
      business_type: 'Bakery',
      description: 'Fresh baked goods daily - reducing food waste one surprise bag at a time!',
      address: '123 Main Street',
      city: 'Colombo',
      postal_code: '00100',
      coordinates: { lng: 79.8612, lat: 6.9271 },
      operating_hours: {
        monday: { open: '07:00', close: '19:00', isOpen: true },
        tuesday: { open: '07:00', close: '19:00', isOpen: true },
        wednesday: { open: '07:00', close: '19:00', isOpen: true },
        thursday: { open: '07:00', close: '19:00', isOpen: true },
        friday: { open: '07:00', close: '19:00', isOpen: true },
        saturday: { open: '08:00', close: '18:00', isOpen: true },
        sunday: { open: '09:00', close: '17:00', isOpen: true },
      },
      is_verified: true,
      verified_at: new Date().toISOString(),
      average_rating: 4.5,
      total_reviews: 127,
    }
  }
];

async function createAuthUser(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {},
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create auth user: ${error}`);
  }

  return await response.json();
}

async function executeSQL(query, params = []) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
    },
    body: JSON.stringify({ query, params }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return await response.json();
}

async function insertUserData(userId, email, name, userType, phoneNumber) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: userId,
      email,
      name,
      user_type: userType,
      phone_number: phoneNumber,
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to insert user data: ${error}`);
  }

  return await response.json();
}

async function insertCustomerProfile(userId, profile) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/customer_profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: userId,
      dietary_preferences: profile.dietary_preferences,
      address: profile.address,
      city: profile.city,
      postal_code: profile.postal_code,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to insert customer profile: ${error}`);
  }

  return await response.json();
}

async function insertShopProfile(userId, profile) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/shop_profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: userId,
      business_name: profile.business_name,
      business_type: profile.business_type,
      description: profile.description,
      address: profile.address,
      city: profile.city,
      postal_code: profile.postal_code,
      operating_hours: profile.operating_hours,
      is_verified: profile.is_verified,
      verified_at: profile.verified_at,
      average_rating: profile.average_rating,
      total_reviews: profile.total_reviews,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to insert shop profile: ${error}`);
  }

  return await response.json();
}

async function main() {
  console.log('🚀 Creating demo accounts for FoodSaverr...\n');

  for (const account of DEMO_ACCOUNTS) {
    console.log(`📝 Creating ${account.type} demo account: ${account.email}`);

    try {
      // Create auth user
      console.log('   ⏳ Creating auth user...');
      const authUser = await createAuthUser(account.email, account.password);
      const userId = authUser.id || authUser.user?.id;
      
      if (!userId) {
        throw new Error('Failed to get user ID from auth response');
      }

      console.log(`   ✅ Auth user created: ${userId}`);

      // Insert user data
      console.log('   ⏳ Creating user record...');
      await insertUserData(
        userId,
        account.email,
        account.userData.name,
        account.type,
        account.userData.phone_number
      );
      console.log('   ✅ User record created');

      // Insert profile data
      if (account.type === 'customer') {
        console.log('   ⏳ Creating customer profile...');
        await insertCustomerProfile(userId, account.profile);
        console.log('   ✅ Customer profile created');
      } else if (account.type === 'shop') {
        console.log('   ⏳ Creating shop profile...');
        await insertShopProfile(userId, account.profile);
        console.log('   ✅ Shop profile created');
      }

      console.log(`   🎉 ${account.type} demo account created successfully!\n`);
    } catch (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        console.log(`   ⚠️  Account already exists, skipping...\n`);
      } else {
        console.error(`   ❌ Error creating ${account.type} account:`, error.message);
        console.error('   Continuing with next account...\n');
      }
    }
  }

  console.log('✨ Demo account creation completed!\n');
  console.log('📋 Demo Accounts:');
  console.log('   Customer: customer@demo.com / demo123');
  console.log('   Shop: shop@demo.com / demo123\n');
  console.log('🎯 You can now use the demo buttons in the login screen!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

