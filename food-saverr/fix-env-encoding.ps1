# Script to fix .env file encoding issues (BOM removal)
$envPath = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env file not found at: $envPath" -ForegroundColor Red
    exit 1
}

Write-Host "Reading .env file..." -ForegroundColor Cyan

# Read the file content
$content = Get-Content $envPath -Raw -Encoding UTF8

# Remove BOM if present
if ($content.StartsWith([char]0xFEFF)) {
    Write-Host "⚠️  Found BOM (Byte Order Mark), removing..." -ForegroundColor Yellow
    $content = $content.Substring(1)
}

# Remove any invalid characters (like »)
$content = $content -replace '[^\x20-\x7E\r\n]', ''

# Check for common encoding issues (using regex for special characters)
if ($content -match '[^\x20-\x7E\r\n\t]') {
    Write-Host "⚠️  Found invalid characters, cleaning..." -ForegroundColor Yellow
    # Remove any non-printable ASCII characters except newlines and tabs
    $content = $content -replace '[^\x20-\x7E\r\n\t]', ''
}

# Save the file without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($envPath, $content, $utf8NoBom)

Write-Host "✅ .env file fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "Try running the Supabase command again:" -ForegroundColor Cyan
Write-Host "  npx supabase link --project-ref bblcyyqmwmbovkecxuqz" -ForegroundColor White

