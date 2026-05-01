import React from 'react';
import { motion } from 'motion/react';
import { History, Cpu, Database } from 'lucide-react';

const Card = ({ children, className = '', title, icon: Icon }) => (
    <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm ${className}`}>
        {title && (
            <div className="flex items-center gap-2 mb-4">
                {Icon && <Icon className="w-5 h-5 text-indigo-600" />}
                <h3 className="font-semibold text-slate-800">{title}</h3>
            </div>
        )}
        {children}
    </div>
);

export default function MyBookings({ myBookings }) {
    return (
        <motion.div
            key="bookings"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
        >
            <Card title="Active Bookings" icon={History}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-slate-100">
                                <th className="pb-4 font-semibold text-slate-500 text-sm">Resource</th>
                                <th className="pb-4 font-semibold text-slate-500 text-sm">Amount</th>
                                <th className="pb-4 font-semibold text-slate-500 text-sm">Price</th>
                                <th className="pb-4 font-semibold text-slate-500 text-sm">Start Time</th>
                                <th className="pb-4 font-semibold text-slate-500 text-sm">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {myBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                                        No bookings found.
                                    </td>
                                </tr>
                            ) : (
                                myBookings.map(booking => (
                                    <tr key={booking._id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                                                    {(booking.assignedResource?.cpu || 0) > 0
                                                        ? <Cpu className="w-4 h-4" />
                                                        : <Database className="w-4 h-4" />
                                                    }
                                                </div>
                                                <span className="font-medium text-slate-900">RAM Task</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-slate-600">{booking.requiredRam} GB</td>
                                        <td className="py-4 text-slate-900 font-medium">Resource #{String(booking.assignedResource?._id || '').slice(-6)}</td>
                                        <td className="py-4 text-slate-500 text-sm">
                                            {new Date(booking.createdAt).toLocaleString()}
                                        </td>
                                        <td className="py-4">
                                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-wider">
                                                {booking.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </motion.div>
    );
}