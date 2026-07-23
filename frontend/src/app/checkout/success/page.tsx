'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ShoppingBag, ArrowRight, Heart } from 'lucide-react';

function SuccessDetails() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If we want to simulate a webhook call for mock sessions immediately:
    if (sessionId && sessionId.startsWith('cs_mock_') && orderId) {
      // Direct call to public local webhook to automatically transition the order
      fetch(`http://localhost:3004/orders/stripe-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'checkout.session.completed',
          data: {
            object: {
              id: sessionId,
              payment_status: 'paid',
              metadata: { orderId }
            }
          }
        })
      }).catch(err => console.warn('Could not run mock webhook trigger:', err));
    }
  }, [sessionId, orderId]);

  if (!mounted) return null;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-5 mb-8 border border-slate-150 dark:border-slate-800/80 text-left space-y-3 font-medium">
      {orderId && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-bold">Order ID:</span>
          <span className="text-slate-700 dark:text-slate-300 font-mono font-bold select-all">{orderId}</span>
        </div>
      )}
      {sessionId && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-bold">Session ID:</span>
          <span className="text-slate-700 dark:text-slate-350 font-mono truncate max-w-[180px]" title={sessionId}>
            {sessionId}
          </span>
        </div>
      )}
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 dark:text-slate-500 font-bold">Status:</span>
        <span className="text-emerald-600 dark:text-emerald-455 font-bold uppercase tracking-wider flex items-center gap-1">
          ● Confirmed
        </span>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-105 dark:border-slate-800 text-center relative overflow-hidden">
        {/* Subtle decorative background gradients */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl"></div>

        {/* Animated Check Icon */}
        <div className="relative inline-flex items-center justify-center w-24 h-24 bg-emerald-50 dark:bg-emerald-950/30 rounded-full mb-6 text-emerald-500 dark:text-emerald-400">
          <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping opacity-75 duration-1000"></div>
          <CheckCircle className="w-12 h-12 relative z-10" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
          Payment Successful!
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Thank you for your purchase. Your order has been placed and is currently being processed.
        </p>

        <Suspense fallback={<div className="h-24 flex items-center justify-center text-xs text-slate-400">Loading order details...</div>}>
          <SuccessDetails />
        </Suspense>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/orders"
            className="w-full inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-sm font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md hover:shadow-lg transition-all gap-2"
          >
            <ShoppingBag className="w-4 h-4" /> View Your Orders <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-6 py-3.5 border border-slate-200 dark:border-slate-800 text-sm font-bold rounded-2xl text-slate-705 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all gap-2"
          >
            <Heart className="w-4 h-4 text-rose-505" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
