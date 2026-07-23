# ========================================
# Start Frontend
# ========================================

Write-Host "Starting Frontend..." -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot

$command = "cd '$projectRoot\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $command

Write-Host "✅ Frontend started in new window!" -ForegroundColor Green
Write-Host "Wait for it to compile, then open http://localhost:3000" -ForegroundColor Yellow
