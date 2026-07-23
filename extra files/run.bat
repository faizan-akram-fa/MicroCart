@echo off
echo Starting Ecommerce Microservices...
powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\start-all-services-pgadmin.ps1'"
pause
