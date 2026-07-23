# ========================================
# Update Ports: Gateway -> 4000, Frontend -> 3000
# ========================================

Write-Host "Updating configuration to resolve port conflict..." -ForegroundColor Cyan

$projectRoot = "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices"

# 1. Update API Gateway Port to 4000
$gatewayEnvPath = "$projectRoot\services\api-gateway\.env"
$gatewayContent = Get-Content $gatewayEnvPath
$gatewayContent = $gatewayContent -replace "PORT=3000", "PORT=4000"
$gatewayContent | Set-Content $gatewayEnvPath
Write-Host "✅ Moved API Gateway to Port 4000" -ForegroundColor Green

# 2. Update Frontend to point to Gateway on 4000
$frontendEnvPath = "$projectRoot\frontend\.env.local"
Set-Content -Path $frontendEnvPath -Value "NEXT_PUBLIC_API_URL=http://localhost:4000/api"
Write-Host "✅ Updated Frontend to connect to Port 4000" -ForegroundColor Green

# 3. Update create-env-files script for future use
$scriptPath = "$projectRoot\create-env-files-pgadmin.ps1"
$scriptContent = Get-Content $scriptPath
$scriptContent = $scriptContent -replace "PORT=3000", "PORT=4000" -replace "FRONTEND_URL=http://localhost:3000", "FRONTEND_URL=http://localhost:3000"
$scriptContent | Set-Content $scriptPath
Write-Host "✅ Updated create-env-files script" -ForegroundColor Green

Write-Host ""
Write-Host "Please RESTART your services for changes to take effect!" -ForegroundColor Yellow
