import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Database } from 'lucide-react';
import {
    AreaChart, Area, CartesianGrid, XAxis, YAxis,
    Tooltip, ResponsiveContainer
} from 'recharts';

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

export default function SystemMonitor({ resources, monitorData }) {
    return (
        <motion.div
            key="monitor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
        >
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="CPU Usage History" icon={Cpu}>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monitorData}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" hide />
                                <YAxis domain={[0, 100]} hide />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="RAM Usage History" icon={Database}>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monitorData}>
                                <defs>
                                    <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" hide />
                                <YAxis domain={[0, 100]} hide />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="ram" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="flex flex-col items-center justify-center py-10">
                    <p className="text-sm font-medium text-slate-500 mb-2">Current Load</p>
                    <p className="text-4xl font-bold text-slate-900">{resources?.cpu.usage || "0.00"}</p>
                    <p className="text-xs text-slate-400 mt-2">1 min average</p>
                </Card>
                <Card className="flex flex-col items-center justify-center py-10">
                    <p className="text-sm font-medium text-slate-500 mb-2">Memory Pressure</p>
                    <p className="text-4xl font-bold text-slate-900">{resources?.ram.usagePercent || "0"}%</p>
                    <p className="text-xs text-slate-400 mt-2">{resources?.ram.available} available</p>
                </Card>
                <Card className="flex flex-col items-center justify-center py-10">
                    <p className="text-sm font-medium text-slate-500 mb-2">System Health</p>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-2xl font-bold text-slate-900">Optimal</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">All systems operational</p>
                </Card>
            </div>
        </motion.div>
    );
}