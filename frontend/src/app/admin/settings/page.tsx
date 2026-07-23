'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Sun, 
  Moon, 
  Monitor, 
  ShieldCheck, 
  User, 
  Lock, 
  Bell, 
  Check, 
  Sparkles,
  ArrowRight,
  Globe,
  Sliders
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useAuthStore, useAppStore } from '@/lib/store';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { user } = useAuthStore();
  const { currency, setCurrency } = useAppStore();
  const router = useRouter();

  const [soundAlerts, setSoundAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-5xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          Admin System &amp; Appearance Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize your admin panel theme preferences, display options, and security settings.
        </p>
      </div>

      {/* Appearance Section */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-150 dark:border-gray-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Theme &amp; Color Mode
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Switch between Light Mode and Dark Mode for the control panel.</p>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 px-3 py-1 rounded-full border border-primary-100 dark:border-primary-900/30">
            Active: {theme} mode
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Light Mode Preview Card */}
          <div 
            onClick={() => {
              setTheme('light');
              toast.success('Switched to Light Theme');
            }}
            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group ${
              theme === 'light'
                ? 'border-primary-600 bg-gradient-to-br from-slate-50 to-white shadow-xl ring-4 ring-primary-500/10'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                <Sun className="w-6 h-6" />
              </div>
              {theme === 'light' && (
                <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">Light Theme</h3>
            <p className="text-xs text-gray-500 mb-4">Clean, high-contrast light layout designed for daytime administration.</p>

            {/* Mock Light Mode Component Preview */}
            <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 space-y-2">
              <div className="h-3 w-2/3 bg-slate-300 rounded" />
              <div className="h-2 w-full bg-slate-200 rounded" />
              <div className="flex gap-1.5 pt-1">
                <div className="h-6 w-14 bg-indigo-600 rounded-lg" />
                <div className="h-6 w-14 bg-slate-200 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Dark Mode Preview Card */}
          <div 
            onClick={() => {
              setTheme('dark');
              toast.success('Switched to Dark Glassmorphism Theme');
            }}
            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group ${
              theme === 'dark'
                ? 'border-indigo-500 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 shadow-xl ring-4 ring-indigo-500/20'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Moon className="w-6 h-6" />
              </div>
              {theme === 'dark' && (
                <span className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white mb-1">Dark Glassmorphism</h3>
            <p className="text-xs text-slate-400 mb-4">Sleek dark layout with subtle glass effects for reduced eye strain.</p>

            {/* Mock Dark Mode Component Preview */}
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-2">
              <div className="h-3 w-2/3 bg-indigo-400/50 rounded" />
              <div className="h-2 w-full bg-slate-800 rounded" />
              <div className="flex gap-1.5 pt-1">
                <div className="h-6 w-14 bg-indigo-600 rounded-lg" />
                <div className="h-6 w-14 bg-slate-800 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-150 dark:border-gray-800 shadow-sm space-y-6">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-500" /> Platform &amp; Display Preferences
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Configure default currency formatting and alert notifications.</p>
        </div>

        <div className="space-y-4">
          {/* Currency Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Default Currency Display</p>
                <p className="text-xs text-gray-400">Select currency for revenue metrics and product pricing</p>
              </div>
            </div>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value as any);
                toast.success(`Currency updated to ${e.target.value}`);
              }}
              className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-xs text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="PKR">PKR - Pakistani Rupee (Rs)</option>
              <option value="USD">USD - US Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="GBP">GBP - British Pound (£)</option>
            </select>
          </div>

          {/* Sound Alerts Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Admin System Notifications</p>
                <p className="text-xs text-gray-400">Receive live toasts for new seller applications and system alerts</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSoundAlerts(!soundAlerts);
                toast.success(soundAlerts ? 'System notifications muted' : 'System notifications enabled');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${soundAlerts ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${soundAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Security & Account Shortcuts */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-150 dark:border-gray-800 shadow-sm space-y-6">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Account &amp; Security Shortcuts
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage your personal admin account details and credentials.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Admin Profile</p>
                <p className="text-xs text-gray-400">Update avatar and name</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => router.push('/change-password')}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Change Password</p>
                <p className="text-xs text-gray-400">Update security password</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

    </div>
  );
}
