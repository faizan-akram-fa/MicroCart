'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { User, ShoppingBag, Store, ArrowLeft, Upload, Loader } from 'lucide-react';

export default function RoleSelectionPage() {
    const [loading, setLoading] = useState(false);
    const [showSellerForm, setShowSellerForm] = useState(false);
    const [sellerData, setSellerData] = useState({
        storeName: '',
        storeAddress: '',
        storeType: 'individual',
        cnicNumber: '',
    });
    const [cnicFile, setCnicFile] = useState<File | null>(null);
    const [isCustomStoreType, setIsCustomStoreType] = useState(false);
    const router = useRouter();
    const { user, login } = useAuthStore();

    useEffect(() => {
        if (user) {
            if (user.role === 'admin' || user.role === 'sub_admin') {
                router.push('/admin/dashboard');
            } else if (user.role === 'buyer') {
                router.push('/');
            } else if (user.role === 'seller') {
                if (user.sellerStatus === 'approved') {
                    router.push('/seller/dashboard');
                } else if (user.sellerStatus === 'pending') {
                    if (user.cnicNumber) {
                        // KYC already submitted, move to the pending status page
                        router.push('/seller/pending');
                    } else {
                        // Role selected but form not yet submitted
                        setShowSellerForm(true);
                        setSellerData({
                            storeName: user.storeName || '',
                            storeAddress: user.storeAddress || '',
                            storeType: user.storeType || 'individual',
                            cnicNumber: user.cnicNumber || '',
                        });
                        if (user.storeType && !['individual', 'business'].includes(user.storeType)) {
                            setIsCustomStoreType(true);
                        }
                    }
                }
            }
        }
    }, [user, router]);

    const handleSelectRole = async (role: 'buyer' | 'seller') => {
        if (role === 'seller') {
            setShowSellerForm(true);
            return;
        }
        await submitRoleUpdate(role);
    };

    const submitRoleUpdate = async (role: 'buyer' | 'seller') => {
        setLoading(true);
        try {
            const res = await authAPI.setRole(role);
            const { user, access_token } = res.data;

            // Update local storage and store
            localStorage.setItem('token', access_token);
            login(user, access_token);

            toast.success(`Welcome, ${user.firstName}! Account set to ${role}.`);

            if (role === 'seller') {
                router.push('/seller/dashboard');
            } else {
                router.push('/');
            }
        } catch (error) {
            console.error('Role update error:', error);
            toast.error('Failed to update role. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSellerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Upload CNIC Image if present
            if (cnicFile) {
                const formData = new FormData();
                formData.append('image', cnicFile);
                await authAPI.uploadCnicImage(formData);
            }

            // 2. Update Profile with Seller Details
            await authAPI.updateProfile({
                storeName: sellerData.storeName,
                storeAddress: sellerData.storeAddress,
                storeType: sellerData.storeType,
                cnicNumber: sellerData.cnicNumber,
            });

            // 3. Set Role to Seller
            await submitRoleUpdate('seller');

        } catch (error: any) {
            console.error('Seller onboarding error:', error);
            const message = error.response?.data?.message || 'Failed to save seller details. Please check your inputs.';
            toast.error(message);
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCnicFile(e.target.files[0]);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 animate-fade-in transition-colors duration-200">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Choose Account Type</h1>
                    <p className="text-gray-600 dark:text-gray-400">Select how you want to use MicroCart. This can be changed later.</p>
                </div>

                {showSellerForm ? (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-fade-in">
                        {user?.role !== 'seller' && (
                            <button
                                onClick={() => setShowSellerForm(false)}
                                className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Role Selection
                            </button>
                        )}

                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Setup Your Store</h2>
                            <p className="text-gray-600 dark:text-gray-400">Please provide your business details to start selling.</p>
                        </div>

                        <form onSubmit={handleSellerSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Store Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={sellerData.storeName}
                                        onChange={(e) => setSellerData({ ...sellerData, storeName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        placeholder="My Awesome Store"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Store Type</label>
                                    <select
                                        value={isCustomStoreType ? 'other' : sellerData.storeType}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'other') {
                                                setIsCustomStoreType(true);
                                                setSellerData({ ...sellerData, storeType: '' });
                                            } else {
                                                setIsCustomStoreType(false);
                                                setSellerData({ ...sellerData, storeType: val });
                                            }
                                        }}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all mb-3"
                                    >
                                        <option value="individual">Individual</option>
                                        <option value="business">Business / Company</option>
                                        <option value="other">Other (Please Specify)</option>
                                    </select>
                                    {isCustomStoreType && (
                                        <input
                                            type="text"
                                            value={sellerData.storeType}
                                            onChange={(e) => setSellerData({ ...sellerData, storeType: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            placeholder="Specify Store Type"
                                            required
                                            autoFocus
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Store Address *</label>
                                <textarea
                                    required
                                    value={sellerData.storeAddress}
                                    onChange={(e) => setSellerData({ ...sellerData, storeAddress: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    rows={3}
                                    placeholder="Full address of your business/warehouse"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CNIC Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={sellerData.cnicNumber}
                                        onChange={(e) => {
                                            // Allow only numbers and dashes, format XXXXX-XXXXXXX-X
                                            let val = e.target.value.replace(/[^0-9]/g, '');
                                            if (val.length > 13) val = val.slice(0, 13);

                                            if (val.length > 5 && val.length <= 12) {
                                                val = `${val.slice(0, 5)}-${val.slice(5)}`;
                                            } else if (val.length > 12) {
                                                val = `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12)}`;
                                            }
                                            setSellerData({ ...sellerData, cnicNumber: val });
                                        }}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                        placeholder="12345-1234567-1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CNIC Copy (Image) *</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            required
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="cnic-upload"
                                        />
                                        <label
                                            htmlFor="cnic-upload"
                                            className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-gray-600 dark:text-gray-400 overflow-hidden"
                                        >
                                            <Upload className="w-5 h-5 mr-2 flex-shrink-0" />
                                            <span className="truncate max-w-[200px]">
                                                {cnicFile ? cnicFile.name : 'Click to Upload CNIC'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn btn-primary py-4 text-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                        Creating Store...
                                    </span>
                                ) : (
                                    'Complete Setup & Start Selling'
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Buyer Card */}
                        <button
                            onClick={() => handleSelectRole('buyer')}
                            disabled={loading}
                            className="group relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-500 text-left"
                        >
                            <div className="mb-6 inline-block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                <ShoppingBag className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Become a Buyer</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Browse millions of products, track orders, and fetch wishlists. Best for personal shopping.
                            </p>
                            <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium group-hover:translate-x-1 transition-transform">
                                Continue as Buyer
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>

                        {/* Seller Card */}
                        <button
                            onClick={() => handleSelectRole('seller')}
                            disabled={loading}
                            className="group relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-500 text-left"
                        >
                            <div className="mb-6 inline-block p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
                                <Store className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Become a Seller</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Create your store, manage inventory, and sell to millions. Best for businesses.
                            </p>
                            <div className="flex items-center text-purple-600 dark:text-purple-400 font-medium group-hover:translate-x-1 transition-transform">
                                Continue as Seller
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
