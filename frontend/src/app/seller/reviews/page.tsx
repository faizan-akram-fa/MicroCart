'use client';

import { useState, useEffect } from 'react';
import { reviewsAPI } from '@/lib/api';
import { Review } from '@/types';
import { 
    Trash2, 
    Search, 
    Filter, 
    Star,
    MessageSquare,
    AlertCircle,
    Package,
    CheckCircle,
    XCircle,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Link from 'next/link';

export default function SellerReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [ratingFilter, setRatingFilter] = useState<'all' | 'high' | 'low'>('all');
    const [selectedReviewForLightbox, setSelectedReviewForLightbox] = useState<Review | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const fetchReviews = async () => {
        try {
            const { data } = await reviewsAPI.getSeller();
            setReviews(data);
        } catch (error) {
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected' | 'deactivated') => {
        try {
            await reviewsAPI.updateStatus(id, status);
            toast.success(`Review status updated to ${status}`);
            fetchReviews();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('PERMANENT DELETE: Are you sure? This review will be removed from the database forever.')) return;
        
        try {
            await reviewsAPI.delete(id);
            toast.success('Review permanently deleted');
            fetchReviews();
        } catch (error) {
            toast.error('Failed to delete review');
        }
    };

    const filteredReviews = reviews.filter(review => {
        const name = review.userName.includes('@') ? 'Verified Customer' : review.userName;
        const matchesSearch = 
            name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            review.comment.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesRating = true;
        if (ratingFilter === 'high') matchesRating = review.rating >= 4;
        if (ratingFilter === 'low') matchesRating = review.rating <= 2;
        
        return matchesSearch && matchesRating;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 uppercase tracking-wider">Approved</span>;
            case 'rejected':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 uppercase tracking-wider">Rejected</span>;
            case 'deactivated':
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700 uppercase tracking-wider">Hidden</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 animate-pulse uppercase tracking-wider">Pending Approval</span>;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Reviews</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage feedback for your products</p>
                </div>
                <div className="flex items-center gap-4 bg-primary-50 dark:bg-primary-900/10 px-6 py-3 rounded-2xl border border-primary-100 dark:border-primary-800 shadow-sm">
                    <MessageSquare className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    <div>
                        <p className="text-xs text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider">Total Feedback</p>
                        <p className="text-2xl font-black text-primary-700 dark:text-primary-200 leading-none">{reviews.length}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="relative col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search feedback or customer name..."
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none appearance-none transition-all shadow-sm"
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(e.target.value as any)}
                    >
                        <option value="all">All Ratings</option>
                        <option value="high">High Ratings (4-5 ★)</option>
                        <option value="low">Low Ratings (1-2 ★)</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse"></div>
                    ))}
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-16 text-center border border-gray-100 dark:border-gray-700 shadow-xl">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No reviews found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        Once customers start reviewing your products, they will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReviews.map((review) => (
                        <div key={review.id} className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
                            
                            {/* Product Background Thumbnail Overlay */}
                            <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] dark:opacity-[0.07] -mr-8 -mt-8 pointer-events-none group-hover:scale-125 transition-transform duration-500">
                                <img src={review.product?.images?.[0]} alt="" className="w-full h-full object-cover rounded-full" />
                            </div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-700 dark:text-primary-300 font-black text-xl">
                                        {review.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white leading-tight">
                                            {review.userName.includes('@') ? 'Verified Customer' : review.userName}
                                        </h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{format(new Date(review.createdAt), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-xl border border-yellow-100 dark:border-yellow-800 shadow-sm">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        <span className="text-sm font-black text-yellow-700 dark:text-yellow-400">{review.rating}.0</span>
                                    </div>
                                    {getStatusBadge(review.status)}
                                </div>
                            </div>

                            <div className="flex-1 relative z-10">
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 italic">
                                    "{review.comment}"
                                </p>

                                {review.images && review.images.length > 0 && (
                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                                        {review.images.map((img, idx) => (
                                            <div 
                                                key={idx} 
                                                onClick={() => {
                                                    setSelectedReviewForLightbox(review);
                                                    setActiveImageIndex(idx);
                                                }}
                                                className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 flex-shrink-0 shadow-sm cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                                            >
                                                <img src={img} alt="Review" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex flex-col gap-4 relative z-10">
                                <Link 
                                    href={`/products/${review.productId}#reviews`}
                                    className="flex items-center gap-2 group/link"
                                >
                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 flex-shrink-0">
                                        <img src={review.product?.images?.[0]} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] text-primary-600 font-black uppercase tracking-tighter truncate group-hover/link:underline">
                                            {review.product?.name}
                                        </span>
                                        <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold">
                                            <Package className="w-2.5 h-2.5" />
                                            <span>ID: {review.productId.slice(0, 8)}</span>
                                        </div>
                                    </div>
                                </Link>
                                <div className="flex items-center gap-2">
                                    {review.status !== 'approved' && (
                                        <button
                                            onClick={() => handleUpdateStatus(review.id, 'approved')}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl transition-all font-bold text-xs shadow-lg shadow-green-500/20"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Approve
                                        </button>
                                    )}
                                    {review.status !== 'deactivated' && (
                                        <button
                                            onClick={() => handleUpdateStatus(review.id, 'deactivated')}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-bold text-xs ${review.status !== 'approved' ? 'w-12 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200' : 'flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200 shadow-sm'}`}
                                            title="Hide Review"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            {review.status === 'approved' && 'Hide'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(review.id)}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-bold text-xs ${review.status !== 'approved' ? 'w-12 bg-red-50 text-red-500 hover:bg-red-100' : 'flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 shadow-sm'}`}
                                        title="Permanent Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {review.status === 'approved' && 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Slider Lightbox Modal */}
            {selectedReviewForLightbox && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedReviewForLightbox(null)}
                >
                    {/* Close Button */}
                    <button 
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[110] bg-white/10 p-2 rounded-full backdrop-blur-md"
                        onClick={() => setSelectedReviewForLightbox(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {/* Previous Button */}
                    {selectedReviewForLightbox.images.length > 1 && (
                        <button 
                            className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-[110] bg-white/10 p-4 rounded-full backdrop-blur-md hover:scale-110 active:scale-95"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex((prev) => (prev === 0 ? selectedReviewForLightbox.images.length - 1 : prev - 1));
                            }}
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>
                    )}

                    {/* Next Button */}
                    {selectedReviewForLightbox.images.length > 1 && (
                        <button 
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-[110] bg-white/10 p-4 rounded-full backdrop-blur-md hover:scale-110 active:scale-95"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex((prev) => (prev === selectedReviewForLightbox.images.length - 1 ? 0 : prev + 1));
                            }}
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    )}

                    {/* Main Image Container */}
                    <div 
                        className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center justify-center gap-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative group w-full flex justify-center">
                            <img 
                                key={activeImageIndex}
                                src={selectedReviewForLightbox.images[activeImageIndex]} 
                                alt="Review Detail" 
                                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-500"
                            />
                        </div>

                        {/* Image Counter & Thumbnails */}
                        <div className="flex flex-col items-center gap-4 w-full">
                            <div className="bg-white/10 backdrop-blur-md px-4 py-1 rounded-full text-white/80 text-sm font-medium">
                                {activeImageIndex + 1} / {selectedReviewForLightbox.images.length}
                            </div>
                            
                            {selectedReviewForLightbox.images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto max-w-full px-4 py-2 scrollbar-hide">
                                    {selectedReviewForLightbox.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                                                activeImageIndex === idx ? 'border-primary-500 scale-110 ring-2 ring-primary-500/50' : 'border-transparent opacity-50 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
