# 🔧 Quick Fix Instructions

## Issues Fixed:
1. ✅ API Gateway rate-limit import error
2. ✅ Frontend dependencies script

## 🚀 Run This (PowerShell/CMD):

### Option 1: Automatic Fix (Easy)
```cmd
fix-and-start.bat
```

### Option 2: Manual Steps

**Step 1: Install Frontend Dependencies**
```cmd
cd frontend
npm install
cd ..
```

**Step 2: Rebuild & Start Services**
```cmd
docker-compose build
docker-compose up -d
```

**Step 3: Start Frontend**
```cmd
cd frontend
npm run dev
```

## ✅ Access Your Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3000/api

## 🎯 Test It

1. Open browser: http://localhost:3000
2. Click "Register"
3. Create buyer account
4. Browse products

## 🐛 If Still Not Working

### Frontend Error "next not found":
```cmd
cd frontend
rmdir /s /q node_modules
npm install
npm run dev
```

### Docker Error:
```cmd
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Check Services Status:
```cmd
docker-compose ps
```

### View Logs:
```cmd
docker-compose logs -f api-gateway
```

## 📝 What Changed

**services/api-gateway/src/main.ts:**
- Changed `import * as rateLimit` to `import rateLimit`

**services/api-gateway/package.json:**
- Updated express-rate-limit to v7.1.5

## ✅ Everything Should Work Now!

The issues were:
1. Old syntax for rate-limit import (fixed)
2. Frontend needed `npm install` (you need to run this)

Run the commands above and you're good to go! 🚀
