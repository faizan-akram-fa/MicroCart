'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { cartAPI, ordersAPI } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  CheckCircle2, 
  Loader, 
  ArrowLeft,
  Calendar,
  KeyRound
} from 'lucide-react';

function StripeMockContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('order_id') || searchParams.get('orderId') || '';
  const amountParam = searchParams.get('amount') || '0';
  const amount = parseFloat(amountParam);

  const [cardNumber, setCardNumber] = useState('4242  4242  4242  4242');
  const [expiry, setExpiry] = useState('12 / 28');
  const [cvc, setCvc] = useState('123');
  const [cardHolder, setCardHolder] = useState('Stripe Test Customer');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
  const [statusText, setStatusText] = useState('Contacting Stripe Payment Gateway...');

  useEffect(() => {
    // Security check: if order is already paid, redirect away
    if (typeof window !== 'undefined' && orderId) {
      const isPaid = sessionStorage.getItem(`paid_order_${orderId}`);
      if (isPaid) {
        toast.success('Order payment is already finalized');
        router.replace('/orders');
      }
    }
  }, [orderId, router]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setStep('processing');

    const steps = [
      'Authenticating Stripe API Key...',
      'Verifying Card Details with Issuing Bank...',
      'Performing 3D Secure Authorization...',
      'Settling Funds & Updating Order Status...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setStatusText(steps[currentStep]);
      }
    }, 700);

    try {
      setTimeout(async () => {
        clearInterval(interval);
        
        // Confirm order status in backend if orderId is provided
        if (orderId) {
          try {
            await ordersAPI.updateStatus(orderId, 'paid');
          } catch (err) {
            console.log('Order status auto-update notice:', err);
          }
        }

        await cartAPI.clear();
        if (typeof window !== 'undefined' && orderId) {
          sessionStorage.setItem(`paid_order_${orderId}`, 'true');
        }

        setStep('success');
        toast.success('Stripe Payment Verified Successfully!');

        setTimeout(() => {
          router.replace('/orders');
        }, 1500);
      }, 3000);

    } catch (error: any) {
      clearInterval(interval);
      setIsProcessing(false);
      setStep('input');
      toast.error('Payment processing failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-8 px-4 animate-fade-in font-sans">
      <Toaster position="top-center" />

      {/* Top Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg font-black text-sm tracking-tighter">
            STRIPE
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Test Gateway</span>
        </div>
        <div className="flex items-center text-xs text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/50 font-medium">
          <Lock className="w-3 h-3 mr-1.5" /> 256-bit SSL Encrypted
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Top Accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          {step === 'input' && (
            <form onSubmit={handlePay} className="space-y-6">
              {/* Order Amount Banner */}
              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</p>
                  <p className="text-2xl font-black text-white tracking-tight">
                    PKR {amount ? amount.toLocaleString() : '0'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Merchant</p>
                  <p className="text-xs font-bold text-indigo-400">MicroCart Store</p>
                </div>
              </div>

              {/* Simulated Credit Card Preview */}
              <div className="w-full h-44 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-5 rounded-2xl flex flex-col justify-between shadow-xl border border-indigo-500/30 relative">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-7 bg-amber-400/80 rounded-md border border-amber-300 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-3 w-0.5 bg-slate-900"></div>
                    <div className="absolute inset-x-0 top-3 h-0.5 bg-slate-900"></div>
                  </div>
                  <span className="text-lg font-black italic tracking-tighter text-white">VISA</span>
                </div>

                <div>
                  <p className="text-lg font-mono tracking-widest text-slate-100 mb-2">
                    {cardNumber}
                  </p>
                  <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    <span>{cardHolder}</span>
                    <span>{expiry}</span>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 transition-all pl-11"
                      required
                    />
                    <CreditCard className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Expires (MM / YY)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 transition-all pl-11"
                        required
                      />
                      <Calendar className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      CVC / CVV
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        maxLength={4}
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 transition-all pl-11"
                        required
                      />
                      <KeyRound className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Pay Button */}
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 text-base flex items-center justify-center space-x-2 active:scale-98"
              >
                <Lock className="w-4 h-4" />
                <span>Pay PKR {amount ? amount.toLocaleString() : '0'}</span>
              </button>

              <p className="text-[11px] text-center text-slate-500">
                Test mode active — uses Stripe 4242 4242 test card simulation
              </p>
            </form>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center space-y-6 animate-fade-in">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                <CreditCard className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Authorizing Card Payment</h3>
                <p className="text-xs text-indigo-400 font-mono animate-pulse">{statusText}</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-10 text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-emerald-950/80 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-900/40">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-2">Payment Verified!</h3>
                <p className="text-xs text-slate-400">Your order has been authorized by Stripe.</p>
              </div>
              <p className="text-xs text-indigo-400 font-medium">Redirecting to your orders page...</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center pt-6 border-t border-slate-800 text-[11px] text-slate-500">
        <p>Powered by Stripe Payment Gateway • 256-Bit TLS Encryption</p>
      </footer>
    </div>
  );
}

export default function StripeMockPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <StripeMockContent />
    </Suspense>
  );
}
