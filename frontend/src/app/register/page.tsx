'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'buyer' as 'buyer' | 'seller',
    phone: '',
    // Seller fields
    storeName: '',
    storeAddress: '',
    storeType: 'individual',
    cnicNumber: '',
  });
  const [cnicFile, setCnicFile] = useState<File | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCustomStoreType, setIsCustomStoreType] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCnicFile(e.target.files[0]);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setFormData({
        ...formData,
        phone: value ? `+92${value}` : ''
      });
    }
  };

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    let formattedCnic = rawValue;

    if (rawValue.length > 5) {
      formattedCnic = rawValue.slice(0, 5) + '-' + rawValue.slice(5);
    }
    if (rawValue.length > 12) {
      formattedCnic = rawValue.slice(0, 5) + '-' + rawValue.slice(5, 12) + '-' + rawValue.slice(12, 13);
    }

    if (rawValue.length <= 13) {
      setFormData({
        ...formData,
        cnicNumber: formattedCnic
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Password Validation
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[0-9]).{8,}$/;
    if (!strongPasswordRegex.test(formData.password)) {
      toast.error('Password must contain at least 1 Uppercase letter, 1 Number, and 1 Special character');
      return;
    }

    if (formData.password.toLowerCase().includes('123456') || formData.password.toLowerCase().includes('abcdef')) {
      toast.error('Password cannot contain simple sequences like "123456"');
      return;
    }

    // Phone validation: +92 followed by 10 digits
    // Since we control input to be digits only and prepend +92, checking length is mostly enough but regex is safer
    const phoneRegex = /^\+92\d{10}$/;

    if (formData.phone && !phoneRegex.test(formData.phone)) {
      toast.error('Phone number must be exactly 10 digits after +92');
      return;
    }

    if (formData.role === 'seller' && !cnicFile) {
      toast.error('CNIC Document is required for sellers');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;

      let response;
      if (formData.role === 'seller' && cnicFile) {
        const form = new FormData();
        Object.keys(registerData).forEach(key => {
          form.append(key, registerData[key as keyof typeof registerData]);
        });
        form.append('cnicImage', cnicFile);
        response = await authAPI.register(form);
      } else {
        response = await authAPI.register(registerData);
      }

      const { access_token, user } = response.data;

      login(user, access_token);
      toast.success('Registration successful!');

      // Redirect based on role
      if (user.role === 'seller') {
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
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 transition-colors duration-200">
      <div className="max-w-2xl w-full">
        <div className="card">
          <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">Register</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-medium">
                    +92
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone.startsWith('+92') ? formData.phone.slice(3) : formData.phone}
                    onChange={handlePhoneChange}
                    className="input pl-12"
                    placeholder="3001234567"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="input pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                    onMouseDown={(e) => { e.preventDefault(); setShowPassword(true); }}
                    onMouseUp={(e) => { e.preventDefault(); setShowPassword(false); }}
                    onMouseLeave={(e) => { e.preventDefault(); setShowPassword(false); }}
                    onTouchStart={(e) => { e.preventDefault(); setShowPassword(true); }}
                    onTouchEnd={(e) => { e.preventDefault(); setShowPassword(false); }}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordFocused && (
                  <div className="absolute z-10 w-full mt-1 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg text-xs text-gray-600 dark:text-gray-300">
                    <p className="font-semibold mb-1 text-gray-800 dark:text-white">Password must match:</p>
                    <ul className="pl-4 space-y-1">
                      <li className={formData.password.length >= 8 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                        {formData.password.length >= 8 ? '✓' : '•'} At least 8 characters long
                      </li>
                      <li className={/[A-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                        {/[A-Z]/.test(formData.password) ? '✓' : '•'} One Uppercase letter (A-Z)
                      </li>
                      <li className={/(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password) ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                        {/(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password) ? '✓' : '•'} One Number (0-9) & One Special Char
                      </li>
                      <li className={!formData.password.toLowerCase().includes('123456') && !formData.password.toLowerCase().includes('abcdef') && formData.password.length > 0 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                        {!formData.password.toLowerCase().includes('123456') && !formData.password.toLowerCase().includes('abcdef') && formData.password.length > 0 ? '✓' : '•'} No sequences (e.g. 123456, abcdef)
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                    onMouseDown={(e) => { e.preventDefault(); setShowConfirmPassword(true); }}
                    onMouseUp={(e) => { e.preventDefault(); setShowConfirmPassword(false); }}
                    onMouseLeave={(e) => { e.preventDefault(); setShowConfirmPassword(false); }}
                    onTouchStart={(e) => { e.preventDefault(); setShowConfirmPassword(true); }}
                    onTouchEnd={(e) => { e.preventDefault(); setShowConfirmPassword(false); }}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Type *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {formData.role === 'buyer'
                    ? 'As a buyer, you can browse and purchase products'
                    : 'As a seller, you can list and manage your products'}
                </p>
              </div>

              {formData.role === 'seller' && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Store Address *
                    </label>
                    <input
                      type="text"
                      name="storeAddress"
                      value={formData.storeAddress}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Store Type *
                    </label>
                    <select
                      name="storeType"
                      value={isCustomStoreType ? 'other' : formData.storeType}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'other') {
                          setIsCustomStoreType(true);
                          setFormData({ ...formData, storeType: '' });
                        } else {
                          setIsCustomStoreType(false);
                          setFormData({ ...formData, storeType: val });
                        }
                      }}
                      className="input mb-2"
                      required
                    >
                      <option value="individual">Individual</option>
                      <option value="business">Business / Company</option>
                      <option value="other">Other (Please Specify)</option>
                    </select>
                    {isCustomStoreType && (
                      <input
                        type="text"
                        value={formData.storeType}
                        onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
                        className="input"
                        placeholder="Specify Store Type"
                        required
                        autoFocus
                      />
                    )}
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CNIC Number *
                    </label>
                    <input
                      type="text"
                      name="cnicNumber"
                      value={formData.cnicNumber}
                      onChange={handleCnicChange}
                      className="input"
                      placeholder="XXXXX-XXXXXXX-X"
                      maxLength={15} // 13 digits + 2 dashes
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CNIC Copy (Image or PDF) *
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="register-cnic-upload"
                        required
                      />
                      <label
                        htmlFor="register-cnic-upload"
                        className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-gray-600 dark:text-gray-400 overflow-hidden"
                      >
                        <span className="truncate max-w-[200px]">
                          {cnicFile ? cnicFile.name : 'Click to Upload CNIC'}
                        </span>
                      </label>
                    </div>
                  </div>
                </>
              )}

            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
