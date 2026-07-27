'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { wishlistAPI } from '@/lib/api';
import { useAuthStore, useAppStore, SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES, CURRENCY_LABELS } from '@/lib/store';
import { ShoppingCart, Heart, User, LogOut, Package, Moon, Sun, ShieldCheck, Globe, DollarSign, Headphones, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProfileImage from './ProfileImage';
import { useCartStore } from '@/hooks/useCartStore';
import { useTheme } from '@/components/ThemeProvider';

export default function Header() {
  const { user, isAuthenticated, logout, setWishlist } = useAuthStore();
  const { currency, setCurrency, language, setLanguage } = useAppStore();
  const { itemCount, fetchCartCount } = useCartStore();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getSupportLink = () => {
    if (!isAuthenticated) return '/support';
    const role = user?.role;
    if (role === 'admin' || role === 'sub_admin') {
      return '/admin/support';
    } else if (role === 'seller') {
      return '/seller/support';
    } else {
      return '/support';
    }
  };

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      fetchWishlist();
      fetchCartCount();
    }
  }, [isAuthenticated]);

  // ... inside JSX ...
  <Link href="/cart" className="text-gray-700 hover:text-primary-600 relative">
    <ShoppingCart className="w-6 h-6" />
    {itemCount > 0 && (
      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
        {itemCount > 99 ? '99+' : itemCount}
      </span>
    )}
  </Link>

  const fetchWishlist = async () => {
    try {
      const response = await wishlistAPI.get();
      // Assuming response.data is array of objects with productId
      const wishlistIds = response.data.map((item: any) => item.productId);
      setWishlist(wishlistIds);
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 dark:bg-gray-900 dark:border-b dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {/* Logo */}
          {/* Logo */}
          <Link
            href={!mounted || (isAuthenticated && user?.role === 'seller' && user?.sellerStatus !== 'approved') ? '/seller/pending' : '/'}
            className="flex items-center gap-2 group"
          >
            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-750 flex items-center justify-center transition-all group-hover:shadow-md">
              <img src="/logo.png" alt="Microcart" className="h-9 md:h-10 w-auto object-contain" />
            </div>
          </Link>

          {/* Navigation */}
          {(!mounted || !(isAuthenticated && user?.role === 'seller' && user?.sellerStatus !== 'approved')) ? (
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="group relative px-4 py-2 font-medium text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
            >
              <span className="relative z-10">Products</span>
              <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary-600 transition-transform duration-300 ease-out group-hover:scale-x-100 dark:bg-primary-400" />
              <span className="absolute inset-0 -z-10 scale-90 rounded-lg bg-gray-100 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 dark:bg-gray-800" />
            </Link>
            {mounted && isAuthenticated && user?.role === 'seller' && (
              <Link
                href="/seller/dashboard"
                className="group relative px-4 py-2 font-medium text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
              >
                <span className="relative z-10">Seller Dashboard</span>
                <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary-600 transition-transform duration-300 ease-out group-hover:scale-x-100 dark:bg-primary-400" />
                <span className="absolute inset-0 -z-10 scale-90 rounded-lg bg-gray-100 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 dark:bg-gray-800" />
              </Link>
            )}
            {mounted && isAuthenticated && (user?.role === 'admin' || user?.role === 'sub_admin') && (
              <Link
                href="/admin/dashboard"
                className="group relative px-4 py-2 font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Admin Panel
                </span>
                <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-indigo-600 transition-transform duration-300 ease-out group-hover:scale-x-100 dark:bg-indigo-400" />
                <span className="absolute inset-0 -z-10 scale-90 rounded-lg bg-indigo-50/50 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 dark:bg-indigo-900/10" />
              </Link>
            )}
          </nav>
          ) : null}

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center gap-1 p-2 text-gray-700 hover:text-primary-600 dark:text-gray-200 uppercase text-xs font-bold">
                <Globe className="w-4 h-4" />
                {mounted ? language : 'EN'}
              </button>
              <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden border border-gray-100 dark:border-gray-700">
                {SUPPORTED_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-primary-50 dark:hover:bg-gray-700 ${language === lang.code ? 'font-bold text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency Selector */}
            <div className="relative group">
              <button className="flex items-center gap-1 p-2 text-gray-700 hover:text-primary-600 dark:text-gray-200 text-xs font-bold whitespace-nowrap">
                {mounted ? CURRENCY_LABELS[currency] || currency : '🇵🇰 PKR'}
              </button>
              <div className="absolute right-0 mt-2 w-28 bg-white dark:bg-gray-800 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden border border-gray-100 dark:border-gray-700">
                {SUPPORTED_CURRENCIES.map(curr => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-primary-50 dark:hover:bg-gray-700 ${currency === curr ? 'font-bold text-primary-600' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    {CURRENCY_LABELS[curr] || curr}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="group relative p-2 text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-400"
              aria-label="Toggle Dark Mode"
            >
              <span className="relative z-10">{theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}</span>
              <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary-600 transition-transform duration-300 ease-out group-hover:scale-x-100 dark:bg-primary-400" />
              <span className="absolute inset-0 -z-10 scale-90 rounded-lg bg-gray-100 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 dark:bg-gray-800" />

              {/* Tooltip */}
              <span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 dark:bg-gray-700">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>

            {mounted && (
              <Link
                href={getSupportLink()}
                className="group relative p-2 text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-400"
                aria-label="Customer Support"
              >
                <span className="relative z-10"><Headphones className="w-6 h-6" /></span>
                <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary-600 transition-transform duration-300 ease-out group-hover:scale-x-100 dark:bg-primary-400" />
                <span className="absolute inset-0 -z-10 scale-90 rounded-lg bg-gray-100 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 dark:bg-gray-805" />

                {/* Tooltip */}
                <span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 dark:bg-gray-700">
                  Support
                </span>
              </Link>
            )}
            {mounted && isAuthenticated ? (
              user?.role === 'seller' && user?.sellerStatus !== 'approved' ? (
                <>
                  <button
                    onClick={handleLogout}
                    className="group relative p-2 text-gray-700 transition-colors hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
                  >
                    <span className="relative z-10 flex items-center gap-2"><LogOut className="w-5 h-5" /> Logout</span>
                  </button>
                </>
              ) : (
              <>
                {user?.role === 'buyer' && (
                  <>
                    <Link
                      href="/wishlist"
                      className="group relative p-2 text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                    >
                      <span className="relative z-10"><Heart className="w-6 h-6" /></span>
                      <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary-600 transition-transform duration-300 ease-out group-hover:scale-x-100 dark:bg-primary-400" />
                      <span className="absolute inset-0 -z-10 scale-90 rounded-lg bg-gray-100 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 dark:bg-gray-800" />

                      {/* Tooltip */}
                      <span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 dark:bg-gray-700">
                        Wishlist
                      </span>
                    </Link>
                    <Link
                      href="/cart"
                      className="group relative p-2 text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                    >
                      <span className="relative z-10">
                        <ShoppingCart className="w-6 h-6" />
                        {itemCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-gray-900">
                            {itemCount > 99 ? '99+' : itemCount}
                          </span>
                        )}
                      </span>
                      <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary-600 transition-transform duration-300 ease-out group-hover:scale-x-100 dark:bg-primary-400" />
                      <span className="absolute inset-0 -z-10 scale-90 rounded-lg bg-gray-100 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 dark:bg-gray-800" />

                      {/* Tooltip */}
                      <span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 dark:bg-gray-700">
                        Cart
                      </span>
                    </Link>
                    <Link
                      href="/orders"
                      className="group relative p-2 text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                    >
                      <span className="relative z-10"><Package className="w-6 h-6" /></span>
                      <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary-600 transition-transform duration-300 ease-out group-hover:scale-x-100 dark:bg-primary-400" />
                      <span className="absolute inset-0 -z-10 scale-90 rounded-lg bg-gray-100 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 dark:bg-gray-800" />

                      {/* Tooltip */}
                      <span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 dark:bg-gray-700">
                        Orders
                      </span>
                    </Link>
                  </>
                )}
                <Link
                  href="/profile"
                  className="group relative p-1 text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                >
                  <span className="relative z-10"><ProfileImage size="sm" /></span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary-600 transition-transform duration-300 ease-out group-hover:scale-x-100 dark:bg-primary-400" />
                  <span className="absolute inset-0 -z-10 scale-90 rounded-lg bg-gray-100 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 dark:bg-gray-800" />

                  {/* Tooltip */}
                  <span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 dark:bg-gray-700">
                    Profile
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="group relative p-2 text-gray-700 transition-colors hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
                >
                  <span className="relative z-10"><LogOut className="w-6 h-6" /></span>
                  <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-red-600 transition-transform duration-300 ease-out group-hover:scale-x-100 dark:bg-red-400" />
                  <span className="absolute inset-0 -z-10 scale-90 rounded-lg bg-gray-100 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 dark:bg-gray-800" />

                  {/* Tooltip */}
                  <span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 dark:bg-gray-700">
                    Logout
                  </span>
                </button>
                <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.firstName}
                </span>
              </>
              )
            ) : (
              <>
                <Link href="/login" className="btn btn-outline text-xs px-3 py-1.5 sm:text-sm sm:px-5 sm:py-2.5">
                  Login
                </Link>
                <Link href="/register" className="btn btn-primary text-xs px-3 py-1.5 sm:text-sm sm:px-5 sm:py-2.5">
                  Register
                </Link>
              </>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:text-primary-600 dark:text-gray-200 focus:outline-none"
              aria-label="Toggle Mobile Navigation"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 pt-3 pb-6 space-y-4 animate-fade-in">
          <nav className="flex flex-col space-y-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-between"
            >
              <span>Products</span>
            </Link>

            {mounted && isAuthenticated && user?.role === 'seller' && (
              <Link
                href="/seller/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-all"
              >
                Seller Dashboard
              </Link>
            )}

            {mounted && isAuthenticated && (user?.role === 'admin' || user?.role === 'sub_admin') && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Panel
              </Link>
            )}

            {mounted && isAuthenticated && user?.role === 'buyer' && (
              <>
                <Link
                  href="/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500" /> Wishlist</span>
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary-500" /> Cart</span>
                  {itemCount > 0 && (
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {itemCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-2"><Package className="w-4 h-4 text-amber-500" /> Orders</span>
                </Link>
              </>
            )}

            <Link
              href={getSupportLink()}
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <Headphones className="w-4 h-4 text-emerald-500" /> Support Center
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
