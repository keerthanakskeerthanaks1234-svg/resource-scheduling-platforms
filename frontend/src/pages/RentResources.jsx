import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ShoppingBag,
    Cpu,
    Database,
    Zap,
    HardDrive,
    Clock
} from 'lucide-react';

const Card = ({ children }) => (
    <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="bg-white/90 backdrop-blur-lg border border-slate-200 
    rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all"
    >
        {children}
    </motion.div>
);

const ResourceIcon = ({ type }) => {
    if (type === 'CPU') return <Cpu className="w-6 h-6" />;
    if (type === 'RAM') return <Database className="w-6 h-6" />;
    if (type === 'GPU') return <Zap className="w-6 h-6" />;
    return <HardDrive className="w-6 h-6" />;
};

export default function RentResources({ listings, handleBook }) {
    const [hours, setHours] = useState(1);

    return (
        <motion.div
            key="rent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
        >
            {listings.length === 0 ? (
                <div className="py-20 text-center">
                    <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">
                        Marketplace is Empty
                    </h3>
                    <p className="text-slate-500">
                        Check back later or share your own resources!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {listings.map(listing => {
                        const totalCost = (listing.ram || 0) * hours;

                        return (
                            <Card key={listing._id}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                        <ResourceIcon type="RAM" />
                                    </div>

                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-slate-900">
                                            {listing.ram} GB
                                        </p>
                                        <p className="text-xs text-slate-500">RAM available</p>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                    CPU {listing.cpu} cores • RAM {listing.ram} GB
                                </h3>

                                <p className="text-sm text-slate-500 mb-4 truncate">
                                    Provider: {listing.user?.email || 'unknown'}
                                </p>

                                <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                                    <Clock className="w-4 h-4" />
                                    Battery: {listing.battery}%
                                </div>

                                {/* Duration Selector */}
                                <div className="mb-4">
                                    <label className="text-sm font-medium text-slate-600">
                                        Duration (hours)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={hours}
                                        onChange={(e) => setHours(Number(e.target.value))}
                                        className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                {/* Cost Preview */}
                                <div className="mb-6 p-3 bg-slate-50 rounded-xl text-sm">
                                    Estimated RAM Need:{" "}
                                    <span className="font-semibold text-slate-900">
                                        {totalCost} GB
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleBook(listing._id, hours)}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl 
                  font-semibold hover:bg-indigo-700 transition-all"
                                >
                                    Rent Resource
                                </button>
                            </Card>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}