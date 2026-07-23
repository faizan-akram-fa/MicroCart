'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ordersAPI } from '@/lib/api';
import { Order } from '@/types';
import { 
  Package, 
  MapPin, 
  CreditCard, 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ShoppingBag,
  ArrowLeft,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

export default function OrderTrackingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getById(id as string);
      setOrder(response.data);
    } catch (error) {
      toast.error('Failed to load order details');
      router.push(user?.role === 'admin' ? '/admin/orders' : user?.role === 'seller' ? '/seller/orders' : '/orders');
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Clock, desc: 'We have received your order' },
    { key: 'confirmed', label: 'Confirmed', icon: ShieldCheck, desc: 'Seller has confirmed your order' },
    { key: 'processing', label: 'Processing', icon: Package, desc: 'Your items are being packed' },
    { key: 'shipped', label: 'On the Way', icon: Truck, desc: 'Your package is with the courier' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2, desc: 'Order reached your destination' },
  ];

  const getCurrentStatusIndex = () => {
    if (!order) return -1;
    return statusSteps.findIndex(step => step.key === order.status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) return null;

  const currentIdx = getCurrentStatusIndex();
  
  const backLink = user?.role === 'admin' ? '/admin/orders' : user?.role === 'seller' ? '/seller/orders' : '/orders';
  const backText = user?.role === 'admin' ? 'Back to Global Orders' : user?.role === 'seller' ? 'Back to Seller Orders' : 'Back to My Orders';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 animate-fade-in">
      <div className="container mx-auto max-w-5xl">
        <Link 
          href={backLink} 
          className="inline-flex items-center text-gray-500 hover:text-primary-600 mb-8 font-bold transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          {backText}
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Tracking View */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Track Your Journey</h1>
                  <p className="text-gray-500 font-medium mt-1">Order #{order.id.slice(0, 12)}</p>
                </div>
                <div className="text-right">
                  <div className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest">
                    {order.status}
                  </div>
                </div>
              </div>

              {/* Visual Timeline */}
              <div className="relative mt-20 mb-20 px-4">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800 -translate-y-1/2"></div>
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary-600 to-indigo-600 -translate-y-1/2 transition-all duration-1000 ease-out"
                  style={{ width: `${(currentIdx / (statusSteps.length - 1)) * 100}%` }}
                ></div>

                <div className="relative flex justify-between">
                  {statusSteps.map((step, i) => {
                    const isCompleted = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={step.key} className="flex flex-col items-center group">
                        <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center relative z-10 transition-all duration-500
                          ${isCompleted ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}
                          ${isCurrent ? 'scale-125 ring-4 ring-primary-500/20' : ''}
                        `}>
                          <step.icon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                        </div>
                        <div className="absolute top-16 text-center w-24">
                          <p className={`text-[10px] font-black uppercase tracking-tighter ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-32 p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center mb-4">
                  <Clock className="w-5 h-5 mr-3 text-primary-500" /> Latest Status Update
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {statusSteps[currentIdx]?.desc || 'System update in progress.'}
                </p>
                <p className="text-xs text-gray-400 mt-2">Last updated: {new Date(order.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8 flex items-center">
                <ShoppingBag className="w-6 h-6 mr-3 text-gray-400" /> Package Contents
              </h2>
              <div className="space-y-6">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{item.productName}</h4>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900 dark:text-white tracking-tighter">Rs {Number(item.price).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-black">Per unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Details */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center">
                <MapPin className="w-5 h-5 mr-3 text-rose-500" /> Delivery Address
              </h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                {order.shippingAddress},<br />
                {order.city}, {order.state} {order.zipCode}
              </p>
              <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Contact Phone</p>
                <p className="font-bold text-gray-900 dark:text-white">{order.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center">
                <CreditCard className="w-5 h-5 mr-3 text-emerald-500" /> Payment Info
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Payment Method</span>
                  <span className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-widest bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">
                    {order.paymentMethod.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    Rs {((order.items || []).reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0)).toLocaleString()}
                  </span>
                </div>
                {Number(order.discountAmount || 0) > 0 && (
                  <div className="flex justify-between items-center text-sm text-rose-500">
                    <span className="font-medium">Discount</span>
                    <span className="font-bold">-Rs {Number(order.discountAmount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Shipping Fee</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {((order.items || []).reduce((sum, item) => sum + (Number(item.shipping || 0) * (item.quantity || 1)), 0)) > 0
                      ? `Rs ${((order.items || []).reduce((sum, item) => sum + (Number(item.shipping || 0) * (item.quantity || 1)), 0)).toLocaleString()}`
                      : 'Free'}
                  </span>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 dark:text-white font-black text-lg uppercase tracking-tight">Total Paid</span>
                  <span className="text-2xl font-black text-primary-600 tracking-tight">Rs {Number(order.totalAmount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {user?.role !== 'admin' && user?.role !== 'sub_admin' && (
              <div className="p-8 bg-gradient-to-br from-indigo-600 to-primary-700 rounded-[3rem] text-white shadow-xl shadow-primary-500/20">
                 <Calendar className="w-8 h-8 opacity-40 mb-4" />
                 <h3 className="text-lg font-bold mb-2">Need Support?</h3>
                 <p className="text-primary-100 text-sm leading-relaxed opacity-80 mb-6">
                   If you have any questions regarding this order, our 24/7 support team is here to help.
                 </p>
                 <button 
                   onClick={() => {
                     if (user?.role === 'seller') {
                       router.push('/seller/support');
                     } else {
                       router.push(`/support?openTicket=true&orderId=${order.id}`);
                     }
                   }}
                   className="w-full bg-white text-primary-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform"
                 >
                   Contact Support
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
