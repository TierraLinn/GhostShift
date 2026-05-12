$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "GhostShift mobile build starter" -ForegroundColor Cyan
Write-Host ""
Write-Host "This project already works as an installable PWA." -ForegroundColor Green
Write-Host "Open the phone install guide:" -ForegroundColor Green
Write-Host "  GhostShift\mobile-app\PWA_INSTALL.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "For native Android/iPhone builds you will need:" -ForegroundColor Cyan
Write-Host "  - Node/npm"
Write-Host "  - Android Studio for Android"
Write-Host "  - Xcode on macOS for iPhone/iPad"
Write-Host "  - Capacitor or a Trusted Web Activity wrapper"
Write-Host ""
Write-Host "Starting the local PWA server now..." -ForegroundColor Cyan
Set-Location (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "..")
node .\backend\server.mjs
