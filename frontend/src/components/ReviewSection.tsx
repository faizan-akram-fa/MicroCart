'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, ShieldCheck, AlertCircle, Camera, X, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import { reviewsAPI } from '@/lib/api';
import { Review } from '@/types';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Normalize image URL — handles relative paths from old data
const normalizeImageUrl = (src: string): string => {
    if (!src) return '';
    // If already a full URL, return as-is
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    // If it's a relative path like /uploads/abc.jpg, prepend product service URL
    if (src.startsWith('/uploads/')) return `http://localhost:3002${src}`;
    return src;
};

// Return a clean, valid images array — filters out all corrupt/empty entries
const getValidImages = (images: any): string[] => {
    if (!images) return [];
    if (!Array.isArray(images)) return [];
    return images
        .filter((img): img is string => !!img && typeof img === 'string')
        .map(img => img.trim())
        .filter(img => img.length > 0 && img !== '[object Object]' && img !== 'null')
        .map(normalizeImageUrl)
        .filter(img => img.startsWith('http'));
};

const ImageWithFallback = ({ src, alt, containerClassName, imgClassName }: { src: string, alt: string, containerClassName?: string, imgClassName?: string }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const normalizedSrc = normalizeImageUrl(src);

    // Guard against corrupt DB entries from previous bugs
    const isCorrupt = !normalizedSrc || normalizedSrc === '[object Object]' || !normalizedSrc.startsWith('http');

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
                src={normalizedSrc}
                alt={alt}
                className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'} ${imgClassName}`}
                onLoad={() => setLoading(false)}
                onError={() => {
                    console.warn('[ReviewImage] Failed to load:', normalizedSrc);
                    setLoading(false);
                    setError(true);
                }}
            />
        </div>
    );
};

interface ReviewSectionProps {
    productId: string;
    productName: string;
}

export default function ReviewSection({ productId, productName }: ReviewSectionProps) {
    const { user, isAuthenticated } = useAuthStore();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hover, setHover] = useState(0);
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editComment, setEditComment] = useState('');
    const [editRating, setEditRating] = useState(5);

    const [selectedReviewForLightbox, setSelectedReviewForLightbox] = useState<Review | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const fetchReviews = async () => {
        try {
            const { data } = await reviewsAPI.getByProduct(productId);
            
            // Map reviews to use current user's name if they are the author
            const updatedReviews = data.map((r: Review) => {
                let name = r.userName;
                // Protection against old reviews that might have email stored
                if (name.includes('@')) {
                    name = 'Verified Customer';
                }

                if (user && r.userId === user.id) {
                    name = `${user.firstName} ${user.lastName}`.trim() || name;
                }
                
                return {
                    ...r,
                    userName: name
                };
            });

            // Show only approved reviews
            setReviews(updatedReviews.filter((r: Review) => r.status === 'approved'));
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [productId]);

    const handleUpdate = async (id: string) => {
        if (editComment.length < 10) {
            toast.error('Comment must be at least 10 characters long');
            return;
        }

        try {
            await reviewsAPI.update(id, { comment: editComment, rating: editRating });
            toast.success('Review updated successfully!');
            setEditingReviewId(null);
            fetchReviews();
        } catch (error) {
            toast.error('Failed to update review');
        }
    };

    const startEditing = (review: Review) => {
        setEditingReviewId(review.id);
        setEditComment(review.comment);
        setEditRating(review.rating);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (images.length + files.length > 3) {
                toast.error('You can only upload up to 3 images');
                return;
            }

            const newImages = [...images, ...files];
            setImages(newImages);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews([...previews, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);

        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    const [guestName, setGuestName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (comment.length < 10) {
            toast.error('Comment must be at least 10 characters long');
            return;
        }

        if (!isAuthenticated && !guestName.trim()) {
            toast.error('Please provide your name');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('productId', productId);
            formData.append('rating', rating.toString());
            formData.append('comment', comment);
            if (!isAuthenticated) {
                formData.append('userName', guestName);
            }
            images.forEach(image => {
                formData.append('images', image);
            });

            if (isAuthenticated) {
                await reviewsAPI.create(formData);
                toast.success('Review posted successfully!');
            } else {
                await reviewsAPI.createGuest(formData);
                toast.success('Review submitted! It will appear after moderation.');
            }
            
            setComment('');
            setRating(5);
            setImages([]);
            setPreviews([]);
            setGuestName('');
            fetchReviews(); // Refresh list
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to submit review';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="mt-12 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800/50 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div id="reviews" className="mt-16 border-t border-gray-100 dark:border-gray-800 pt-12">
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Reviews List */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-8">
                        <MessageSquare className="w-6 h-6 text-primary-600" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Reviews</h2>
                        <span className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium px-2.5 py-0.5 rounded-full">
                            {reviews.length}
                        </span>
                    </div>

                    {reviews.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <MessageSquare className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No reviews yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                Be the first to share your thoughts about {productName}!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-2xl shadow-sm transition-all hover:shadow-md"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold">
                                                {review.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                                        {review.userName}
                                                    </h4>
                                                    {review.isEdited && (
                                                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded italic font-medium">
                                                            Edited
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                                                    {format(new Date(review.createdAt), 'MMM dd, yyyy HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                                                    {editingReviewId === review.id ? editRating : review.rating}.0
                                                </span>
                                            </div>
                                            {user?.id === review.userId && editingReviewId !== review.id && (
                                                <button
                                                    onClick={() => startEditing(review)}
                                                    className="flex items-center gap-1.5 text-[10px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest transition-colors"
                                                >
                                                    <Edit3 className="w-3 h-3" />
                                                    Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {editingReviewId === review.id ? (
                                        <div className="space-y-4 mb-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-primary-100 dark:border-primary-900/30">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Update Rating</label>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setEditRating(star)}
                                                            className="transition-transform active:scale-125"
                                                        >
                                                            <Star
                                                                className={`w-5 h-5 ${star <= editRating
                                                                    ? 'fill-yellow-400 text-yellow-400'
                                                                    : 'text-gray-300 dark:text-gray-600'
                                                                    }`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Update Comment</label>
                                                <textarea
                                                    value={editComment}
                                                    onChange={(e) => setEditComment(e.target.value)}
                                                    rows={3}
                                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdate(review.id)}
                                                    className="flex-1 bg-primary-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-primary-700 transition-all"
                                                >
                                                    Save Changes
                                                </button>
                                                <button
                                                    onClick={() => setEditingReviewId(null)}
                                                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic mb-4">
                                            "{review.comment}"
                                        </p>
                                    )}

                                    {/* Review Images */}
                                    {(() => {
                                        const validImgs = getValidImages(review.images);
                                        if (validImgs.length === 0) return null;
                                        return (
                                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                                {validImgs.map((img: string, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => {
                                                            setSelectedReviewForLightbox({ ...review, images: validImgs });
                                                            setActiveImageIndex(idx);
                                                        }}
                                                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary-500 hover:scale-105 transition-all shadow-sm group"
                                                    >
                                                        <ImageWithFallback src={img} alt="Review thumbnail" containerClassName="w-full h-full" imgClassName="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <Camera className="w-5 h-5 text-white" />
                                                                <span className="text-[8px] text-white font-bold uppercase tracking-tighter">View Photo</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}

                                    {review.userId && (
                                        <div className="mt-4 flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium">
                                            <ShieldCheck className="w-4 h-4" />
                                            Verified Purchase
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Post Review Form */}
                {user?.role !== 'admin' && user?.role !== 'sub_admin' && user?.role !== 'seller' && (
                    <div className="lg:w-96">
                        <div className="sticky top-24 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                Write a Review
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {!isAuthenticated && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Enter your name"
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Your Rating
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHover(star)}
                                                onMouseLeave={() => setHover(0)}
                                                className="transition-transform active:scale-110"
                                            >
                                                <Star
                                                    className={`w-8 h-8 ${star <= (hover || rating)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-300 dark:text-gray-600'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Your Feedback
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={4}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="Tell us what you liked or disliked about this product..."
                                        required
                                    />
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Add Photos (Max 3)
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {previews.map((preview, idx) => (
                                            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-lg"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {previews.length < 3 && (
                                            <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group">
                                                <Camera className="w-5 h-5 text-gray-400 group-hover:text-primary-500" />
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleImageChange}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Posting...
                                        </div>
                                    ) : (
                                        'Post Review'
                                    )}
                                </button>
                            </form>
                        </div>
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
                                src={selectedReviewForLightbox.images[activeImageIndex] || ''}
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
