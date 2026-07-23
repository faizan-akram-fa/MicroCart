# 🚀 Local Development Setup Guide

## Problem Statement
When running the full Docker Compose build, it fails after some time due to build issues, network errors, or dependency problems. This guide provides a **hybrid approach** that's more reliable for development.

## ✅ Recommended Approach: Hybrid Setup

**Use Docker ONLY for databases** + **Run services locally with Node.js**

This approach:
- ✅ Avoids Docker build failures
- ✅ Faster development (hot reload works better)
- ✅ Easier to debug
- ✅ More control over each service

---

## 📋 Step-by-Step Setup Procedure

### Step 1: Start Databases with Docker

First, we'll run **ONLY the PostgreSQL databases** using Docker Compose.

```powershell
# Navigate to your project
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices"

# Start ONLY the databases (not the services)
docker-compose up -d user-db product-db cart-db order-db wishlist-db
```

**Verify databases are running:**
```powershell
docker ps
```

You should see 5 PostgreSQL containers running on ports:
- `user-db`: Port 5433
- `product-db`: Port 5434
- `cart-db`: Port 5435
- `order-db`: Port 5436
- `wishlist-db`: Port 5437

---

### Step 2: Create Environment Files

Each service needs a `.env` file. Let's create them:

#### **User Service** `.env`
```powershell
cd services\user-service
```

Create `.env` file with:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=user_db
JWT_SECRET=your-secret-key-change-in-production-make-it-long-and-random
FRONTEND_URL=http://localhost:3000
```

#### **Product Service** `.env`
```powershell
cd ..\product-service
```

Create `.env` file with:
```env
PORT=3002
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=product_db
USER_SERVICE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

#### **Cart Service** `.env`
```powershell
cd ..\cart-service
```

Create `.env` file with:
```env
PORT=3003
DB_HOST=localhost
DB_PORT=5435
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=cart_db
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3000
```

#### **Order Service** `.env`
```powershell
cd ..\order-service
```

Create `.env` file with:
```env
PORT=3004
DB_HOST=localhost
DB_PORT=5436
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=order_db
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
CART_SERVICE_URL=http://localhost:3003
FRONTEND_URL=http://localhost:3000
```

#### **Wishlist Service** `.env`
```powershell
cd ..\wishlist-service
```

Create `.env` file with:
```env
PORT=3005
DB_HOST=localhost
DB_PORT=5437
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=wishlist_db
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3000
```

#### **API Gateway** `.env`
```powershell
cd ..\api-gateway
```

Create `.env` file with:
```env
PORT=3000
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
CART_SERVICE_URL=http://localhost:3003
ORDER_SERVICE_URL=http://localhost:3004
WISHLIST_SERVICE_URL=http://localhost:3005
FRONTEND_URL=http://localhost:3000
```

---

### Step 3: Install Dependencies

Install npm packages for each service (one-time setup):

```powershell
# User Service
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices\services\user-service"
npm install

# Product Service
cd ..\product-service
npm install

# Cart Service
cd ..\cart-service
npm install

# Order Service
cd ..\order-service
npm install

# Wishlist Service
cd ..\wishlist-service
npm install

# API Gateway
cd ..\api-gateway
npm install

# Frontend (optional, if you want to run it)
cd ..\..\frontend
npm install
```

---

### Step 4: Start Services in Order

Open **6 separate PowerShell terminals** and start services in this order:

#### Terminal 1: User Service (Start FIRST - others depend on it)
```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices\services\user-service"
npm run start:dev
```
**Wait until you see:** `Application is running on: http://localhost:3001`

#### Terminal 2: Product Service
```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices\services\product-service"
npm run start:dev
```
**Wait until you see:** `Application is running on: http://localhost:3002`

#### Terminal 3: Cart Service
```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices\services\cart-service"
npm run start:dev
```
**Wait until you see:** `Application is running on: http://localhost:3003`

#### Terminal 4: Order Service
```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices\services\order-service"
npm run start:dev
```
**Wait until you see:** `Application is running on: http://localhost:3004`

#### Terminal 5: Wishlist Service
```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices\services\wishlist-service"
npm run start:dev
```
**Wait until you see:** `Application is running on: http://localhost:3005`

#### Terminal 6: API Gateway (Start LAST)
```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices\services\api-gateway"
npm run start:dev
```
**Wait until you see:** `Application is running on: http://localhost:3000`

---

### Step 5: Test the Setup

#### Check Database Connections
Each service should automatically create its tables when it starts (TypeORM synchronize).

#### Test API Gateway
```powershell
# Check if API Gateway is responding
curl http://localhost:3000/api/health
```

#### Check Individual Services
```powershell
curl http://localhost:3001  # User Service
curl http://localhost:3002  # Product Service
curl http://localhost:3003  # Cart Service
curl http://localhost:3004  # Order Service
curl http://localhost:3005  # Wishlist Service
```

---

## 🎯 Quick Start with One Script (Optional)

I can create a PowerShell script to start all services at once. Let me know if you want this.

---

## 🔍 Troubleshooting

### Problem: Database connection failed
**Solution:**
```powershell
# Check if databases are running
docker ps

# If not running, start them
docker-compose up -d user-db product-db cart-db order-db wishlist-db

# Check logs
docker logs user-db
```

### Problem: Port already in use
**Solution:**
```powershell
# Find process using the port (e.g., 3001)
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID> /F
```

### Problem: Module not found error
**Solution:**
```powershell
# Navigate to the service directory
cd services\user-service

# Delete node_modules
Remove-Item -Recurse -Force node_modules

# Reinstall
npm install
```

### Problem: TypeORM sync errors
**Check your entity files** - Make sure they have proper decorators
```typescript
@Entity('users')
export class User {
  // ...
}
```

---

## 📊 Database Access (Optional)

If you want to view your databases using a GUI:

### Option 1: pgAdmin
1. Install pgAdmin 4
2. Connect to each database:
   - Host: `localhost`
   - Port: `5433` (for user-db), `5434`, `5435`, etc.
   - Username: `postgres`
   - Password: `postgres`

### Option 2: DBeaver
1. Install DBeaver
2. Create connections for each database with the same credentials

---

## 🛑 Stopping Everything

### Stop Services
Press `Ctrl+C` in each terminal window

### Stop Databases
```powershell
docker-compose down
```

### Stop and Remove Volumes (CAUTION - Deletes all data)
```powershell
docker-compose down -v
```

---

## 📝 Summary of Procedure

1. ✅ **Start databases FIRST** using Docker Compose
2. ✅ **Create `.env` files** for each service with `localhost` database connections
3. ✅ **Install dependencies** for each service (`npm install`)
4. ✅ **Start services in order** (User → Product → Cart → Order → Wishlist → Gateway)
5. ✅ **Verify each service** is running before starting the next
6. ✅ **Test the API Gateway** to ensure all services are connected

---

## 🎯 Why This Approach Works

- ✅ **No Docker build failures** - We're not building Docker images for services
- ✅ **Fast hot reload** - Changes reflect immediately
- ✅ **Easy debugging** - You can see logs clearly in each terminal
- ✅ **Database isolation** - Each service has its own PostgreSQL database
- ✅ **Production-like** - Services talk to each other via HTTP
- ✅ **No complex networking** - Everything runs on localhost

---

## 🚀 Next Steps

Once everything is running:
1. Test user registration: `POST http://localhost:3000/api/auth/register`
2. Test login: `POST http://localhost:3000/api/auth/login`
3. Test products: `GET http://localhost:3000/api/products`

See `API_TESTING.md` for complete API documentation.

---

**Good luck with your FYP! 🎓**
