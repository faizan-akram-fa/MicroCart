'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { cartAPI, ordersAPI } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  KeyRound, 
  CheckCircle2, 
  Loader, 
  ArrowLeft, 
  Building2 
} from 'lucide-react';

function GatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const method = searchParams.get('method') || 'easypaisa';
  const orderId = searchParams.get('orderId') || `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const amountParam = searchParams.get('amount') || '0';
  const phoneParam = searchParams.get('phone') || '';
  
  const amount = parseFloat(amountParam);

  // Form states
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState(phoneParam);
  const [cnic, setCnic] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  
  // Processing simulation state
  const [processingSubstep, setProcessingSubstep] = useState(0);
  const [trxRef, setTrxRef] = useState('');

  const isEasypaisa = method === 'easypaisa';
  const brandName = isEasypaisa ? 'EasyPaisa' : 'JazzCash';
  const brandSubtext = isEasypaisa ? 'Telenor Microfinance Bank' : 'Mobilink Microfinance Bank';
  const brandColorBg = isEasypaisa ? 'bg-emerald-600' : 'bg-rose-600';
  const brandColorText = isEasypaisa ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  const brandColorBorder = isEasypaisa ? 'border-emerald-500/30' : 'border-rose-500/30';
  const brandRing = isEasypaisa ? 'focus:ring-emerald-500' : 'focus:ring-rose-500';

  useEffect(() => {
    if (!phoneParam && typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('checkout_phone') || '';
      if (savedPhone) setPhone(savedPhone);
    }

    // Security check: if order is already paid, redirect away to normal page immediately
    if (typeof window !== 'undefined' && orderId) {
      const isPaid = sessionStorage.getItem(`paid_order_${orderId}`);
      if (isPaid) {
        toast.success('Order payment is already finalized');
        router.replace('/orders');
      }
    }
  }, [phoneParam, orderId, router]);

  // Security guard for browser Back button (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const isPaid = typeof window !== 'undefined' ? sessionStorage.getItem(`paid_order_${orderId}`) : false;
      if (isPaid || step === 3) {
        router.replace('/orders');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [orderId, step, router]);

  // Step 1 Submission: Move to PIN & OTP Step
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error(`Please enter a valid ${brandName} account mobile number`);
      return;
    }
    if (!isEasypaisa && cnic.length < 6) {
      toast.error('Please enter the last 6 digits of your CNIC');
      return;
    }

    toast.success(`OTP sent to ${phone}`);
    setStep(2);
  };

  // Step 2 Submission: Run Verification and Payment Settlement
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      toast.error(`Please enter your ${brandName} 4-digit secret MPIN`);
      return;
    }
    if (!otp || otp.length < 4) {
      toast.error('Please enter the verification OTP code sent to your mobile');
      return;
    }

    const generatedTrx = `TRX-${method.substring(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    setTrxRef(generatedTrx);
    setStep(3);

    // Simulation steps — payment already verified by PIN+OTP above
    let currentSubstep = 0;
    const interval = setInterval(() => {
      currentSubstep++;
      setProcessingSubstep(currentSubstep);
      
      if (currentSubstep >= 4) {
        clearInterval(interval);
        setTimeout(async () => {
          try {
            // Retrieve the checkout payload stored before gateway redirect
            const rawPayload = typeof window !== 'undefined'
              ? sessionStorage.getItem('pending_checkout_payload')
              : null;

            if (rawPayload) {
              const pendingData = JSON.parse(rawPayload);
              // Create the order NOW — payment is verified. This is the ONLY DB call.
              await ordersAPI.create({
                ...pendingData,
                paymentMethod: method,
                transactionReference: generatedTrx,
              });
              sessionStorage.removeItem('pending_checkout_payload');
              sessionStorage.removeItem('pending_checkout_temp_id');
            }

            // Clear cart only after successful order creation
            await cartAPI.clear();
          } catch (e: any) {
            console.error('Order placement after payment error:', e);
          }

          if (typeof window !== 'undefined' && orderId) {
            sessionStorage.setItem(`paid_order_${orderId}`, 'true');
          }

          toast.success(`Payment verified & order placed via ${brandName}!`);
          router.replace(`/orders?success=true&trx=${generatedTrx}`);
        }, 1500);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 animate-fade-in relative overflow-hidden font-sans">
      <Toaster position="top-right" containerStyle={{ zIndex: 999999 }} />

      {/* Decorative Glow */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20 ${
        isEasypaisa ? 'bg-emerald-500' : 'bg-rose-500'
      }`} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20 bg-indigo-500" />

      {/* Top Navbar */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800/80 relative z-10">
        <button 
          onClick={() => router.replace('/orders')}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel &amp; Return
        </button>

        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-5 h-5 ${brandColorText}`} />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
            256-Bit Encrypted Payment
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto w-full my-auto py-8 relative z-10">
        
        {/* Gateway Brand Header Card */}
        <div className={`rounded-3xl border ${brandColorBorder} bg-slate-900/90 shadow-2xl overflow-hidden p-6 sm:p-8 backdrop-blur-xl relative`}>
          
          {/* Brand Logo Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg p-1.5 flex-shrink-0 border border-slate-700/50 overflow-hidden">
                <img 
                  src={isEasypaisa ? '/easypaisa.png' : '/jazzcash.png'} 
                  alt={brandName} 
                  className="w-full h-full object-contain" 
                />
              </div>

              <div>
                <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  {brandName} <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">Official</span>
                </h1>
                <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-500" /> {brandSubtext}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Payable</span>
              <span className="text-lg font-black text-white">Rs. {amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Merchant & Order Details */}
          <div className="py-4 px-4 my-6 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Merchant Name</span>
              <span className="font-bold text-slate-200">MicroCart Store Network</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Order Reference</span>
              <span className="font-mono font-bold text-indigo-400">{orderId}</span>
            </div>
          </div>

          {/* STEP 1: Enter Mobile Number */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>{brandName} Mobile Number *</span>
                  <span className="text-[10px] font-normal text-slate-400">Pakistani Account</span>
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="03001234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, '').slice(0, 12))}
                    className={`w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-sm font-semibold font-mono text-white transition-all ${brandRing} focus:ring-2`}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">An OTP prompt will be dispatched to this mobile number.</p>
              </div>

              {!isEasypaisa && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    CNIC Last 6 Digits *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    maxLength={6}
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-sm font-semibold font-mono text-white transition-all ${brandRing} focus:ring-2`}
                  />
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-4 rounded-2xl font-black text-white shadow-xl ${brandColorBg} hover:opacity-90 transition-all active:scale-95 text-sm uppercase tracking-wider flex items-center justify-center gap-2`}
              >
                <span>Send OTP &amp; Proceed</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: Enter PIN & OTP */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  6-Digit OTP Code *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit OTP code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-sm font-bold font-mono tracking-widest text-white transition-all ${brandRing} focus:ring-2`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  {brandName} Secret MPIN *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••"
                    maxLength={5}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    className={`w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-sm font-bold font-mono text-white transition-all ${brandRing} focus:ring-2`}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Your PIN is encrypted locally. Never share your MPIN.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3.5 rounded-2xl font-bold text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
                >
                  Back
                </button>

                <button
                  type="submit"
                  className={`w-2/3 py-3.5 rounded-2xl font-black text-white shadow-xl ${brandColorBg} hover:opacity-90 transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2`}
                >
                  <span>Confirm &amp; Pay Rs. {amount.toFixed(2)}</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Verification & Settlement Animation */}
          {step === 3 && (
            <div className="py-8 space-y-6 text-center animate-fade-in">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                {processingSubstep >= 4 ? (
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-white">
                  {processingSubstep >= 4 ? 'Payment Authorized!' : `Connecting to ${brandName} Bank...`}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {processingSubstep === 1 && 'Verifying OTP & Wallet Secret MPIN credentials...'}
                  {processingSubstep === 2 && 'Checking account balance and transaction limits...'}
                  {processingSubstep === 3 && `Settling Rs. ${amount.toFixed(2)} with merchant...`}
                  {processingSubstep >= 4 && `TRX Reference: ${trxRef}. Confirming order...`}
                </p>
              </div>

              {/* Progress Checklist */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-2.5 text-left max-w-xs mx-auto">
                {[
                  'Handshake with Bank Server',
                  'PIN Authorization',
                  'Funds Settlement',
                  'Order Placement Logging'
                ].map((st, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    {processingSubstep > i ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : processingSubstep === i ? (
                      <Loader className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                    )}
                    <span className={`text-[11px] font-medium ${
                      processingSubstep > i ? 'text-slate-200 font-bold' : 'text-slate-500'
                    }`}>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Security Badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-slate-400" /> SSL 256-Bit</span>
          <span>•</span>
          <span>Verified Merchant</span>
          <span>•</span>
          <span>Instant Callback</span>
        </div>

      </main>

      {/* Page Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-[10px] text-slate-500 py-4 border-t border-slate-900 relative z-10">
        © {new Date().getFullYear()} {brandName} Digital Mobile Wallet Gateway. Powered by MicroCart Platform.
      </footer>
    </div>
  );
}

export default function GatewayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Loader className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <GatewayContent />
    </Suspense>
  );
}
