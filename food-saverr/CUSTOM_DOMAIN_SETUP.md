# Setting Up a Custom Domain for Supabase

This guide will help you set up a custom domain for your Supabase project. **Note:** A custom domain is not required to fix the Content-Type issue - try the manual upload method first (see `FIX_HTML_CONTENT_TYPE.md`).

## Why Use a Custom Domain?

Custom domains are useful for:
- **Branding**: Use `api.yourdomain.com` instead of `bblcyyqmwmbovkecxuqz.supabase.co`
- **OAuth**: Better user experience on OAuth consent screens
- **Long-term portability**: Easier to migrate between Supabase projects
- **Professional appearance**: More polished API endpoints

## Prerequisites

1. **Paid Supabase Plan**: Custom domains are only available on paid plans (Pro/Team/Enterprise)
2. **Domain Name**: You need a domain (e.g., `example.com`) from a DNS provider
3. **Supabase CLI**: Install the latest version
4. **Owner/Admin Access**: You need Owner or Admin permissions for the project

## Step 1: Install Supabase CLI

If you haven't already:

```bash
npm install -g supabase
```

Or using other package managers:
```bash
# Homebrew (Mac)
brew install supabase/tap/supabase

# Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Step 2: Login to Supabase CLI

```bash
supabase login
```

This will open your browser to authenticate.

## Step 3: Get Your Project Reference

Your project reference is: `bblcyyqmwmbovkecxuqz`

You can also find it in:
- Supabase Dashboard URL: `https://app.supabase.com/project/bblcyyqmwmbovkecxuqz`
- Or in your project settings

## Step 4: Choose Your Custom Domain

You need a **subdomain** (not the root domain). Examples:
- ✅ `api.foodsaverr.com`
- ✅ `supabase.foodsaverr.com`
- ✅ `api.yourdomain.com`
- ❌ `foodsaverr.com` (root domain - not supported)

## Step 5: Add CNAME Record

Add a CNAME record in your domain's DNS settings:

1. Go to your DNS provider (e.g., Cloudflare, Namecheap, GoDaddy)
2. Add a new CNAME record:
   - **Name/Host**: `api` (or your chosen subdomain)
   - **Value/Target**: `bblcyyqmwmbovkecxuqz.supabase.co`
   - **TTL**: 300 (low TTL for faster propagation)

**Example for `api.foodsaverr.com`:**
```
Type: CNAME
Name: api
Value: bblcyyqmwmbovkecxuqz.supabase.co
TTL: 300
```

## Step 6: Register Domain with Supabase

Run this command to register your domain:

```bash
supabase domains create --project-ref bblcyyqmwmbovkecxuqz --custom-hostname api.yourdomain.com
```

Replace `api.yourdomain.com` with your actual subdomain.

This will return a TXT record you need to add to DNS.

## Step 7: Add TXT Record for Verification

The command will output something like:

```
Required outstanding validation records:
    _acme-challenge.api.yourdomain.com. TXT -> ca3-F1HvR9i938OgVwpCFwi1jTsbhe1hvT0Ic3efPY3Q
```

Add this TXT record to your DNS:

1. Go to your DNS provider
2. Add a new TXT record:
   - **Name/Host**: `_acme-challenge.api` (or `_acme-challenge.api.yourdomain.com` - depends on your DNS provider)
   - **Value**: `ca3-F1HvR9i938OgVwpCFwi1jTsbhe1hvT0Ic3efPY3Q` (the value from the command)
   - **TTL**: 300

**Important**: Some DNS providers automatically append the domain name. If your provider does this, create the record for `_acme-challenge.api` instead of `_acme-challenge.api.yourdomain.com`.

## Step 8: Verify Domain

After adding both CNAME and TXT records, verify the domain:

```bash
supabase domains reverify --project-ref bblcyyqmwmbovkecxuqz
```

You may need to run this multiple times as DNS records can take time to propagate (usually 5-30 minutes).

## Step 9: Prepare Your Applications

Before activating, update your OAuth providers and applications:

### For OAuth Providers (Google, GitHub, etc.)

In each provider's developer console, add BOTH callback URLs:
- Original: `https://bblcyyqmwmbovkecxuqz.supabase.co/auth/v1/callback`
- New: `https://api.yourdomain.com/auth/v1/callback`

### For Your App Code

You can use either domain interchangeably, but prepare to switch:

```typescript
// Option 1: Keep using original domain
const supabase = createClient(
  'https://bblcyyqmwmbovkecxuqz.supabase.co',
  SUPABASE_ANON_KEY
);

// Option 2: Switch to custom domain (after activation)
const supabase = createClient(
  'https://api.yourdomain.com',
  SUPABASE_ANON_KEY
);
```

### Update Email Verification URL

After activation, update your email verification redirect URL:

```
https://api.yourdomain.com/storage/v1/object/public/public-assets/email-verification/index.html?redirect=food-saverr://auth/callback
```

## Step 10: Activate Domain

Once everything is prepared and verified:

```bash
supabase domains activate --project-ref bblcyyqmwmbovkecxuqz
```

This process can take up to 30 minutes as Supabase issues an SSL certificate via Let's Encrypt.

## Step 11: Update Your Application

After activation, update your `.env` file:

```env
# Option 1: Keep both (they work interchangeably)
EXPO_PUBLIC_SUPABASE_URL=https://api.yourdomain.com

# Option 2: Keep original as fallback
EXPO_PUBLIC_SUPABASE_URL=https://bblcyyqmwmbovkecxuqz.supabase.co
```

And update your email verification redirect URL in Supabase Dashboard:
- Go to Authentication → URL Configuration
- Update redirect URLs to use your custom domain

## Troubleshooting

### DNS Records Not Propagating
- Wait 5-30 minutes for DNS propagation
- Use `dig` or `nslookup` to check if records are live
- Ensure TTL is low (300 seconds) for faster updates

### Verification Fails
- Double-check TXT record value (no extra spaces)
- Ensure CNAME points to correct Supabase domain
- Try `domains reverify` command again

### SSL Certificate Issues
- SSL certificate is issued automatically by Let's Encrypt
- Can take up to 30 minutes after activation
- If issues persist, contact Supabase support

### Content-Type Still Wrong
- Custom domain doesn't automatically fix Content-Type
- You still need to upload files with correct Content-Type
- Try manual upload via Supabase Dashboard

## Removing Custom Domain

If you need to remove the custom domain:

```bash
supabase domains delete --project-ref bblcyyqmwmbovkecxuqz
```

**Warning**: This may break OAuth/SAML integrations. Update your OAuth providers first.

## Alternative: Vanity Subdomain

If you don't have a custom domain, you can use a vanity subdomain on `supabase.co`:

```bash
# Check availability
supabase vanity-subdomains --project-ref bblcyyqmwmbovkecxuqz check-availability --desired-subdomain foodsaverr --experimental

# Activate (if available)
supabase vanity-subdomains --project-ref bblcyyqmwmbovkecxuqz activate --desired-subdomain foodsaverr --experimental
```

This would give you: `foodsaverr.supabase.co` instead of `bblcyyqmwmbovkecxuqz.supabase.co`

## Next Steps

1. Test your custom domain: `https://api.yourdomain.com/storage/v1/object/public/public-assets/email-verification/index.html`
2. Update your app's Supabase URL
3. Update OAuth callback URLs
4. Update email verification redirect URLs

---

**Remember**: A custom domain is optional. The Content-Type issue can be fixed by re-uploading the file correctly via Supabase Dashboard.


