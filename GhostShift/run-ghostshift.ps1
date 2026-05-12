$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "Starting GhostShift..." -ForegroundColor Cyan
Write-Host "App:       http://localhost:8787" -ForegroundColor Green
Write-Host "Signup:    http://localhost:8787/signup.html" -ForegroundColor Green
Write-Host "Dashboard: http://localhost:8787/dashboard.html" -ForegroundColor Green
Write-Host "Demo:      http://localhost:8787/demo-player.html" -ForegroundColor Green
Write-Host ""
Write-Host "Keep this PowerShell window open while using the app." -ForegroundColor Yellow
Write-Host ""

node .\backend\server.mjs
