'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

import { Suspense } from 'react';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuthStore();

    useEffect(() => {
        const token = searchParams.get('token');
        const role = searchParams.get('role');

        if (token) {
            localStorage.setItem('token', token);

            // Fetch full profile and login for all users (including pending)
            authAPI.getProfile().then((res) => {
                login(res.data, token);
                toast.success('Login successful!');
                
                if (res.data.role === 'pending') {
                    router.push('/role-selection');
                } else if (res.data.role === 'seller') {
                    if (res.data.sellerStatus !== 'approved') {
                        router.push('/seller/pending');
                    } else {
                        router.push('/seller/dashboard');
                    }
                } else {
                    router.push('/');
                }
            }).catch((err) => {
                console.error('Profile fetch error:', err);
                toast.error('Failed to verify login');
                router.push('/login');
            });
        } else {
            router.push('/login');
        }
    }, [searchParams, router, login]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Processing login...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
