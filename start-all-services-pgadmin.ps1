# ========================================
# Start All Microservices (pgAdmin Setup)
# ========================================
# This script opens multiple PowerShell windows,
# one for each microservice, and starts them in dependency order

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Starting All Microservices (pgAdmin)  " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$projectRoot = $PSScriptRoot

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
$pgRunning = $false
try {
    $testConn = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($testConn.TcpTestSucceeded) {
        $pgRunning = $true
        Write-Host "✅ PostgreSQL is running on port 5432" -ForegroundColor Green
    }
}
catch {
    $pgRunning = $false
}

if (-not $pgRunning) {
    Write-Host "❌ PostgreSQL is not running on port 5432" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Open Services (Win + R, type 'services.msc')" -ForegroundColor White
    Write-Host "2. Find 'postgresql-x64-15' (or your version)" -ForegroundColor White
    Write-Host "3. Right-click → Start" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter after starting PostgreSQL"
}

Write-Host ""
Write-Host "Initial Setup: Database Check" -ForegroundColor Cyan

# Check if password is provided via environment variable, otherwise prompt
if ($env:PG_PASSWORD) {
    $pgPass = $env:PG_PASSWORD
    Write-Host "Using PostgreSQL password from environment variable." -ForegroundColor Gray
} else {
    $pgPass = Read-Host "Please enter your PostgreSQL password (press Enter for default 'postgres')"
    if ($pgPass -eq "") { $pgPass = "postgres" }
    $env:PG_PASSWORD = $pgPass
}

Write-Host "Running database creation script..." -ForegroundColor Yellow
node create_dbs.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database setup failed. Please check your password and try again." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Starting services in dependency order..." -ForegroundColor Cyan

# Function to start a service in a new PowerShell window
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [int]$DelaySeconds = 0,
        [int]$Port = 0
    )
    
    Write-Host "▶ Starting $ServiceName..." -ForegroundColor Cyan
    
    if ($DelaySeconds -gt 0) {
        Write-Host "  Waiting $DelaySeconds seconds for dependencies..." -ForegroundColor Yellow
        Start-Sleep -Seconds $DelaySeconds
    }
    
    if ($Port -gt 0) {
        $portCmd = "`$env:PORT=$Port;"
    }
    else {
        $portCmd = ""
    }
    
    $command = "cd '$ServicePath'; $portCmd Write-Host 'Starting $ServiceName...' -ForegroundColor Green; npm run start:dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $command
}

# ========================================
# Step 1: User Service (FIRST - others depend on it)
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "STEP 1/6: User Service (Port 3001)" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Start-Service -ServiceName "User Service" -ServicePath "$projectRoot\services\user-service"

# ========================================
# Step 2: Product Service
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "STEP 2/6: Product Service (Port 3002)" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Start-Service -ServiceName "Product Service" -ServicePath "$projectRoot\services\product-service" -DelaySeconds 12

# ========================================
# Step 3: Cart Service
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "STEP 3/6: Cart Service (Port 3003)" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Start-Service -ServiceName "Cart Service" -ServicePath "$projectRoot\services\cart-service" -DelaySeconds 10

# ========================================
# Step 4: Order Service
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "STEP 4/6: Order Service (Port 3004)" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Start-Service -ServiceName "Order Service" -ServicePath "$projectRoot\services\order-service" -DelaySeconds 10

# ========================================
# Step 5: Wishlist Service
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "STEP 5/7: Wishlist Service (Port 3005)" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Start-Service -ServiceName "Wishlist Service" -ServicePath "$projectRoot\services\wishlist-service" -DelaySeconds 10

# ========================================
# Step 6: Support Service
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "STEP 6/7: Support Service (Port 3006)" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Start-Service -ServiceName "Support Service" -ServicePath "$projectRoot\services\support-service" -DelaySeconds 10

# ========================================
# Step 7: API Gateway (LAST)
# ========================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "STEP 7/7: API Gateway (Port 4000)" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Start-Service -ServiceName "API Gateway" -ServicePath "$projectRoot\services\api-gateway" -DelaySeconds 10 -Port 4000

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services are starting!           " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Wait for each service to show:" -ForegroundColor Yellow
Write-Host "  'Application is running on: http://localhost:XXXX'" -ForegroundColor White
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  ✅ API Gateway: http://localhost:4000" -ForegroundColor White
Write-Host "  ✅ User Service: http://localhost:3001" -ForegroundColor White
Write-Host "  ✅ Product Service: http://localhost:3002" -ForegroundColor White
Write-Host "  ✅ Cart Service: http://localhost:3003" -ForegroundColor White
Write-Host "  ✅ Order Service: http://localhost:3004" -ForegroundColor White
Write-Host "  ✅ Wishlist Service: http://localhost:3005" -ForegroundColor White
Write-Host "  ✅ Support Service: http://localhost:3006" -ForegroundColor White
Write-Host ""
Write-Host "Database Tables:" -ForegroundColor Cyan
Write-Host "  Tables will be created automatically by TypeORM" -ForegroundColor White
Write-Host "  Check pgAdmin → Databases → [db_name] → Schemas → public → Tables" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  Close all PowerShell windows or press Ctrl+C in each" -ForegroundColor White
Write-Host ""
Write-Host "To test the API:" -ForegroundColor Yellow
Write-Host "  Open browser to http://localhost:3000" -ForegroundColor White
Write-Host ""
