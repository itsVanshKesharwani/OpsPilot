# OpsPilot dev mode: backend + frontend together (one terminal)
# Usage:  .\start.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== OpsPilot starting ===" -ForegroundColor Cyan

# 1) backend
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$root\backend'; python -m uvicorn main:app --reload --port 8000" -WindowStyle Normal

# 2) frontend dev server (proxies /api -> :8000)
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "Set-Location '$root\frontend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3
Write-Host ""
Write-Host "Backend : http://127.0.0.1:8000  (API + docs)" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173   (hot reload UI)" -ForegroundColor Green
Write-Host ""
Write-Host "Production mode (single server):  cd frontend; npm run build; cd ..\backend; python -m uvicorn main:app --port 8000" -ForegroundColor Yellow
