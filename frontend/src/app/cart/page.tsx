'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cartAPI } from '@/lib/api';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCartStore } from '@/hooks/useCartStore';
import { useAppStore } from '@/lib/store';
import { formatPrice } from '@/lib/currency';

interface CartItem {
  productId: string;
  name: string;
  description?: string;
  price: number | string;
  quantity: number;
  image?: string;
  stock?: number;
}

interface Cart {
  items: CartItem[];
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetchCartCount } = useCartStore();
  const { currency, exchangeRates } = useAppStore();
  const router = useRouter(); // Restore router

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await cartAPI.get();
      setCart(response.data);
      // Sync badge count whenever we load the cart
      fetchCartCount();
    } catch (error) {
      console.error(error);
      // toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const item = cart?.items.find(i => i.productId === productId);
    if (item && item.stock !== undefined && newQuantity > item.stock) {
      toast.error(`Only ${item.stock} items available in stock`);
      return;
    }
    try {
      await cartAPI.update({ productId, quantity: newQuantity });
      fetchCart(); // This will also trigger fetchCartCount
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (productId: string) => {
    if (!confirm('Remove this item?')) return;
    try {
      await cartAPI.remove(productId);
      toast.success('Item removed');
      fetchCart(); // Syncs badge
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    if (!confirm('Clear entire cart?')) return;
    try {
      await cartAPI.clear();
      toast.success('Cart cleared');
      fetchCart(); // Syncs badge
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  const calculateTotal = () => {
    return cart?.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0) || 0;
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="bg-gray-300 h-8 w-48 mb-6 rounded"></div>
          <div className="bg-gray-300 h-32 rounded mb-4"></div>
          <div className="bg-gray-300 h-32 rounded"></div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Add some products to get started!</p>
          <button onClick={() => router.push('/')} className="btn btn-primary">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <button onClick={clearCart} className="btn btn-secondary text-red-600">
          <Trash2 className="w-4 h-4 mr-2 inline" />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.productId} className="card flex items-center gap-4">
              {/* Product Image */}
              <div className="w-24 h-24 bg-gray-200 rounded flex-shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/100';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-grow">
                <h3 className="font-semibold text-lg mb-1 dark:text-gray-200">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 line-clamp-1">{item.description}</p>
                )}
                <p className="text-primary-600 dark:text-primary-400 font-bold">{formatPrice(item.price, currency, exchangeRates)}</p>
                {item.stock !== undefined && (
                  <p className={`text-xs mt-1 ${item.stock - item.quantity <= 0 ? 'text-red-500 font-semibold' : 'text-orange-500'}`}>
                    {item.stock - item.quantity <= 0 
                      ? 'Maximum stock reached' 
                      : `Only ${item.stock - item.quantity} more can be added`}
                  </p>
                )}
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold dark:text-gray-200">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={item.stock !== undefined && item.quantity >= item.stock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeItem(item.productId)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-semibold dark:text-gray-200">{formatPrice(calculateTotal(), currency, exchangeRates)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="font-semibold text-green-600 dark:text-green-400">FREE</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                <span className="text-lg font-bold dark:text-white">Total</span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {formatPrice(calculateTotal(), currency, exchangeRates)}
                </span>
              </div>
            </div>

            <button onClick={handleCheckout} className="btn btn-primary w-full">
              Proceed to Checkout
            </button>

            <button
              onClick={() => router.push('/')}
              className="btn btn-outline w-full mt-2"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
