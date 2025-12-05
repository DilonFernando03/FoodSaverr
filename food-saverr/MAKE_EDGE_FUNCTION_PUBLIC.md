# Make Edge Function Publicly Accessible

The Edge Function needs to be publicly accessible for email verification links to work.

## Option 1: Configure in Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/bblcyyqmwmbovkecxuqz/functions
2. Click on `serve-email-verification`
3. Look for **Settings** or **Configuration**
4. Enable **"Allow anonymous access"** or **"Public function"**
5. Save the changes

## Option 2: Test in Browser First

The function might already work in browsers even if it shows 401 in PowerShell. Test it:

1. Open this URL in your browser:
   ```
   https://bblcyyqmwmbovkecxuqz.supabase.co/functions/v1/serve-email-verification
   ```

2. If it shows the HTML page, it's working! ✅

3. If it shows an error or login page, use Option 1 above.

## Option 3: Update Function Code (If needed)

If the dashboard doesn't have a public setting, we can modify the function to not require authentication. But first, try Option 1 or 2.

## After Making It Public

1. Test the URL in a browser
2. Verify it shows the styled HTML page (not source code)
3. Update your email redirect URL in Supabase Dashboard:
   - Go to **Authentication** → **URL Configuration**
   - Set redirect URL to:
     ```
     https://bblcyyqmwmbovkecxuqz.supabase.co/functions/v1/serve-email-verification?redirect=food-saverr://auth/callback
     ```

