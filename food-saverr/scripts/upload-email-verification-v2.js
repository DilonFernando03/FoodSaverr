/**
 * Improved script to upload the email verification HTML page to Supabase Storage
 * Uses Supabase JS client which handles Content-Type metadata better
 * 
 * Usage: node scripts/upload-email-verification-v2.js
 * 
 * Requirements:
 * - EXPO_PUBLIC_SUPABASE_URL must be set in .env
 * - SUPABASE_SERVICE_ROLE_KEY must be set in .env (recommended) or EXPO_PUBLIC_SUPABASE_ANON_KEY
 * - Supabase Storage bucket "public-assets" must exist and be public
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Use Supabase JS client for better Content-Type handling
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bblcyyqmwmbovkecxuqz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY must be set in .env');
  console.error('   Get your keys from: https://app.supabase.com > Your Project > Settings > API');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

    // Convert to Blob/Buffer with explicit Content-Type
    const fileBuffer = Buffer.from(htmlContent, 'utf8');

    console.log('\n📤 Uploading file to Supabase Storage...');
    console.log(`   Bucket: ${STORAGE_BUCKET}`);
    console.log(`   Path: ${STORAGE_PATH}`);
    console.log(`   Content-Type: text/html; charset=utf-8`);

    // Upload using Supabase Storage API with explicit Content-Type
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_PATH, fileBuffer, {
        contentType: 'text/html; charset=utf-8',
        upsert: true, // Overwrite if exists
        cacheControl: 'public, max-age=3600',
      });

    if (error) {
      // If file exists, try to update it
      if (error.message.includes('already exists') || error.statusCode === '409') {
        console.log('File exists, attempting to update...');
        
        // Delete first, then upload
        const { error: deleteError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([STORAGE_PATH]);
        
        if (deleteError && !deleteError.message.includes('not found')) {
          console.error('Delete error:', deleteError);
        }

        // Upload again
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(STORAGE_PATH, fileBuffer, {
            contentType: 'text/html; charset=utf-8',
            upsert: true,
            cacheControl: 'public, max-age=3600',
          });

        if (uploadError) {
          throw uploadError;
        }
        console.log('✅ File updated successfully!');
      } else {
        throw error;
      }
    } else {
      console.log('✅ File uploaded successfully!');
    }

    // Verify the file is accessible and check Content-Type
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${STORAGE_PATH}`;
    console.log('\n🔍 Verifying file...');
    
    try {
      const verifyResponse = await fetch(publicUrl, { method: 'HEAD' });
      const contentType = verifyResponse.headers.get('content-type');
      console.log(`Content-Type header: ${contentType || 'Not set'}`);
      
      if (contentType && contentType.includes('text/html')) {
        console.log('✅ Content-Type is correct! The page should render properly.');
      } else {
        console.log('⚠️  WARNING: Content-Type is not text/html!');
        console.log('   Expected: text/html');
        console.log('   Found: ' + (contentType || 'Not set'));
        console.log('\n   This might be a Supabase Storage limitation.');
        console.log('   Try uploading manually via Supabase Dashboard instead.');
        console.log('   Or consider using a custom domain (see CUSTOM_DOMAIN_SETUP.md)');
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
    
  } catch (error) {
    console.error('❌ Error uploading file:', error.message);
    console.error('\n💡 Alternative solutions:');
    console.error('1. Upload manually via Supabase Dashboard:');
    console.error('   - Go to Storage > public-assets > email-verification');
    console.error('   - Upload index.html (should auto-detect Content-Type)');
    console.error('\n2. Use a custom domain (see CUSTOM_DOMAIN_SETUP.md)');
    console.error('\n3. Check that SUPABASE_SERVICE_ROLE_KEY is set in .env');
    process.exit(1);
  }
}

uploadFile().catch(error => {
  console.error('Failed to upload:', error.message);
  process.exit(1);
});


