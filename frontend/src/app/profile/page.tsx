'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, useAppStore, SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES, CURRENCY_LABELS } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { User as UserIcon, MapPin, Lock, Trash2, Save, Loader, Eye, EyeOff, ShieldCheck, ChevronRight } from 'lucide-react';
import ProfileImage from '@/components/ProfileImage';

export default function ProfilePage() {
    const { user, isAuthenticated, updateUser, logout } = useAuthStore();
    const { setLanguage, setCurrency } = useAppStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');

    useEffect(() => {
        setMounted(true);
    }, []);

    // Form States
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        preferredLanguage: 'en',
        preferredCurrency: 'PKR',
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                address: user.address || '',
                city: user.city || '',
                state: user.state || '',
                zipCode: user.zipCode || '',
                country: user.country || '',
                preferredLanguage: user.preferredLanguage || 'en',
                preferredCurrency: user.preferredCurrency || 'PKR',
            });
        }
    }, [isAuthenticated, user, router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await authAPI.updateProfile(formData);
            updateUser(data);
            setLanguage(formData.preferredLanguage);
            setCurrency(formData.preferredCurrency);
            toast.success('Profile updated successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Password Validation Logic
        if (passwordData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[0-9]).{8,}$/;
        if (!strongPasswordRegex.test(passwordData.newPassword)) {
            toast.error('Password must contain at least 1 Uppercase letter, 1 Number, and 1 Special character');
            return;
        }

        if (passwordData.newPassword.toLowerCase().includes('123456') || passwordData.newPassword.toLowerCase().includes('abcdef')) {
            toast.error('Password cannot contain simple sequences like "123456"');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await authAPI.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success('Password changed successfully');
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                await authAPI.deleteAccount();
                logout();
                toast.success('Account deleted successfully');
                router.push('/');
            } catch (error: any) {
                toast.error('Failed to delete account');
            }
        }
    };

    if (!mounted || !user) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 space-y-2">
                    <div className="flex flex-col items-center mb-6">
                        <ProfileImage size="xl" editable={true} />
                        <p className="mt-2 text-sm text-gray-500">Click to change</p>
                    </div>
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'personal'
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        <UserIcon className="w-5 h-5" />
                        Personal Info
                    </button>
                    <button
                        onClick={() => setActiveTab('address')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'address'
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        <MapPin className="w-5 h-5" />
                        Address
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'security'
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        <Lock className="w-5 h-5" />
                        Security
                    </button>
                    <button
                        onClick={() => setActiveTab('danger')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'danger'
                            ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-red-600 dark:text-red-400'
                            }`}
                    >
                        <Trash2 className="w-5 h-5" />
                        Delete Account
                    </button>
                    {(user.role === 'admin' || user.role === 'sub_admin') && (
                        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={() => router.push('/admin/dashboard')}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all group font-semibold border border-indigo-100 dark:border-indigo-800/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-indigo-600 rounded-lg shadow-md group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="w-4 h-4 text-white" />
                                    </div>
                                    <span>Admin Dashboard</span>
                                </div>
                                <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 card">
                    {activeTab === 'personal' && (
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">Personal Information</h2>
                                {(user.role === 'admin' || user.role === 'sub_admin') && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 animate-pulse">
                                        <ShieldCheck className="w-3 h-3" />
                                        {user.role === 'admin' ? 'Administrator' : 'Sub-Admin'}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="input bg-gray-100 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                </div>
                                <div>
                                    <label className="label">Phone</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-medium">
                                            +92
                                        </span>
                                        <input
                                            type="tel"
                                            value={formData.phone.startsWith('+92') ? formData.phone.slice(3) : formData.phone}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                if (value.length <= 10) {
                                                    setFormData({ ...formData, phone: value ? `+92${value}` : '' });
                                                }
                                            }}
                                            className="input pl-12"
                                            placeholder="3001234567"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Preferred Language</label>
                                    <select
                                        value={formData.preferredLanguage}
                                        onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                                        className="input bg-white dark:bg-gray-800"
                                    >
                                        {SUPPORTED_LANGUAGES.map((lang) => (
                                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Preferred Currency</label>
                                    <select
                                        value={formData.preferredCurrency}
                                        onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                                        className="input bg-white dark:bg-gray-800"
                                    >
                                        {SUPPORTED_CURRENCIES.map((curr) => (
                                            <option key={curr} value={curr}>{CURRENCY_LABELS[curr] || curr}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
                                    {loading ? <Loader className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'address' && (
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <h2 className="text-xl font-semibold mb-4">Address Management</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="label">Street Address</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">City</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">State / Province</label>
                                        <input
                                            type="text"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Zip Code</label>
                                        <input
                                            type="text"
                                            value={formData.zipCode}
                                            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Country</label>
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
                                    {loading ? <Loader className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    Save Address
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="label">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showOldPassword ? "text" : "password"}
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            className="input pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                            onMouseDown={(e) => { e.preventDefault(); setShowOldPassword(true); }}
                                            onMouseUp={(e) => { e.preventDefault(); setShowOldPassword(false); }}
                                            onMouseLeave={(e) => { e.preventDefault(); setShowOldPassword(false); }}
                                            onTouchStart={(e) => { e.preventDefault(); setShowOldPassword(true); }}
                                            onTouchEnd={(e) => { e.preventDefault(); setShowOldPassword(false); }}
                                        >
                                            {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">New Password</label>
                                    <div className="relative">
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                onFocus={() => setPasswordFocused(true)}
                                                onBlur={() => setPasswordFocused(false)}
                                                className="input pr-10"
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                                onMouseDown={(e) => { e.preventDefault(); setShowNewPassword(true); }}
                                                onMouseUp={(e) => { e.preventDefault(); setShowNewPassword(false); }}
                                                onMouseLeave={(e) => { e.preventDefault(); setShowNewPassword(false); }}
                                                onTouchStart={(e) => { e.preventDefault(); setShowNewPassword(true); }}
                                                onTouchEnd={(e) => { e.preventDefault(); setShowNewPassword(false); }}
                                            >
                                                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {passwordFocused && (
                                            <div className="absolute z-10 w-full mt-1 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg text-xs text-gray-600 dark:text-gray-300">
                                                <p className="font-semibold mb-1 text-gray-800 dark:text-white">Password must match:</p>
                                                <ul className="pl-4 space-y-1">
                                                    <li className={passwordData.newPassword.length >= 8 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                                                        {passwordData.newPassword.length >= 8 ? '✓' : '•'} At least 8 characters long
                                                    </li>
                                                    <li className={/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                                                        {/[A-Z]/.test(passwordData.newPassword) ? '✓' : '•'} One Uppercase letter (A-Z)
                                                    </li>
                                                    <li className={/(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/.test(passwordData.newPassword) ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                                                        {/(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/.test(passwordData.newPassword) ? '✓' : '•'} One Number (0-9) & One Special Char
                                                    </li>
                                                    <li className={!passwordData.newPassword.toLowerCase().includes('123456') && !passwordData.newPassword.toLowerCase().includes('abcdef') && passwordData.newPassword.length > 0 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                                                        {!passwordData.newPassword.toLowerCase().includes('123456') && !passwordData.newPassword.toLowerCase().includes('abcdef') && passwordData.newPassword.length > 0 ? '✓' : '•'} No sequences (e.g. 123456, abcdef)
                                                    </li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmNewPassword ? "text" : "password"}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="input pr-10"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                                            onMouseDown={(e) => { e.preventDefault(); setShowConfirmNewPassword(true); }}
                                            onMouseUp={(e) => { e.preventDefault(); setShowConfirmNewPassword(false); }}
                                            onMouseLeave={(e) => { e.preventDefault(); setShowConfirmNewPassword(false); }}
                                            onTouchStart={(e) => { e.preventDefault(); setShowConfirmNewPassword(true); }}
                                            onTouchEnd={(e) => { e.preventDefault(); setShowConfirmNewPassword(false); }}
                                        >
                                            {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
                                    {loading ? <Loader className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'danger' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
                            <div className="bg-red-50 p-6 rounded-lg border border-red-100">
                                <h3 className="text-lg font-medium text-red-800 mb-2">Delete Account</h3>
                                <p className="text-red-600 mb-4">
                                    Once you delete your account, there is no going back. Please be certain.
                                </p>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete My Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
