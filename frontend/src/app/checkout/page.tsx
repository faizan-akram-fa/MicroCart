'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartAPI, ordersAPI, promotionsAPI, productsAPI } from '@/lib/api';
import { useAuthStore, useAppStore } from '@/lib/store';
import { formatPrice } from '@/lib/currency';
import { CartItem } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import { 
  CreditCard, 
  Wallet, 
  Coins, 
  ShieldCheck, 
  Loader, 
  ArrowLeft,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function CheckoutPage() {
  const [cart, setCart] = useState<{ items: CartItem[] }>({ items: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();
  const { currency, exchangeRates } = useAppStore();
  
  // Promo code states
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [productsInfo, setProductsInfo] = useState<Record<string, any>>({});

  // Form states
  const [formData, setFormData] = useState({
    shippingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
  });

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'card' | 'easypaisa' | 'jazzcash'>('cash_on_delivery');
  
  // Card input states
  const [cardData, setCardData] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
  });

  // Wallet input states
  const [walletPhone, setWalletPhone] = useState('');
  const [walletCnic, setWalletCnic] = useState('');

  // Simulation modal states
  const [showSimModal, setShowSimModal] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simStepsText, setSimStepsText] = useState<string[]>([]);

  useEffect(() => {
    fetchCart();
    if (user) {
      setFormData(prev => ({
        ...prev,
        shippingAddress: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        phone: user.phone || '',
      }));
      setWalletPhone(user.phone || '');
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const response = await cartAPI.get();
      if (response.data.items.length === 0) {
        toast.error('Your cart is empty');
        router.push('/cart');
        return;
      }
      setCart(response.data);

      // Fetch product info to get descriptions for shipping
      const infoMap: Record<string, any> = {};
      await Promise.all(
        response.data.items.map(async (item: CartItem) => {
          try {
            const pRes = await productsAPI.getById(item.productId);
            infoMap[item.productId] = pRes.data;
          } catch (e) {
            console.error('Failed to load product details for', item.productId, e);
          }
        })
      );
      setProductsInfo(infoMap);
    } catch (error) {
      toast.error('Failed to load cart');
      router.push('/cart');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    
    if (name === 'number') {
      // Format: 4444 4444 4444 4444
      value = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
    } else if (name === 'expiry') {
      // Format: MM/YY
      value = value.replace(/\D/g, '');
      if (value.length > 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
      value = value.slice(0, 5);
    } else if (name === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 3);
    }

    setCardData({
      ...cardData,
      [name]: value,
    });
  };

  const handleWalletPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletPhone(e.target.value.replace(/[^\d+]/g, '').slice(0, 15));
  };

  const calculateTotal = () => {
    return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getProductShippingCost = (description: string) => {
    if (!description) return 0;
    const match = description.match(/\[Shipping:\s*(Free|(\d+(\.\d+)?))\]/i);
    if (match) {
      if (match[1].toLowerCase() === 'free') return 0;
      const val = parseFloat(match[1]);
      return isNaN(val) ? 0 : val;
    }
    return 0;
  };

  const calculateShipping = () => {
    if (appliedPromo && (appliedPromo.code.toUpperCase().includes('FREE') || appliedPromo.code.toUpperCase().includes('SHIP'))) {
      return 0;
    }
    return cart.items.reduce((sum, item) => {
      const prod = productsInfo[item.productId];
      if (prod) {
        const cost = getProductShippingCost(prod.description);
        return sum + (cost * item.quantity);
      }
      return sum;
    }, 0);
  };

  const calculateFinalTotal = () => {
    const subtotal = calculateTotal();
    const discount = appliedPromo ? appliedPromo.discountAmount : 0;
    const shipping = calculateShipping();
    return Math.max(0, subtotal - discount + shipping);
  };

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setValidatingPromo(true);
    try {
      const res = await promotionsAPI.validate({ code: promoCode, cartItems: cart.items });
      setAppliedPromo(res.data);
      toast.success('Promo code applied successfully!');
    } catch (error: any) {
      setAppliedPromo(null);
      toast.error(error.response?.data?.message || 'Invalid promo code');
    } finally {
      setValidatingPromo(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const executeOrderPlacement = async (txnRef?: string) => {
    try {
      const orderData = {
        items: cart.items.map(item => {
          const prod = productsInfo[item.productId];
          return {
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
            sellerId: item.sellerId,
            shipping: prod ? getProductShippingCost(prod.description) : 0,
          };
        }),
        totalAmount: calculateFinalTotal(),
        promoCode: appliedPromo?.code,
        paymentMethod,
        transactionReference: txnRef || null,
        ...formData,
      };

      await ordersAPI.create(orderData);
      await cartAPI.clear();

      toast.success('Order placed successfully!');
      router.push('/orders');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  const runPaymentSimulation = () => {
    const steps = [
      'Initializing secure handshake with payment gateway...',
      'Validating payment details and credentials...',
      'Authorizing transaction and settling funds securely...',
      'Finalizing payment verification logs...',
      'Payment authorized! Logging order placement...'
    ];
    setSimStepsText(steps);
    setSimStep(0);
    setShowSimModal(true);

    const interval = setInterval(() => {
      setSimStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setTimeout(async () => {
            const ref = `TRX-${paymentMethod.substring(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
            setShowSimModal(false);
            await executeOrderPlacement(ref);
          }, 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
  };

  const runRealPaymentFlow = async () => {
    const brandLabel = paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash';
    const steps = [
      `Connecting to ${brandLabel} secure gateway...`,
      'Preparing checkout session...',
      'Securing SSL handshake...',
      `Redirecting to ${brandLabel} Portal...`
    ];
    setSimStepsText(steps);
    setSimStep(0);
    setShowSimModal(true);

    const interval = setInterval(() => {
      setSimStep((prev) => {
        if (prev < steps.length - 2) return prev + 1;
        return prev;
      });
    }, 400);

    try {
      // Build order payload — do NOT call API yet, store in sessionStorage only
      const orderPayload = {
        items: cart.items.map(item => {
          const prod = productsInfo[item.productId];
          return {
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
            sellerId: item.sellerId,
            shipping: prod ? getProductShippingCost(prod.description) : 0,
          };
        }),
        totalAmount: calculateFinalTotal(),
        promoCode: appliedPromo?.code,
        paymentMethod,
        walletPhone,
        cnic: paymentMethod === 'jazzcash' ? walletCnic : undefined,
        ...formData,
      };

      const tempId = `TEMP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      // Store payload in sessionStorage — the gateway will create the order after verified payment
      sessionStorage.setItem('pending_checkout_payload', JSON.stringify(orderPayload));
      sessionStorage.setItem('pending_checkout_temp_id', tempId);
      localStorage.setItem('checkout_phone', walletPhone);

      clearInterval(interval);
      setSimStep(steps.length - 1);

      setTimeout(() => {
        setShowSimModal(false);
        toast.success(`Redirecting to ${brandLabel} Gateway...`);
        router.replace(`/checkout/gateway?method=${paymentMethod}&orderId=${tempId}&amount=${calculateFinalTotal()}&phone=${walletPhone}`);
      }, 600);

    } catch (error: any) {
      clearInterval(interval);
      setShowSimModal(false);
      toast.error('Failed to initialize payment session. Please try again.');
    }
  };
  const runStripePaymentFlow = async () => {
    const steps = [
      'Connecting to Stripe gateway...',
      'Creating secure checkout session...',
      'Preparing redirection details...',
      'Redirecting to Stripe...'
    ];
    setSimStepsText(steps);
    setSimStep(0);
    setShowSimModal(true);

    const interval = setInterval(() => {
      setSimStep((prev) => {
        if (prev < steps.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 800);

    try {
      const orderData = {
        items: cart.items.map(item => {
          const prod = productsInfo[item.productId];
          return {
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
            sellerId: item.sellerId,
            shipping: prod ? getProductShippingCost(prod.description) : 0,
          };
        }),
        totalAmount: calculateFinalTotal(),
        promoCode: appliedPromo?.code,
        paymentMethod: 'card',
        ...formData,
      };

      const res = await ordersAPI.create(orderData);
      clearInterval(interval);
      setSimStep(steps.length - 1);
      
      setTimeout(async () => {
        setShowSimModal(false);
        await cartAPI.clear();
        if (res && res.data && res.data.requiresRedirect && res.data.paymentUrl) {
          toast.success('Session created! Redirecting to Stripe...');
          window.location.href = res.data.paymentUrl;
        } else {
          toast.success('Order placed successfully!');
          router.push('/orders');
        }
      }, 1000);

    } catch (error: any) {
      clearInterval(interval);
      setShowSimModal(false);
      toast.error(error.response?.data?.message || 'Stripe Checkout initialization failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.shippingAddress || !formData.city || !formData.state || !formData.zipCode || !formData.phone) {
      toast.error('Please fill in all shipping details');
      return;
    }

    if (paymentMethod === 'easypaisa') {
      if (walletPhone.length < 10) {
        toast.error('Please enter a valid EasyPaisa mobile number');
        return;
      }
    }

    if (paymentMethod === 'jazzcash') {
      if (walletPhone.length < 10) {
        toast.error('Please enter a valid JazzCash mobile number');
        return;
      }
      if (walletCnic.length < 6) {
        toast.error('Please enter the last 6 digits of your CNIC');
        return;
      }
    }

    setSubmitting(true);
    
    if (paymentMethod === 'cash_on_delivery') {
      await executeOrderPlacement();
      setSubmitting(false);
    } else if (paymentMethod === 'card') {
      await runStripePaymentFlow();
      setSubmitting(false);
    } else {
      await runRealPaymentFlow();
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-black mb-8 bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">Checkout Settlement</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping & Payment forms */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card p-6 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
              <ShieldCheck className="w-5 h-5 text-indigo-500 mr-2" />
              Shipping Information
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Shipping Address *
                </label>
                <input
                  type="text"
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                  placeholder="Street address, apartment, etc."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                    placeholder="+92 300 1234567"
                    required
                  />
                </div>
              </div>

              {/* Payment Methods Section */}
              <div className="mt-8 border-t border-gray-150 dark:border-gray-800 pt-6">
                <h3 className="text-md font-bold mb-4 text-gray-850 dark:text-white flex items-center">
                  <Lock className="w-4 h-4 text-indigo-500 mr-2" /> Select Payment Method
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash_on_delivery')}
                    className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all min-h-[140px] ${
                      paymentMethod === 'cash_on_delivery' 
                        ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10' 
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <Coins className="w-6 h-6 text-gray-650 dark:text-gray-400" />
                    <span className="font-bold text-sm mt-4 block text-gray-900 dark:text-white">Cash on Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all min-h-[140px] ${
                      paymentMethod === 'card' 
                        ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10' 
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-sm mt-4 block text-gray-900 dark:text-white">Credit/Debit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('easypaisa')}
                    className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all min-h-[140px] ${
                      paymentMethod === 'easypaisa' 
                        ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/10' 
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="h-8 w-20 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
                      <img src="/easypaisa.png" alt="EasyPaisa" className="h-full w-auto object-contain" />
                    </div>
                    <span className="font-bold text-sm mt-4 block text-gray-900 dark:text-white">EasyPaisa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('jazzcash')}
                    className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all min-h-[140px] ${
                      paymentMethod === 'jazzcash' 
                        ? 'border-amber-600 bg-amber-50/20 dark:bg-amber-950/10' 
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="h-8 w-20 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
                      <img src="/jazzcash.png" alt="JazzCash" className="h-full w-auto object-contain" />
                    </div>
                    <span className="font-bold text-sm mt-4 block text-gray-900 dark:text-white">JazzCash</span>
                  </button>
                </div>

                {/* Sub-panels depending on selection */}
                <div className="mt-6">
                  {paymentMethod === 'card' && (
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-150 dark:border-gray-800 flex flex-col md:flex-row gap-8 items-center animate-fade-in w-full">
                      {/* Credit Card UI Display */}
                      <div className="w-72 h-44 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl flex flex-col justify-between relative shadow-xl border border-slate-700 shrink-0">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold tracking-widest text-slate-400">STRIPE PAYMENT</span>
                          <span className="text-xl font-bold tracking-tighter italic">Visa / MC</span>
                        </div>
                        
                        {/* Sim card chip */}
                        <div className="w-10 h-7 bg-amber-400/80 rounded-md mb-2 relative overflow-hidden border border-amber-300">
                          <div className="absolute inset-y-0 left-3 w-0.5 bg-slate-800"></div>
                          <div className="absolute inset-x-0 top-3 h-0.5 bg-slate-800"></div>
                        </div>

                        <div>
                          <p className="text-md font-mono tracking-widest text-slate-100">
                            •••• •••• •••• ••••
                          </p>
                          <div className="flex justify-between mt-3">
                            <div>
                              <p className="text-[7px] text-slate-400 uppercase tracking-wider">Secured By</p>
                              <p className="text-[11px] font-bold tracking-wide uppercase">Stripe Gateway</p>
                            </div>
                            <div>
                              <p className="text-[7px] text-slate-400 uppercase tracking-wider">Encryption</p>
                              <p className="text-[11px] font-mono font-bold tracking-wide">AES-256</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Redirect details */}
                      <div className="flex-1 space-y-3">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Secure Credit/Debit Card Checkout</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          We process payments securely using Stripe. When you click <strong>Place Order</strong>, you will be redirected to Stripe Checkout to enter your card details.
                        </p>
                        <ul className="text-[11px] text-gray-400 dark:text-gray-500 space-y-1">
                          <li className="flex items-center">✓ 3D Secure Verification enabled</li>
                          <li className="flex items-center">✓ PCI-DSS Level 1 compliant gateway</li>
                          <li className="flex items-center">✓ Fully encrypted transactions</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {(paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && (
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-150 dark:border-gray-800 animate-fade-in flex flex-col md:flex-row gap-6 items-center">
                      {paymentMethod === 'easypaisa' ? (
                        <div className="h-12 w-28 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden p-1 shadow-md flex-shrink-0">
                          <img src="/easypaisa.png" alt="EasyPaisa" className="h-full w-auto object-contain" />
                        </div>
                      ) : (
                        <div className="h-12 w-28 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden p-1 shadow-md flex-shrink-0">
                          <img src="/jazzcash.png" alt="JazzCash" className="h-full w-auto object-contain" />
                        </div>
                      )}
                      
                      <div className="flex-1 w-full space-y-4">
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-white capitalize">
                            {paymentMethod} Wallet Authorization
                          </h4>
                          <p className="text-xs text-gray-500">
                            Confirm transaction request by entering your details below.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mobile Account Number *</label>
                            <input
                              type="text"
                              value={walletPhone}
                              onChange={handleWalletPhoneChange}
                              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                              placeholder="03001234567"
                              required
                            />
                          </div>

                          {paymentMethod === 'jazzcash' && (
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">CNIC (Last 6 Digits) *</label>
                              <input
                                type="text"
                                value={walletCnic}
                                onChange={(e) => setWalletCnic(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
                                placeholder="123456"
                                required
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-primary-600 hover:bg-primary-750 text-white w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-md mt-6 flex justify-center items-center"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24 p-6 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg border border-gray-100 dark:border-gray-800" />
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{item.name}</h4>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatPrice(Number(item.price) * item.quantity, currency, exchangeRates)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-150 dark:border-gray-800 pt-4 mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="PROMO CODE"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={!!appliedPromo}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-xs font-bold uppercase"
                />
                {!appliedPromo ? (
                  <button 
                    onClick={handleApplyPromo}
                    disabled={!promoCode || validatingPromo}
                    className="bg-primary-600 hover:bg-primary-750 text-white font-bold text-xs px-4 rounded-xl transition-all"
                  >
                    {validatingPromo ? '...' : 'Apply'}
                  </button>
                ) : (
                  <button 
                    onClick={removePromo}
                    className="bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs px-4 rounded-xl transition-all"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-gray-150 dark:border-gray-800 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{formatPrice(calculateTotal(), currency, exchangeRates)}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium text-sm">
                  <span>Discount ({appliedPromo.code})</span>
                  <span>-{formatPrice(appliedPromo.discountAmount, currency, exchangeRates)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                <span className={`font-semibold ${calculateShipping() === 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                  {calculateShipping() === 0 ? 'FREE' : formatPrice(calculateShipping(), currency, exchangeRates)}
                </span>
              </div>
              <div className="border-t border-gray-150 dark:border-gray-800 pt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800 dark:text-white">Total Amount</span>
                <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
                  {formatPrice(calculateFinalTotal(), currency, exchangeRates)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Processing Dialog Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6 animate-scale-in">
            <div className="mx-auto w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-150 dark:border-indigo-900/50">
              <Loader className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                <Lock className="w-4.5 h-4.5 text-emerald-500" /> Secure Payment Processing
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Simulating network integration. Please do not close or refresh the window.
              </p>
            </div>

            {/* Sim step logs */}
            <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-150 dark:border-gray-800/50 text-left font-mono text-[10px] space-y-1.5 text-gray-500 dark:text-gray-400 max-h-24 overflow-y-auto">
              {simStepsText.slice(0, simStep + 1).map((stepText, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="text-emerald-500">✔</span>
                  <span>{stepText}</span>
                </div>
              ))}
            </div>

            {/* Simulated merchant data */}
            <div className="pt-2 text-xs text-gray-400 dark:text-gray-500 flex justify-between items-center border-t border-gray-150 dark:border-gray-800">
              <span>Merchant: MicroCart Online Store</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">Rs. {calculateFinalTotal().toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
