# E-Commerce Microservices Platform 🛍️

A complete, production-ready e-commerce platform built with NestJS microservices, PostgreSQL databases, Next.js frontend, Prometheus + Grafana + Loki monitoring stack, and automated GitHub Actions CI/CD pipeline.

> 📖 **Key Documentation**:
> - 📊 **[MONITORING.md](file://./MONITORING.md)**: Full Prometheus, Grafana & Loki observability stack setup guide.
> - 🚀 **[CICD.md](file://./CICD.md)**: Complete GitHub Actions CI/CD automated build, test & Docker push pipeline setup guide.

## 🏗️ Architecture

This project implements a microservices architecture with the following services:

### Microservices
1. **User Service** (Port 3001) - Authentication, Authorization, Profile Management
2. **Product Service** (Port 3002) - Product CRUD, Search & Filtering
3. **Cart Service** (Port 3003) - Shopping Cart Management
4. **Order Service** (Port 3004) - Order Processing & Management
5. **Wishlist Service** (Port 3005) - Favorite Products
6. **API Gateway** (Port 3000) - Single entry point, routing, rate limiting

### Frontend
- **Next.js Application** (Port 3000 in dev mode) - Modern, responsive UI with TypeScript and Tailwind CSS

### Databases
Each microservice has its own PostgreSQL database:
- `user_db` - User data
- `product_db` - Product catalog
- `cart_db` - Shopping carts
- `order_db` - Orders
- `wishlist_db` - Wishlists

## 🚀 Features

### For Buyers
- ✅ User Registration & Login (Email/Password + OAuth Google)
- ✅ Browse Products with Search & Filters
- ✅ Product Details View
- ✅ Add to Cart / Wishlist
- ✅ Checkout (Cash on Delivery)
- ✅ Order Tracking
- ✅ Profile Management

### For Sellers
- ✅ Seller Registration
- ✅ Add/Edit/Delete Products
- ✅ Manage Product Inventory
- ✅ View Orders
- ✅ Update Order Status

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)
- npm or yarn

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ecommerce-microservices
```

### 2. Install Dependencies for All Services

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

# Frontend
cd ../../frontend
npm install
```

### 3. Configure Environment Variables

Each service has a `.env` file. Update the following if needed:

**User Service (.env)**
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=change-this-to-a-strong-secret
```

### 4. Start with Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 5. OR Start Services Manually

**Terminal 1 - User Service**
```bash
cd services/user-service
npm run start:dev
```

**Terminal 2 - Product Service**
```bash
cd services/product-service
npm run start:dev
```

**Terminal 3 - Cart Service**
```bash
cd services/cart-service
npm run start:dev
```

**Terminal 4 - Order Service**
```bash
cd services/order-service
npm run start:dev
```

**Terminal 5 - Wishlist Service**
```bash
cd services/wishlist-service
npm run start:dev
```

**Terminal 6 - API Gateway**
```bash
cd services/api-gateway
npm run start:dev
```

**Terminal 7 - Frontend**
```bash
cd frontend
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3000/api
- **User Service**: http://localhost:3001
- **Product Service**: http://localhost:3002
- **Cart Service**: http://localhost:3003
- **Order Service**: http://localhost:3004
- **Wishlist Service**: http://localhost:3005

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Google OAuth login

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (Seller only)
- `PUT /api/products/:id` - Update product (Seller only)
- `DELETE /api/products/:id` - Delete product (Seller only)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item quantity
- `DELETE /api/cart/remove/:productId` - Remove item from cart

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (Seller only)

### Wishlist
- `GET /api/wishlist` - Get user wishlist
- `POST /api/wishlist/add` - Add product to wishlist
- `DELETE /api/wishlist/remove/:productId` - Remove from wishlist

## 🗄️ Database Schema

### Users Table
```sql
id: UUID (PK)
email: String (Unique)
password: String (Hashed)
firstName: String
lastName: String
role: Enum (buyer, seller)
phone: String
address: Text
googleId: String
createdAt: Timestamp
updatedAt: Timestamp
```

### Products Table
```sql
id: UUID (PK)
name: String
description: Text
price: Decimal
category: String
stock: Integer
images: Array
sellerId: UUID (FK)
brand: String
rating: Float
reviewCount: Integer
isActive: Boolean
createdAt: Timestamp
updatedAt: Timestamp
```

### Orders Table
```sql
id: UUID (PK)
userId: UUID (FK)
items: JSONB
totalAmount: Decimal
status: Enum (pending, confirmed, processing, shipped, delivered, cancelled)
shippingAddress: Text
paymentMethod: String
createdAt: Timestamp
updatedAt: Timestamp
```

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- CORS enabled
- Input validation
- SQL injection prevention (TypeORM)

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Project Structure

```
ecommerce-microservices/
├── services/
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   ├── dto/
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   ├── guards/
│   │   │   └── strategies/
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── product-service/
│   ├── cart-service/
│   ├── order-service/
│   ├── wishlist-service/
│   └── api-gateway/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps

# Restart databases
docker-compose restart user-db product-db
```

### TypeORM Sync Issues
Set `synchronize: false` in production and use migrations instead.

## 🚢 Deployment

### Docker Hub
```bash
# Build and push images
docker-compose build
docker tag user-service username/user-service:latest
docker push username/user-service:latest
```

### Kubernetes
Helm charts and K8s manifests available in `/k8s` directory.

## 📝 Environment Variables

### Required for Production
- `JWT_SECRET` - Strong random string
- `DATABASE_URL` - Production database connection
- `GOOGLE_CLIENT_ID` - Google OAuth credentials
- `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- `FRONTEND_URL` - Production frontend URL

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name - FYP Project 2024/2025

## 🙏 Acknowledgments

- NestJS Framework
- Next.js Framework
- TypeORM
- PostgreSQL
- Docker

---

**Note**: This is a Final Year Project (FYP) demonstrating microservices architecture implementation for an e-commerce platform.
