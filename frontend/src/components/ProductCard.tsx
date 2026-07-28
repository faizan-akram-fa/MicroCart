'use client';



import { Product } from '@/types';
import Link from 'next/link';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { cartAPI, wishlistAPI } from '@/lib/api';
import { useAuthStore, useAppStore } from '@/lib/store';
import { useCartStore } from '@/hooks/useCartStore';
import { formatPrice } from '@/lib/currency';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated, user, wishlist, addToWishlistStore, removeFromWishlistStore } = useAuthStore();
  const { currency, exchangeRates } = useAppStore();
  const { fetchCartCount, increment } = useCartStore();
  const router = useRouter();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      router.push('/login');
      return;
    }

    try {
      // Optimistic update
      increment(1);

      await cartAPI.add({ productId: product.id, quantity: 1, sellerId: product.sellerId });
      // Sync exact count from server
      await fetchCartCount();
      toast.success('Added to cart!');
    } catch (error) {
      // Revert if failed (optional, but good practice would be decrement, sticking to simple for now)
      toast.error('Failed to add to cart');
      fetchCartCount(); // resync to be sure
    }
  };

  const isWishlisted = wishlist.includes(product.id);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      router.push('/login');
      return;
    }

    try {
      if (isWishlisted) {
        await wishlistAPI.remove(product.id);
        removeFromWishlistStore(product.id);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.add(product.id);
        addToWishlistStore(product.id);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update wishlist');
    }
  };

  const formatImageUrl = (url: string) => {
    if (!url) return '';
    let clean = url.replace(/^https?:\/\/(localhost|product-service|user-service)(:\d+)?/, '');
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    clean = clean.replace(/^\/?app\/uploads\//, 'uploads/').replace(/\/app\/uploads\//, '/uploads/');
    const cleanPath = clean.startsWith('/') ? clean : `/${clean}`;
    return cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;
  };

  return (
    <Link href={`/products/${product.id}`} className="card hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={formatImageUrl(product.images[0])}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Image
          </div>
        )}

        {/* Sale Badge */}
        {product.isOnSale && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10 animate-pulse">
            SALE
          </span>
        )}

        {/* Wishlist Button */}
        {user?.role === 'buyer' && (
          <button
            onClick={handleToggleWishlist}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        )}
      </div>

      {/* Product Info */}
      <h3 className="font-semibold text-lg mb-1 line-clamp-2 dark:text-gray-100">{product.name}</h3>
      {
        product.storeName && (
          <p className="text-xs text-primary-600 dark:text-primary-400 mb-2 font-medium">
            Sold by: {product.storeName}
          </p>
        )
      }
      <p className="text-gray-600 text-sm mb-2 line-clamp-2 dark:text-gray-400">
        {product.description.replace(/\[Shipping:\s*(Free|(\d+(\.\d+)?))\]/i, '').trim()}
      </p>

      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          {product.isOnSale && product.salePrice ? (
            <>
              <span className="text-xs text-gray-500 line-through decoration-red-500 decoration-1">
                {formatPrice(product.price, currency, exchangeRates)}
              </span>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatPrice(product.salePrice, currency, exchangeRates)}
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {formatPrice(product.price, currency, exchangeRates)}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-semibold">{product.rating}</span>
            <span className="text-gray-400 text-sm">({product.reviewCount})</span>
          </div>
          <span className={`text-xs font-medium ${product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
          </span>
        </div>
      </div>

      {/* Category */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs bg-gray-200 px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-300">
          {product.category}
        </span>
      </div>

      {/* Add to Cart Button */}
      {
        user?.role === 'buyer' && (
          <button
            onClick={handleAddToCart}
            className="btn btn-primary w-full flex items-center justify-center gap-2 group-hover:translate-y-0 translate-y-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={product.stock === 0}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        )
      }
    </Link >
  );
}
