# Cleanup script for email verification setup files
# Removes files that are no longer needed since GitHub Pages is working

Write-Host "Cleaning up email verification setup files..." -ForegroundColor Cyan
Write-Host ""

$filesToRemove = @(
    # Edge Function files
    "CHECK_DETAILS_TAB.md",
    "DEPLOY_EDGE_FUNCTION.md",
    "EDGE_FUNCTION_SOLUTION.md",
    "MAKE_EDGE_FUNCTION_PUBLIC.md",
    "MAKE_FUNCTION_PUBLIC_STEPS.md",
    
    # Upload scripts
    "scripts\upload-email-verification.js",
    "scripts\upload-email-verification-v2.js",
    "UPLOAD_EMAIL_VERIFICATION.md",
    
    # Troubleshooting files
    "FIX_HTML_CONTENT_TYPE.md",
    "verify-content-type.ps1",
    "fix-env-encoding.ps1",
    "FIX_ENV_ENCODING.md",
    "QUICK_FIX_ENV.md",
    
    # Optional (comment out if you want to keep)
    "CUSTOM_DOMAIN_SETUP.md",
    "INSTALL_SUPABASE_CLI.md"
)

$directoriesToRemove = @(
    "supabase\functions\serve-email-verification"
)

$removed = 0
$failed = 0

# Remove files
foreach ($file in $filesToRemove) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        try {
            Remove-Item $path -Force
            Write-Host "✅ Removed: $file" -ForegroundColor Green
            $removed++
        } catch {
            Write-Host "❌ Failed to remove: $file - $_" -ForegroundColor Red
            $failed++
        }
    }
}

# Remove directories
foreach ($dir in $directoriesToRemove) {
    $path = Join-Path $PSScriptRoot $dir
    if (Test-Path $path) {
        try {
            Remove-Item $path -Recurse -Force
            Write-Host "✅ Removed directory: $dir" -ForegroundColor Green
            $removed++
        } catch {
            Write-Host "❌ Failed to remove directory: $dir - $_" -ForegroundColor Red
            $failed++
        }
    }
}

Write-Host ""
Write-Host "Cleanup complete!" -ForegroundColor Cyan
Write-Host "  Removed: $removed items" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "  Failed: $failed items" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Files kept:" -ForegroundColor Cyan
Write-Host "  ✅ docs/email-verification/index.html (your working solution)" -ForegroundColor Green
Write-Host "  ✅ static/email-verification/index.html (source file)" -ForegroundColor Green
Write-Host "  ✅ FINAL_SOLUTION.md (documentation)" -ForegroundColor Green
Write-Host "  ✅ CLEANUP_GUIDE.md (this cleanup guide)" -ForegroundColor Green

