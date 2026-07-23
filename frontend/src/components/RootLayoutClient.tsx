'use client';

import { usePathname, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/ThemeProvider';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';
import FloatingSupportButton from '@/components/FloatingSupportButton';
import { useAppStore, useAuthStore } from '@/lib/store';
import { useEffect } from 'react';

export default function RootLayoutClient({
  children,
  interClassName,
}: {
  children: React.ReactNode;
  interClassName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname?.startsWith('/admin');
  const { fetchExchangeRates } = useAppStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchExchangeRates();
  }, [fetchExchangeRates]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname]);

  useEffect(() => {
    if (isAuthenticated && user?.mustChangePassword && pathname !== '/change-password') {
      router.replace('/change-password');
    }
  }, [isAuthenticated, user, pathname, router]);

  return (
    <body className={interClassName} suppressHydrationWarning>
      <ThemeProvider>
        <div className="flex flex-col min-h-screen">
          {!isAdminRoute && <Header />}
          <main className="flex-grow dark:bg-gray-900 transition-colors duration-200" suppressHydrationWarning>
            {children}
          </main>
        </div>
        <Toaster 
          position="top-right" 
          containerStyle={{ top: 90, zIndex: 999999 }}
          toastOptions={{
            style: {
              zIndex: 999999,
            },
          }}
        />
        <ProfileCompletionModal />
        <FloatingSupportButton />
      </ThemeProvider>
    </body>
  );
}
