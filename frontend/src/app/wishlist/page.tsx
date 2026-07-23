'use client';

import { useEffect, useState } from 'react';
import { wishlistAPI } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await wishlistAPI.get();
      setWishlist(response.data);
    } catch (error) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="bg-gray-300 h-48 rounded mb-4"></div>
              <div className="bg-gray-300 h-4 rounded mb-2"></div>
              <div className="bg-gray-300 h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            item.product && <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">Your wishlist is empty</p>
          <a href="/" className="btn btn-primary">
            Browse Products
          </a>
        </div>
      )}
    </div>
  );
}
