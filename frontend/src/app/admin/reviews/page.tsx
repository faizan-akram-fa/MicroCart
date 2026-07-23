'use client';

import { useState, useEffect } from 'react';
import { reviewsAPI } from '@/lib/api';
import Link from 'next/link';
import { Review } from '@/types';
import { 
    CheckCircle, 
    XCircle, 
    Trash2, 
    Search, 
    Filter, 
    MoreVertical,
    AlertCircle,
    Package,
    X,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ImageWithFallback = ({ src, alt, containerClassName, imgClassName }: { src: string, alt: string, containerClassName?: string, imgClassName?: string }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Guard against corrupt DB entries from previous bugs
    const isCorrupt = src === '[object Object]' || !src;

    if (isCorrupt || error) {
        return (
            <div className={`bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400 ${containerClassName}`}>
                <AlertCircle className="w-6 h-6 mb-1 opacity-50" />
                <span className="text-[10px] font-medium opacity-70 px-2 text-center">Unavailable</span>
            </div>
        );
    }

    return (
        <div className={`relative ${containerClassName}`}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm z-10">
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'} ${imgClassName}`}
                onLoad={() => setLoading(false)}
                onError={() => {
                    setLoading(false);
                    setError(true);
                }}
            />
        </div>
    );
};

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [selectedReviewForLightbox, setSelectedReviewForLightbox] = useState<Review | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const fetchReviews = async () => {
        try {
            const { data } = await reviewsAPI.getAllAdmin();
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
        const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">Approved</span>;
            case 'rejected':
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">Rejected</span>;
            case 'deactivated':
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">Hidden</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 animate-pulse">Pending</span>;
        }
    };

    return (
        <div className="p-6 lg:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Moderation</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and moderate customer product feedback</p>
                </div>
                <div className="flex items-center gap-4 bg-primary-50 dark:bg-primary-900/10 px-4 py-2 rounded-xl border border-primary-100 dark:border-primary-800">
                    <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <span className="text-primary-700 dark:text-primary-300 font-semibold">{reviews.length} Total Reviews</span>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by user or content..."
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none appearance-none transition-all"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Loading reviews...</p>
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <div className="p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No reviews found</h3>
                        <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search terms.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User & Product</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Review Content</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredReviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold">
                                                        {review.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{review.userName}</div>
                                                </div>
                                                <Link 
                                                    href={`/products/${review.productId}#reviews`}
                                                    className="flex items-center gap-3 group/prod"
                                                >
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 flex-shrink-0">
                                                        <img 
                                                            src={review.product?.images?.[0] || '/placeholder.png'} 
                                                            alt="Product" 
                                                            className="w-full h-full object-cover group-hover/prod:scale-110 transition-transform"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-primary-600 group-hover/prod:underline">
                                                            {review.product?.name || 'View Product'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-mono uppercase">
                                                            ID: {review.productId.slice(0, 8)}
                                                        </span>
                                                    </div>
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex gap-0.5 mb-1">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`} />
                                                    ))}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 max-w-md">"{review.comment}"</p>
                                                
                                                {/* Images in table */}
                                                {review.images && review.images.length > 0 && (
                                                    <div className="flex gap-1 mt-2">
                                                        {review.images.map((img, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                onClick={() => {
                                                                    setSelectedReviewForLightbox(review);
                                                                    setActiveImageIndex(idx);
                                                                }}
                                                                className="w-8 h-8 rounded-md overflow-hidden border border-gray-100 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                                                            >
                                                                <ImageWithFallback src={img} alt="Review thumbnail" containerClassName="w-full h-full" imgClassName="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{format(new Date(review.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(review.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-2">
                                                {review.status !== 'approved' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(review.id, 'approved')}
                                                        className="flex items-center justify-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-colors text-xs font-bold"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Approve
                                                    </button>
                                                )}
                                                {review.status !== 'deactivated' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(review.id, 'deactivated')}
                                                        className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-xs font-bold"
                                                        title="Hide from public view"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Hide
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(review.id)}
                                                    className="flex items-center justify-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors text-xs font-bold"
                                                    title="Permanent Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

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
                            <ImageWithFallback 
                                key={`${selectedReviewForLightbox.id}-${activeImageIndex}`}
                                src={selectedReviewForLightbox.images[activeImageIndex]} 
                                alt="Review Detail" 
                                containerClassName="max-w-full max-h-[75vh] flex justify-center rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-500 bg-black/20"
                                imgClassName="max-w-full max-h-[75vh] object-contain"
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
                                            <ImageWithFallback src={img} alt={`Thumbnail ${idx + 1}`} containerClassName="w-full h-full" imgClassName="w-full h-full object-cover" />
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
