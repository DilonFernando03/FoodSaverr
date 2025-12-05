# Deploy Edge Function for Email Verification

## Step 1: Login to Supabase (if not already logged in)

```bash
npx supabase login
```

This will open your browser to authenticate.

## Step 2: Deploy the Edge Function

```bash
cd food-saverr
npx supabase functions deploy serve-email-verification
```

## Step 3: Test the Function

After deployment, test the URL:

```
https://bblcyyqmwmbovkecxuqz.supabase.co/functions/v1/serve-email-verification
```

It should render the HTML page with correct Content-Type header.

## Step 4: Update Email Redirect URL

In Supabase Dashboard:
1. Go to **Authentication** → **URL Configuration**
2. Update **Redirect URLs** to include:
   ```
   https://bblcyyqmwmbovkecxuqz.supabase.co/functions/v1/serve-email-verification?redirect=food-saverr://auth/callback
   ```

Or set in your `.env` file:
```env
EXPO_PUBLIC_EMAIL_REDIRECT_TO=https://bblcyyqmwmbovkecxuqz.supabase.co/functions/v1/serve-email-verification?redirect=food-saverr://auth/callback
```

## Troubleshooting

### "Not logged in" error
Run `npx supabase login` first.

### "Project not linked" error
Run `npx supabase link --project-ref bblcyyqmwmbovkecxuqz` again.

### Deployment fails
- Check that you have the correct permissions (Owner/Admin)
- Verify the function code is correct
- Check Supabase Dashboard for error logs

