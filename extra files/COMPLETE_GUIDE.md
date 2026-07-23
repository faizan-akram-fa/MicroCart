# E-Commerce Microservices - Complete Project Guide

## 🎯 Project Overview

This is a complete e-commerce platform built with **microservices architecture** for your Final Year Project (FYP). The project demonstrates industry-standard practices including:

- **Backend**: NestJS (TypeScript)
- **Frontend**: Next.js (React/TypeScript)  
- **Databases**: PostgreSQL (separate database per service)
- **Containerization**: Docker & Docker Compose
- **Architecture**: Microservices with API Gateway

## 📁 Project Structure

```
ecommerce-microservices/
├── services/
│   ├── user-service/          (Port 3001) - Auth & Users
│   ├── product-service/        (Port 3002) - Products
│   ├── cart-service/           (Port 3003) - Shopping Cart
│   ├── order-service/          (Port 3004) - Orders
│   ├── wishlist-service/       (Port 3005) - Wishlist
│   └── api-gateway/            (Port 3000) - API Gateway
├── frontend/                   (Next.js - to be created)
├── docker-compose.yml
└── README.md
```

## ✅ What's Been Created

### 1. User Service (COMPLETE ✅)
- User registration with email/password
- JWT authentication
- Google OAuth integration
- Profile management
- Role-based access control (Buyer/Seller)
- **Database**: user_db (PostgreSQL)

**Key Files**:
- `src/entities/user.entity.ts` - User database schema
- `src/services/auth.service.ts` - Authentication logic
- `src/strategies/jwt.strategy.ts` - JWT validation
- `src/controllers/auth.controller.ts` - Auth endpoints

### 2. Product Service (COMPLETE ✅)
- Product CRUD operations (Create, Read, Update, Delete)
- Search and filtering
- Category management
- Stock management
- Seller-only product management
- **Database**: product_db (PostgreSQL)

**Key Files**:
- `src/entities/product.entity.ts` - Product schema
- `src/services/product.service.ts` - Product business logic
- `src/controllers/product.controller.ts` - Product endpoints

### 3. Cart Service (COMPLETE ✅)
- Add products to cart
- Update cart quantities
- Remove items from cart
- Calculate cart total
- **Database**: cart_db (PostgreSQL)

**Key Files**:
- `src/entities/cart.entity.ts` - Cart schema with JSONB items
- `src/services/cart.service.ts` - Cart management logic
- `src/controllers/cart.controller.ts` - Cart endpoints

### 4. Order Service (COMPLETE ✅)
- Create orders from cart
- Order history
- Order status tracking
- Seller order management
- Cash on delivery support
- **Database**: order_db (PostgreSQL)

**Key Files**:
- `src/entities/order.entity.ts` - Order schema
- `src/services/order.service.ts` - Order processing
- `src/controllers/order.controller.ts` - Order endpoints

### 5. Wishlist Service (COMPLETE ✅)
- Add products to wishlist
- View wishlist
- Remove from wishlist
- **Database**: wishlist_db (PostgreSQL)

**Key Files**:
- `src/entities/wishlist.entity.ts` - Wishlist schema
- `src/services/wishlist.service.ts` - Wishlist logic
- `src/controllers/wishlist.controller.ts` - Wishlist endpoints

### 6. API Gateway (COMPLETE ✅)
- Single entry point for all services
- Request routing
- Rate limiting
- CORS configuration

**Key Files**:
- `src/gateway.controller.ts` - Route handlers
- `src/proxy.service.ts` - Service proxying logic

## 🚀 Setup & Installation

### Option 1: Using Docker (Recommended)

1. **Install Docker & Docker Compose**
   - Download from: https://www.docker.com/products/docker-desktop

2. **Start All Services**
   ```bash
   cd ecommerce-microservices
   docker-compose up --build
   ```

3. **Access the Application**
   - API Gateway: http://localhost:3000/api
   - User Service: http://localhost:3001
   - Product Service: http://localhost:3002
   - Cart Service: http://localhost:3003
   - Order Service: http://localhost:3004
   - Wishlist Service: http://localhost:3005

4. **Stop All Services**
   ```bash
   docker-compose down
   ```

### Option 2: Manual Setup (For Development)

1. **Install PostgreSQL**
   - Download from: https://www.postgresql.org/download/

2. **Create Databases**
   ```sql
   CREATE DATABASE user_db;
   CREATE DATABASE product_db;
   CREATE DATABASE cart_db;
   CREATE DATABASE order_db;
   CREATE DATABASE wishlist_db;
   ```

3. **Install Dependencies for Each Service**
   ```bash
   # User Service
   cd services/user-service
   npm install
   
   # Product Service
   cd ../product-service
   npm install
   
   # Cart Service
   cd ../cart-service
   npm install
   
   # Order Service
   cd ../order-service
   npm install
   
   # Wishlist Service
   cd ../wishlist-service
   npm install
   
   # API Gateway
   cd ../api-gateway
   npm install
   ```

4. **Start Each Service (Separate Terminal Windows)**
   ```bash
   # Terminal 1 - User Service
   cd services/user-service
   npm run start:dev
   
   # Terminal 2 - Product Service
   cd services/product-service
   npm run start:dev
   
   # Terminal 3 - Cart Service
   cd services/cart-service
   npm run start:dev
   
   # Terminal 4 - Order Service
   cd services/order-service
   npm run start:dev
   
   # Terminal 5 - Wishlist Service
   cd services/wishlist-service
   npm run start:dev
   
   # Terminal 6 - API Gateway
   cd services/api-gateway
   npm run start:dev
   ```

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "buyer@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "buyer",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "buyer@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "buyer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "buyer"
  }
}
```

#### Get Profile
```http
GET /api/users/profile
Authorization: Bearer {token}
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001"
}
```

### Product Endpoints

#### Get All Products (with filters)
```http
GET /api/products?search=laptop&category=electronics&minPrice=500&maxPrice=2000&page=1&limit=20
```

#### Get Product by ID
```http
GET /api/products/{productId}
```

#### Create Product (Seller Only)
```http
POST /api/products
Authorization: Bearer {seller-token}
Content-Type: application/json

{
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop",
  "price": 1299.99,
  "category": "electronics",
  "stock": 50,
  "images": ["image1.jpg", "image2.jpg"],
  "brand": "TechBrand"
}
```

#### Update Product (Seller Only)
```http
PUT /api/products/{productId}
Authorization: Bearer {seller-token}
Content-Type: application/json

{
  "price": 1199.99,
  "stock": 45
}
```

#### Delete Product (Seller Only)
```http
DELETE /api/products/{productId}
Authorization: Bearer {seller-token}
```

#### Get Seller's Products
```http
GET /api/products/seller
Authorization: Bearer {seller-token}
```

### Cart Endpoints

#### Get Cart
```http
GET /api/cart
Authorization: Bearer {token}
```

#### Add to Cart
```http
POST /api/cart/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "product-uuid",
  "quantity": 2
}
```

#### Update Cart Item
```http
PUT /api/cart/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "product-uuid",
  "quantity": 3
}
```

#### Remove from Cart
```http
DELETE /api/cart/remove/{productId}
Authorization: Bearer {token}
```

#### Get Cart Total
```http
GET /api/cart/total
Authorization: Bearer {token}
```

#### Clear Cart
```http
DELETE /api/cart/clear
Authorization: Bearer {token}
```

### Order Endpoints

#### Create Order
```http
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "productId": "uuid",
      "productName": "Gaming Laptop",
      "quantity": 1,
      "price": 1299.99
    }
  ],
  "totalAmount": 1299.99,
  "shippingAddress": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "phone": "+1234567890"
}
```

#### Get User Orders
```http
GET /api/orders
Authorization: Bearer {token}
```

#### Get Order by ID
```http
GET /api/orders/{orderId}
Authorization: Bearer {token}
```

#### Get Seller Orders
```http
GET /api/orders/seller
Authorization: Bearer {seller-token}
```

#### Update Order Status (Seller Only)
```http
PUT /api/orders/{orderId}/status
Authorization: Bearer {seller-token}
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Order Status Values:**
- pending
- confirmed
- processing
- shipped
- delivered
- cancelled

### Wishlist Endpoints

#### Get Wishlist
```http
GET /api/wishlist
Authorization: Bearer {token}
```

#### Add to Wishlist
```http
POST /api/wishlist/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "product-uuid"
}
```

#### Remove from Wishlist
```http
DELETE /api/wishlist/remove/{productId}
Authorization: Bearer {token}
```

## 🎨 Frontend Development (Next.js)

### Create Next.js Frontend

```bash
cd ecommerce-microservices
npx create-next-app@latest frontend
```

Select options:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- App Router: Yes

### Required Pages

1. **Authentication**
   - `/login` - Login page
   - `/register` - Registration page

2. **Buyer Pages**
   - `/` - Home/Product listing
   - `/products/[id]` - Product details
   - `/cart` - Shopping cart
   - `/checkout` - Checkout page
   - `/orders` - Order history
   - `/wishlist` - Wishlist
   - `/profile` - User profile

3. **Seller Pages**
   - `/seller/dashboard` - Seller dashboard
   - `/seller/products` - Manage products
   - `/seller/products/new` - Add product
   - `/seller/products/[id]/edit` - Edit product
   - `/seller/orders` - Manage orders

### API Integration Example

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function getProducts(params?: any) {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/products?${queryString}`);
  return response.json();
}

export async function addToCart(productId: string, quantity: number, token: string) {
  const response = await fetch(`${API_URL}/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, quantity }),
  });
  return response.json();
}
```

## 🔒 Security Best Practices

1. **Never commit sensitive data**
   - Add `.env` files to `.gitignore`
   - Use environment variables for secrets

2. **Change default passwords**
   - Update PostgreSQL passwords
   - Change JWT secret key
   - Update OAuth credentials

3. **Use HTTPS in production**
   - Enable SSL/TLS certificates
   - Use secure cookies

4. **Implement rate limiting**
   - Already configured in API Gateway
   - Adjust limits as needed

## 🧪 Testing the Application

### Using Postman/Thunder Client

1. **Import the API Collection** (create one with all endpoints)

2. **Test Flow:**
   ```
   a. Register a buyer account
   b. Register a seller account
   c. Login as seller → Create products
   d. Login as buyer → Browse products
   e. Add products to cart
   f. Create order
   g. Check order status
   ```

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@test.com","password":"password123","firstName":"John","lastName":"Doe","role":"buyer"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@test.com","password":"password123"}'

# Get Products (use token from login)
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Database Schema Diagrams

### User Database
```
users
├── id (UUID, PK)
├── email (String, Unique)
├── password (String, Hashed)
├── firstName (String)
├── lastName (String)
├── role (Enum: buyer, seller)
├── phone (String)
├── address (String)
├── city (String)
├── state (String)
├── zipCode (String)
├── googleId (String, Nullable)
├── isActive (Boolean)
├── createdAt (Timestamp)
└── updatedAt (Timestamp)
```

### Product Database
```
products
├── id (UUID, PK)
├── name (String)
├── description (Text)
├── price (Decimal)
├── category (String)
├── stock (Integer)
├── images (Array)
├── sellerId (UUID, FK → users.id)
├── brand (String)
├── rating (Float)
├── reviewCount (Integer)
├── isActive (Boolean)
├── createdAt (Timestamp)
└── updatedAt (Timestamp)
```

### Cart Database
```
carts
├── id (UUID, PK)
├── userId (UUID, FK → users.id)
├── items (JSONB: [{productId, quantity, price, name, image}])
├── createdAt (Timestamp)
└── updatedAt (Timestamp)
```

### Order Database
```
orders
├── id (UUID, PK)
├── userId (UUID, FK → users.id)
├── items (JSONB)
├── totalAmount (Decimal)
├── status (Enum: pending, confirmed, processing, shipped, delivered, cancelled)
├── shippingAddress (String)
├── city (String)
├── state (String)
├── zipCode (String)
├── phone (String)
├── paymentMethod (String)
├── sellerId (UUID, FK → users.id)
├── createdAt (Timestamp)
└── updatedAt (Timestamp)
```

### Wishlist Database
```
wishlists
├── id (UUID, PK)
├── userId (UUID, FK → users.id)
├── productId (UUID, FK → products.id)
└── createdAt (Timestamp)
```

## 🎓 FYP Presentation Tips

### Architecture Diagram
```
[Frontend (Next.js)] 
        ↓
[API Gateway :3000]
        ↓
    ┌───┴───┬───────┬──────┬──────────┐
    ↓       ↓       ↓      ↓          ↓
[User    [Product [Cart [Order   [Wishlist
Service] Service] Svc]  Service]  Service]
:3001]   :3002]   :3003] :3004]    :3005]
    ↓       ↓       ↓      ↓          ↓
[user_db][prod_db][cart_db][order_db][wish_db]
```

### Key Points to Highlight

1. **Microservices Architecture**
   - Each service has its own database
   - Services communicate via REST APIs
   - Independent scaling and deployment

2. **Technology Stack**
   - Modern, industry-standard technologies
   - TypeScript for type safety
   - PostgreSQL for data persistence

3. **Security**
   - JWT authentication
   - Role-based access control
   - Password hashing with bcrypt

4. **Scalability**
   - Docker containers
   - Easy horizontal scaling
   - Load balancing ready

5. **Code Quality**
   - Clean architecture
   - Separation of concerns
   - Reusable components

## 📝 Common Issues & Solutions

### Issue: Port Already in Use
**Solution:**
```bash
# Find process using port
lsof -i :3001
# Kill process
kill -9 <PID>
```

### Issue: Database Connection Failed
**Solution:**
- Check if PostgreSQL is running
- Verify database credentials in `.env` files
- Ensure databases are created

### Issue: Service Can't Connect to Another Service
**Solution:**
- Check if all services are running
- Verify service URLs in environment variables
- Check Docker network configuration

### Issue: TypeORM Synchronize Not Working
**Solution:**
- Set `synchronize: true` only in development
- Use migrations in production
- Check database permissions

## 📦 Deployment Checklist

### Before Deployment

- [ ] Update all `.env` files with production values
- [ ] Change JWT secret to strong random string
- [ ] Set `synchronize: false` in TypeORM config
- [ ] Create database migrations
- [ ] Add proper error logging
- [ ] Configure HTTPS/SSL
- [ ] Set up monitoring
- [ ] Configure backup strategy
- [ ] Update CORS settings for production domain
- [ ] Test all API endpoints
- [ ] Perform security audit

### Deployment Platforms

- **Heroku** - Easy deployment, free tier available
- **AWS** - Full control, ECS/EKS for containers
- **Google Cloud** - GKE for Kubernetes
- **DigitalOcean** - Affordable, App Platform
- **Vercel** - Perfect for Next.js frontend

## 🤝 Contributing

This is a Final Year Project. Feel free to:
1. Fork the repository
2. Add new features
3. Fix bugs
4. Improve documentation

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review service logs: `docker-compose logs -f`
3. Verify environment variables
4. Check database connections

## 🎉 Congratulations!

You now have a complete e-commerce microservices platform! This project demonstrates:
- ✅ Microservices architecture
- ✅ RESTful API design
- ✅ Database design and management
- ✅ Authentication and authorization
- ✅ Docker containerization
- ✅ Modern development practices

Perfect for your Final Year Project presentation! 🚀

---

**Project Author**: [Your Name]
**Institution**: [Your University]
**Year**: 2024/2025
**Project Type**: Final Year Project (FYP)
