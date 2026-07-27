'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle2,
  XCircle,
  Loader,
  RefreshCcw,
  Store,
  FileText,
  AlertCircle
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SellerApprovals() {
  const [pendingSellers, setPendingSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Rejection Modal State
  const [rejectingSeller, setRejectingSeller] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPendingSellers();
      setPendingSellers(res.data);
    } catch (error) {
      console.error('Fetch pending sellers error:', error);
      toast.error('Failed to load pending sellers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, name: string) => {
    try {
      await adminAPI.approveSeller(id);
      toast.success(`Seller ${name} approved successfully`);
      setPendingSellers(pendingSellers.filter(s => s.id !== id));
      // Dispatch event to update layout badge
      window.dispatchEvent(new Event('refreshPendingSellers'));
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to approve seller';
      toast.error(`Error: ${msg}`);
      console.error('Approve Error Detailed:', error);
    }
  };

  const handleReject = async () => {
    if (!rejectingSeller) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setRejectLoading(true);
    try {
      await adminAPI.rejectSeller(rejectingSeller.id, rejectionReason);
      toast.success(`Seller ${rejectingSeller.firstName} rejected successfully`);
      setPendingSellers(pendingSellers.filter(s => s.id !== rejectingSeller.id));
      setRejectingSeller(null);
      setRejectionReason('');
      // Dispatch event to update layout badge
      window.dispatchEvent(new Event('refreshPendingSellers'));
    } catch (error) {
      toast.error('Failed to reject seller');
    } finally {
      setRejectLoading(false);
    }
  };

  const filteredSellers = pendingSellers.filter(seller => 
    seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${seller.firstName} ${seller.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (seller.storeName && seller.storeName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCnicUrl = (cnicImage: any) => {
    if (!cnicImage) return null;
    let url = typeof cnicImage === 'string' ? cnicImage.replace(/\\/g, '/') : String(cnicImage);
    if (url === '[object Object]' || url === '{}' || url.includes('%7B%7D') || url.includes('{}')) return null;

    // Always strip localhost domain & port to route through domain proxy
    url = url.replace(/^https?:\/\/localhost:\d+/, '');

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Normalize /app/uploads or app/uploads to uploads/
    url = url.replace(/^\/?app\/uploads\//, 'uploads/').replace(/\/app\/uploads\//, '/uploads/');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `/api${cleanPath}`;
  };

  if (loading && pendingSellers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in relative z-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Approvals</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review and approve new seller registrations.</p>
        </div>
        <button 
          onClick={fetchSellers}
          className="flex items-center justify-center px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-gray-700 dark:text-gray-300 shadow-sm"
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, email or store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Sellers List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredSellers.map((seller, i) => (
          <div key={seller.id} className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden animate-fade-in-up flex flex-col md:flex-row" style={{ animationDelay: `${i * 50}ms` }}>
            
            {/* Left side: Seller Details */}
            <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 flex flex-col">
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-800">
                  <img src={seller.profileImage || `https://ui-avatars.com/api/?name=${seller.firstName}+${seller.lastName}`} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{seller.firstName} {seller.lastName}</h3>
                  <p className="text-sm text-gray-500">{seller.email}</p>
                  <p className="text-sm text-gray-500">{seller.phone || 'No phone provided'}</p>
                </div>
              </div>
              
              <div className="space-y-4 flex-1">
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-4 border border-primary-100 dark:border-primary-900/30">
                  <div className="flex items-center text-primary-700 dark:text-primary-300 font-bold mb-2">
                    <Store className="w-4 h-4 mr-2" /> Store Info
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><strong>Name:</strong> {seller.storeName || 'N/A'}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><strong>Type:</strong> <span className="capitalize">{seller.storeType || 'N/A'}</span></p>
                  <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Address:</strong> {seller.storeAddress || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Right side: Documents & Actions */}
            <div className="p-6 md:w-2/3 flex flex-col justify-between">
              <div>
                <h4 className="text-md font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-400" /> Identity Verification
                </h4>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2"><strong>CNIC Number:</strong> {seller.cnicNumber || 'Not provided'}</p>
                  
                  {getCnicUrl(seller.cnicImage) ? (
                    <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 mr-auto flex bg-gray-50 dark:bg-gray-800 justify-center items-center relative group" style={{ height: '200px', width: '350px' }}>
                      <img 
                        src={getCnicUrl(seller.cnicImage)!} 
                        alt="CNIC Document" 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a 
                          href={getCnicUrl(seller.cnicImage)!} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-white text-gray-900 px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
                        >
                          View Full Image
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex items-start border border-red-100 dark:border-red-900/30">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div>No valid CNIC document was uploaded by this user. They cannot be approved until they provide verification.</div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button 
                  onClick={() => handleApprove(seller.id, seller.firstName)}
                  disabled={!seller.cnicImage}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg shadow-primary-500/20 disabled:shadow-none"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Approve Seller
                </button>
                <button 
                  onClick={() => setRejectingSeller(seller)}
                  className="flex-1 bg-white hover:bg-rose-50 dark:bg-gray-800 dark:hover:bg-rose-900/20 text-rose-600 py-3 rounded-xl font-bold transition-all flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:border-rose-200 dark:hover:border-rose-800"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSellers.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">All caught up!</p>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs mt-2">There are no pending seller applications waiting for review.</p>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border-b border-rose-100 dark:border-rose-900/30">
              <h3 className="text-xl font-bold text-rose-900 dark:text-rose-100 flex items-center">
                <XCircle className="w-6 h-6 mr-2 text-rose-500" /> Reject Seller Application
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You are about to reject the application for <strong>{rejectingSeller.firstName} {rejectingSeller.lastName}</strong> ({rejectingSeller.storeName || 'No Store'}).
              </p>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reason for Rejection (Required)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. The provided CNIC image is blurry and illegible, please upload a clearer copy."
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 p-4 min-h-[120px] outline-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end space-x-3 bg-gray-50 dark:bg-gray-900/50">
              <button 
                onClick={() => {
                  setRejectingSeller(null);
                  setRejectionReason('');
                }}
                disabled={rejectLoading}
                className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={rejectLoading || !rejectionReason.trim()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-500/20"
              >
                {rejectLoading ? (
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
