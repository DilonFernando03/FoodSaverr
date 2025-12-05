/**
 * Script to upload the email verification HTML page to Supabase Storage
 * 
 * Usage: node scripts/upload-email-verification.js
 * 
 * Requirements:
 * - EXPO_PUBLIC_SUPABASE_URL must be set in .env
 * - EXPO_PUBLIC_SUPABASE_ANON_KEY must be set in .env
 * - Supabase Storage bucket "public-assets" must exist and be public
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bblcyyqmwmbovkecxuqz.supabase.co';
// Try service role key first (bypasses RLS), fall back to anon key
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibGN5eXFtd21ib3ZrZWN4dXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMDc0MjMsImV4cCI6MjA3NDg4MzQyM30.WzIcxOdp41VzwE0Udl8vh6KK2DQXYFJMsHFG9X5-5E4';

const HTML_FILE_PATH = path.join(__dirname, '../static/email-verification/index.html');
const STORAGE_BUCKET = 'public-assets';
const STORAGE_PATH = 'email-verification/index.html';

async function uploadFile() {
  try {
    // Read the HTML file
    console.log('Reading HTML file from:', HTML_FILE_PATH);
    if (!fs.existsSync(HTML_FILE_PATH)) {
      throw new Error(`HTML file not found at: ${HTML_FILE_PATH}`);
    }
    const htmlContent = fs.readFileSync(HTML_FILE_PATH, 'utf8');

    // First, try to delete the existing file to ensure clean upload
    const deleteUrl = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${STORAGE_PATH}`;
    console.log('Checking for existing file...');
    try {
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (deleteResponse.ok) {
        console.log('✅ Deleted existing file');
      }
    } catch (deleteError) {
      // File might not exist, which is fine
      console.log('No existing file to delete (this is OK)');
    }

    // Upload to Supabase Storage with correct Content-Type
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${STORAGE_PATH}`;
    console.log(`\nUploading to: ${uploadUrl}`);
    console.log('Setting Content-Type: text/html; charset=utf-8');
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'text/html; charset=utf-8',
        'x-upsert': 'true', // Overwrite if exists
        'Cache-Control': 'public, max-age=3600',
      },
      body: htmlContent,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, response.statusText);
      console.error('Error details:', errorText);
      
      if (response.status === 403 || response.status === 401) {
        console.error('\n⚠️  Permission denied. This might be an RLS (Row Level Security) issue.');
        console.error('Solutions:');
        console.error('1. Add SUPABASE_SERVICE_ROLE_KEY to your .env file (recommended for uploads)');
        console.error('2. Or upload manually via Supabase Dashboard (see instructions below)');
        console.error('3. Or configure Storage bucket RLS policies to allow anon uploads');
      } else if (response.status === 404) {
        console.error('\n⚠️  Storage bucket might not exist or be accessible.');
        console.error('Please ensure:');
        console.error('1. Storage bucket "public-assets" exists in Supabase');
        console.error('2. The bucket is set to public');
        console.error('3. The bucket has proper CORS settings');
      }
      
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Upload successful!');
    
    // Verify the file is accessible and check Content-Type
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${STORAGE_PATH}`;
    console.log('\n🔍 Verifying file...');
    try {
      const verifyResponse = await fetch(publicUrl, { method: 'HEAD' });
      const contentType = verifyResponse.headers.get('content-type');
      console.log(`Content-Type header: ${contentType || 'Not set (this may cause the issue)'}`);
      
      if (contentType && contentType.includes('text/html')) {
        console.log('✅ Content-Type is correct!');
      } else {
        console.log('⚠️  WARNING: Content-Type is not text/html!');
        console.log('   The file may display as source code instead of rendered HTML.');
        console.log('   Solution: Check Supabase Dashboard > Storage > public-assets');
        console.log('   and ensure the file metadata has Content-Type: text/html');
      }
    } catch (verifyError) {
      console.log('⚠️  Could not verify Content-Type:', verifyError.message);
    }
    
    console.log('\n📝 File URL:', publicUrl);
    console.log('\n📝 Next steps:');
    console.log('1. Test the URL in a browser:');
    console.log(`   ${publicUrl}`);
    console.log('   It should render as HTML, not show source code.');
    console.log('\n2. Configure Supabase Auth email redirect URL to:');
    console.log(`   ${publicUrl}?redirect=food-saverr://auth/callback`);
    console.log('\n3. Or set EXPO_PUBLIC_EMAIL_REDIRECT_TO in your .env file to:');
    console.log(`   ${publicUrl}?redirect=food-saverr://auth/callback`);
    
  } catch (error) {
    console.error('❌ Error uploading file:', error.message);
    process.exit(1);
  }
}

// Check if running in Node.js environment with fetch support
if (typeof fetch === 'undefined') {
  // Try to use node-fetch if available
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    console.error('This script requires Node.js 18+ with fetch support, or install node-fetch:');
    console.error('  npm install node-fetch');
    console.error('\nAlternatively, you can upload the file manually:');
    console.error('1. Go to Supabase Dashboard > Storage');
    console.error('2. Create bucket "public-assets" (if not exists) and make it public');
    console.error('3. Upload static/email-verification/index.html to public-assets/email-verification/');
    process.exit(1);
  }
}

uploadFile().catch(error => {
  console.error('Failed to upload:', error.message);
  process.exit(1);
});

