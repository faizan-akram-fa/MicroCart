# ========================================
# Create .env files for LOCAL PostgreSQL (pgAdmin)
# This script will prompt for your PostgreSQL password
# ========================================

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Create .env Files for pgAdmin Setup  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$projectRoot = "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices"

# Prompt for PostgreSQL password
Write-Host "Please enter your PostgreSQL password:" -ForegroundColor Yellow
Write-Host "(This is the password you use to login to pgAdmin)" -ForegroundColor Gray
$pgPassword = Read-Host -AsSecureString "Password"
$pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
)

Write-Host ""
Write-Host "Creating .env files..." -ForegroundColor Cyan
Write-Host ""

# ========================================
# User Service .env
# ========================================
$userServiceEnv = @"
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=$pgPasswordPlain
DB_NAME=user_db
JWT_SECRET=your-secret-key-change-in-production-make-it-long-and-random
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=dummy-client-id-to-prevent-startup-crash
GOOGLE_CLIENT_SECRET=dummy-secret-to-prevent-startup-crash
"@

Set-Content -Path "$projectRoot\services\user-service\.env" -Value $userServiceEnv
Write-Host "✅ Created user-service/.env" -ForegroundColor Green

# ========================================
# Product Service .env
# ========================================
$productServiceEnv = @"
PORT=3002
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=$pgPasswordPlain
DB_NAME=product_db
USER_SERVICE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
"@

Set-Content -Path "$projectRoot\services\product-service\.env" -Value $productServiceEnv
Write-Host "✅ Created product-service/.env" -ForegroundColor Green

# ========================================
# Cart Service .env
# ========================================
$cartServiceEnv = @"
PORT=3003
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=$pgPasswordPlain
DB_NAME=cart_db
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3000
"@

Set-Content -Path "$projectRoot\services\cart-service\.env" -Value $cartServiceEnv
Write-Host "✅ Created cart-service/.env" -ForegroundColor Green

# ========================================
# Order Service .env
# ========================================
$orderServiceEnv = @"
PORT=3004
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=$pgPasswordPlain
DB_NAME=order_db
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
CART_SERVICE_URL=http://localhost:3003
FRONTEND_URL=http://localhost:3000
"@

Set-Content -Path "$projectRoot\services\order-service\.env" -Value $orderServiceEnv
Write-Host "✅ Created order-service/.env" -ForegroundColor Green

# ========================================
# Wishlist Service .env
# ========================================
$wishlistServiceEnv = @"
PORT=3005
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=$pgPasswordPlain
DB_NAME=wishlist_db
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3000
"@

Set-Content -Path "$projectRoot\services\wishlist-service\.env" -Value $wishlistServiceEnv
Write-Host "✅ Created wishlist-service/.env" -ForegroundColor Green

# ========================================
# API Gateway .env
# ========================================
$apiGatewayEnv = @"
PORT=4000
USER_SERVICE_URL=http://127.0.0.1:3001
PRODUCT_SERVICE_URL=http://127.0.0.1:3002
CART_SERVICE_URL=http://127.0.0.1:3003
ORDER_SERVICE_URL=http://127.0.0.1:3004
WISHLIST_SERVICE_URL=http://127.0.0.1:3005
FRONTEND_URL=http://localhost:3000
"@

Set-Content -Path "$projectRoot\services\api-gateway\.env" -Value $apiGatewayEnv
Write-Host "✅ Created api-gateway/.env" -ForegroundColor Green

# Clear password from memory
$pgPasswordPlain = $null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All .env files created successfully!  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Database Host: localhost" -ForegroundColor White
Write-Host "  Database Port: 5432" -ForegroundColor White
Write-Host "  Database User: postgres" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure you've created the 5 databases in pgAdmin:" -ForegroundColor White
Write-Host "   - user_db" -ForegroundColor Gray
Write-Host "   - product_db" -ForegroundColor Gray
Write-Host "   - cart_db" -ForegroundColor Gray
Write-Host "   - order_db" -ForegroundColor Gray
Write-Host "   - wishlist_db" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Install dependencies:" -ForegroundColor White
Write-Host "   cd services\user-service && npm install" -ForegroundColor Gray
Write-Host "   (Repeat for all services)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start services in order:" -ForegroundColor White
Write-Host "   .\start-all-services-pgadmin.ps1" -ForegroundColor Gray
Write-Host ""
