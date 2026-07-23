'use client';

import { useEffect, useState } from 'react';
import { ordersAPI, adminAPI } from '@/lib/api';
import { Order } from '@/types';
import {
  Package,
  Search,
  Eye,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  ShoppingBag,
  Clock,
  ArrowUpRight,
  Calendar,
  User,
  Store,
  CreditCard,
  CheckCircle2,
  Trash2,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrdersAndUsers();
  }, []);

  const fetchOrdersAndUsers = async () => {
    setLoading(true);
    try {
      const [ordersRes, usersRes] = await Promise.all([
        ordersAPI.getAllAdmin(),
        adminAPI.getAllUsers()
      ]);
      setOrders(ordersRes.data);
      setUsers(usersRes.data || []);
    } catch (error) {
      toast.error('Failed to load global order monitor records');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
      confirmed: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
      processing: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
      shipped: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
      delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
      cancelled: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
    };
    return styles[status] || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const getUserName = (userId: string) => {
    if (!userId) return 'Guest User';
    const matched = users.find(u => u.id === userId);
    return matched ? `${matched.firstName} ${matched.lastName}` : 'Guest User';
  };

  const getStoreName = (sellerId: string) => {
    if (!sellerId) return 'Direct Store';
    const matched = users.find(u => u.id === sellerId);
    return matched ? `${matched.firstName} ${matched.lastName}` : 'Direct Store';
  };

  const filteredOrders = orders.filter(order => {
    const customerName = getUserName(order.userId || '').toLowerCase();
    const storeName = getStoreName(order.sellerId || '').toLowerCase();

    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.includes(searchTerm.toLowerCase()) ||
      storeName.includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalRevenue: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
    totalOrders: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    failed: orders.filter(o => o.status === 'cancelled').length,
  };

  const formatMoney = (amount: any) => {
    return `Rs ${Number(amount || 0).toLocaleString()}`;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-500 font-bold animate-pulse">Scanning Global Transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Platform Oversight</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Global Order Monitor</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Surveillance and management of all system-wide orders.</p>
        </div>
      </div>

      {/* Admin Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Volume', value: `Rs ${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Unfulfilled', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Cancellations', value: stats.failed, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} dark:bg-opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className={`text-2xl font-black ${stat.color} dark:text-white tracking-tighter`}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Content */}
      <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order, Customer, or Store..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl outline-none text-sm transition-all focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 dark:bg-gray-800/30">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Details</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Insight</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Store Assignment</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Value</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Surveillance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="group hover:bg-gray-50/40 dark:hover:bg-gray-800/30 transition-all cursor-pointer"
                >
                  <td className="px-10 py-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl flex items-center justify-center group-hover:scale-115 transition-transform duration-300">
                        <ShoppingBag className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight">#{order.id.slice(0, 12)}</p>
                        <div className="flex items-center text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                          <Calendar className="w-3 h-3 mr-1" /> {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="space-y-1.5">
                      <p className="text-sm font-black text-gray-800 dark:text-gray-200 leading-tight">
                        {getUserName(order.userId || '')}
                      </p>
                      <div className="flex items-center text-xs font-semibold text-gray-400 font-mono">
                        <User className="w-3.5 h-3.5 mr-1.5 text-primary-500/80" />
                        <span>{order.userId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="space-y-1.5">
                      <p className="text-sm font-black text-gray-800 dark:text-gray-200 leading-tight">
                        {getStoreName(order.sellerId || '')}
                      </p>
                      <div className="flex items-center text-xs font-semibold text-gray-400 font-mono">
                        <Store className="w-3.5 h-3.5 mr-1.5 text-emerald-500/80" />
                        <span>{order.sellerId || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">Rs {Number(order.totalAmount).toLocaleString()}</p>
                    <div className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                      {order.status}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-20 text-center">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No orders match surveillance criteria</p>
          </div>
        )}
      </div>

      {/* Digital Receipt Modal Details popup */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-250 relative">

            {/* Header section */}
            <div className="bg-gradient-to-r from-sky-500/10 to-indigo-500/10 p-6 text-center border-b border-dashed border-slate-200 dark:border-slate-800 relative">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <ShoppingBag className="w-6 h-6 text-sky-500" />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Order Receipt Summary</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">ID: #{selectedOrder.id.toUpperCase()}</p>
            </div>

            {/* Receipt Body content */}
            <div className="p-6 space-y-5 max-h-[55vh] overflow-y-auto custom-scrollbar font-mono text-xs text-slate-700 dark:text-slate-355">
              <div className="space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">CUSTOMER NAME:</span>
                  <span className="text-slate-850 dark:text-white font-extrabold">{getUserName(selectedOrder.userId || '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">STORE NAME:</span>
                  <span className="text-slate-850 dark:text-white font-extrabold">{getStoreName(selectedOrder.sellerId || '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">TIMESTAMP:</span>
                  <span className="text-slate-850 dark:text-white font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">ORDER STATUS:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedOrder.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                      selectedOrder.status === 'cancelled' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>{selectedOrder.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">PAY METHOD:</span>
                  <span className="text-slate-850 dark:text-white font-bold uppercase">{selectedOrder.paymentMethod}</span>
                </div>
              </div>

              {/* Items mapping list */}
              <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-700 py-3 space-y-2">
                <span className="text-slate-400 font-bold block mb-1">PURCHASED ITEMS:</span>
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={item.productId || idx} className="flex justify-between leading-relaxed">
                    <span className="truncate max-w-[240px]">{item.productName} <span className="text-slate-400">x{item.quantity}</span></span>
                    <span>{formatMoney(Number(item.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Financial values */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-500">
                  <span>SUBTOTAL:</span>
                  <span>{formatMoney(selectedOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-800 dark:text-white font-black text-sm border-t border-slate-100 dark:border-slate-800 pt-2">
                  <span>TOTAL VALUE:</span>
                  <span>{formatMoney(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Footer control panel button */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-250 dark:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-[10px] uppercase tracking-wider"
              >
                Close Receipt
              </button>
              <Link
                href={`/orders/${selectedOrder.id}`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />View Details
              </Link>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
