import React from 'react';
import { motion } from 'framer-motion';
import {
    PlusCircle,
    Activity,
    Zap,
    BatteryWarning
} from 'lucide-react';

const Card = ({ children, title, icon: Icon }) => (
    <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
        className="bg-white/90 backdrop-blur-lg border border-slate-200 
        rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all"
    >
        {title && (
            <div className="flex items-center gap-2 mb-6">
                {Icon && <Icon className="w-5 h-5 text-indigo-600" />}
                <h3 className="font-semibold text-slate-800">{title}</h3>
            </div>
        )}
        {children}
    </motion.div>
);

export default function SellResources({
    resources,
    listings,
    handleListResource
}) {
    const myListings = listings;
    const estimatedHourly = myListings.reduce((sum, l) => sum + Number(l.ram || 0), 0);

    /* ============================= */
    /* Battery Logic */
    /* ============================= */
    const batteryLevel = resources?.battery?.percent ?? null;
    const isCharging = resources?.battery?.is_charging ?? false;
    const batteryLow = batteryLevel !== null && batteryLevel < 15;

    const batteryColor =
        batteryLevel >= 50
            ? "bg-emerald-500"
            : batteryLevel >= 15
                ? "bg-amber-500"
                : "bg-rose-500";

    const batteryTextColor =
        batteryLevel >= 50
            ? "text-emerald-600"
            : batteryLevel >= 15
                ? "text-amber-600"
                : "text-rose-600";

    return (
        <motion.div
            key="sell"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
        >

            {/* LEFT SECTION */}
            <div className="lg:col-span-2 space-y-8">

                {/* List New Resource */}
                <Card title="Share Your Resource" icon={PlusCircle}>
                    {batteryLow && (
                        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl flex items-center gap-2 text-sm font-medium">
                            <BatteryWarning className="w-5 h-5" />
                            Battery below 15%. Sharing disabled.
                        </div>
                    )}

                    <form onSubmit={handleListResource} className="space-y-6">

                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    CPU Cores
                                </label>
                                <input
                                    name="cpu"
                                    type="number"
                                    min="1"
                                    placeholder="4"
                                    required
                                    className="mt-2 w-full p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    RAM (GB)
                                </label>
                                <input
                                    name="ram"
                                    type="number"
                                    min="1"
                                    placeholder="8"
                                    required
                                    className="mt-2 w-full p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Battery (%)
                                </label>
                                <input
                                    name="battery"
                                    type="number"
                                    min="15"
                                    max="100"
                                    placeholder="80"
                                    required
                                    className="mt-2 w-full p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={batteryLow}
                            className={`w-full py-3 rounded-2xl font-semibold transition-all
                            ${batteryLow
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                        >
                            List Resource
                        </button>
                    </form>
                </Card>

                {/* Active Listings */}
                <Card title="Your Active Listings" icon={Activity}>
                    {myListings.length === 0 ? (
                        <p className="text-center py-10 text-slate-400 italic">
                            No active listings found.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {myListings.map(listing => (
                                <div
                                    key={listing._id}
                                    className="flex items-center justify-between p-4 rounded-2xl 
                                    border border-slate-100 hover:bg-slate-50 transition-all"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            CPU {listing.cpu} cores | RAM {listing.ram} GB
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Battery {listing.battery}% • {listing.status}
                                        </p>
                                    </div>

                                    <span className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-xl">
                                        Shared
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-8">

                <Card title="System Overview" icon={Activity}>
                    <div className="space-y-6">

                        {/* CPU */}
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-xs text-slate-500 uppercase">CPU Load</p>
                            <p className="text-xl font-bold">
                                {resources?.cpu?.usage || "0.00"}
                            </p>
                        </div>

                        {/* RAM */}
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-xs text-slate-500 uppercase">RAM Usage</p>
                            <p className="text-xl font-bold">
                                {resources?.ram?.usagePercent || "0"}%
                            </p>
                        </div>

                        {/* 🔋 BATTERY STATUS */}
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <div className="flex justify-between mb-2">
                                <p className="text-xs text-slate-500 uppercase">Battery</p>
                                {batteryLevel !== null && (
                                    <span className={`text-xs font-semibold ${batteryTextColor}`}>
                                        {batteryLevel}%
                                    </span>
                                )}
                            </div>

                            {batteryLevel !== null ? (
                                <>
                                    <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${batteryColor}`}
                                            style={{ width: `${batteryLevel}%` }}
                                        />
                                    </div>

                                    <p className="text-xs text-slate-500">
                                        {isCharging ? "Charging 🔌" : "Not Charging"}
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs text-slate-400">
                                    Battery info unavailable
                                </p>
                            )}
                        </div>

                        {/* Estimated Earnings */}
                        <div className="p-4 bg-indigo-50 rounded-2xl">
                            <p className="text-xs text-slate-500 uppercase">
                                Estimated Hourly Income
                            </p>
                            <p className="text-xl font-bold text-indigo-700">
                                {estimatedHourly} GB
                            </p>
                        </div>

                    </div>
                </Card>

            </div>
        </motion.div>
    );
}