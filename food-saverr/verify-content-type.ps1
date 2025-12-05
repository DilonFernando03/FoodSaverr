# Quick script to verify Content-Type header
# Add cache-busting parameter to avoid cached responses
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$url = "https://bblcyyqmwmbovkecxuqz.supabase.co/storage/v1/object/public/public-assets/email-verification/index.html?t=$timestamp"

Write-Host "Checking Content-Type header..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host ""

try {
    # Try HEAD request first
    $response = Invoke-WebRequest -Uri $url -Method Head -ErrorAction Stop
    $contentType = $response.Headers['Content-Type']
    
    Write-Host "HTTP Response Headers:" -ForegroundColor Cyan
    Write-Host "  Content-Type: $contentType" -ForegroundColor $(if ($contentType -like "*text/html*") { "Green" } else { "Yellow" })
    
    # Show other relevant headers
    if ($response.Headers['Cache-Control']) {
        Write-Host "  Cache-Control: $($response.Headers['Cache-Control'])" -ForegroundColor Gray
    }
    if ($response.Headers['Content-Length']) {
        Write-Host "  Content-Length: $($response.Headers['Content-Length']) bytes" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    if ($contentType -like "*text/html*") {
        Write-Host "✅ Content-Type is correct! The page should render properly." -ForegroundColor Green
        Write-Host ""
        Write-Host "Test the URL in your browser:" -ForegroundColor Cyan
        Write-Host "  https://bblcyyqmwmbovkecxuqz.supabase.co/storage/v1/object/public/public-assets/email-verification/index.html" -ForegroundColor White
    } else {
        Write-Host "⚠️  Content-Type mismatch detected!" -ForegroundColor Yellow
        Write-Host "   Dashboard shows: text/html; charset=utf-8" -ForegroundColor Gray
        Write-Host "   HTTP header shows: $contentType" -ForegroundColor Gray
        Write-Host ""
        Write-Host "This might be a Supabase Storage serving issue." -ForegroundColor Yellow
        Write-Host "Try:" -ForegroundColor Cyan
        Write-Host "  1. Wait a few minutes for changes to propagate" -ForegroundColor White
        Write-Host "  2. Clear your browser cache and try again" -ForegroundColor White
        Write-Host "  3. Test in an incognito/private browser window" -ForegroundColor White
        Write-Host "  4. Check if the page actually renders despite the header" -ForegroundColor White
    }
} catch {
    Write-Host "Error checking URL: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Trying GET request instead..." -ForegroundColor Yellow
    try {
        $getResponse = Invoke-WebRequest -Uri $url -Method Get -ErrorAction Stop
        $getContentType = $getResponse.Headers['Content-Type']
        Write-Host "GET request Content-Type: $getContentType" -ForegroundColor $(if ($getContentType -like "*text/html*") { "Green" } else { "Yellow" })
    } catch {
        Write-Host "GET request also failed: $_" -ForegroundColor Red
    }
}


