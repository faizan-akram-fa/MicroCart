'use client';

import { useState, useEffect } from 'react';
import { Send, Users, Layout, Type, Loader, CheckCircle2, AlertCircle, ShoppingBag, Zap } from 'lucide-react';
import { sellerAPI, ordersAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function SellerCommunications() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user?.role !== 'seller') {
      router.push('/');
      return;
    }
    fetchAudience();
  }, [user]);

  const fetchAudience = async () => {
    try {
      const res = await sellerAPI.getBuyers();
      setCustomers(res.data);
      setCustomerCount(res.data.length);
    } catch (error) {
      console.error('Failed to fetch audience count');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      toast.error('Subject and message are required');
      return;
    }

    if (customerCount === 0) {
      toast.error('You do not have any customers to send promotions to yet.');
      return;
    }

    setLoading(true);
    try {
      await sellerAPI.sendPromotion(formData);
      toast.success('Campaign sent to your customers successfully!');
      setSent(true);
      setFormData({ subject: '', message: '' });
      setTimeout(() => setSent(false), 5000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Customer Engagement</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight italic">Store Promotion Hub</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Connect with customers who have purchased from your store.</p>
        </div>
        <div 
          onClick={() => customerCount !== null && setIsModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
        >
          <ShoppingBag className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            {customerCount !== null ? `${customerCount} Loyal Customers` : 'Loading Audience...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Composer Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-500 hover:shadow-2xl">
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <label className="flex items-center text-xs font-black text-gray-400 dark:text-gray-500 px-1 uppercase tracking-[0.2em]">
                  <Type className="w-4 h-4 mr-2 text-indigo-500" /> Subject Line
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exclusive 20% Discount for my valued customers! 🎁"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-6 py-5 bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold placeholder:font-normal transition-all"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center text-xs font-black text-gray-400 dark:text-gray-500 px-1 uppercase tracking-[0.2em]">
                  <Layout className="w-4 h-4 mr-2 text-indigo-500" /> Message Content
                </label>
                <div className="relative">
                  <textarea
                    required
                    rows={10}
                    placeholder="Wrtie your message here... You can use basic HTML like <b>bold</b> and <br> for new lines."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-6 py-6 bg-gray-50 dark:bg-gray-800/50 border-none rounded-[2rem] focus:ring-2 focus:ring-indigo-500 outline-none text-sm leading-relaxed custom-scrollbar min-h-[300px]"
                  />
                  <div className="absolute bottom-6 right-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    {formData.message.length} Characters
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 max-w-[200px] leading-relaxed">
                Your message will be sent individually to all customers who have ordered from you.
              </p>
              
              <button
                type="submit"
                disabled={loading || sent || customerCount === 0}
                className={`py-4 px-10 rounded-2xl font-black text-white shadow-xl flex items-center space-x-3 transition-all transform active:scale-95 ${
                  sent 
                    ? 'bg-emerald-500 shadow-emerald-500/30' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 hover:-translate-y-1'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span className="uppercase tracking-widest text-xs">Sending...</span>
                  </>
                ) : sent ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 animate-bounce" />
                    <span className="uppercase tracking-widest text-xs">Delivered</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="uppercase tracking-widest text-xs">Send Promotion</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-xl font-black mb-4 leading-tight italic">Targeted Marketing</h3>
            <p className="text-sm text-indigo-100 leading-relaxed mb-6">
              You are only authorized to contact buyers who have already interacted with your store. This ensures a high conversion rate and keeps our community spam-free.
            </p>
            <div 
              onClick={() => setIsModalOpen(true)}
              className="p-5 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors"
            >
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Potential Reach</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black">{customerCount || 0}</span>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg">Verified Buyers</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="font-black text-gray-900 dark:text-white mb-6 flex items-center uppercase tracking-widest text-xs">
              <AlertCircle className="w-4 h-4 mr-2 text-amber-500" /> Best Practices
            </h3>
            <ul className="space-y-4">
              {[
                'Offer exclusive discounts',
                'Announce new product arrivals',
                'Keep messages concise and clear',
                'Use emojis to stand out'
              ].map((note, i) => (
                <li key={i} className="flex items-start text-xs text-gray-500 dark:text-gray-400 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 mr-3 shrink-0"></div>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
    </div>

      {/* Loyal Customers Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-black text-xl flex items-center dark:text-white">
                <Users className="w-5 h-5 mr-2 text-indigo-500" />
                Loyal Customers
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {customers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">
                  No customers found yet.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {customers.map((c) => (
                    <li key={c.id} className="p-4 flex items-center space-x-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors m-2">
                      <img 
                        src={c.profileImage || `https://ui-avatars.com/api/?name=${c.firstName}+${c.lastName}&background=random`} 
                        alt={c.firstName} 
                        className="w-12 h-12 rounded-full border-2 border-indigo-100 dark:border-indigo-900 object-cover"
                      />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white leading-tight">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {c.email}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
