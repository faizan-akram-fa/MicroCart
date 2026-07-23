# E-Commerce Frontend (Next.js)

Modern, responsive e-commerce frontend built with Next.js 14, TypeScript, and Tailwind CSS.

## ✨ Features

### Buyer Features
- 🔐 User authentication (Login/Register)
- 🛍️ Browse and search products
- 🔍 Advanced filtering (category, price range, search)
- 🛒 Shopping cart management
- ❤️ Wishlist functionality
- ✅ Checkout with cash on delivery
- 📦 Order history and tracking
- 👤 Profile management

### Seller Features
- 📊 Seller dashboard with statistics
- ➕ Add new products
- ✏️ Edit existing products
- 🗑️ Delete products
- 📋 View and manage orders
- 🔄 Update order status

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home/Products listing
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Checkout page
│   │   ├── orders/            # Order history
│   │   ├── wishlist/          # Wishlist page
│   │   ├── profile/           # User profile
│   │   ├── products/[id]/     # Product details
│   │   └── seller/            # Seller pages
│   │       ├── dashboard/     # Seller dashboard
│   │       └── products/      # Manage products
│   ├── components/            # Reusable components
│   │   ├── Header.tsx         # Navigation header
│   │   └── ProductCard.tsx    # Product card component
│   ├── lib/                   # Utilities
│   │   ├── api.ts            # API client & endpoints
│   │   └── store.ts          # Global state (Zustand)
│   └── types/                 # TypeScript types
│       └── index.ts          # Type definitions
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 🔌 API Integration

The frontend connects to the backend API Gateway at `http://localhost:3000/api`

### API Client (`lib/api.ts`)

All API calls are centralized in the API client:

```typescript
import { authAPI, productsAPI, cartAPI, ordersAPI, wishlistAPI } from '@/lib/api';

// Example: Login
const response = await authAPI.login({ email, password });

// Example: Get products
const products = await productsAPI.getAll({ search: 'laptop' });

// Example: Add to cart
await cartAPI.add({ productId: '123', quantity: 1 });
```

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **Custom components** in `globals.css`
- **Responsive design** for all screen sizes

### Custom CSS Classes

```css
.btn             /* Base button */
.btn-primary     /* Primary button */
.btn-secondary   /* Secondary button */
.btn-outline     /* Outlined button */
.input           /* Input field */
.card            /* Card container */
```

## 🔐 Authentication

Authentication is managed with Zustand store (`lib/store.ts`):

```typescript
import { useAuthStore } from '@/lib/store';

const { user, isAuthenticated, login, logout } = useAuthStore();

// Login
login(user, token);

// Logout
logout();

// Check auth status
if (isAuthenticated) {
  // User is logged in
}
```

## 🛣️ Routes

### Public Routes
- `/` - Home (Product listing)
- `/login` - Login page
- `/register` - Registration page
- `/products/[id]` - Product details

### Protected Routes (Buyer)
- `/cart` - Shopping cart
- `/checkout` - Checkout
- `/orders` - Order history
- `/wishlist` - Wishlist
- `/profile` - User profile

### Protected Routes (Seller)
- `/seller/dashboard` - Seller dashboard
- `/seller/products` - Manage products
- `/orders` - Customer orders

## 📱 Components

### Header Component
Navigation bar with role-based menu items

### ProductCard Component
Reusable product card with:
- Product image
- Name and description
- Price and stock
- Add to cart button
- Add to wishlist button

## 🔔 Notifications

Toast notifications using `react-hot-toast`:

```typescript
import toast from 'react-hot-toast';

// Success
toast.success('Product added to cart!');

// Error
toast.error('Failed to load products');

// Loading
toast.loading('Processing...');
```

## 🌐 Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 📦 Dependencies

### Core
- `next` - React framework
- `react` & `react-dom` - React library
- `typescript` - Type safety

### State Management
- `zustand` - Lightweight state management

### API & Data
- `axios` - HTTP client

### UI & Icons
- `lucide-react` - Icon library
- `react-hot-toast` - Toast notifications
- `tailwindcss` - CSS framework

## 🎯 Key Features Implementation

### Product Search & Filtering
```typescript
const fetchProducts = async (params = {}) => {
  const response = await productsAPI.getAll({
    search: 'laptop',
    category: 'Electronics',
    minPrice: 500,
    maxPrice: 2000,
  });
};
```

### Shopping Cart
```typescript
// Add to cart
await cartAPI.add({ productId, quantity: 1 });

// Update quantity
await cartAPI.update({ productId, quantity: 3 });

// Remove item
await cartAPI.remove(productId);

// Clear cart
await cartAPI.clear();
```

### Order Management
```typescript
// Create order
await ordersAPI.create({
  items: [...],
  totalAmount: 1299.99,
  shippingAddress: '...',
  city: 'New York',
  // ...
});

// Update status (Seller)
await ordersAPI.updateStatus(orderId, 'confirmed');
```

## 🚧 Development Tips

### Hot Reload
Changes are automatically reflected thanks to Next.js Fast Refresh

### TypeScript
All components are fully typed for better DX and fewer bugs

### API Errors
API errors are automatically handled and displayed as toasts

### Authentication
Token is stored in localStorage and automatically added to API requests

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to change the color scheme:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#0ea5e9',  // Change primary color
        // ...
      },
    },
  },
}
```

### Fonts
Change font in `layout.tsx`:

```typescript
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
```

## 📝 Todo / Future Enhancements

- [ ] Product reviews and ratings
- [ ] Advanced search with filters
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Social media login
- [ ] Dark mode support
- [ ] PWA support
- [ ] Image upload for products
- [ ] Real-time order updates
- [ ] Multi-language support

## 🐛 Troubleshooting

### API Connection Issues
- Ensure backend services are running
- Check API_URL in `.env.local`
- Verify CORS is enabled on backend

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Check token expiration
- Verify JWT_SECRET matches backend

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild
npm run build
```

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Zustand](https://github.com/pmndrs/zustand)

## 🤝 Contributing

This is a Final Year Project. Feel free to:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - Free to use for educational purposes

---

**Built with ❤️ for FYP 2024/2025**
