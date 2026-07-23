'use client';

import { useEffect, useState } from 'react';
import { ordersAPI } from '@/lib/api';
import { Order } from '@/types';
import { useAuthStore } from '@/lib/store';
import { 
  Package, 
  Search, 
  Filter, 
  CheckCircle2, 
  Truck, 
  XCircle,
  RefreshCcw,
  ShoppingBag,
  ExternalLink,
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SellerOrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersAPI.getSellerOrders();
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load customer orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      toast.success(`Order marked as ${status.toUpperCase()}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-600 border-amber-100',
      confirmed: 'bg-blue-50 text-blue-600 border-blue-100',
      processing: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      shipped: 'bg-purple-50 text-purple-600 border-purple-100',
      delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
    };
    return styles[status] || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    ready: orders.filter(o => ['confirmed', 'processing'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  );

  if (loading && orders.length === 0) {
    return <div className="p-12 text-center animate-pulse">Loading Hub...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-sm font-bold text-primary-600 uppercase tracking-widest">Vendor Portal</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Fulfillment Center</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage customer orders and update delivery progress.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/seller/dashboard" className="btn btn-outline border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 px-6 py-3 flex items-center">
            <LayoutDashboard className="w-5 h-5 mr-2" />
            Dashboard
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Orders', value: stats.total, icon: ShoppingBag, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Pending Action', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Ready to Ship', value: stats.ready, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Successful', value: stats.delivered, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 dark:bg-gray-900 shadow-sm`}>
            <div className={`w-10 h-10 ${stat.bg} dark:bg-opacity-10 rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className={`text-3xl font-black ${stat.color} dark:text-white`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row justify-between gap-6">
          <div className="flex items-center space-x-3">
             {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
               <button
                 key={status}
                 onClick={() => setStatusFilter(status)}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   statusFilter === status
                     ? 'bg-gray-900 text-white shadow-lg'
                     : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100'
                 }`}
               >
                 {status}
               </button>
             ))}
          </div>
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search Order ID..."
               className="pl-12 pr-6 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none text-sm w-full md:w-64"
             />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Info</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer & Items</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">#{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center space-x-3">
                        <div className="flex -space-x-2">
                           {order.items.slice(0, 2).map((item, idx) => (
                             <div key={idx} className="w-8 h-8 rounded-lg border-2 border-white dark:border-gray-900 bg-gray-100 overflow-hidden shadow-sm">
                                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <div className="text-[10px] flex items-center justify-center h-full">📦</div>}
                             </div>
                           ))}
                           {order.items.length > 2 && (
                             <div className="w-8 h-8 rounded-lg border-2 border-white dark:border-gray-900 bg-gray-900 text-white flex items-center justify-center text-[8px] font-bold">
                               +{order.items.length - 2}
                             </div>
                           )}
                        </div>
                        <div className="text-xs">
                           <p className="font-bold text-gray-700 dark:text-gray-300">Multiple Items</p>
                           <div className="flex items-center text-gray-400 mt-0.5">
                              <MapPin className="w-3 h-3 mr-1" /> {order.city}
                           </div>
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-primary-600">Rs {Number(order.totalAmount).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{order.paymentMethod.replace('_', ' ')}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                       {order.status === 'pending' && (
                         <>
                           <button onClick={() => updateStatus(order.id, 'confirmed')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Confirm Order">
                              <CheckCircle2 className="w-4 h-4" />
                           </button>
                           <button onClick={() => updateStatus(order.id, 'cancelled')} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Reject Order">
                              <XCircle className="w-4 h-4" />
                           </button>
                         </>
                       )}
                       {order.status === 'confirmed' && (
                         <button onClick={() => updateStatus(order.id, 'processing')} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center px-4" title="Start Processing">
                            <RefreshCcw className="w-4 h-4 mr-2" /> <span className="text-[10px] font-black uppercase tracking-widest">Process</span>
                         </button>
                       )}
                       {order.status === 'processing' && (
                         <button onClick={() => updateStatus(order.id, 'shipped')} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center px-4" title="Mark as Shipped">
                            <Truck className="w-4 h-4 mr-2" /> <span className="text-[10px] font-black uppercase tracking-widest">Ship</span>
                         </button>
                       )}
                       {order.status === 'shipped' && (
                         <button onClick={() => updateStatus(order.id, 'delivered')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center px-4" title="Mark as Delivered">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> <span className="text-[10px] font-black uppercase tracking-widest">Complete</span>
                         </button>
                       )}
                       <Link href={`/orders/${order.id}`} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-900 hover:text-white transition-all shadow-sm" title="Full Details">
                          <ExternalLink className="w-4 h-4" />
                       </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
