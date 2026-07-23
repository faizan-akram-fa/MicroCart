# 🗄️ Local PostgreSQL Setup with pgAdmin

## Prerequisites
- ✅ PostgreSQL installed on your PC (download from https://www.postgresql.org/download/ if not installed)
- ✅ pgAdmin 4 installed (comes with PostgreSQL installation)
- ✅ Node.js 18+ installed

---

## 📋 Step-by-Step Setup

### Step 1: Create Databases in pgAdmin

1. **Open pgAdmin 4**
   - Launch pgAdmin from Start menu
   - Enter your master password when prompted

2. **Connect to PostgreSQL Server**
   - In the left panel, expand "Servers"
   - Click on "PostgreSQL 15" (or your version)
   - Enter your PostgreSQL password (the one you set during PostgreSQL installation)

3. **Create the 5 Databases**

   Right-click on "Databases" → "Create" → "Database..."

   Create these databases **one by one**:

   | Database Name | Owner | Encoding | Collation |
   |---------------|-------|----------|-----------|
   | `user_db` | postgres | UTF8 | Default |
   | `product_db` | postgres | UTF8 | Default |
   | `cart_db` | postgres | UTF8 | Default |
   | `order_db` | postgres | UTF8 | Default |
   | `wishlist_db` | postgres | UTF8 | Default |

   **For each database:**
   - Database name: (use names from table above)
   - Owner: `postgres`
   - Click "Save"

4. **Verify Databases Created**
   - Expand "Databases" in pgAdmin
   - You should see all 5 databases listed

---

### Step 2: Note Your PostgreSQL Connection Details

You'll need these details:
- **Host**: `localhost`
- **Port**: `5432` (default PostgreSQL port)
- **Username**: `postgres` (or the username you created)
- **Password**: Your PostgreSQL password

---

### Step 3: Create .env Files for Your Services

Now we need to configure each microservice to connect to your local databases.

#### Option A: Manual Creation

Create a `.env` file in each service directory with the following content:

##### **services/user-service/.env**
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_NAME=user_db
JWT_SECRET=your-secret-key-change-in-production-make-it-long-and-random
FRONTEND_URL=http://localhost:3000
```

##### **services/product-service/.env**
```env
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_NAME=product_db
USER_SERVICE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

##### **services/cart-service/.env**
```env
PORT=3003
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_NAME=cart_db
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3000
```

##### **services/order-service/.env**
```env
PORT=3004
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_NAME=order_db
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
CART_SERVICE_URL=http://localhost:3003
FRONTEND_URL=http://localhost:3000
```

##### **services/wishlist-service/.env**
```env
PORT=3005
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_NAME=wishlist_db
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
FRONTEND_URL=http://localhost:3000
```

##### **services/api-gateway/.env**
```env
PORT=3000
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
CART_SERVICE_URL=http://localhost:3003
ORDER_SERVICE_URL=http://localhost:3004
WISHLIST_SERVICE_URL=http://localhost:3005
FRONTEND_URL=http://localhost:3000
```

> **IMPORTANT**: Replace `YOUR_POSTGRES_PASSWORD_HERE` with your actual PostgreSQL password!

#### Option B: Use Automated Script

I'll create a script for you that prompts for your password. See `create-env-files-pgadmin.ps1` below.

---

### Step 4: Install Dependencies

Open PowerShell and run:

```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices"

# Install for each service
cd services\user-service
npm install

cd ..\product-service
npm install

cd ..\cart-service
npm install

cd ..\order-service
npm install

cd ..\wishlist-service
npm install

cd ..\api-gateway
npm install
```

---

### Step 5: Start Your Microservices

**IMPORTANT**: Start services in this order (each in a separate PowerShell window):

#### Terminal 1: User Service (START FIRST)
```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices\services\user-service"
npm run start:dev
```
**Wait for**: `Application is running on: http://localhost:3001`

#### Terminal 2: Product Service
```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices\services\product-service"
npm run start:dev
```
**Wait for**: `Application is running on: http://localhost:3002`

#### Terminal 3: Cart Service
```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices\services\cart-service"
npm run start:dev
```
**Wait for**: `Application is running on: http://localhost:3003`

#### Terminal 4: Order Service
```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices\services\order-service"
npm run start:dev
```
**Wait for**: `Application is running on: http://localhost:3004`

#### Terminal 5: Wishlist Service
```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices\services\wishlist-service"
npm run start:dev
```
**Wait for**: `Application is running on: http://localhost:3005`

#### Terminal 6: API Gateway (START LAST)
```powershell
cd "c:\Users\Mughal Faizan\Downloads\ecommerce-microservices\services\api-gateway"
npm run start:dev
```
**Wait for**: `Application is running on: http://localhost:3000`

---

### Step 6: Verify Database Tables Were Created

1. **Go back to pgAdmin**
2. **For each database**, expand:
   - Databases → `user_db` → Schemas → public → Tables
   
3. **You should see tables created automatically** by TypeORM:
   - In `user_db`: `user` table
   - In `product_db`: `product` table
   - In `cart_db`: `cart`, `cart_item` tables
   - In `order_db`: `order`, `order_item` tables
   - In `wishlist_db`: `wishlist`, `wishlist_item` tables

4. **If tables don't appear**, right-click on "Tables" and click "Refresh"

---

## 🎯 Testing Your Setup

### Test 1: Check Services Are Running
```powershell
# Open a new PowerShell window
curl http://localhost:3001  # User Service
curl http://localhost:3002  # Product Service
curl http://localhost:3000  # API Gateway
```

### Test 2: Register a Test User
```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"test@example.com\",
    \"password\": \"password123\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"role\": \"buyer\"
  }'
```

### Test 3: Check Database Entry
1. Go to pgAdmin
2. Open `user_db` → Schemas → public → Tables → `user`
3. Right-click → "View/Edit Data" → "All Rows"
4. You should see your test user!

---

## 🔧 Troubleshooting

### Issue: "Connection refused" or "ECONNREFUSED"
**Cause**: PostgreSQL service is not running

**Solution**:
1. Open Services (Win + R, type `services.msc`)
2. Find "postgresql-x64-15" (or your version)
3. Right-click → Start
4. Set "Startup type" to "Automatic"

### Issue: "password authentication failed for user postgres"
**Cause**: Wrong password in .env file

**Solution**:
1. Open each `.env` file
2. Update `DB_PASSWORD=` with your correct PostgreSQL password
3. Restart the affected service

### Issue: "database does not exist"
**Cause**: Database not created in pgAdmin

**Solution**:
1. Go back to Step 1
2. Create the missing database
3. Restart the service

### Issue: Tables not created automatically
**Cause**: TypeORM synchronize might be off or connection failed

**Solution**:
1. Check service logs for database connection errors
2. Verify database credentials in `.env`
3. Check that `synchronize: true` in the service's `app.module.ts`

### Issue: Port 5432 already in use
**Cause**: Another PostgreSQL instance is running

**Solution**:
```powershell
# Find what's using port 5432
netstat -ano | findstr :5432

# Check your PostgreSQL port in pgAdmin
# Update DB_PORT in .env files if it's different
```

---

## 📊 At a Glance: What You Have

| Component | Status | Connection |
|-----------|--------|------------|
| PostgreSQL Server | ✅ Running locally | localhost:5432 |
| 5 Databases | ✅ Created in pgAdmin | user_db, product_db, cart_db, order_db, wishlist_db |
| 6 Microservices | 🚀 Running with Node.js | Ports 3000-3005 |
| Tables | ✅ Auto-created by TypeORM | Check in pgAdmin |

---

## 🎓 Summary

**What you did:**
1. ✅ Created 5 databases in pgAdmin
2. ✅ Configured services to connect to local PostgreSQL
3. ✅ Installed dependencies
4. ✅ Started services in correct order
5. ✅ TypeORM automatically created tables

**What's running:**
- ✅ PostgreSQL (with 5 databases)
- ✅ 6 Microservices (ports 3000-3005)
- ✅ All tables auto-created by TypeORM

**No Docker needed!** Everything runs natively on your PC.

---

## 📝 Quick Reference

### Start Everything
1. Ensure PostgreSQL service is running
2. Open 6 PowerShell terminals
3. Run `npm run start:dev` in each service directory (in order)

### Stop Everything
Press `Ctrl+C` in each PowerShell window

### View Logs
Check the PowerShell terminal for each service

### View Database
Use pgAdmin to browse tables and data

---

**You're all set! 🚀**
