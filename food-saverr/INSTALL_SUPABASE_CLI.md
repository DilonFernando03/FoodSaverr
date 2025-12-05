# Installing Supabase CLI on Windows

Supabase CLI cannot be installed via `npm install -g`. Use one of these methods:

## Method 1: Using Scoop (Recommended for Windows)

### Step 1: Install Scoop

Open **PowerShell as Administrator** and run:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### Step 2: Add Supabase Bucket

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
```

### Step 3: Install Supabase CLI

```powershell
scoop install supabase
```

### Step 4: Verify Installation

```powershell
supabase --version
```

## Method 2: Using npx (No Installation - Quick Test)

You can use Supabase CLI without installing it globally:

```bash
npx supabase --version
npx supabase login
npx supabase link --project-ref bblcyyqmwmbovkecxuqz
npx supabase functions deploy serve-email-verification
```

**Note**: This will download the CLI each time, but it works without installation.

## Method 3: Direct Download

1. Go to: https://github.com/supabase/cli/releases
2. Download the Windows executable (`.exe`)
3. Add it to your PATH or use it directly

## After Installation

Once Supabase CLI is installed, continue with the Edge Function setup:

1. Login:
   ```bash
   supabase login
   ```

2. Link your project:
   ```bash
   cd food-saverr
   supabase link --project-ref bblcyyqmwmbovkecxuqz
   ```

3. Deploy the Edge Function:
   ```bash
   supabase functions deploy serve-email-verification
   ```

## Troubleshooting

### "scoop: command not found"
- Make sure you installed Scoop in PowerShell (not Git Bash)
- Restart your terminal after installing Scoop
- Check that Scoop is in your PATH

### Permission Errors
- Run PowerShell as Administrator when installing Scoop
- For regular use, you don't need admin rights

### Alternative: Use npx
If you have issues with Scoop, just use `npx supabase` instead of `supabase` for all commands.

