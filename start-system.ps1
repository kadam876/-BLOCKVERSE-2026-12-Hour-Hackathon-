# Crowd Alert System - Windows PowerShell Startup Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Crowd Alert System - Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "[1/3] Checking Python..." -ForegroundColor Yellow
python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python not found" -ForegroundColor Red
    exit 1
}

# Check if Node is installed
Write-Host "[2/3] Checking Node.js..." -ForegroundColor Yellow
node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Starting Services..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Opening 3 terminals for services..." -ForegroundColor Cyan
Write-Host ""

# Terminal 1: Python Backend
Write-Host "Terminal 1: Starting Python Flask Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python people.py"

# Wait a bit
Start-Sleep -Seconds 2

# Terminal 2: Node Backend
Write-Host "Terminal 2: Starting Node.js Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\crowd-alert-system\backend'; npm start"

# Wait a bit
Start-Sleep -Seconds 2

# Terminal 3: React Frontend
Write-Host "Terminal 3: Starting React Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\crowd-alert-system\frontend'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Open browser: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services running on:" -ForegroundColor Yellow
Write-Host "  - Python: http://localhost:5002" -ForegroundColor Gray
Write-Host "  - Node: http://localhost:4000" -ForegroundColor Gray
Write-Host "  - React: http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C in each terminal to stop services" -ForegroundColor Yellow
Write-Host ""
