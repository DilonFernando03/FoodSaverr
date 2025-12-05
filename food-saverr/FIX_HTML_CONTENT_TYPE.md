# Fix: HTML File Showing as Source Code Instead of Rendered Page

## Problem
When you access your email verification HTML page, it displays as raw HTML source code instead of rendering as a webpage. This happens because Supabase Storage is not serving the file with the correct `Content-Type: text/html` header.

## Solution Options

### Option 1: Manual Upload via Supabase Dashboard (Recommended - Easiest)

This method ensures the Content-Type is set correctly:

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your project

2. **Open Storage**
   - Click on "Storage" in the left sidebar
   - Find or create the `public-assets` bucket
   - Make sure it's set to **Public**

3. **Upload the HTML file**
   - Navigate to or create the `email-verification` folder
   - Click "Upload file"
   - Select `static/email-verification/index.html` from your project
   - **Important**: When uploading, the browser/Supabase should automatically detect it's an HTML file and set the Content-Type correctly

4. **Verify the Content-Type**
   - After upload, click on the file
   - Check the file details/metadata
   - Ensure `Content-Type` is set to `text/html` or `text/html; charset=utf-8`
   - If it's not correct, you may need to delete and re-upload

5. **Test the URL**
   - Visit: `https://bblcyyqmwmbovkecxuqz.supabase.co/storage/v1/object/public/public-assets/email-verification/index.html`
   - It should render as a webpage, not show source code

### Option 2: Use Upload Script with Service Role Key

If you have the service role key:

1. **Add service role key to `.env`**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
   Get it from: Supabase Dashboard > Settings > API > `service_role` key

2. **Run the upload script**
   ```bash
   cd food-saverr
   node scripts/upload-email-verification.js
   ```

3. **Verify Content-Type**
   - The script will check and report the Content-Type
   - If it's still wrong, use Option 1 instead

### Option 3: Fix Existing File Metadata

If the file is already uploaded but has wrong Content-Type:

1. **Delete the existing file**
   - Go to Supabase Dashboard > Storage > public-assets > email-verification
   - Delete `index.html`

2. **Re-upload using Option 1** (manual upload)

### Option 4: Use Supabase CLI

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref bblcyyqmwmbovkecxuqz

# Upload with explicit content type
supabase storage upload public-assets static/email-verification/index.html email-verification/index.html --content-type "text/html"
```

## Verify the Fix

After fixing, test the URL in a browser:
```
https://bblcyyqmwmbovkecxuqz.supabase.co/storage/v1/object/public/public-assets/email-verification/index.html
```

**Expected Result**: You should see a styled "Email verified 🎉" page with confetti animations.

**If Still Showing Source Code**: 
- Clear your browser cache
- Try in an incognito/private window
- Check the browser's Network tab to see what Content-Type header is being sent
- Verify the file metadata in Supabase Dashboard

## Why This Happens

Supabase Storage determines Content-Type based on:
1. The file extension (`.html` should trigger `text/html`)
2. The Content-Type header sent during upload
3. File metadata stored in Supabase

Sometimes the Content-Type isn't set correctly during upload, especially when using the REST API directly. Manual upload via the dashboard usually handles this automatically.

## Prevention

For future uploads:
- Use manual upload via Supabase Dashboard for HTML files
- Or ensure the upload script sets `Content-Type: text/html; charset=utf-8` header
- Or use Supabase JS client library which handles this automatically


