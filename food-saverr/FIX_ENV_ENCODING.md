# Fix .env File Encoding Issue

The error "unexpected character '»' in variable name" indicates your `.env` file has encoding issues, likely a BOM (Byte Order Mark) or invalid characters.

## Quick Fix

Run the PowerShell script to automatically fix the encoding:

```powershell
cd food-saverr
.\fix-env-encoding.ps1
```

## Manual Fix

If the script doesn't work, fix it manually:

### Option 1: Recreate .env File

1. **Backup your current .env file:**
   ```powershell
   copy .env .env.backup
   ```

2. **Open .env in a text editor** (VS Code, Notepad++, etc.)

3. **Save as UTF-8 without BOM:**
   - In VS Code: Click encoding in bottom right → "Save with Encoding" → "UTF-8"
   - In Notepad++: Encoding → "Convert to UTF-8 without BOM"

4. **Check for invalid characters:**
   - Look for characters like `»`, `«`, or other non-ASCII characters
   - Remove any characters that aren't letters, numbers, or standard punctuation

### Option 2: Use Environment Variables Instead

You can skip the .env file for linking by setting environment variables directly:

```bash
# In Git Bash or PowerShell
export SUPABASE_URL="https://bblcyyqmwmbovkecxuqz.supabase.co"
export SUPABASE_ACCESS_TOKEN="your_access_token"

npx supabase link --project-ref bblcyyqmwmbovkecxuqz
```

### Option 3: Temporarily Rename .env

If you just need to link the project and don't need the .env file for that:

```bash
# Temporarily rename
mv .env .env.temp

# Link project
npx supabase link --project-ref bblcyyqmwmbovkecxuqz

# Rename back
mv .env.temp .env
```

## Verify .env File Format

Your `.env` file should look like this (no BOM, no special characters):

```env
EXPO_PUBLIC_SUPABASE_URL=https://bblcyyqmwmbovkecxuqz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
```

Each line should be:
- `VARIABLE_NAME=value`
- No spaces around the `=`
- No quotes needed (unless the value contains spaces)
- No special characters like `»`, `«`, etc.

## After Fixing

Try linking again:

```bash
npx supabase link --project-ref bblcyyqmwmbovkecxuqz
```

