import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    ShoppingBag,
    PlusCircle,
    History,
    Activity,
    Zap,
    LogOut,
    Notebook
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout, navItems = [] }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const fallbackItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'sell', label: 'Share Resources', icon: PlusCircle },
        { id: 'rent', label: 'Request Resources', icon: ShoppingBag },
        { id: 'bookings', label: 'My Rentals', icon: History },
        { id: 'monitor', label: 'System Monitor', icon: Activity },
        { id: 'zeppelin', label: 'Zeppelin Notebook', icon: Notebook },
    ];
    const items = navItems.length ? navItems : fallbackItems;

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const avatarColors = [
        'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
        'bg-rose-500', 'bg-cyan-500', 'bg-violet-500',
    ];

    const colorIndex = (user?.name?.charCodeAt(0) || 0) % avatarColors.length;
    const avatarColor = avatarColors[colorIndex];

    return (
        <>
            <aside className="w-72 bg-gradient-to-b from-white to-slate-50 border-r border-slate-200 flex flex-col shadow-sm">

                {/* Logo Section */}
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-md">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">
                            ResourceNode
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-5 space-y-2">
                    {items.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <motion.button
                                key={item.id}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setActiveTab(item.id)}
                                className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${isActive
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                        : 'text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900'
                                    }`}
                            >
                                {/* Active Glow Bar */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-full"
                                    />
                                )}

                                {item.icon ? <item.icon className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
                                {item.label}
                            </motion.button>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-5 border-t border-slate-100 space-y-4">
                    {user && (
                        <div className="flex items-center gap-3 px-2">
                            <div
                                className={`w-10 h-10 rounded-full ${avatarColor}
                flex items-center justify-center text-white
                shadow-md ring-2 ring-white`}
                            >
                                <span className="text-sm font-bold">
                                    {getInitials(user.name)}
                                </span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                    {user.name || 'User'}
                                </p>
                                <p className="text-xs text-slate-400 truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setShowConfirm(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </motion.button>
                </div>
            </aside>

            {/* Logout Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 w-full max-w-sm text-center"
                        >
                            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LogOut className="w-7 h-7 text-red-500" />
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                Logout?
                            </h3>

                            <p className="text-sm text-slate-500 mb-6">
                                Are you sure you want to log out?
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={() => { setShowConfirm(false); onLogout(); }}
                                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all"
                                >
                                    Yes, Logout
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}