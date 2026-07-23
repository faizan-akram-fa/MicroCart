# 🚀 Quick Start - pgAdmin Setup

## You Want to Use Your Local PostgreSQL (pgAdmin) ✅

Perfect! Here's the **3-step process**:

---

## Step 1: Create Databases in pgAdmin (5 minutes)

1. **Open pgAdmin 4**
2. **Connect to PostgreSQL** (enter your password)
3. **Create 5 databases** (Right-click "Databases" → Create):
   - `user_db`
   - `product_db`
   - `cart_db`
   - `order_db`
   - `wishlist_db`

> 📖 **Detailed instructions**: See [`PGADMIN_SETUP_GUIDE.md`](./PGADMIN_SETUP_GUIDE.md) - Step 1

---

## Step 2: Create .env Files (1 minute)

Run this script - it will ask for your PostgreSQL password:

```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices"
.\create-env-files-pgadmin.ps1
```

**What it does:**
- Creates `.env` files for all 6 services
- Configures connection to `localhost:5432`
- Uses your PostgreSQL password
- Sets up service URLs

---

## Step 3: Install & Start Services (10-15 minutes)

### First Time Only: Install Dependencies

```powershell
# User Service
cd services\user-service
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

# Go back to root
cd ..\..
```

### Start All Services (Every Time)

```powershell
# Automated (opens 6 windows)
.\start-all-services-pgadmin.ps1
```

**OR manually** (6 separate PowerShell terminals):
```powershell
# Terminal 1
cd services\user-service && npm run start:dev

# Terminal 2
cd services\product-service && npm run start:dev

# Terminal 3
cd services\cart-service && npm run start:dev

# Terminal 4
cd services\order-service && npm run start:dev

# Terminal 5
cd services\wishlist-service && npm run start:dev

# Terminal 6
cd services\api-gateway && npm run start:dev
```

---

## ✅ Verify Setup

### 1. Check Services Are Running
Open browser to:
- http://localhost:3000 (API Gateway)
- http://localhost:3001 (User Service)
- http://localhost:3002 (Product Service)

### 2. Check Tables Were Created
1. Open pgAdmin
2. Expand: **Databases → user_db → Schemas → public → Tables**
3. You should see: **`user`** table
4. Repeat for other databases

### 3. Test Registration
```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@test.com\",\"password\":\"pass123\",\"firstName\":\"Test\",\"lastName\":\"User\",\"role\":\"buyer\"}'
```

---

## 📊 What You Have

| Component | Location | Port |
|-----------|----------|------|
| PostgreSQL | Your PC (pgAdmin) | 5432 |
| User Service | localhost | 3001 |
| Product Service | localhost | 3002 |
| Cart Service | localhost | 3003 |
| Order Service | localhost | 3004 |
| Wishlist Service | localhost | 3005 |
| API Gateway | localhost | 3000 |

**Databases:**
- `user_db` - User data
- `product_db` - Product catalog
- `cart_db` - Shopping carts
- `order_db` - Orders
- `wishlist_db` - Wishlists

**Tables:** Auto-created by TypeORM when services start!

---

## 🛑 Stop Everything

Press `Ctrl+C` in each PowerShell window

PostgreSQL keeps running in the background (that's OK)

---

## 🔧 Common Issues

### PostgreSQL Not Running
```powershell
# Open Services
Win + R → services.msc

# Find "postgresql-x64-15"
# Right-click → Start
```

### Wrong Password
Edit `.env` files in each service folder:
```env
DB_PASSWORD=your_actual_password
```

### Tables Not Created
1. Check service logs for errors
2. Verify database exists in pgAdmin
3. Restart the service

### Port Conflicts
```powershell
# Find what's using a port
netstat -ano | findstr :3001

# Kill it
taskkill /PID <PID> /F
```

---

## 📚 Documentation

- **This Guide**: Quick reference
- **[PGADMIN_SETUP_GUIDE.md](./PGADMIN_SETUP_GUIDE.md)**: Complete detailed guide
- **[API_TESTING.md](./API_TESTING.md)**: API endpoints reference

---

## 🎯 Summary

**What you do:**
1. ✅ Create 5 databases in pgAdmin
2. ✅ Run `create-env-files-pgadmin.ps1` (enter password)
3. ✅ Run `npm install` for each service (first time only)
4. ✅ Run `start-all-services-pgadmin.ps1`

**What happens automatically:**
- ✅ Services connect to your local PostgreSQL
- ✅ Tables are created by TypeORM
- ✅ Everything runs on your PC (no Docker needed!)

---

**You're ready to go! 🚀**

See [`PGADMIN_SETUP_GUIDE.md`](./PGADMIN_SETUP_GUIDE.md) for more details.
