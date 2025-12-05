# Quick Fix for .env Encoding Issue

## Easiest Solution: Temporarily Rename .env

In PowerShell or Git Bash:

```bash
cd food-saverr

# Temporarily rename .env
mv .env .env.temp

# Link Supabase project
npx supabase link --project-ref bblcyyqmwmbovkecxuqz

# Rename back
mv .env.temp .env
```

## Alternative: Fix Execution Policy (One-Time)

In PowerShell (run as Administrator):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run:
```powershell
.\fix-env-encoding.ps1
```

## Alternative: Bypass for One Command

In PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\fix-env-encoding.ps1
```

## Manual Fix (Recommended)

1. Open `.env` in VS Code
2. Look at the bottom right corner - it should show the encoding
3. If it says "UTF-8 with BOM" or shows invalid characters:
   - Click the encoding name
   - Select "Save with Encoding"
   - Choose "UTF-8" (NOT "UTF-8 with BOM")
4. Check for any characters like `»` or `«` and remove them
5. Save the file

## Verify .env Format

Your `.env` should look like this (no special characters):

```env
EXPO_PUBLIC_SUPABASE_URL=https://bblcyyqmwmbovkecxuqz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
```

