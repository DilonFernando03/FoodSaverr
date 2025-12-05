# Edge Function Solution for Email Verification HTML

Since Supabase Storage has a limitation where it serves HTML files with `text/plain` Content-Type (even though the metadata shows `text/html`), we can use a Supabase Edge Function to serve the HTML with the correct headers.

## Benefits

- ✅ Correct `Content-Type: text/html` header
- ✅ Full control over response headers
- ✅ Can inject dynamic content (redirect URLs, tokens, etc.)
- ✅ No dependency on Storage Content-Type issues

## Setup Instructions

### Step 1: Install Supabase CLI

**For Windows (using Scoop - Recommended):**

1. Install Scoop if you don't have it:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```

2. Add Supabase bucket:
   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   ```

3. Install Supabase CLI:
   ```powershell
   scoop install supabase
   ```

**Alternative: Using npx (no installation needed):**

You can use Supabase CLI via npx without installing it globally:
```bash
npx supabase --version
```

**For other platforms**, see: https://github.com/supabase/cli#install-the-cli

### Step 2: Login to Supabase

```bash
supabase login
```

### Step 3: Link Your Project

```bash
cd food-saverr
supabase link --project-ref bblcyyqmwmbovkecxuqz
```

### Step 4: Deploy the Edge Function

```bash
supabase functions deploy serve-email-verification
```

### Step 5: Update Email Redirect URL

In Supabase Dashboard → Authentication → URL Configuration, update the redirect URL to:

```
https://bblcyyqmwmbovkecxuqz.supabase.co/functions/v1/serve-email-verification?redirect=food-saverr://auth/callback
```

Or set in your `.env` file:

```env
EXPO_PUBLIC_EMAIL_REDIRECT_TO=https://bblcyyqmwmbovkecxuqz.supabase.co/functions/v1/serve-email-verification?redirect=food-saverr://auth/callback
```

## Testing

After deployment, test the URL:

```
https://bblcyyqmwmbovkecxuqz.supabase.co/functions/v1/serve-email-verification
```

It should render as HTML with the correct Content-Type header.

## Alternative: Test in Browser First

Before setting up the Edge Function, **test if the Storage URL actually works in a browser**:

1. Open in an incognito/private window:
   ```
   https://bblcyyqmwmbovkecxuqz.supabase.co/storage/v1/object/public/public-assets/email-verification/index.html
   ```

2. Some browsers (like Chrome) are smart enough to detect HTML content even with wrong Content-Type headers and will render it correctly.

3. If it renders correctly in the browser, you might not need the Edge Function solution!

## Updating the HTML

To update the HTML content:

1. Edit `supabase/functions/serve-email-verification/index.ts`
2. Update the `HTML_CONTENT` constant
3. Redeploy: `supabase functions deploy serve-email-verification`

## Comparison

| Method | Content-Type | Setup Complexity | Maintenance |
|--------|-------------|------------------|-------------|
| Storage (current) | ❌ text/plain | ✅ Easy | ✅ Easy |
| Edge Function | ✅ text/html | ⚠️ Medium | ⚠️ Medium |
| Custom Domain | ❌ Still text/plain | ❌ Complex | ⚠️ Medium |

**Recommendation**: Test the Storage URL in a browser first. If it renders correctly despite the wrong header, stick with Storage. If not, use the Edge Function solution.

