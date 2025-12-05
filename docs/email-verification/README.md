# Email Verification Page

This folder contains the email verification HTML page for FoodSaverr.

## GitHub Pages Setup

1. **Enable GitHub Pages:**
   - Go to your GitHub repository settings
   - Navigate to "Pages" section
   - Under "Source", select "Deploy from a branch"
   - Choose "main" branch and "/docs" folder
   - Click "Save"

2. **Your page will be available at:**
   ```
   https://yourusername.github.io/FoodSaverr/email-verification/
   ```

3. **Update Supabase Auth redirect URL:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Set redirect URL to:
     ```
     https://yourusername.github.io/FoodSaverr/email-verification/?redirect=food-saverr://auth/callback
     ```

## File Structure

```
docs/
  └── email-verification/
      └── index.html
```

