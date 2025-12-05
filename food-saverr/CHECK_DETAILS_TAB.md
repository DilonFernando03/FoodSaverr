# Check Details Tab for Function Settings

## Step 1: Click on "Details" Tab

In the Supabase dashboard, click on the **"Details"** tab (next to "Overview", "Invocations", "Logs", "Code").

## Step 2: Look for These Settings

In the Details tab, look for:
- **"Verify JWT"** toggle/checkbox
- **"Require Authentication"** setting  
- **"Public Access"** option
- Any **"Security"** or **"Access"** section

## Step 3: If Settings Are There

- **Disable/Uncheck** "Verify JWT" or "Require Authentication"
- **Enable** "Public Access" if available
- **Save** the changes

## Step 4: If Settings Are NOT There

If you don't see these settings in the Details tab, we'll need to modify the function code to handle unauthenticated requests. This is a Supabase limitation - Edge Functions require authentication by default.

## Alternative: Use Anon Key in Function

We can modify the function to work with the anon key, which makes it effectively public for GET requests.

