# 🧪 MicroCart Testing Guide

Now that your application is running, follow these steps to verify everything is working correctly.

## ✅ Prerequisites
1. Ensure all services are running (6 PowerShell windows).
2. Ensure you ran `.\create-env-files-pgadmin.ps1` to fix database connections.
3. Ensure you updated the port conflict with `.\fix-ports.ps1`.

---

## 🛍️ Test 1: Buyer Flow

### 1. Register a Buyer Account
1. Go to **[http://localhost:3000/auth/signup](http://localhost:3000/auth/signup)**
2. Fill in the details:
   - **First Name**: John
   - **Last Name**: Doe
   - **Email**: john@example.com
   - **Password**: password123
   - **Role**: Buyer
3. Click "Sign Up". You should be redirected to the login page.

### 2. Login
1. Enter `john@example.com` and `password123`.
2. Click "Login". You should see the Home Page with products.

### 3. Add to Cart (Empty initially)
1. You won't see products yet because we haven't created any!
2. Log out for now.

---

## 🏪 Test 2: Seller Flow

### 1. Register a Seller Account
1. Go to **[http://localhost:3000/auth/signup](http://localhost:3000/auth/signup)**
2. Fill in:
   - **First Name**: Jane
   - **Last Name**: Smith
   - **Email**: jane@store.com
   - **Password**: password123
   - **Role**: Seller
3. Click "Sign Up".

### 2. Access Seller Dashboard
1. Login as `jane@store.com`.
2. You should see a "Seller Dashboard" link or be redirected there.
3. Click "Create Product".

### 3. Create a Product
1. **Name**: Gaming Laptop
2. **Price**: 1200
3. **Category**: Electronics
4. **Stock**: 10
5. Click "Create".

---

## 🛒 Test 3: Complete Purchase

1. Login as **John (Buyer)** again.
2. You should now see the "Gaming Laptop" on the home page.
3. Click "Add to Cart".
4. Go to Cart icon (top right).
5. Proceed to Checkout.
6. Enter shipping details and click "Place Order".
7. Success! 🎉

---

## 🐛 Troubleshooting

- **"Connection Refused"**: Using wrong port? Check `.env` files.
- **"404 Not Found"**: API Gateway might be down or on wrong port.
- **"Database Error"**: Did you create the databases in pgAdmin? (`user_db`, `product_db`, etc.)
