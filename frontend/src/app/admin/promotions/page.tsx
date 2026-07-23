'use client';

import { useState, useEffect } from 'react';
import { promotionsAPI } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Tag, 
  Plus, 
  Clock, 
  BarChart3, 
  CheckCircle2, 
  Sparkles, 
  Edit3, 
  X, 
  Copy, 
  Search, 
  Filter, 
  AlertCircle, 
  Percent, 
  DollarSign, 
  Power,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

function PromoCard({ 
  promo, 
  toggleStatus, 
  onEdit 
}: { 
  promo: any; 
  toggleStatus: (id: string) => void; 
  onEdit: (promo: any) => void;
}) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!promo.expiryDate) return;
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(promo.expiryDate).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      setIsExpired(false);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${days}d ${hours}h ${minutes}m left`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [promo.expiryDate]);

  const activeStatus = isExpired ? false : promo.isActive;
  const usagePercentage = promo.usageLimit ? Math.min(100, Math.round((promo.usedCount / promo.usageLimit) * 100)) : 0;

  const copyCode = () => {
    navigator.clipboard.writeText(promo.code);
    toast.success(`Code ${promo.code} copied to clipboard!`);
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 p-6 shadow-xl group ${
      isExpired 
        ? 'border-slate-800 bg-slate-900/60 opacity-80' 
        : activeStatus 
          ? 'border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 hover:border-indigo-500/60 hover:shadow-indigo-500/10'
          : 'border-slate-800 bg-slate-900/80'
    }`}>
      {/* Decorative Glow */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl transition-transform duration-700 ${
        isExpired ? 'bg-rose-500/5' : promo.type === 'percentage' ? 'bg-indigo-500/10 group-hover:scale-150' : 'bg-emerald-500/10 group-hover:scale-150'
      }`} />

      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${
          isExpired 
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
            : activeStatus 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          {isExpired ? 'Expired' : (activeStatus ? 'Active Code' : 'Inactive')}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(promo)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-sm active:scale-95"
            title="Edit Promotion"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => toggleStatus(promo.id)}
            disabled={isExpired}
            className={`p-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeStatus 
                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
            }`}
            title={activeStatus ? 'Deactivate Code' : 'Activate Code'}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Promo Details */}
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className={`p-4 rounded-2xl border shadow-inner flex-shrink-0 ${
          isExpired 
            ? 'bg-slate-800 border-slate-700 text-slate-500' 
            : promo.type === 'percentage' 
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {promo.type === 'percentage' ? <Percent className="w-7 h-7" /> : <DollarSign className="w-7 h-7" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-2xl font-black font-mono tracking-wider truncate ${
              isExpired ? 'text-slate-500 line-through' : 'text-white'
            }`}>
              {promo.code}
            </h3>
            <button
              onClick={copyCode}
              className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
              title="Copy Code"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs font-bold text-slate-400 mt-0.5">
            {promo.type === 'percentage' ? `${promo.value}% STOREWIDE DISCOUNT` : `Rs. ${promo.value} OFF ORDER`}
          </p>
        </div>
      </div>

      {/* Metric Breakdown Rows */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80 text-xs relative z-10">
        
        {/* Usage Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> Usage Counter
            </span>
            <span className="font-bold text-slate-200">
              {promo.usedCount} {promo.usageLimit ? `/ ${promo.usageLimit} uses` : 'times redeemed'}
            </span>
          </div>

          {promo.usageLimit && (
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  usagePercentage >= 90 ? 'bg-rose-500' : usagePercentage >= 50 ? 'bg-amber-500' : 'bg-indigo-500'
                }`} 
                style={{ width: `${usagePercentage}%` }} 
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-medium block">Min. Order Value</span>
            <span className="text-xs font-bold text-slate-200 mt-0.5 block">
              Rs. {Number(promo.minOrderValue || 0).toFixed(2)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-medium block">Time Remaining</span>
            <span className={`text-xs font-bold mt-0.5 block truncate ${
              isExpired ? 'text-rose-400' : 'text-indigo-400'
            }`}>
              {promo.expiryDate ? timeLeft : 'Never Expires'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  const defaultFormData = {
    code: '',
    type: 'percentage',
    value: '',
    minOrderValue: '0',
    usageLimit: '',
    expiryDate: '',
  };
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const res = await promotionsAPI.getAll();
      setPromotions(res.data || []);
    } catch (error) {
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await promotionsAPI.update(editId, {
          ...formData,
          value: Number(formData.value),
          minOrderValue: Number(formData.minOrderValue),
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
        });
        toast.success('Promotion updated successfully');
      } else {
        await promotionsAPI.create({
          ...formData,
          value: Number(formData.value),
          minOrderValue: Number(formData.minOrderValue),
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
          scope: 'platform',
        });
        toast.success('Promotion created successfully');
      }
      closeModal();
      fetchPromotions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} promotion`);
    }
  };

  const openModal = (promo?: any) => {
    if (promo) {
      setIsEditing(true);
      setEditId(promo.id);
      setFormData({
        code: promo.code,
        type: promo.type,
        value: promo.value.toString(),
        minOrderValue: promo.minOrderValue.toString(),
        usageLimit: promo.usageLimit ? promo.usageLimit.toString() : '',
        expiryDate: promo.expiryDate ? new Date(promo.expiryDate).toISOString().slice(0, 16) : '',
      });
    } else {
      setIsEditing(false);
      setEditId('');
      setFormData(defaultFormData);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditId('');
    setFormData(defaultFormData);
  };

  const toggleStatus = async (id: string) => {
    try {
      await promotionsAPI.toggleStatus(id);
      toast.success('Promotion status updated');
      fetchPromotions();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  // Filtered promotions
  const filteredPromotions = promotions.filter((p) => {
    const matchesSearch = p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const isExpired = p.expiryDate && new Date(p.expiryDate).getTime() <= new Date().getTime();
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = p.isActive && !isExpired;
    } else if (statusFilter === 'expired') {
      matchesStatus = isExpired;
    } else if (statusFilter === 'inactive') {
      matchesStatus = !p.isActive && !isExpired;
    }

    return matchesSearch && matchesStatus;
  });

  const totalRedeemed = promotions.reduce((acc, p) => acc + (p.usedCount || 0), 0);
  const activeCount = promotions.filter(p => p.isActive && (!p.expiryDate || new Date(p.expiryDate) > new Date())).length;
  const expiredCount = promotions.filter(p => p.expiryDate && new Date(p.expiryDate) <= new Date()).length;

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-7xl mx-auto">
      <Toaster 
        position="top-right" 
        containerStyle={{ top: 90, zIndex: 999999 }}
        toastOptions={{
          style: {
            zIndex: 999999,
          },
        }}
      />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Tag className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Platform Promotions &amp; Vouchers
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage global store discount codes, seasonal campaigns, and active buyer vouchers.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 transition-all active:scale-95 text-sm"
        >
          <Plus className="w-5 h-5" />
          Create Promotion Code
        </button>
      </div>

      {/* Metrics Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Codes */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-5 shadow-lg transition-all cursor-pointer group ${
            statusFilter === 'all' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-indigo-500/20 hover:border-indigo-500/40'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 rounded-xl">
              <Tag className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Catalog
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Promo Codes</p>
          <p className="text-2xl font-extrabold text-indigo-400 tracking-tight leading-none mb-1">{promotions.length}</p>
          <p className="text-[10px] text-slate-500">Click to show all</p>
        </div>

        {/* Active Codes */}
        <div 
          onClick={() => setStatusFilter('active')}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-5 shadow-lg transition-all cursor-pointer group ${
            statusFilter === 'active' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-emerald-500/20 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Active
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Active Vouchers</p>
          <p className="text-2xl font-extrabold text-emerald-400 tracking-tight leading-none mb-1">{activeCount}</p>
          <p className="text-[10px] text-emerald-400/80 font-medium">Ready for checkout</p>
        </div>

        {/* Total Redeemed */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 p-5 shadow-lg group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-purple-500/10 border border-purple-500/25 rounded-xl">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Usage
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Redeemed</p>
          <p className="text-2xl font-extrabold text-purple-400 tracking-tight leading-none mb-1">{totalRedeemed}</p>
          <p className="text-[10px] text-slate-500">Customer redemptions</p>
        </div>

        {/* Expired Codes */}
        <div 
          onClick={() => setStatusFilter('expired')}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 p-5 shadow-lg transition-all cursor-pointer group ${
            statusFilter === 'expired' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-rose-500/20 hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/25 rounded-xl">
              <Clock className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Expired
            </span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Expired Vouchers</p>
          <p className="text-2xl font-extrabold text-rose-400 tracking-tight leading-none mb-1">{expiredCount}</p>
          <p className="text-[10px] text-rose-400/80 font-medium">Click to show expired</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-sm border border-gray-150 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search promo code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-gray-900 dark:text-white transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700/60 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-gray-900 dark:text-white text-xs font-bold cursor-pointer"
          >
            <option value="all" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">All Voucher Codes ({promotions.length})</option>
            <option value="active" className="bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400">Active Codes ({activeCount})</option>
            <option value="expired" className="bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400">Expired Codes ({expiredCount})</option>
            <option value="inactive" className="bg-white dark:bg-gray-900 text-gray-500">Inactive Codes</option>
          </select>
        </div>
      </div>

      {/* Promotions Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promo: any) => (
            <PromoCard key={promo.id} promo={promo} toggleStatus={toggleStatus} onEdit={openModal} />
          ))}
          
          {filteredPromotions.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm p-8">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Promotions Found</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                No promotion codes match your search criteria. Create a new promo code to attract shoppers!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm p-4 flex items-center justify-center min-h-screen overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in relative my-auto max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-150 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Platform Promotion' : 'Create New Promotion Code'}
                </h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Promo Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    placeholder="e.g. SUMMER20"
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all uppercase font-mono font-bold ${
                      isEditing ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Generate Random Code"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Auto</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Discount Type
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-bold cursor-pointer"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="percentage" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Percentage (%)</option>
                    <option value="fixed" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-bold"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Min. Order Value (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-bold"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Usage Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-bold placeholder:font-normal"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Expiry Date &amp; Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-bold"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t border-gray-150 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md active:scale-95"
                >
                  {isEditing ? 'Save Changes' : 'Create Promotion Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
