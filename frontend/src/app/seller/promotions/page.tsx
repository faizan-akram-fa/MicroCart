'use client';

import { useState, useEffect } from 'react';
import { promotionsAPI, productsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { PlusIcon, TagIcon, ClockIcon, ChartBarIcon, XMarkIcon, CheckCircleIcon, CubeIcon, SparklesIcon, PencilIcon } from '@heroicons/react/24/outline';

function PromoCard({ promo, toggleStatus, onEdit }: { promo: any; toggleStatus: (id: string) => void; onEdit: (promo: any) => void }) {
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
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [promo.expiryDate]);

  const activeStatus = isExpired ? false : promo.isActive;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-800 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 flex gap-2">
        <button
          onClick={() => onEdit(promo)}
          className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700"
          title="Edit Promotion"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggleStatus(promo.id)}
          disabled={isExpired}
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            isExpired ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 cursor-not-allowed' :
            activeStatus ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {isExpired ? 'Expired' : (activeStatus ? 'Active' : 'Inactive')}
        </button>
      </div>
      
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-4 rounded-xl ${isExpired ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'}`}>
          <CubeIcon className="w-8 h-8" />
        </div>
        <div>
          <h3 className={`text-2xl font-bold tracking-tight ${isExpired ? 'text-slate-500 dark:text-gray-500 line-through' : 'text-slate-800 dark:text-white'}`}>{promo.code}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-gray-400">
            {promo.type === 'percentage' ? `${promo.value}% OFF` : `Rs. ${promo.value} OFF`}
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-gray-800">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-gray-400 flex items-center gap-2"><TagIcon className="w-4 h-4"/> Scope</span>
          <span className="font-medium text-slate-700 dark:text-gray-200">Specific Products</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-gray-400 flex items-center gap-2"><ClockIcon className="w-4 h-4"/> Expiry</span>
          <span className="font-medium text-slate-700 dark:text-gray-200">{promo.expiryDate ? new Date(promo.expiryDate).toLocaleDateString() : 'No expiry'}</span>
        </div>
        {promo.expiryDate && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-gray-400 flex items-center gap-2"><ClockIcon className="w-4 h-4 text-amber-500"/> Time Left</span>
            <span className={`font-medium ${isExpired ? 'text-red-500 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>{timeLeft || 'Calculating...'}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-gray-400 flex items-center gap-2"><ChartBarIcon className="w-4 h-4"/> Usage</span>
          <span className="font-medium text-slate-700 dark:text-gray-200">{promo.usedCount} {promo.usageLimit ? `/ ${promo.usageLimit}` : 'times'}</span>
        </div>
      </div>
    </div>
  );
}

export default function SellerPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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
    scope: 'product',
    applicableProductIds: [] as string[],
  };
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [promoRes, prodRes] = await Promise.all([
        promotionsAPI.getAll(),
        productsAPI.getSellerProducts()
      ]);
      setPromotions(promoRes.data);
      setProducts(prodRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.applicableProductIds.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

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
        });
        toast.success('Promotion created successfully');
      }
      
      closeModal();
      fetchData();
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
        scope: promo.scope,
        applicableProductIds: promo.applicableProductIds || [],
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
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleProductSelect = (productId: string) => {
    setFormData(prev => {
      const isSelected = prev.applicableProductIds.includes(productId);
      return {
        ...prev,
        applicableProductIds: isSelected 
          ? prev.applicableProductIds.filter(id => id !== productId)
          : [...prev.applicableProductIds, productId]
      };
    });
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">Store Promotions</h1>
          <p className="text-slate-500 mt-1">Create discount codes to boost your sales.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/30 transition-all active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
          Create Code
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo: any) => (
            <PromoCard key={promo.id} promo={promo} toggleStatus={toggleStatus} onEdit={openModal} />
          ))}
          {promotions.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <TagIcon className="w-16 h-16 text-slate-300 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 dark:text-gray-300">No Promotions Yet</h3>
              <p className="text-slate-500 dark:text-gray-400">Create your first store promotion to attract more buyers.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto border border-transparent dark:border-gray-800">
            <div className="p-6 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50/50 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{isEditing ? 'Edit Promotion' : 'Create Store Promotion'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Promo Code</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAVE10"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all uppercase pr-12 bg-white dark:bg-gray-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                    title="Generate Random Code"
                  >
                    <SparklesIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Discount Type</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-slate-800 dark:text-white"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-slate-800 dark:text-white"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Min. Order Value (Rs.)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-slate-800 dark:text-white"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Usage Limit (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Expiry Date (Optional)</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-slate-800 dark:text-white"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>

              <div className="border-t border-slate-100 dark:border-gray-800 pt-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">Select Applicable Products *</label>

                  <div className="bg-slate-50 dark:bg-gray-800/50 p-4 rounded-xl border border-slate-200 dark:border-gray-700 max-h-48 overflow-y-auto space-y-2">
                    {products.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-gray-400 text-center py-2">No products found. Add products first.</p>
                    ) : (
                      products.map((product: any) => (
                        <label key={product.id} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                          <input 
                            type="checkbox"
                            checked={formData.applicableProductIds.includes(product.id)}
                            onChange={() => handleProductSelect(product.id)}
                            className="w-4 h-4 text-amber-500 focus:ring-amber-500 rounded border-slate-300 dark:border-gray-600 dark:bg-gray-800"
                          />
                          <img src={product.images?.[0] || 'https://via.placeholder.com/40'} alt="" className="w-8 h-8 rounded object-cover" />
                          <span className="text-sm font-medium text-slate-700 dark:text-gray-200 truncate flex-1">{product.name}</span>
                        </label>
                      ))
                    )}
                  </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 text-slate-600 dark:text-gray-300 font-medium hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                >
                  {isEditing ? 'Save Changes' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
