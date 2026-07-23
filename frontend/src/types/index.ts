export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'buyer' | 'seller' | 'admin' | 'sub_admin' | 'pending';
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  profileImage?: string;
  preferredLanguage?: string;
  preferredCurrency?: string;
  storeName?: string;
  storeAddress?: string;
  storeType?: string;
  cnicNumber?: string;
  cnicImage?: string;
  sellerStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  permissions?: string[];
  isActive?: boolean;
  mustChangePassword?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  sellerId: string;
  storeName?: string;
  brand?: string;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  salePrice?: number;
  isOnSale?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
  sellerId: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
  sellerId: string;
  shipping?: number;
  discount?: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  paymentMethod: string;
  sellerId?: string;
  createdAt: string;
  updatedAt: string;
  discountAmount?: number;
  promoCode?: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product?: Product;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'deactivated';
  isEdited: boolean;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}
