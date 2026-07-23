'use client';

import { useState, useEffect } from 'react';

import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Clock, XCircle, ChevronRight, LogOut, Upload, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PendingSellerPage() {
  const { user, logout, updateUser } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [isResubmitting, setIsResubmitting] = useState(false);
  const [loadingResubmit, setLoadingResubmit] = useState(false);
  const [sellerData, setSellerData] = useState({
    storeName: user?.storeName || '',
    storeAddress: user?.storeAddress || '',
    storeType: user?.storeType || 'individual',
    cnicNumber: user?.cnicNumber || '',
  });
  const [cnicFile, setCnicFile] = useState<File | null>(null);
  const [isCustomStoreType, setIsCustomStoreType] = useState(
    user?.storeType && !['individual', 'business'].includes(user.storeType)
  );

  useEffect(() => {
    setMounted(true);
    // If they are approved, they shouldn't be here
    if (user?.role === 'seller') {
      if (user?.sellerStatus === 'approved') {
        router.push('/seller/dashboard');
      } else if (!user?.cnicNumber) {
        // If they are a seller but haven't submitted KYC, they should be in role-selection
        router.push('/role-selection');
      }
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!mounted || !user || user.role !== 'seller') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 p-8 md:p-12 text-center animate-fade-in-up">
        
        {user.sellerStatus === 'rejected' ? (
          <>
            <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-8 border-[6px] border-rose-100 dark:border-rose-900/30">
              <XCircle className="w-12 h-12 text-rose-500" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Application <span className="text-rose-600">Declined</span></h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
              Unfortunately, your seller registration could not be approved at this time.
            </p>
            
            <div className="bg-rose-50 dark:bg-rose-900/10 text-rose-800 dark:text-rose-200 p-6 rounded-2xl mb-8 text-left border border-rose-100 dark:border-rose-900/30 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
               <h3 className="font-bold flex items-center mb-2">
                 <ShieldAlert className="w-5 h-5 mr-2" /> Administrator Feedback:
               </h3>
               <p className="text-sm pl-7 leading-relaxed">{user.rejectionReason || "No specific reason provided."}</p>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={() => setIsResubmitting(true)} 
                className="btn w-full btn-primary font-bold py-3 shadow-lg shadow-primary-500/20"
              >
                <Upload className="w-5 h-5 mr-2 inline" /> Update Document & Re-Submit
              </button>
              <button onClick={handleLogout} className="btn w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 font-bold py-3">
                <LogOut className="w-5 h-5 mr-2 inline" /> Logout
              </button>
            </div>
            {isResubmitting && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
                <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-800">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-10">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Update & Resubmit App</h2>
                    <button onClick={() => setIsResubmitting(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="p-6">
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setLoadingResubmit(true);
                      try {
                        if (cnicFile) {
                          const formData = new FormData();
                          formData.append('image', cnicFile);
                          await authAPI.uploadCnicImage(formData);
                        }
                        await authAPI.updateProfile({
                          storeName: sellerData.storeName,
                          storeAddress: sellerData.storeAddress,
                          storeType: sellerData.storeType,
                          cnicNumber: sellerData.cnicNumber,
                        });
                        const res = await authAPI.resubmitSeller();
                        updateUser(res.data.user);
                        toast.success('Application resubmitted successfully!');
                        setIsResubmitting(false);
                        setLoadingResubmit(false);
                      } catch (error: any) {
                        toast.error(error.response?.data?.message || 'Failed to resubmit');
                        setLoadingResubmit(false);
                      }
                    }} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Store Name *</label>
                          <input type="text" required value={sellerData.storeName} onChange={(e) => setSellerData({ ...sellerData, storeName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Store Type</label>
                          <select value={isCustomStoreType ? 'other' : sellerData.storeType} onChange={(e) => {
                            if (e.target.value === 'other') setIsCustomStoreType(true);
                            else { setIsCustomStoreType(false); setSellerData({ ...sellerData, storeType: e.target.value }); }
                          }} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none mb-3">
                            <option value="individual">Individual</option>
                            <option value="business">Business / Company</option>
                            <option value="other">Other</option>
                          </select>
                          {isCustomStoreType && (
                            <input type="text" placeholder="Specify Store Type" value={sellerData.storeType} onChange={(e) => setSellerData({ ...sellerData, storeType: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" required />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Store Address *</label>
                        <textarea required rows={2} value={sellerData.storeAddress} onChange={(e) => setSellerData({ ...sellerData, storeAddress: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CNIC Number *</label>
                          <input type="text" required value={sellerData.cnicNumber} onChange={(e) => setSellerData({ ...sellerData, cnicNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New CNIC Copy (Optional if same)</label>
                          <input type="file" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) setCnicFile(e.target.files[0]); }} className="hidden" id="resubmit-cnic" />
                          <label htmlFor="resubmit-cnic" className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-gray-600 dark:text-gray-400">
                            <Upload className="w-5 h-5 mr-2" />
                            <span className="truncate">{cnicFile ? cnicFile.name : 'Click to Upload New CNIC'}</span>
                          </label>
                        </div>
                      </div>
                      <button type="submit" disabled={loadingResubmit} className="w-full btn btn-primary py-4 rounded-xl font-bold shadow-lg disabled:opacity-50 flex justify-center items-center">
                        {loadingResubmit ? 'Resubmitting...' : 'Confirm Resubmission'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
              <div className="absolute inset-0 border-4 border-primary-200 dark:border-primary-900/40 rounded-full animate-ping opacity-75"></div>
              <Clock className="w-12 h-12 text-primary-500 relative z-10" />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Account Under Review</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg leading-relaxed">
              Thanks for joining <span className="font-bold text-primary-600">MicroCart</span>! Our team is currently reviewing your store details and identity verification documents.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 mb-8 text-left">
               <h3 className="text-blue-800 dark:text-blue-300 font-bold mb-2 flex items-center">What happens next?</h3>
               <ul className="space-y-3 text-sm text-blue-700/80 dark:text-blue-400/80">
                 <li className="flex items-start">
                   <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center text-[10px] font-bold mr-3 shrink-0 mt-0.5">1</span>
                   Our administrators will verify your CNIC and store details.
                 </li>
                 <li className="flex items-start">
                   <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center text-[10px] font-bold mr-3 shrink-0 mt-0.5">2</span>
                   This process typically takes 24-48 business hours.
                 </li>
                 <li className="flex items-start">
                   <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center text-[10px] font-bold mr-3 shrink-0 mt-0.5">3</span>
                   You'll gain access to the Seller Dashboard once approved.
                 </li>
               </ul>
            </div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => window.location.reload()} className="btn btn-primary font-bold py-3 px-6 shadow-lg shadow-primary-500/20">
                Check Status Again
              </button>
              <button onClick={handleLogout} className="btn bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 font-bold py-3 px-6">
                Logout
              </button>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-400 font-medium">
        <p>Need help? <a href="mailto:support@microcart.com" className="text-primary-500 hover:underline">Contact Support</a></p>
      </div>
    </div>
  );
}
