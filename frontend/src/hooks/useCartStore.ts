import { create } from 'zustand';
import { cartAPI } from '@/lib/api';

interface CartStore {
    itemCount: number;
    fetchCartCount: () => Promise<void>;
    updateCount: (count: number) => void;
    syncCart: (items: any[]) => void;
    increment: (amount?: number) => void;
    decrement: (amount?: number) => void;
}

export const useCartStore = create<CartStore>((set) => ({
    itemCount: 0,

    fetchCartCount: async () => {
        try {
            const response = await cartAPI.get();
            // Assuming the response structure contains an items array in data
            // Adjust if the API returns something else (e.g. response.data.cart.items)
            const items = response.data.items || [];

            // Calculate total quantity of items
            const count = items.reduce((acc: number, item: any) => acc + item.quantity, 0);

            set({ itemCount: count });
        } catch (error) {
            console.error('Failed to fetch cart count', error);
            // Don't reset to 0 on error effectively, keep previous or set 0? 
            // Safest is to leave it or set 0 if auth error.
        }
    },

    syncCart: (items: any[]) => {
        const count = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
        set({ itemCount: count });
    },

    updateCount: (count) => set({ itemCount: count }),

    increment: (amount = 1) => set((state) => ({ itemCount: state.itemCount + amount })),

    decrement: (amount = 1) => set((state) => ({ itemCount: Math.max(0, state.itemCount - amount) })),
}));
