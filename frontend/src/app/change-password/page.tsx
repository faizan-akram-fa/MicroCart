'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { KeyRound, ShieldAlert, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (oldPassword === newPassword) {
      toast.error('New password cannot be the same as temporary password');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({ oldPassword, newPassword });
      toast.success('Password updated successfully!');

      if (user) {
        const updatedUser = { ...user, mustChangePassword: false };
        updateUser(updatedUser);

        // Redirect based on role
        if (updatedUser.role === 'admin' || updatedUser.role === 'sub_admin') {
          router.replace('/admin/dashboard');
        } else if (updatedUser.role === 'seller') {
          if (updatedUser.sellerStatus === 'approved') {
            router.replace('/seller/dashboard');
          } else if (updatedUser.cnicNumber) {
            router.replace('/seller/pending');
          } else {
            router.replace('/role-selection');
          }
        } else if (updatedUser.role === 'pending') {
          router.replace('/role-selection');
        } else {
          router.replace('/');
        }
      } else {
        router.replace('/login');
      }
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to update password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Background Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-500/0 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-400/10 to-primary-500/0 blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/80 shadow-2xl shadow-slate-200/40 dark:shadow-none animate-slide-up">
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-5 border border-indigo-100/50 dark:border-indigo-900/30 shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Update Password</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2.5 max-w-xs">
              For account security, you must replace your temporary password with a secure new one.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Old / Temporary Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                Temporary Password
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium transition-all"
                  placeholder="Enter temporary password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showOld ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium transition-all"
                  placeholder="Create new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium transition-all"
                  placeholder="Verify new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Change Password & Continue'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
            >
              Sign out and go back
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
