# 🎯 Quick Start - Local Development

## The Problem You're Facing
When running `docker-compose up --build`, the build fails after some time. This is common with multi-service Docker builds due to network issues, dependency conflicts, or resource constraints.

## ✅ The Solution: 3-Step Setup

### STEP 1: Start Databases Only (2 minutes)
```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices"

# Start ONLY databases with Docker
docker-compose up -d user-db product-db cart-db order-db wishlist-db

# Verify they're running
docker ps
```

### STEP 2: Create Environment Files (1 minute)
```powershell
# Run the automated script
.\create-env-files.ps1
```

### STEP 3: Install Dependencies & Start Services (5-10 minutes)
```powershell
# Option A: Automated (opens 6 windows)
.\start-all-services.ps1

# Option B: Manual (if you prefer control)
# Open 6 separate PowerShell terminals and run:
cd services\user-service && npm install && npm run start:dev       # Terminal 1
cd services\product-service && npm install && npm run start:dev    # Terminal 2
cd services\cart-service && npm install && npm run start:dev       # Terminal 3
cd services\order-service && npm install && npm run start:dev      # Terminal 4
cd services\wishlist-service && npm install && npm run start:dev   # Terminal 5
cd services\api-gateway && npm install && npm run start:dev        # Terminal 6
```

---

## ✅ That's It!

Your services will be running at:
- **API Gateway**: http://localhost:3000
- **User Service**: http://localhost:3001
- **Product Service**: http://localhost:3002
- **Cart Service**: http://localhost:3003
- **Order Service**: http://localhost:3004
- **Wishlist Service**: http://localhost:3005

---

## 🔍 Quick Test

```powershell
# Test API Gateway
curl http://localhost:3000

# Test User Service
curl http://localhost:3001
```

---

## 📝 Important Notes

### Database Connection
- ✅ Databases run in Docker containers
- ✅ Services connect to `localhost:5433-5437`
- ✅ Tables are created automatically (TypeORM synchronize)

### Service Startup Order
1. **User Service** - MUST start first (others depend on it)
2. **Product Service** - Depends on User Service
3. **Cart Service** - Depends on User + Product
4. **Order Service** - Depends on User + Product + Cart
5. **Wishlist Service** - Depends on User + Product
6. **API Gateway** - Depends on ALL services

### First-Time Setup
If this is your first time running:
```powershell
# Install dependencies for each service
cd services\user-service && npm install
cd ..\product-service && npm install
cd ..\cart-service && npm install
cd ..\order-service && npm install
cd ..\wishlist-service && npm install
cd ..\api-gateway && npm install
```

---

## 🛑 Stopping Everything

### Stop Services
Press `Ctrl+C` in each PowerShell window

### Stop Databases
```powershell
docker-compose down
```

---

## 🔧 Common Issues

### Port Already in Use
```powershell
# Find process on port 3001
netstat -ano | findstr :3001

# Kill it
taskkill /PID <PID> /F
```

### Database Not Connecting
```powershell
# Restart databases
docker-compose restart user-db product-db cart-db order-db wishlist-db

# Check logs
docker logs user-db
```

### Module Not Found
```powershell
cd services\<service-name>
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 📚 Full Documentation

- **Detailed Setup**: [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md)
- **API Endpoints**: [API_TESTING.md](./API_TESTING.md)
- **Complete Guide**: [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)

---

## ❓ FAQ

**Q: Why not use Docker for everything?**
A: Docker builds can fail due to network issues, build conflicts, or resource constraints. Running services locally is more reliable for development.

**Q: Do I need to create databases manually?**
A: No! TypeORM will automatically create tables when services start.

**Q: Can I still use Docker Compose later?**
A: Yes! Once development is stable, you can build and deploy with `docker-compose up --build`.

**Q: What about the frontend?**
A: The frontend is optional for backend testing. Start it separately if needed:
```powershell
cd frontend
npm install
npm run dev
```

---

**Good luck! 🚀**
