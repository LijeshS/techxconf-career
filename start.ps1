# TechXConf Career Compass - Quick Start Script
# Run this from the project root: .\start.ps1

Write-Host "🎯 TechXConf Career Compass - Starting up..." -ForegroundColor Cyan

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found! Please install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js $(node --version) detected" -ForegroundColor Green

# Install backend deps
Write-Host "`n📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
Write-Host "✅ Backend ready" -ForegroundColor Green

# Install frontend deps
Write-Host "`n📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ..\frontend
npm install
Write-Host "✅ Frontend ready" -ForegroundColor Green

Set-Location ..

Write-Host "`n🚀 To start the app, open TWO terminals:" -ForegroundColor Cyan
Write-Host "  Terminal 1 (backend):  cd backend  ; npm run dev" -ForegroundColor White
Write-Host "  Terminal 2 (frontend): cd frontend ; npm start" -ForegroundColor White
Write-Host "`n🌐 Then open: http://localhost:3000" -ForegroundColor Green
Write-Host "📡 API running at: http://localhost:4000" -ForegroundColor Green
Write-Host "🔭 Observability: http://localhost:3000/observability" -ForegroundColor Green
