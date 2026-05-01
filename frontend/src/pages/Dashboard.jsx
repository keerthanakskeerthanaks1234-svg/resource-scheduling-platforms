import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Cpu,
    Database,
    Zap,
    HardDrive,
    PlusCircle,
    ShoppingBag,
    History,
    ChevronRight
} from 'lucide-react';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';

/* ============================= */
/* Premium Card Component */
/* ============================= */
const Card = ({ children, className = '', title, icon: Icon }) => (
    <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={`bg-white/80 backdrop-blur-lg border border-slate-200 
        rounded-3xl p-6 shadow-sm hover:shadow-xl 
        transition-all duration-300 ${className}`}
    >
        {title && (
            <div className="flex items-center gap-2 mb-4">
                {Icon && <Icon className="w-5 h-5 text-indigo-600" />}
                <h3 className="font-semibold text-slate-800">{title}</h3>
            </div>
        )}
        {children}
    </motion.div>
);

/* ============================= */
/* Stat Component */
/* ============================= */
const Stat = ({
    label,
    value,
    subValue,
    icon: Icon,
    colorClass = 'text-indigo-600'
}) => (
    <div className="flex items-start gap-4">
        <div className={`p-3 rounded-2xl bg-slate-100 ${colorClass}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
                {value}
            </p>
            {subValue && (
                <p className="text-xs text-slate-400 mt-1">{subValue}</p>
            )}
        </div>
    </div>
);

export default function Dashboard({
    resources,
    setActiveTab,
    monitorData = []
}) {

    /* ============================= */
    /* Filter Last 30 Minutes */
    /* ============================= */
    const last30MinutesData = useMemo(() => {
        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000);

        return monitorData.filter(item => {
            const itemTime = new Date();
            const [h, m, s] = item.time.split(':');
            itemTime.setHours(h);
            itemTime.setMinutes(m);
            itemTime.setSeconds(s);
            return itemTime >= thirtyMinutesAgo;
        });
    }, [monitorData]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
        >

            {/* ============================= */}
            {/* Resource Stats */}
            {/* ============================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <Card>
                    <Stat
                        label="CPU Cores"
                        value={resources?.cpu?.cores || "0"}
                        subValue={resources?.cpu?.model}
                        icon={Cpu}
                    />
                </Card>

                <Card>
                    <Stat
                        label="Total RAM"
                        value={resources?.ram?.total || "0 GB"}
                        subValue={`${resources?.ram?.available || "0 GB"} available`}
                        icon={Database}
                        colorClass="text-emerald-600"
                    />
                </Card>

                <Card>
                    <Stat
                        label="GPU Status"
                        value={resources?.gpu?.status || "Offline"}
                        subValue={resources?.gpu?.available}
                        icon={Zap}
                        colorClass="text-amber-600"
                    />
                </Card>

                <Card>
                    <Stat
                        label="Storage"
                        value={resources?.storage?.total || "N/A"}
                        subValue={`${resources?.storage?.available || "N/A"} free`}
                        icon={HardDrive}
                        colorClass="text-rose-600"
                    />
                </Card>

            </div>

            {/* ============================= */}
            {/* Earnings Preview */}
            {/* ============================= */}
            <Card title="Earnings Overview">
                <Stat
                    label="Current Rate"
                    value="₹200 / hr"
                    subValue="Active sharing session"
                    icon={Zap}
                    colorClass="text-green-600"
                />
            </Card>


            {/* ============================= */}
            {/* System Usage Graph */}
            {/* ============================= */}
            <Card title="System Usage Analytics">

                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <LineChart data={monitorData}>

                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="time" />

                            <YAxis />

                            <Tooltip />

                            <Line
                                type="monotone"
                                dataKey="cpu"
                                stroke="#6366f1"
                                strokeWidth={2}
                                name="CPU Usage"
                            />

                            <Line
                                type="monotone"
                                dataKey="ram"
                                stroke="#10b981"
                                strokeWidth={2}
                                name="RAM Usage"
                            />

                        </LineChart>
                    </ResponsiveContainer>
                </div>

            </Card>


            {/* ============================= */}
            {/* Quick Actions */}
            {/* ============================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {[
                    {
                        title: "Share Resources",
                        desc: "Earn money by renting idle hardware",
                        icon: PlusCircle,
                        tab: 'sell',
                        color: "bg-indigo-600"
                    },
                    {
                        title: "Request Resources",
                        desc: "Run ML & data tasks on rented systems",
                        icon: ShoppingBag,
                        tab: 'rent',
                        color: "bg-emerald-600"
                    },
                    {
                        title: "Run Task",
                        desc: "Execute distributed jobs with Zeppelin",
                        icon: Cpu,
                        tab: 'notebook',
                        color: "bg-blue-600"
                    },
                    {
                        title: "My Rentals",
                        desc: "Track usage, cost, and earnings",
                        icon: History,
                        tab: 'bookings',
                        color: "bg-amber-600"
                    }

                ].map((action) => (

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        key={action.title}
                        onClick={() => setActiveTab(action.tab)}
                        className="group p-6 bg-white/90 backdrop-blur-md 
                        border border-slate-200 rounded-3xl 
                        text-left hover:shadow-xl transition-all duration-300"
                    >

                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center 
                            justify-center text-white mb-4 ${action.color}`}
                        >
                            <action.icon className="w-6 h-6" />
                        </div>

                        <h3 className="font-bold text-slate-900 mb-1">
                            {action.title}
                        </h3>

                        <p className="text-sm text-slate-500 mb-4">
                            {action.desc}
                        </p>

                        <div className="flex items-center text-sm font-semibold text-indigo-600">
                            Get Started <ChevronRight className="w-4 h-4 ml-1" />
                        </div>

                    </motion.button>

                ))}

            </div>

        </motion.div>
    );
}