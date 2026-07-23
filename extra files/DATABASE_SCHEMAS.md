# 🗄️ Database Schemas

Here are the exact schemas for each of your 5 microservices, based on the TypeORM entities I found in your code.

---

## 1. User Service (`user_db`)
**Table Name:** `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique User ID |
| `email` | Varchar | Unique | User email address |
| `password` | Varchar | Not Null | Hashed password |
| `firstName` | Varchar | Not Null | First Name |
| `lastName` | Varchar | Not Null | Last Name |
| `role` | Enum | Default: 'buyer' | 'buyer' or 'seller' |
| `phone` | Varchar | Nullable | Phone number |
| `address` | Varchar | Nullable | Street address |
| `city` | Varchar | Nullable | City |
| `state` | Varchar | Nullable | State/Province |
| `zipCode` | Varchar | Nullable | Postal code |
| `country` | Varchar | Nullable | Country |
| `profileImage` | Varchar | Nullable | URL to profile image |
| `googleId` | Varchar | Nullable | Google OAuth ID |
| `facebookId` | Varchar | Nullable | Facebook OAuth ID |
| `isActive` | Boolean | Default: true | Account status |
| `createdAt` | Timestamp | Auto | Creation time |
| `updatedAt` | Timestamp | Auto | Last update time |

---

## 2. Product Service (`product_db`)
**Table Name:** `products`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique Product ID |
| `name` | Varchar | Not Null | Product name |
| `description` | Text | Not Null | Detailed description |
| `price` | Decimal | Precision 10,2 | Product price |
| `category` | Varchar | Not Null | Product category |
| `stock` | Integer | Not Null | Stock quantity |
| `images` | Array | Nullable | List of image URLs |
| `sellerId` | Varchar | Not Null | ID of the seller (User ID) |
| `brand` | Varchar | Nullable | Brand name |
| `rating` | Integer | Default: 0 | Average rating |
| `reviewCount` | Integer | Default: 0 | Number of reviews |
| `isActive` | Boolean | Default: true | Soft delete/Visibility |
| `createdAt` | Timestamp | Auto | Creation time |
| `updatedAt` | Timestamp | Auto | Last update time |

---

## 3. Cart Service (`cart_db`)
**Table Name:** `carts`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique Cart ID |
| `userId` | Varchar | Not Null | User ID who owns the cart |
| `items` | JSONB | Default: [] | Array of items (see structure below) |
| `createdAt` | Timestamp | Auto | Creation time |
| `updatedAt` | Timestamp | Auto | Last update time |

**`items` JSON Structure:**
```json
[
  {
    "productId": "string",
    "quantity": number,
    "price": number,
    "name": "string",
    "image": "string (optional)"
  }
]
```

---

## 4. Order Service (`order_db`)
**Table Name:** `orders`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique Order ID |
| `userId` | Varchar | Not Null | User ID who placed order |
| `items` | JSONB | Not Null | Array of ordered items |
| `totalAmount` | Decimal | Precision 10,2 | Total cost |
| `status` | Enum | Default: 'pending' | pending, confirmed, processing, shipped, delivered, cancelled |
| `shippingAddress`| Varchar | Not Null | Delivery address |
| `city` | Varchar | Not Null | City |
| `state` | Varchar | Not Null | State |
| `zipCode` | Varchar | Not Null | Zip Code |
| `phone` | Varchar | Nullable | Contact number |
| `paymentMethod` | Varchar | Default: 'cash_on_delivery' | Payment method |
| `sellerId` | Varchar | Nullable | Seller ID (for single-seller orders) |
| `createdAt` | Timestamp | Auto | Creation time |
| `updatedAt` | Timestamp | Auto | Last update time |

**`items` JSON Structure:**
Same as Cart items.

---

## 5. Wishlist Service (`wishlist_db`)
**Table Name:** `wishlists`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, Generated | Unique Wishlist Entry ID |
| `userId` | Varchar | Not Null | User ID |
| `productId` | Varchar | Not Null | Product ID |
| `createdAt` | Timestamp | Auto | Date added to wishlist |

---
