'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, ShoppingCart, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';
import { ordersAPI, cartAPI } from '@/lib/api';
import toast from 'react-hot-toast';

function CancelDetails() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<'loading' | 'cancelled' | 'error'>('loading');
  const [restoring, setRestoring] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    
    if (orderId) {
      const cancelOrder = async () => {
        try {
          const ids = orderId.split(',');
          let allItems: any[] = [];
          
          for (const id of ids) {
            try {
              const orderRes = await ordersAPI.getById(id);
              if (orderRes.data && orderRes.data.items) {
                allItems = [...allItems, ...orderRes.data.items];
              }
            } catch (e) {
              console.warn(`Could not load details for order ${id}`, e);
            }
          }
          setOrderItems(allItems);

          // Call the order cancel & stock restoration endpoint
          await ordersAPI.cancelPayment(orderId);
          setStatus('cancelled');
          toast.success('Orders cancelled successfully. Stocks restored.');
        } catch (err) {
          console.error('Failed to cancel order:', err);
          setStatus('error');
        }
      };
      cancelOrder();
    } else {
      setStatus('error');
    }
  }, [orderId]);

  const handleRestoreCart = async () => {
    if (orderItems.length === 0) {
      toast.error('No items found in this order to restore.');
      return;
    }

    setRestoring(true);
    toast.loading('Restoring your shopping cart...', { id: 'restore' });

    try {
      // Re-add each item to the user's cart
      for (const item of orderItems) {
        await cartAPI.add({
          productId: item.productId,
          quantity: item.quantity,
          sellerId: item.sellerId
        });
      }
      toast.success('Cart items restored successfully!', { id: 'restore' });
      router.push('/cart');
    } catch (err) {
      console.error('Failed to restore cart:', err);
      toast.error('Failed to restore cart items.', { id: 'restore' });
    } finally {
      setRestoring(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {orderId && (
        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 border border-slate-150 dark:border-slate-800/80 text-left space-y-3 font-medium">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-bold">Cancelled Order ID:</span>
            <span className="text-slate-700 dark:text-slate-350 font-mono font-bold select-all">{orderId}</span>
          </div>
          <div className="flex justify-between text-xs items-center">
            <span className="text-slate-400 dark:text-slate-500 font-bold">Status:</span>
            {status === 'loading' && (
              <span className="text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Restoring Stocks...
              </span>
            )}
            {status === 'cancelled' && (
              <span className="text-rose-500 font-bold uppercase tracking-wider flex items-center gap-1">
                ● Cancelled & Released
              </span>
            )}
            {status === 'error' && (
              <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                ● Unknown Order State
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        {orderItems.length > 0 && (
          <button
            onClick={handleRestoreCart}
            disabled={restoring}
            className="w-full inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-sm font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md hover:shadow-lg transition-all gap-2 disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" /> Restore Cart & Retry Checkout
          </button>
        )}
        
        <Link
          href="/"
          className="w-full inline-flex items-center justify-center px-6 py-3.5 border border-slate-200 dark:border-slate-800 text-sm font-bold rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Homepage
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
        {/* Subtle decorative background gradients */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl"></div>

        {/* Animated Warning Icon */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 bg-rose-50 dark:bg-rose-950/30 rounded-full mb-6 text-rose-500 dark:text-rose-455">
          <div className="absolute inset-0 bg-rose-400/20 rounded-full animate-ping opacity-75 duration-1000"></div>
          <XCircle className="w-12 h-12 relative z-10" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
          Payment Cancelled
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Your credit card transaction was not completed. No funds were charged and the order has been cancelled.
        </p>

        <Suspense fallback={<div className="h-24 flex items-center justify-center text-xs text-slate-400">Loading details...</div>}>
          <CancelDetails />
        </Suspense>
      </div>
    </div>
  );
}
