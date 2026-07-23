'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, Shield, Info, ArrowLeft, Loader, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

function StripeMockDetails() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || '';
  const amount = searchParams.get('amount') || '0';

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length < 16) {
      toast.error('Please enter a valid 16-digit card number');
      return;
    }
    if (expiry.length < 4) {
      toast.error('Please enter a valid expiry date (MM/YY)');
      return;
    }
    if (cvc.length < 3) {
      toast.error('Please enter a valid 3-digit CVC');
      return;
    }

    setLoading(true);
    toast.loading('Processing payment securely...', { id: 'stripe-pay' });

    setTimeout(() => {
      setLoading(false);
      toast.success('Payment authorized successfully!', { id: 'stripe-pay' });
      // Generate a mock Stripe checkout session ID starting with 'cs_mock_' so success page triggers webhook confirmation
      const mockSessionId = `cs_mock_${Math.floor(100000 + Math.random() * 900000)}`;
      window.location.href = `/checkout/success?session_id=${mockSessionId}&order_id=${orderId}`;
    }, 2000);
  };

  const handleCancel = () => {
    toast.error('Payment cancelled by user');
    window.location.href = `/checkout/cancel?order_id=${orderId}`;
  };

  return (
    <div className="grid md:grid-cols-12 gap-8 items-start">
      {/* Left Column: Order Summary */}
      <div className="md:col-span-5 bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6 text-left">
        <div>
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">MicroCart Checkout Gateway</span>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-1">Payment Summary</h2>
        </div>

        <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-800 py-4 space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-slate-400">Order ID</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{orderId.slice(0, 16)}...</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-slate-400">Merchant</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">MicroCart Network Inc.</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-slate-400">Currency</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">PKR (Rs)</span>
          </div>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-sm font-black text-slate-850 dark:text-slate-300 uppercase">Amount Due</span>
          <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">Rs {Number(amount).toLocaleString()}</span>
        </div>

        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl p-4 border border-indigo-100/30 flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div className="text-[11px] text-indigo-650 dark:text-indigo-400 leading-relaxed font-semibold">
            This is a mock Stripe Checkout environment. No real funds will be charged. You can test payment success or cancellation.
          </div>
        </div>
      </div>

      {/* Right Column: Stripe Form Card */}
      <form onSubmit={handlePay} className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl shadow-xl space-y-6 text-left relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-3">
            <Loader className="w-10 h-10 text-indigo-600 animate-spin" />
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest animate-pulse">Authorizing Card...</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" /> Card Information
          </h3>
          <span className="bg-indigo-500/10 border border-indigo-400/20 text-indigo-500 text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">Stripe Mock</span>
        </div>

        {/* Card Fields Form */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cardholder Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700/60 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm font-semibold text-slate-800 dark:text-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Card Number</label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={19}
                value={cardNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  const formatted = val.replace(/(.{4})/g, '$1 ').trim();
                  setCardNumber(formatted);
                }}
                placeholder="4242 4242 4242 4242"
                className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-155 dark:border-slate-700/60 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm font-semibold text-slate-850 dark:text-white tracking-widest transition-all"
              />
              <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expiration Date</label>
              <input
                type="text"
                required
                maxLength={5}
                value={expiry}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length >= 2) {
                    setExpiry(`${val.slice(0,2)}/${val.slice(2,4)}`);
                  } else {
                    setExpiry(val);
                  }
                }}
                placeholder="MM/YY"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700/60 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm font-semibold text-slate-800 dark:text-white transition-all text-center tracking-widest"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CVC Security Code</label>
              <input
                type="password"
                required
                maxLength={3}
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                placeholder="•••"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700/60 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm font-semibold text-slate-800 dark:text-white transition-all text-center tracking-widest"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-sm font-black rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md hover:shadow-lg transition-all"
          >
            Pay Rs {Number(amount).toLocaleString()}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            className="w-full inline-flex items-center justify-center px-6 py-3.5 border border-slate-100 dark:border-slate-800 text-sm font-bold rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 transition-all gap-1.5"
          >
            Cancel and Return to Merchant
          </button>
        </div>
      </form>
    </div>
  );
}

export default function StripeMockCheckoutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl"></div>

        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">
              S
            </div>
            <h1 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">Stripe Checkout Simulation</h1>
            <p className="text-xs text-slate-400 font-medium">Securely hosted by Stripe Mock Gateway</p>
          </div>

          <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-400 text-xs">Initializing mock gateway...</div>}>
            <StripeMockDetails />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
