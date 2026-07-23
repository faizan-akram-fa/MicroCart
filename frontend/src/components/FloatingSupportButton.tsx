'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { supportAPI } from '@/lib/api';
import { Headphones, MessageCircle } from 'lucide-react';

export default function FloatingSupportButton() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  // Do not show the floating button if we are already on a support page
  const isSupportPage = pathname?.includes('/support');
  
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await supportAPI.getUnreadCount();
      setUnreadCount(res.data || 0);
    } catch (err) {
      console.error('Failed to fetch unread support notifications count:', err);
    }
  };

  useEffect(() => {
    if (isSupportPage) return;
    
    fetchUnreadCount();
    // Poll unread count every 45 seconds
    const interval = setInterval(fetchUnreadCount, 45000);
    return () => clearInterval(interval);
  }, [isAuthenticated, pathname, isSupportPage]);

  if (isSupportPage) return null;

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push('/support');
      return;
    }

    const role = user?.role;
    if (role === 'admin' || role === 'sub_admin') {
      router.push('/admin/support');
    } else if (role === 'seller') {
      router.push('/seller/support');
    } else {
      router.push('/support');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Tooltip text */}
      <div 
        className={`bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xl border border-gray-800 dark:border-gray-100 transition-all duration-300 transform whitespace-nowrap ${
          showTooltip ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-75 pointer-events-none'
        }`}
      >
        {unreadCount > 0 
          ? `You have ${unreadCount} new support replies!` 
          : 'Need Help? Support Center'
        }
      </div>

      {/* Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative group flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-2xl shadow-[0_8px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.5)] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer active:scale-95"
      >
        {/* Pulsing ring if there are unread messages */}
        {unreadCount > 0 && (
          <span className="absolute inset-0 rounded-2xl border-4 border-rose-500 animate-ping opacity-75"></span>
        )}

        {/* Headphones icon */}
        <Headphones className="w-6 h-6 transition-transform duration-500 group-hover:rotate-12" />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black rounded-full h-6 w-6 flex items-center justify-center border-2 border-white dark:border-gray-950 animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
