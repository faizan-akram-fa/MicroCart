# E-Commerce Microservices API Collection

## Variables
- `BASE_URL`: http://localhost:3000/api
- `TOKEN`: (Set after login)
- `SELLER_TOKEN`: (Set after seller login)

## 1. Authentication

### 1.1 Register Buyer
```http
POST {{BASE_URL}}/auth/register
Content-Type: application/json

{
  "email": "buyer@test.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "buyer",
  "phone": "+1234567890"
}
```

### 1.2 Register Seller
```http
POST {{BASE_URL}}/auth/register
Content-Type: application/json

{
  "email": "seller@test.com",
  "password": "Password123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "seller",
  "phone": "+1234567891"
}
```

### 1.3 Login Buyer
```http
POST {{BASE_URL}}/auth/login
Content-Type: application/json

{
  "email": "buyer@test.com",
  "password": "Password123!"
}
```
**Save the `access_token` from response as `{{TOKEN}}`**

### 1.4 Login Seller
```http
POST {{BASE_URL}}/auth/login
Content-Type: application/json

{
  "email": "seller@test.com",
  "password": "Password123!"
}
```
**Save the `access_token` from response as `{{SELLER_TOKEN}}`**

### 1.5 Get Profile
```http
GET {{BASE_URL}}/users/profile
Authorization: Bearer {{TOKEN}}
```

### 1.6 Update Profile
```http
PUT {{BASE_URL}}/users/profile
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

{
  "firstName": "Johnny",
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA"
}
```

## 2. Products

### 2.1 Create Product (Seller)
```http
POST {{BASE_URL}}/products
Authorization: Bearer {{SELLER_TOKEN}}
Content-Type: application/json

{
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop with RTX 4080",
  "price": 1999.99,
  "category": "Electronics",
  "stock": 50,
  "images": ["laptop1.jpg", "laptop2.jpg"],
  "brand": "TechBrand"
}
```

### 2.2 Get All Products
```http
GET {{BASE_URL}}/products
```

### 2.3 Search Products
```http
GET {{BASE_URL}}/products?search=laptop&category=Electronics&minPrice=1000&maxPrice=3000&sortBy=price&sortOrder=ASC
```

### 2.4 Get Product by ID
```http
GET {{BASE_URL}}/products/{productId}
```

### 2.5 Update Product (Seller)
```http
PUT {{BASE_URL}}/products/{productId}
Authorization: Bearer {{SELLER_TOKEN}}
Content-Type: application/json

{
  "price": 1899.99,
  "stock": 45
}
```

### 2.6 Delete Product (Seller)
```http
DELETE {{BASE_URL}}/products/{productId}
Authorization: Bearer {{SELLER_TOKEN}}
```

### 2.7 Get Seller's Products
```http
GET {{BASE_URL}}/products/seller
Authorization: Bearer {{SELLER_TOKEN}}
```

## 3. Cart

### 3.1 Get Cart
```http
GET {{BASE_URL}}/cart
Authorization: Bearer {{TOKEN}}
```

### 3.2 Add to Cart
```http
POST {{BASE_URL}}/cart/add
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

{
  "productId": "{productId}",
  "quantity": 2
}
```

### 3.3 Update Cart Item
```http
PUT {{BASE_URL}}/cart/update
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

{
  "productId": "{productId}",
  "quantity": 3
}
```

### 3.4 Remove from Cart
```http
DELETE {{BASE_URL}}/cart/remove/{productId}
Authorization: Bearer {{TOKEN}}
```

### 3.5 Get Cart Total
```http
GET {{BASE_URL}}/cart/total
Authorization: Bearer {{TOKEN}}
```

### 3.6 Clear Cart
```http
DELETE {{BASE_URL}}/cart/clear
Authorization: Bearer {{TOKEN}}
```

## 4. Orders

### 4.1 Create Order
```http
POST {{BASE_URL}}/orders
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

{
  "items": [
    {
      "productId": "{productId}",
      "productName": "Gaming Laptop",
      "quantity": 1,
      "price": 1999.99
    }
  ],
  "totalAmount": 1999.99,
  "shippingAddress": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "phone": "+1234567890"
}
```

### 4.2 Get User Orders
```http
GET {{BASE_URL}}/orders
Authorization: Bearer {{TOKEN}}
```

### 4.3 Get Order by ID
```http
GET {{BASE_URL}}/orders/{orderId}
Authorization: Bearer {{TOKEN}}
```

### 4.4 Get Seller Orders
```http
GET {{BASE_URL}}/orders/seller
Authorization: Bearer {{SELLER_TOKEN}}
```

### 4.5 Update Order Status (Seller)
```http
PUT {{BASE_URL}}/orders/{orderId}/status
Authorization: Bearer {{SELLER_TOKEN}}
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Order Statuses:**
- pending
- confirmed
- processing
- shipped
- delivered
- cancelled

## 5. Wishlist

### 5.1 Get Wishlist
```http
GET {{BASE_URL}}/wishlist
Authorization: Bearer {{TOKEN}}
```

### 5.2 Add to Wishlist
```http
POST {{BASE_URL}}/wishlist/add
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

{
  "productId": "{productId}"
}
```

### 5.3 Remove from Wishlist
```http
DELETE {{BASE_URL}}/wishlist/remove/{productId}
Authorization: Bearer {{TOKEN}}
```

## Test Flow

1. **Setup Phase**
   - Register a buyer account
   - Register a seller account
   - Login as seller (save SELLER_TOKEN)
   - Login as buyer (save TOKEN)

2. **Seller Actions**
   - Create 3-5 products with SELLER_TOKEN
   - Note down product IDs

3. **Buyer Actions**
   - Browse products (no auth needed)
   - Search and filter products
   - Add products to cart
   - Add products to wishlist
   - View cart total
   - Create order
   - View order history

4. **Seller Actions**
   - View seller orders
   - Update order status to "confirmed"
   - Update order status to "shipped"

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

## Notes

- All authenticated requests require `Authorization: Bearer {token}` header
- Replace `{productId}` and `{orderId}` with actual UUIDs from responses
- Seller-only endpoints will return 403 if called with buyer token
- Cart and wishlist are user-specific
- Products have soft delete (isActive flag)
