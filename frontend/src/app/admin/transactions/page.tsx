'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Calendar, 
  Banknote, 
  Loader, 
  RefreshCcw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRightLeft,
  X,
  Printer,
  User,
  Package,
  Eye,
  ShieldCheck,
  MapPin,
  Download
} from 'lucide-react';
import { adminAPI, ordersAPI } from '@/lib/api';
import { generateTransactionReceiptPDF } from '@/utils/reportGenerator';
import toast, { Toaster } from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [ordersMap, setOrdersMap] = useState<Record<string, any>>({});
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [productsMap, setProductsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const [txRes, ordersRes, usersRes, inventoryRes] = await Promise.all([
        adminAPI.getTransactions().catch(err => { console.error(err); return { data: [] }; }),
        ordersAPI.getAllAdmin().catch(err => { console.error(err); return { data: [] }; }),
        adminAPI.getAllUsers().catch(err => { console.error(err); return { data: [] }; }),
        adminAPI.getInventory().catch(err => { console.error(err); return { data: [] }; }),
      ]);

      const txList = txRes?.data || [];
      const ordersList = ordersRes?.data || [];
      const usersList = usersRes?.data || [];
      const productsList = inventoryRes?.data || [];

      // Create lookup maps
      const pMap: Record<string, any> = {};
      productsList.forEach((p: any) => {
        if (p.id) pMap[p.id] = p;
        if (p._id) pMap[p._id] = p;
      });

      const oMap: Record<string, any> = {};
      ordersList.forEach((o: any) => {
        if (o.id) {
          // Enrich order items with product images and categories if missing
          const enrichedItems = (o.items || []).map((item: any) => {
            const prod = pMap[item.productId];
            const image = item.image || item.productImage || prod?.images?.[0] || prod?.image || '';
            const category = item.category || prod?.category || 'General';
            return {
              ...item,
              image,
              category
            };
          });

          oMap[o.id] = {
            ...o,
            items: enrichedItems
          };
        }
      });

      const uMap: Record<string, any> = {};
      usersList.forEach((u: any) => {
        if (u.id) uMap[u.id] = u;
      });

      setProductsMap(pMap);
      setOrdersMap(oMap);
      setUsersMap(uMap);
      setTransactions(txList);
    } catch (error) {
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const base = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:3002';
    return `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'card':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/30 whitespace-nowrap">
            <CreditCard className="w-3 h-3 flex-shrink-0" /> <span className="hidden xl:inline">Credit/Debit</span> Card
          </span>
        );
      case 'easypaisa':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-900/30 whitespace-nowrap">
            <img src="/easypaisa.png" alt="EasyPaisa" className="w-3.5 h-3.5 object-contain rounded-sm bg-white p-0.5 border border-gray-200 flex-shrink-0" /> EasyPaisa
          </span>
        );
      case 'jazzcash':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-150 dark:border-amber-900/30 whitespace-nowrap">
            <img src="/jazzcash.png" alt="JazzCash" className="w-3.5 h-3.5 object-contain rounded-sm bg-white p-0.5 border border-gray-200 flex-shrink-0" /> JazzCash
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-gray-50 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400 border border-gray-150 dark:border-gray-800 whitespace-nowrap">
            <Banknote className="w-3 h-3 flex-shrink-0" /> COD
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> Paid
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100/70 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/70 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <Clock className="w-3 h-3 flex-shrink-0" /> Unpaid
          </span>
        );
    }
  };

  // Metrics
  const totalVolume = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const completedCount = transactions.filter(t => t.status === 'completed').length;
  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  // Filtered
  const filteredTransactions = transactions.filter((t) => {
    const query = searchQuery.toLowerCase();
    const user = usersMap[t.userId];
    const userName = user ? `${user.firstName} ${user.lastName}`.toLowerCase() : '';
    const userEmail = user ? user.email.toLowerCase() : '';

    const matchesQuery = 
      t.id.toLowerCase().includes(query) ||
      (t.transactionReference && t.transactionReference.toLowerCase().includes(query)) ||
      t.orderId.toLowerCase().includes(query) ||
      t.userId.toLowerCase().includes(query) ||
      userName.includes(query) ||
      userEmail.includes(query);

    const matchesMethod = methodFilter === 'all' || t.paymentMethod === methodFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchesQuery && matchesMethod && matchesStatus;
  });

  const handlePrintReceipt = async () => {
    if (!selectedTx) return;
    toast.loading('Generating PDF Receipt...', { id: 'pdf-receipt' });
    try {
      const buyerUser = usersMap[selectedTx.userId];
      const order = ordersMap[selectedTx.orderId];
      const items = order?.items || [];
      await generateTransactionReceiptPDF(selectedTx, buyerUser, order, items);
      toast.success('PDF Receipt Downloaded!', { id: 'pdf-receipt' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF receipt', { id: 'pdf-receipt' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 w-full max-w-full">
      <Toaster position="top-right" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Transaction Logs</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Audit trail of secure payment transactions and customer receipts.</p>
        </div>
        <button 
          onClick={fetchTransactions}
          disabled={loading}
          className={`flex items-center justify-center px-3.5 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm self-start sm:self-auto ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95'
          }`}
        >
          <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Metric Cards (Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Online Payments */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-4 sm:p-5 shadow-lg hover:border-emerald-500/40 transition-all group">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
              <Banknote className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Online Volume
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Total Online Payments</p>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 tracking-tight leading-none">Rs. {totalVolume.toLocaleString()}</p>
        </div>

        {/* Paid Purchases */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-4 sm:p-5 shadow-lg hover:border-indigo-500/40 transition-all group">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Completed
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Paid Transactions</p>
          <p className="text-xl sm:text-2xl font-extrabold text-indigo-400 tracking-tight leading-none">{completedCount}</p>
        </div>

        {/* COD Pending */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-4 sm:p-5 shadow-lg hover:border-amber-500/40 transition-all group">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-500/8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              COD (Unpaid)
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Pending Cash Settlement</p>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-400 tracking-tight leading-none">{pendingCount}</p>
        </div>
      </div>

      {/* Filter Options */}
      <div className="card p-3.5 sm:p-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative w-full md:max-w-xs lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search ID, Order ID, Buyer Name, Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs transition-all"
            />
          </div>

          <div className="flex flex-row gap-2 items-center w-full md:w-auto">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-2.5 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none text-xs font-bold text-gray-700 dark:text-gray-300 flex-1 md:flex-initial cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">All Payment Methods</option>
              <option value="card" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Credit/Debit Card</option>
              <option value="easypaisa" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">EasyPaisa</option>
              <option value="jazzcash" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">JazzCash</option>
              <option value="cash_on_delivery" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Cash on Delivery</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none text-xs font-bold text-gray-700 dark:text-gray-300 flex-1 md:flex-initial cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">All Statuses</option>
              <option value="completed" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Completed / Paid</option>
              <option value="pending" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Pending / Unpaid</option>
              <option value="failed" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table List (Full Width Window Fit) */}
      <div className="card bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden min-h-[350px]">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <th className="py-3 px-3 sm:px-4">Tx ID / Ref</th>
                  <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Order ID</th>
                  <th className="py-3 px-3 sm:px-4">Buyer</th>
                  <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Date</th>
                  <th className="py-3 px-3 sm:px-4">Amount</th>
                  <th className="py-3 px-3 sm:px-4">Method</th>
                  <th className="py-3 px-3 sm:px-4">Status</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs">
                {filteredTransactions.map((tx) => {
                  const buyerUser = usersMap[tx.userId];
                  const buyerName = buyerUser ? `${buyerUser.firstName} ${buyerUser.lastName}` : (tx.buyer?.firstName ? `${tx.buyer.firstName} ${tx.buyer.lastName}` : 'Guest Customer');
                  const buyerEmail = buyerUser ? buyerUser.email : (tx.buyer?.email || tx.userId);

                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 sm:px-4 font-mono">
                        <div className="font-bold text-gray-900 dark:text-white truncate max-w-[90px] sm:max-w-[110px] lg:max-w-[130px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {tx.id}
                        </div>
                        {tx.transactionReference && (
                          <div className="text-[10px] text-gray-400 truncate max-w-[90px] sm:max-w-[110px]">Ref: {tx.transactionReference}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-mono text-gray-600 dark:text-gray-400 hidden sm:table-cell truncate max-w-[90px] lg:max-w-[110px]">
                        {tx.orderId}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[100px] sm:max-w-[130px] lg:max-w-[160px]">{buyerName}</div>
                        <div className="text-[10px] text-gray-400 font-mono truncate max-w-[100px] sm:max-w-[130px]">{buyerEmail}</div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-gray-500 hidden md:table-cell whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          {format(new Date(tx.createdAt), 'MMM dd, HH:mm')}
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-extrabold text-gray-900 dark:text-white whitespace-nowrap">
                        Rs. {Number(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        {getMethodBadge(tx.paymentMethod)}
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all active:scale-95"
                        >
                          <Eye className="w-3 h-3" /> <span className="hidden sm:inline">Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowRightLeft className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">No Transactions Found</h3>
            <p className="text-gray-500 mt-1 max-w-xs mx-auto text-xs">
              There are no transactions logged matching your search criteria.
            </p>
          </div>
        )}
      </div>

      {/* Transaction Details / Receipt Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center min-h-screen overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[88vh] space-y-4 animate-scale-in relative my-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Payment Receipt Details</h2>
                </div>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  Receipt Ref: TRX-{(selectedTx.id || '').slice(0, 8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-slate-800 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Summary Header Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 rounded-xl border border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Total Amount Paid / Due</p>
                <h3 className="text-2xl font-black text-emerald-400 mt-0.5">Rs. {Number(selectedTx.amount).toFixed(2)}</h3>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {format(new Date(selectedTx.createdAt), 'MMMM dd, yyyy hh:mm a')}
                </p>
              </div>
              <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5">
                {getStatusBadge(selectedTx.status)}
                {getMethodBadge(selectedTx.paymentMethod)}
              </div>
            </div>

            {/* Customer & Gateway Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Buyer Information */}
              <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  <User className="w-3 h-3 mr-1 text-primary-500" /> Customer Info
                </div>
                {(() => {
                  const buyerUser = usersMap[selectedTx.userId];
                  const buyerName = buyerUser ? `${buyerUser.firstName} ${buyerUser.lastName}` : 'Guest Customer';
                  const buyerEmail = buyerUser ? buyerUser.email : selectedTx.userId;
                  return (
                    <>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{buyerName}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono break-all">{buyerEmail}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">User ID: {selectedTx.userId}</p>
                    </>
                  );
                })()}
              </div>

              {/* Transaction & Order Reference */}
              <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  <Package className="w-3 h-3 mr-1 text-indigo-500" /> Reference IDs
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="font-bold text-gray-700 dark:text-gray-300">Transaction ID:</span>{' '}
                  <span className="font-mono text-gray-900 dark:text-white break-all">{selectedTx.id}</span>
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="font-bold text-gray-700 dark:text-gray-300">Order ID:</span>{' '}
                  <span className="font-mono text-gray-900 dark:text-white break-all">{selectedTx.orderId}</span>
                </p>
                {selectedTx.transactionReference && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="font-bold text-gray-700 dark:text-gray-300">Gateway Ref:</span>{' '}
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 break-all">{selectedTx.transactionReference}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Order Items Breakdown with Product Thumbnails */}
            {(() => {
              const order = ordersMap[selectedTx.orderId];
              const items = order?.items || [];
              const shippingAddress = order?.shippingAddress;

              return (
                <div className="space-y-3">
                  {shippingAddress && (
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-800 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <div className="text-[11px] text-gray-600 dark:text-gray-300">
                        <span className="font-bold text-gray-900 dark:text-white">Shipping Address: </span>
                        {typeof shippingAddress === 'string' 
                          ? shippingAddress 
                          : `${shippingAddress.street || ''}, ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}`}
                      </div>
                    </div>
                  )}

                  <div className="border border-gray-150 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 dark:bg-slate-800/80 px-3 py-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex justify-between">
                      <span>Order Items ({items.length})</span>
                      <span>Amount</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-44 overflow-y-auto">
                      {items.length > 0 ? (
                        items.map((item: any, idx: number) => {
                          const itemImg = item.image || item.productImage || item.images?.[0] || '';
                          return (
                            <div key={idx} className="px-3 py-2.5 flex items-center justify-between text-xs gap-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-center">
                                  {itemImg ? (
                                    <img 
                                      src={getImageUrl(itemImg)} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                    />
                                  ) : (
                                    <Package className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-gray-900 dark:text-white truncate">{item.productName || item.title || 'Product Item'}</p>
                                  <p className="text-gray-400 text-[10px]">
                                    Qty: {item.quantity || 1} × Rs. {Number(item.price || 0).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <p className="font-bold text-gray-900 dark:text-white whitespace-nowrap text-xs">
                                Rs. {(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-3 py-3 text-xs text-gray-400 italic text-center">
                          Direct payment record logged for Order #{selectedTx.orderId}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={handlePrintReceipt}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" /> Download Receipt PDF
              </button>
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs transition-all active:scale-95"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
