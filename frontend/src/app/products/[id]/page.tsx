'use client';

import Link from 'next/link';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsAPI, cartAPI, wishlistAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Product } from '@/types';
import toast from 'react-hot-toast';
import { Star, ShoppingCart, Heart, ArrowLeft, Minus, Plus, Share2, MessageSquare } from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import ReviewSection from '@/components/ReviewSection';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, user, wishlist, addToWishlistStore, removeFromWishlistStore } = useAuthStore();
    const { increment, fetchCartCount } = useCartStore();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
        const fetchProduct = async () => {
            try {
                const { data } = await productsAPI.getById(params.id as string);
                setProduct(data);
                if (data.images && data.images.length > 0) {
                    setSelectedImage(data.images[0]);
                }
            } catch (error) {
                toast.error('Failed to load product details');
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchProduct();
        }
    }, [params.id, router]);

    useEffect(() => {
        if (!loading && product && typeof window !== 'undefined') {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
    }, [loading, product]);

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to add items to cart');
            router.push('/login');
            return;
        }

        if (!product) return;

        setAddingToCart(true);
        try {
            const response = await cartAPI.add({
                productId: product.id,
                quantity: quantity,
                sellerId: product.sellerId
            });

            // If the server returns the updated items, use them to sync the badge exactly
            if (response.data && response.data.items) {
                const { syncCart } = useCartStore.getState();
                syncCart(response.data.items);
            } else {
                // Fallback: Optimistic update + fetch
                increment(quantity);
                await fetchCartCount();
            }

            toast.success('Added to cart!');
        } catch (error) {
            toast.error('Failed to add to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to purchase');
            router.push('/login');
            return;
        }

        if (!product) return;

        try {
            await cartAPI.add({
                productId: product.id,
                quantity: quantity,
                sellerId: product.sellerId
            });
            increment(quantity);
            fetchCartCount();
            router.push('/checkout');
        } catch (error) {
            toast.error('Failed to process buy now');
        }
    };

    const isWishlisted = product ? wishlist.includes(product.id) : false;

    const handleToggleWishlist = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to manage wishlist');
            router.push('/login');
            return;
        }

        if (!product) return;

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
            toast.error('Failed to update wishlist');
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    };

    const formatImageUrl = (url: string) => {
        if (!url) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop';
        let clean = url.replace(/^https?:\/\/(localhost|product-service|user-service)(:\d+)?/, '');
        if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
        clean = clean.replace(/^\/?app\/uploads\//, 'uploads/').replace(/\/app\/uploads\//, '/uploads/');
        const cleanPath = clean.startsWith('/') ? clean : `/${clean}`;
        return cleanPath.startsWith('/api') ? cleanPath : `/api${cleanPath}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-7xl">
            {/* Back Button */}
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 mb-6 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Products
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Gallery Section */}
                <div className="space-y-4">
                    <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-sm relative">
                        <img
                            src={formatImageUrl(selectedImage)}
                            alt={product.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                const target = e.currentTarget;
                                target.onerror = null;
                                target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop';
                            }}
                        />
                        {product.isOnSale && (
                            <span className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded shadow-lg animate-pulse z-10">
                                SALE
                            </span>
                        )}
                    </div>

                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(img)}
                                    className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-primary-600 ring-2 ring-primary-100 dark:ring-primary-900' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <img src={formatImageUrl(img)} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info Section */}
                <div className="flex flex-col">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 mb-2">
                            {product.category && (
                                <span className="text-sm text-primary-600 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-900/10 px-2 py-1 rounded">
                                    {product.category}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleShare}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-full transition-all"
                            title="Share Product"
                        >
                            <Share2 className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-4 mt-4 mb-6">
                        <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md">
                            <Star className="w-5 h-5 fill-current" />
                            <span className="font-bold">{product.rating}</span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">{product.reviewCount} Reviews</span>
                        <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <span className={`${product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'} font-medium`}>
                            {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}
                        </span>
                    </div>

                    {/* Price */}
                    {product.salePrice && product.salePrice < product.price ? (
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-xl font-bold text-gray-500 line-through dark:text-gray-400">
                                Rs {Number(product.price).toFixed(2)}
                            </span>
                            <span className="text-4xl font-bold text-red-600 dark:text-red-400">
                                Rs {Number(product.salePrice).toFixed(2)}
                            </span>
                            <span className="bg-red-100 text-red-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded dark:bg-red-200 dark:text-red-900">
                                Save Rs {Number(Number(product.price) - Number(product.salePrice)).toFixed(0)}
                            </span>
                        </div>
                    ) : (
                        <div className="text-4xl font-bold text-gray-900 mb-8">
                            Rs {Number(product.price).toFixed(2)}
                        </div>
                    )}

                    {/* Shipping info */}
                    <div className="text-sm font-semibold mb-6 flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-700 w-fit">
                        <span className="text-gray-550 dark:text-gray-400">Shipping:</span>
                        {(() => {
                            const match = product.description.match(/\[Shipping:\s*(Free|(\d+(\.\d+)?))\]/i);
                            if (match && match[1].toLowerCase() !== 'free') {
                                return (
                                    <span className="text-gray-900 dark:text-white font-bold">
                                        Rs {parseFloat(match[1]).toFixed(2)}
                                    </span>
                                );
                            }
                            return (
                                <span className="text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-950/20 px-2.5 py-0.5 rounded-lg text-xs">
                                    Free Delivery
                                </span>
                            );
                        })()}
                    </div>

                    {/* Description */}
                    <div className="prose prose-gray dark:prose-invert max-w-none mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {product.description.replace(/\[Shipping:\s*(Free|(\d+(\.\d+)?))\]/i, '').trim()}
                        </p>
                    </div>

                    {/* Detailed Features (Mocked from existing data for now) */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-6 sm:gap-x-8 text-sm">
                            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                                <span className="text-gray-500 dark:text-gray-400">Brand</span>
                                <span className="font-medium text-gray-900 dark:text-white">{product.brand || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                                <span className="text-gray-500 dark:text-gray-400">Category</span>
                                <span className="font-medium text-gray-900 dark:text-white">{product.category}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                                <span className="text-gray-500 dark:text-gray-400">SKU</span>
                                <span className="font-medium text-gray-900 dark:text-white">{product.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                                <span className="text-gray-500 dark:text-gray-400">Condition</span>
                                <span className="font-medium text-gray-900 dark:text-white">New</span>
                            </div>
                        </div>
                    </div>

                    {/* Contact Seller CTA */}
                    <div className="mb-6 flex justify-end">
                        <button
                            onClick={() => {
                                if (user?.role === 'admin' || user?.role === 'sub_admin') {
                                    router.push(`/admin/support?vendorId=${product.sellerId}&productId=${product.id}`);
                                } else {
                                    router.push(`/support?openTicket=true&productId=${product.id}&sellerId=${product.sellerId}`);
                                }
                            }}
                            className="text-xs font-black uppercase tracking-wider text-primary-600 hover:text-primary-850 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1.5 transition-all hover:underline"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Have questions? Contact Seller
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-6 border-t border-gray-100">
                        {user?.role === 'buyer' ? (
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Quantity */}
                                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg h-12 w-full sm:w-auto">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-lg transition-colors"
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="flex-1 w-12 text-center font-medium text-gray-900 dark:text-white">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                        className="w-12 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-lg transition-colors"
                                        disabled={quantity >= product.stock}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Add to Cart */}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0 || addingToCart}
                                    className="btn btn-outline flex-1 h-12 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition-all"
                                >
                                    {addingToCart ? (
                                        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <ShoppingCart className="w-5 h-5" />
                                            Add to Cart
                                        </>
                                    )}
                                </button>

                                {/* Buy Now */}
                                <button
                                    onClick={handleBuyNow}
                                    disabled={product.stock === 0 || addingToCart}
                                    className="btn btn-primary flex-1 h-12 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition-all shadow-lg hover:shadow-xl"
                                >
                                    Buy Now
                                </button>

                                {/* Wishlist */}
                                <button
                                    onClick={handleToggleWishlist}
                                    className={`h-12 w-12 flex items-center justify-center rounded-lg border-2 transition-all ${isWishlisted
                                        ? 'border-red-500 bg-red-50 text-red-500 dark:bg-red-900/20'
                                        : 'border-gray-300 text-gray-400 hover:border-red-500 hover:text-red-500 dark:border-gray-600 dark:text-gray-500 dark:hover:border-red-500'
                                        }`}
                                >
                                    <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                                </button>
                            </div>
                        ) : !isAuthenticated ? (
                            <Link href="/login" className="btn btn-primary w-full h-12 flex items-center justify-center text-lg font-semibold">
                                Login to Buy Now
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Review Section */}
            <ReviewSection productId={product.id} productName={product.name} />
        </div>
    );
}
