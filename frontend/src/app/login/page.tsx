'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

import { Eye, EyeOff } from 'lucide-react';
import { Suspense } from 'react';

function LoginContent() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();
  const searchParams = useSearchParams();

  // Handle Google Login Callback or Errors
  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      toast.error(decodeURIComponent(errorParam));
    }

    if (token) {
      // In a real app, verify token or fetch user profile
      localStorage.setItem('token', token);

      authAPI.getProfile().then((res) => {
        login(res.data, token);
        toast.success('Google Login successful!');
        if (res.data.mustChangePassword) {
          router.push('/change-password');
        } else if (res.data.role === 'admin' || res.data.role === 'sub_admin') {
          router.push('/admin/dashboard');
        } else if (res.data.role === 'seller') {
          if (res.data.sellerStatus === 'approved') {
            router.push('/seller/dashboard');
          } else if (res.data.cnicNumber) {
            router.push('/seller/pending');
          } else {
            router.push('/role-selection');
          }
        } else if (res.data.role === 'pending') {
          router.push('/role-selection');
        } else {
          router.push('/');
        }
      }).catch(() => {
        toast.error('Failed to verify Google login');
      });
    }
  }, [searchParams, login, router]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value ? `+92${value}` : '');
      setIsError(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsError(false);

    // Validation
    if (loginMethod === 'email' && !email) {
      toast.error('Email is required'); return;
    }
    if (loginMethod === 'phone' && !phone) {
      toast.error('Phone is required'); return;
    }
    if (!password) {
      toast.error('Password is required');
      return;
    }

    setLoading(true);
    try {
      const payload = loginMethod === 'email' ? { email, password } : { phone, password };
      const response = await authAPI.login(payload);
      const { access_token, user } = response.data;

      login(user, access_token);
      toast.success('Login successful!');

      if (user.mustChangePassword) {
        router.push('/change-password');
      } else if (user.role === 'admin' || user.role === 'sub_admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'seller') {
        if (user.sellerStatus === 'approved') {
          router.push('/seller/dashboard');
        } else if (user.cnicNumber) {
          router.push('/seller/pending');
        } else {
          router.push('/role-selection');
        }
      } else if (user.role === 'pending') {
        router.push('/role-selection');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      setIsError(true);
      const message = error.response?.data?.message || (error.response?.status === 401 ? 'Invalid credentials' : 'Login failed');

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Connect via API Gateway on port 4000
    window.location.href = 'http://localhost:4000/api/auth/google';
  };

  return (
    <div className="max-w-md w-full">
      <div className="card animate-slide-up">
        <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">Login</h2>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex justify-center items-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-transform hover:scale-105 active:scale-95 mb-6 shadow-sm hover:shadow-md"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
          </div>
        </div>

        {/* Toggle Email/Phone */}
        <div className="flex rounded-md bg-gray-100 dark:bg-gray-700 p-1 mb-6">
          <button
            className={`flex-1 py-1.5 text-sm font-medium rounded transition-all duration-300 ${loginMethod === 'email' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white scale-105' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            onClick={() => setLoginMethod('email')}
          >
            Email
          </button>
          <button
            className={`flex-1 py-1.5 text-sm font-medium rounded transition-all duration-300 ${loginMethod === 'phone' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white scale-105' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            onClick={() => setLoginMethod('phone')}
          >
            Phone Number
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up-delay">
          {loginMethod === 'email' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setIsError(false); }}
                className={`input ${isError ? 'border-red-500' : ''}`}
                placeholder="name@example.com"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-medium">
                  +92
                </span>
                <input
                  type="tel"
                  value={phone.startsWith('+92') ? phone.slice(3) : phone}
                  onChange={handlePhoneChange}
                  className={`input pl-12 ${isError ? 'border-red-500' : ''}`}
                  placeholder="3001234567"
                  maxLength={10}
                  required
                />
              </div>
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setIsError(false); }}
              className={`input pr-10 ${isError ? 'border-red-500' : ''}`}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              onMouseDown={(e) => { e.preventDefault(); setShowPassword(true); }}
              onMouseUp={(e) => { e.preventDefault(); setShowPassword(false); }}
              onMouseLeave={(e) => { e.preventDefault(); setShowPassword(false); }}
              // Touch events for mobile support
              onTouchStart={(e) => { e.preventDefault(); setShowPassword(true); }}
              onTouchEnd={(e) => { e.preventDefault(); setShowPassword(false); }}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 animate-fade-in transition-colors duration-200">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
