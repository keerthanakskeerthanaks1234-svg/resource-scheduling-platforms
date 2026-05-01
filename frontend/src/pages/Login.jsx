import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Mail, Lock, Eye, EyeOff, Wallet } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
    const [mode, setMode] = useState('login');
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'buyer' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (mode === 'register') {
            if (!form.name.trim()) return setError('Please enter your full name.');
            if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
            if (form.password.length < 8) return setError('Password must be at least 8 characters.');

            setLoading(true);
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: form.name.trim(),
                        email: form.email.trim(),
                        password: form.password,
                        role: form.role,
                    }),
                });
                const data = await res.json();
                if (!res.ok) {
                    setError(data.msg || 'Registration failed.');
                    return;
                }
                onLogin({
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role,
                    token: data.token,
                });
            } catch {
                setError('Unable to connect to server.');
            } finally {
                setLoading(false);
            }
            return;
        }

        // Login mode
        if (!form.email || !form.password) return setError('Please fill in all fields.');

        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email.trim(),
                    password: form.password,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.msg || 'Incorrect email or password. Please try again.');
            } else {
                onLogin({
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    token: data.token,
                });
            }
        } catch {
            setError('Unable to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    const handleWalletConnect = () => {
        setError('Wallet login is disabled for backend auth flow.');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full opacity-50 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100 rounded-full opacity-50 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-md"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-slate-800">ResourceNode</span>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    {/* Tab switcher */}
                    <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                        {['login', 'register'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setMode(tab); setError(''); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${mode === tab
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab === 'login' ? 'Log In' : 'Register'}
                            </button>
                        ))}
                    </div>

                    <h2 className="text-xl font-semibold text-slate-800 mb-1">
                        {mode === 'login' ? 'Welcome back' : 'Create your account'}
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">
                        {mode === 'login'
                            ? 'Sign in to manage your resources'
                            : 'Join the decentralized compute marketplace'}
                    </p>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Name (register only) */}
                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Preethi Lokesh"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                />
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password (register only) */}
                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={form.confirmPassword}
                                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    />
                                </div>
                            </div>
                        )}

                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                >
                                    <option value="buyer">Buyer (Request Resources)</option>
                                    <option value="seller">Seller (Share Resources)</option>
                                    <option value="admin">Admin (Monitor System)</option>
                                </select>
                            </div>
                        )}

                        {mode === 'login' && (
                            <div className="text-right">
                                <button type="button" className="text-xs text-indigo-600 hover:underline">
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition text-sm"
                        >
                            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-xs text-slate-400">or</span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    {/* Wallet connect */}
                    <button
                        onClick={handleWalletConnect}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-60 text-slate-700 font-medium py-2.5 rounded-lg transition text-sm"
                    >
                        <Wallet className="w-4 h-4 text-indigo-500" />
                        Connect with Wallet
                    </button>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    By continuing, you agree to ResourceNode's Terms of Service
                </p>
            </motion.div>
        </div>
    );
};

export default LoginPage;