# Upload Email Verification HTML to Supabase Storage

The email verification HTML page needs to be uploaded to Supabase Storage so it can be served when users click the verification link in their email.

## Option 1: Using the Upload Script (Recommended)

1. **Make sure you have Node.js 18+** (or install `node-fetch` for older versions)

2. **Run the upload script:**
   ```bash
   node scripts/upload-email-verification.js
   ```

3. **Configure Supabase Auth Redirect URL:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Set **Site URL** to your app's URL (or leave as default)
   - Set **Redirect URLs** to include:
     ```
     https://bblcyyqmwmbovkecxuqz.supabase.co/storage/v1/object/public/public-assets/email-verification/index.html
     ```

## Option 2: Manual Upload via Supabase Dashboard

1. **Create Storage Bucket (if not exists):**
   - Go to Supabase Dashboard → Storage
   - Click "New bucket"
   - Name: `public-assets`
   - Make it **Public** (toggle on)
   - Click "Create bucket"

2. **Upload the HTML file:**
   - In the `public-assets` bucket, create folder `email-verification`
   - Upload `static/email-verification/index.html` to `email-verification/index.html`
   - Make sure the file is publicly accessible

3. **Configure Supabase Auth:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add redirect URL:
     ```
     https://bblcyyqmwmbovkecxuqz.supabase.co/storage/v1/object/public/public-assets/email-verification/index.html
     ```

## Option 3: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref bblcyyqmwmbovkecxuqz

# Upload the file
supabase storage upload public-assets static/email-verification/index.html email-verification/index.html
```

## Verify Upload

After uploading, verify the file is accessible by visiting:
```
https://bblcyyqmwmbovkecxuqz.supabase.co/storage/v1/object/public/public-assets/email-verification/index.html
```

You should see the styled "Email verified 🎉" page, not the raw HTML source code.

## Configure Email Redirect URL

In your Supabase project settings:

1. Go to **Authentication** → **URL Configuration**
2. Set **Redirect URLs** to include:
   ```
   https://bblcyyqmwmbovkecxuqz.supabase.co/storage/v1/object/public/public-assets/email-verification/index.html?redirect=food-saverr://auth/callback
   ```

Or set the `EXPO_PUBLIC_EMAIL_REDIRECT_TO` environment variable in your `.env` file:
```
EXPO_PUBLIC_EMAIL_REDIRECT_TO=https://bblcyyqmwmbovkecxuqz.supabase.co/storage/v1/object/public/public-assets/email-verification/index.html?redirect=food-saverr://auth/callback
```

## Troubleshooting

### File shows as raw HTML instead of rendered page
- Check that the file was uploaded correctly
- Verify the Content-Type is `text/html`
- Check browser console for errors
- Ensure the storage bucket is public

### Deep link doesn't work
- Verify the app scheme `food-saverr` is configured in `app.json` and `app.config.js`
- Check that the callback handler exists at `app/auth/callback.tsx`
- Test the deep link manually: `food-saverr://auth/callback#access_token=test`

### Tokens not passed correctly
- Verify the HTML script preserves the hash fragment when redirecting
- Check that the callback handler properly extracts tokens from the URL

