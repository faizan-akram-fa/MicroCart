import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  wishlist: string[];
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setWishlist: (wishlist: string[]) => void;
  addToWishlistStore: (productId: string) => void;
  removeFromWishlistStore: (productId: string) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize from localStorage if available
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken,
    isAuthenticated: !!storedToken,
    wishlist: [],
    login: (user, token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false, wishlist: [] });
    },
    updateUser: (user) => {
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    },
    setWishlist: (wishlist) => set({ wishlist }),
    addToWishlistStore: (productId) => set((state) => ({ wishlist: [...state.wishlist, productId] })),
    removeFromWishlistStore: (productId) => set((state) => ({ wishlist: state.wishlist.filter((id) => id !== productId) })),
  };
});

export const SUPPORTED_CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];
export const CURRENCY_LABELS: Record<string, string> = {
  PKR: '🇵🇰 PKR',
  USD: '🇺🇸 USD',
  EUR: '🇪🇺 EUR',
  GBP: '🇬🇧 GBP',
  AED: '🇦🇪 AED',
  SAR: '🇸🇦 SAR',
};
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ar', name: 'Arabic' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
];

interface AppState {
  currency: string;
  exchangeRates: Record<string, number>;
  language: string;
  setCurrency: (currency: string) => void;
  setLanguage: (language: string) => void;
  fetchExchangeRates: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  currency: typeof window !== 'undefined' ? localStorage.getItem('currency') || 'PKR' : 'PKR',
  language: typeof window !== 'undefined' ? localStorage.getItem('language') || 'en' : 'en',
  exchangeRates: { PKR: 1 }, // Default fallback
  setCurrency: (currency) => {
    if (typeof window !== 'undefined') localStorage.setItem('currency', currency);
    set({ currency });
  },
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
      document.cookie = `googtrans=/en/${language}; path=/;`;
      window.location.reload();
    }
    set({ language });
  },
  fetchExchangeRates: async () => {
    if (typeof window === 'undefined') return;
    try {
      const cacheKey = 'exchange_rates_cache';
      const cacheTimeKey = 'exchange_rates_time';
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheTimeKey);
      
      const now = new Date().getTime();
      // Use cache if less than 24 hours old
      if (cached && cacheTime && now - Number(cacheTime) < 24 * 60 * 60 * 1000) {
        set({ exchangeRates: JSON.parse(cached) });
        return;
      }
      
      // Fetch fresh rates relative to PKR
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/PKR');
      const data = await res.json();
      
      if (data && data.rates) {
        localStorage.setItem(cacheKey, JSON.stringify(data.rates));
        localStorage.setItem(cacheTimeKey, now.toString());
        set({ exchangeRates: data.rates });
      }
    } catch (e) {
      console.error('Failed to fetch exchange rates', e);
    }
  }
}));
