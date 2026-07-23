'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';

export default function ProfileCompletionModal() {
    const { user, isAuthenticated } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only show if authenticated and not already on the profile page
        if (isAuthenticated && user && pathname !== '/profile') {
            // Check for missing critical fields
            const isRestrictedRole = user.role === 'admin' || user.role === 'sub_admin';
            const isUnapprovedSeller = user.role === 'seller' && user.sellerStatus !== 'approved';
            const isIncomplete = !user.phone || !user.address || !user.city;
            
            if (isIncomplete && !isRestrictedRole && !isUnapprovedSeller) {
                // Check if we've already shown it this session (optional, but good UX)
                // For now, per requirement: "every login till it will add the details"
                // so we show it if fields are missing.
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        } else {
            setIsOpen(false);
        }
    }, [isAuthenticated, user, pathname]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-slide-up relative">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
                        <svg className="h-6 w-6 text-primary-600 dark:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Complete Your Profile
                    </h3>

                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Please complete your profile details (Address, Phone, etc.) to enjoy the full experience.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="btn btn-primary w-full justify-center"
                        >
                            Complete Profile Now
                        </Link>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="btn bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 w-full justify-center"
                        >
                            Remind Me Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
