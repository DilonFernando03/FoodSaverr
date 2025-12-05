#!/usr/bin/env node

/**
 * Apply the surprise bag display RLS policy fix.
 *
 * This script posts the SQL in fix-bag-display-rls.sql to Supabase using the
 * service role key so customer accounts can see bags from pending shops.
 *
 * Usage:
 *   node scripts/apply-rls-fix.js
 *
 * Required env vars (can be read from .env or .env.local):
 *   - EXPO_PUBLIC_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs');
const path = require('path');

function parseAndSetEnv(content) {
  if (!content) return;
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }
  content.split(/\r?\n/).forEach(line => {
    if (!line || /^\s*#/.test(line)) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    if (!key) return;
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

function loadEnvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      parseAndSetEnv(fs.readFileSync(filePath, 'utf-8'));
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

for (const envPath of candidateEnvPaths) {
  if (loadEnvFile(envPath)) {
    console.log(`ℹ️  Loaded environment variables from: ${envPath}`);
    break;
  }
}

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration.');
  console.error('   Ensure EXPO_PUBLIC_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const sqlPath = path.join(__dirname, '..', 'fix-bag-display-rls.sql');

if (!fs.existsSync(sqlPath)) {
  console.error(`❌ Cannot find SQL file at: ${sqlPath}`);
  process.exit(1);
}

const sqlFileContents = fs.readFileSync(sqlPath, 'utf-8');

if (!sqlFileContents.trim()) {
  console.error('❌ SQL file is empty.');
  process.exit(1);
}

function stripSqlComments(sql) {
  return sql.replace(/--.*$/gm, '').trim();
}

function splitSqlStatements(rawSql) {
  return rawSql
    .split(/;\s*(?:\r?\n|$)/)
    .map(statement => stripSqlComments(statement))
    .filter(statement => statement.length > 0);
}

async function runExecSql(query) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY,
    },
    body: JSON.stringify({ query }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || response.statusText);
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn('⚠️  Received non-JSON response from exec_sql:', text);
    return null;
  }
}

async function applyRlsFix() {
  console.log('🔄 Applying surprise bag RLS policy fix...');

  const statements = splitSqlStatements(sqlFileContents);

  if (statements.length === 0) {
    console.error('❌ No SQL statements found in fix-bag-display-rls.sql.');
    process.exit(1);
  }

  for (const [index, statement] of statements.entries()) {
    const preview = statement.replace(/\s+/g, ' ').slice(0, 80);
    console.log(`→ Executing statement ${index + 1}/${statements.length}: ${preview}${preview.length >= 80 ? '…' : ''}`);
    await runExecSql(statement);
  }

  console.log('✅ RLS policies updated successfully.');

  // Fetch the relevant policies to confirm
  const verificationQuery = `
    SELECT tablename, policyname, qual
    FROM pg_policies
    WHERE tablename IN ('surprise_bags', 'shop_profiles')
    ORDER BY tablename, policyname;
  `;

  let policies;
  try {
    policies = await runExecSql(verificationQuery.trim());
  } catch (error) {
    console.warn('⚠️  Policies applied, but verification query failed.');
    console.warn(String(error));
    return;
  }

  if (!Array.isArray(policies)) {
    console.warn('⚠️  Verification query returned unexpected data:', policies);
    return;
  }

  console.log('📄 Current policies:');
  for (const policy of policies) {
    console.log(`   • ${policy.tablename}: ${policy.policyname} → ${policy.qual}`);
  }

  console.log('✨ Done. Customer accounts should now see bags from pending shops.');
}

applyRlsFix().catch(error => {
  console.error('❌ Unexpected error applying RLS fix:', error);
  process.exit(1);
});

