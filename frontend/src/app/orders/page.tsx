'use client';

import { useEffect, useState } from 'react';
import { ordersAPI } from '@/lib/api';
import { Order } from '@/types';
import { useAuthStore } from '@/lib/store';
import { 
  Package, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle,
  RefreshCcw,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = user?.role === 'seller'
        ? await ordersAPI.getSellerOrders()
        : await ordersAPI.getAll();
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle2 className="w-4 h-4" />;
      case 'processing': return <RefreshCcw className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
      confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
      processing: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
      shipped: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
      delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
      cancelled: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
    };
    return styles[status] || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading && orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-48"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-800 h-64 rounded-[2.5rem]"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            {user?.role === 'seller' ? 'Customer Orders' : 'Order History'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
            Track, manage, and review your {user?.role === 'seller' ? 'sales' : 'purchases'}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                statusFilter === status
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-100 dark:border-gray-800 hover:border-primary-500/50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-10">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by Order ID or Product Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-6 py-5 bg-white dark:bg-gray-900 border-none rounded-[2rem] shadow-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white text-lg transition-all"
        />
      </div>

      {filteredOrders.length > 0 ? (
        <div className="space-y-8">
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="group bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <div className="p-8">
                <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                      <ShoppingBag className="w-6 h-6 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Order #{order.id.slice(0, 8)}</h3>
                      <p className="text-sm text-gray-500 font-medium">Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-widest ${getStatusStyles(order.status)}`}>
                      <span className="mr-2">{getStatusIcon(order.status)}</span>
                      {order.status}
                    </div>
                    
                    {order.status === 'pending' && order.paymentMethod === 'card' && user?.role !== 'seller' && (
                      <>
                        <button
                          onClick={() => {
                            window.location.href = `/checkout/stripe-mock?order_id=${order.id}&amount=${order.totalAmount}`;
                          }}
                          className="flex items-center px-4 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-md"
                        >
                          Pay Now
                        </button>
                        <button
                          onClick={async () => {
                            const loadingId = toast.loading('Cancelling unpaid order...');
                            try {
                              await ordersAPI.cancelPayment(order.id);
                              toast.success('Order cancelled successfully', { id: loadingId });
                              fetchOrders();
                            } catch (err) {
                              toast.error('Failed to cancel order', { id: loadingId });
                            }
                          }}
                          className="flex items-center px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-md"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    <Link 
                      href={`/orders/${order.id}`}
                      className="flex items-center px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
                    >
                      Track Order <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-center border-t border-gray-50 dark:border-gray-800 pt-8">
                  {/* Items Preview */}
                  <div className="flex -space-x-4 overflow-hidden">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="relative inline-block w-16 h-16 rounded-2xl border-4 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 overflow-hidden shadow-sm">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="relative inline-block w-16 h-16 rounded-2xl border-4 border-white dark:border-gray-900 bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                        + {order.items.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Items</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {order.items.length} {order.items.length === 1 ? 'Product' : 'Products'}
                    </p>
                  </div>

                  <div className="text-right lg:text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                    <p className="text-3xl font-black text-primary-600 tracking-tight">Rs {Number(order.totalAmount).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">No orders found</h2>
          <p className="text-gray-500 mt-2">Try adjusting your filters or start shopping.</p>
          <Link href="/products" className="inline-block mt-8 text-primary-600 font-bold hover:underline">Explore Products</Link>
        </div>
      )}
    </div>
  );
}

