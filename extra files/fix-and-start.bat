@echo off
echo ================================
echo Fixing E-Commerce Microservices
echo ================================
echo.

echo Step 1: Installing Frontend Dependencies...
cd frontend
call npm install
cd ..
echo Frontend dependencies installed!
echo.

echo Step 2: Rebuilding Docker Images...
docker-compose build
echo Docker images rebuilt!
echo.

echo Step 3: Starting All Services...
docker-compose up -d
echo Services started!
echo.

echo ================================
echo Setup Complete!
echo ================================
echo.
echo Backend Services: http://localhost:3000/api
echo.
echo To start Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Frontend will be at: http://localhost:3000
echo.
pause
