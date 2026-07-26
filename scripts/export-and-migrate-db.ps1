# =========================================================================
# MicroCart Local Database Export & Live Kubernetes Import Helper
# =========================================================================

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " MicroCart Database Migration Utility " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$DUMP_DIR = Join-Path $PSScriptRoot "db-dumps"
if (-not (Test-Path $DUMP_DIR)) {
    New-Item -ItemType Directory -Path $DUMP_DIR | Out-Null
}

$databases = @(
    @{ Name = "user_db"; Container = "ecommerce-microservices-user-db-1"; Port = 5433 },
    @{ Name = "product_db"; Container = "ecommerce-microservices-product-db-1"; Port = 5434 },
    @{ Name = "cart_db"; Container = "ecommerce-microservices-cart-db-1"; Port = 5435 },
    @{ Name = "order_db"; Container = "ecommerce-microservices-order-db-1"; Port = 5436 },
    @{ Name = "wishlist_db"; Container = "ecommerce-microservices-wishlist-db-1"; Port = 5437 },
    @{ Name = "support_db"; Container = "ecommerce-microservices-support-db-1"; Port = 5438 }
)

Write-Host "[1/2] Exporting local database records to SQL files..." -ForegroundColor Yellow

foreach ($db in $databases) {
    $dbName = $db.Name
    $dumpPath = Join-Path $DUMP_DIR "$dbName.sql"
    
    Write-Host " - Dumping $dbName..." -NoNewline
    
    # Try docker exec first
    $dockerCmd = "docker exec -t $($db.Container) pg_dump -U postgres -d $dbName --clean --if-exists"
    try {
        Invoke-Expression "$dockerCmd > `"$dumpPath`"" 2>$null
        Write-Host " [SUCCESS (Docker)]" -ForegroundColor Green
    } catch {
        # Fallback to local pg_dump via port
        try {
            pg_dump -h localhost -p $($db.Port) -U postgres -d $dbName --clean --if-exists > "$dumpPath" 2>$null
            Write-Host " [SUCCESS (Local Port $($db.Port))]" -ForegroundColor Green
        } catch {
            Write-Host " [SKIPPED - Container/Port not active]" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
Write-Host "[2/2] Live Migration Guide for Ubuntu Kubernetes Cluster" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------"
Write-Host "To import these local database dumps into your live Ubuntu server:" -ForegroundColor White
Write-Host "1. Upload the dump folder to your Ubuntu server:" -ForegroundColor Cyan
Write-Host "   scp -r `"$DUMP_DIR`" ubuntu@15.252.12.221:~/MicroCart/" -ForegroundColor Green
Write-Host ""
Write-Host "2. Run this command on your Ubuntu server to restore all 6 databases:" -ForegroundColor Cyan
Write-Host "   bash ~/MicroCart/db-dumps/import-on-server.sh" -ForegroundColor Green
Write-Host ""
