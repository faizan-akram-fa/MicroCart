'use client';

import { useState, useEffect, useRef } from 'react';
import { authAPI } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Key, Clock, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<'request_otp' | 'verify_otp' | 'enter_password'>('request_otp');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Countdown Timer logic
    useEffect(() => {
        if (step === 'verify_otp' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        toast.error('OTP has expired. Please request a new one.');
                        handleGoBack();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [step, timeLeft]);

    const handleGoBack = () => {
        setStep('request_otp');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeLeft(0);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const res = await authAPI.forgotPassword({ email });
            toast.success(res.data?.message || 'Verification OTP sent to your email.');
            setStep('verify_otp');
            setTimeLeft(120); // 2 minutes in seconds
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send OTP code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) {
            toast.error('Please enter the OTP verification code');
            return;
        }

        setLoading(true);
        try {
            await authAPI.verifyOtp({ email, otp });
            toast.success('OTP verified successfully! Now set your new password.');
            setStep('enter_password');
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Invalid OTP';
            toast.error(errorMsg);
            if (errorMsg.toLowerCase().includes('expired')) {
                handleGoBack();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[0-9]).{8,}$/;
        if (!strongPasswordRegex.test(newPassword)) {
            toast.error('Password must contain at least 1 Uppercase letter, 1 Number, and 1 Special character');
            return;
        }

        if (newPassword.toLowerCase().includes('123456') || newPassword.toLowerCase().includes('abcdef')) {
            toast.error('Password cannot contain simple sequences like "123456"');
            return;
        }

        setLoading(true);
        try {
            await authAPI.resetPassword({
                email,
                otp,
                newPassword,
            });
            toast.success('Password reset successful! Please login.');
            router.push('/login');
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Failed to reset password';
            toast.error(errorMsg);
            if (errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('invalid otp')) {
                handleGoBack();
            }
        } finally {
            setLoading(false);
        }
    };

    // Format seconds to MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 transition-colors duration-200">
            <Toaster position="top-right" />
            <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-750 p-8 rounded-3xl shadow-xl transition-all duration-200">
                <div className="text-center mb-6">
                    <div className="mx-auto w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900/50">
                        {step === 'request_otp' && <Mail className="h-7 w-7" />}
                        {step === 'verify_otp' && <Key className="h-7 w-7" />}
                        {step === 'enter_password' && <Lock className="h-7 w-7" />}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {step === 'enter_password' ? 'New Password' : 'Reset Password'}
                    </h2>
                </div>

                {step === 'request_otp' && (
                    <form onSubmit={handleRequestOtp} className="space-y-6">
                        <p className="text-sm text-gray-505 dark:text-gray-400 text-center leading-relaxed">
                            Enter your registered email address and we will send you a 6-digit OTP code to verify your identity.
                        </p>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                                required
                                placeholder="you@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary-600 hover:bg-primary-750 text-white w-full py-3 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                        >
                            {loading ? 'Sending OTP Code...' : 'Send OTP Verification'}
                        </button>
                    </form>
                )}

                {step === 'verify_otp' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/20 rounded-2xl p-4 mb-4 text-center">
                            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-1">
                                Verification code sent to:
                            </p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                {email}
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/20 rounded-2xl py-3 px-4 mb-2">
                            <Clock className="h-4 w-4 text-red-500" />
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                OTP Code expires in: <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">6-Digit OTP Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full text-center tracking-widest text-lg font-mono px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                                required
                                placeholder="000000"
                                maxLength={6}
                            />
                        </div>

                        <div className="pt-2 flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary-600 hover:bg-primary-750 text-white w-full py-3 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                {loading ? 'Checking code...' : 'Verify OTP'}
                            </button>

                            <button
                                type="button"
                                onClick={handleGoBack}
                                className="w-full py-3 rounded-xl border border-gray-255 dark:border-gray-700 text-gray-650 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" /> Go Back
                            </button>
                        </div>
                    </form>
                )}

                {step === 'enter_password' && (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div className="relative">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                                    required
                                    minLength={8}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 cursor-pointer"
                                    onMouseDown={(e) => { e.preventDefault(); setShowNewPassword(true); }}
                                    onMouseUp={(e) => { e.preventDefault(); setShowNewPassword(false); }}
                                    onMouseLeave={(e) => { e.preventDefault(); setShowNewPassword(false); }}
                                    onTouchStart={(e) => { e.preventDefault(); setShowNewPassword(true); }}
                                    onTouchEnd={(e) => { e.preventDefault(); setShowNewPassword(false); }}
                                >
                                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {passwordFocused && (
                                <div className="absolute z-10 w-full mt-1.5 p-4 bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl text-xs text-gray-600 dark:text-gray-300">
                                    <p className="font-bold mb-2 text-gray-800 dark:text-white flex items-center gap-1.5">
                                        <ShieldCheck className="h-4 w-4 text-indigo-500" /> Password Strength Checklist:
                                    </p>
                                    <ul className="pl-4 space-y-1.5 list-disc">
                                        <li className={newPassword.length >= 8 ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                                            At least 8 characters long
                                        </li>
                                        <li className={/[A-Z]/.test(newPassword) ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                                            One Uppercase letter (A-Z)
                                        </li>
                                        <li className={/(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/.test(newPassword) ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                                            One Number (0-9) & One Special Char
                                        </li>
                                        <li className={!newPassword.toLowerCase().includes('123456') && !newPassword.toLowerCase().includes('abcdef') && newPassword.length > 0 ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                                            No sequences (e.g. 123456, abcdef)
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-sm"
                                    required
                                    minLength={8}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-655 dark:hover:text-gray-300 cursor-pointer"
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

                        <div className="pt-2 flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary-600 hover:bg-primary-750 text-white w-full py-3 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                {loading ? 'Resetting Password...' : 'Reset Password'}
                            </button>

                            <button
                                type="button"
                                onClick={handleGoBack}
                                className="w-full py-3 rounded-xl border border-gray-255 dark:border-gray-700 text-gray-650 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" /> Go Back
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-6 text-center border-t border-gray-150 dark:border-gray-750 pt-5">
                    <Link href="/login" className="text-primary-600 hover:text-primary-750 font-semibold text-sm transition-all">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
