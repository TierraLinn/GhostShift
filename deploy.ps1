# GhostShift Production Deployment Script (PowerShell)
# Usage: ./deploy.ps1 -Url "https://ghostshift.railway.app"

param(
    [Parameter(Mandatory=$false)]
    [string]$Url
)

Write-Host ""
Write-Host "🚀 GhostShift Production Deployment Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (-not $Url) {
    Write-Host ""
    Write-Host "Usage: ./deploy.ps1 -Url 'https://your-production-url.railway.app'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Yellow
    Write-Host "  ./deploy.ps1 -Url 'https://ghostshift.railway.app'" -ForegroundColor Gray
    Write-Host "  ./deploy.ps1 -Url 'https://ghostshift.onrender.com'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "This script will:" -ForegroundColor Yellow
    Write-Host "  1. Create backend .env file" -ForegroundColor Gray
    Write-Host "  2. Show extension manifest updates needed" -ForegroundColor Gray
    Write-Host "  3. Prepare for Railway/Render deployment" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "✅ Deploying to: $Url" -ForegroundColor Green
Write-Host ""

# Extract domain from URL
$domain = $Url -replace "https://", "" -replace "http://", ""

Write-Host "📝 Step 1: Creating backend .env file..." -ForegroundColor Cyan

# Create .env file
$envContent = @"
# GhostShift Production .env
PORT=8787

# Stripe Configuration (leave empty to use demo mode)
# STRIPE_SECRET_KEY=sk_test_your_key_here
# STRIPE_PRICE_PLUS=price_xxx
# STRIPE_PRICE_FAMILY=price_xxx

# Debug
## comment to disable verbose logging
DEBUG=0
"@

$envPath = ".\GhostShift\backend\.env"
$envContent | Out-File -FilePath $envPath -Encoding UTF8
Write-Host "✅ Created $envPath" -ForegroundColor Green

Write-Host ""
Write-Host "✅ You're ready to deploy!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host "1. Commit these changes:" -ForegroundColor Gray
Write-Host "   git add -A && git commit -m 'Production deployment configuration'" -ForegroundColor DarkGray
Write-Host ""
Write-Host "2. Push to GitHub:" -ForegroundColor Gray
Write-Host "   git push" -ForegroundColor DarkGray
Write-Host ""
Write-Host "3. Connect to Railway.app or Render.com" -ForegroundColor Gray
Write-Host "   See DEPLOYMENT_TODAY.md for full instructions" -ForegroundColor DarkGray
Write-Host ""
Write-Host "4. Once deployed, update extension for live domain:" -ForegroundColor Gray
Write-Host "   Edit: extension-chrome-edge/manifest.json" -ForegroundColor DarkGray
Write-Host "   Add to host_permissions: `"https://$domain/*`"" -ForegroundColor DarkGray
Write-Host ""
Write-Host "5. Reload extension in Chrome:" -ForegroundColor Gray
Write-Host "   chrome://extensions > GhostShift > Reload (⟳)" -ForegroundColor DarkGray
Write-Host ""
