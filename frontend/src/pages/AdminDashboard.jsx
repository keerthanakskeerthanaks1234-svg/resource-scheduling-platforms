import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Server, Users, ListTodo, FileText, BarChart2,
  Bell, RefreshCw, CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff,
  Battery, Cpu, Database, Activity, Clock, Trash2, UserX, UserCheck,
  Ban, Play, Square, Shield, Eye
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'nodes', label: 'Nodes', icon: Server },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

const StatusBadge = ({ status }) => {
  const map = {
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    busy: 'bg-amber-50 text-amber-700 border-amber-200',
    offline: 'bg-slate-100 text-slate-500 border-slate-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    running: 'bg-blue-50 text-blue-700 border-blue-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
    pending: 'bg-slate-50 text-slate-600 border-slate-200',
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    seller: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    buyer: 'bg-teal-50 text-teal-700 border-teal-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, color, bg, sub }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start gap-4">
    <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-slate-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const AlertBadge = ({ level }) => {
  if (level === 'error') return <span className="flex items-center gap-1 text-xs font-semibold text-rose-600"><XCircle className="w-3.5 h-3.5" />Error</span>;
  if (level === 'warn') return <span className="flex items-center gap-1 text-xs font-semibold text-amber-600"><AlertTriangle className="w-3.5 h-3.5" />Warning</span>;
  return <span className="flex items-center gap-1 text-xs font-semibold text-blue-600"><Bell className="w-3.5 h-3.5" />Info</span>;
};

const ActionButton = ({ onClick, label, Icon, variant = 'default', disabled = false }) => {
  const v = {
    danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200',
    success: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
    default: 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${v[variant]}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
};

export default function AdminDashboard({ authFetch }) {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [logFilter, setLogFilter] = useState({ level: '', category: '' });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const api = useCallback(async (url, opts = {}) => {
    const res = await authFetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Request failed');
    return data;
  }, [authFetch]);

  const loadDashboard = useCallback(async () => {
    try {
      const d = await api('/api/admin/dashboard');
      setDashboard(d);
      setAlerts(d.alerts || []);
    } catch (e) { showToast(e.message, 'error'); }
  }, [api]);

  const loadNodes = useCallback(async () => {
    try { setNodes(await api('/api/admin/nodes')); }
    catch (e) { showToast(e.message, 'error'); }
  }, [api]);

  const loadUsers = useCallback(async () => {
    try { setUsers(await api('/api/admin/users')); }
    catch (e) { showToast(e.message, 'error'); }
  }, [api]);

  const loadTasks = useCallback(async () => {
    try { setTasks(await api('/api/admin/tasks')); }
    catch (e) { showToast(e.message, 'error'); }
  }, [api]);

  const loadLogs = useCallback(async () => {
    const params = new URLSearchParams();
    if (logFilter.level) params.set('level', logFilter.level);
    if (logFilter.category) params.set('category', logFilter.category);
    params.set('limit', '100');
    try { setLogs(await api(`/api/admin/logs?${params}`)); }
    catch (e) { showToast(e.message, 'error'); }
  }, [api, logFilter]);

  const loadAnalytics = useCallback(async () => {
    try { setAnalytics(await api('/api/admin/analytics')); }
    catch (e) { showToast(e.message, 'error'); }
  }, [api]);

  const loadAlerts = useCallback(async () => {
    try { setAlerts(await api('/api/admin/alerts')); }
    catch (e) { showToast(e.message, 'error'); }
  }, [api]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await loadDashboard();
      if (tab === 'nodes') await loadNodes();
      else if (tab === 'users') await loadUsers();
      else if (tab === 'tasks') await loadTasks();
      else if (tab === 'logs') await loadLogs();
      else if (tab === 'analytics') await loadAnalytics();
    } finally { setLoading(false); }
  }, [tab, loadDashboard, loadNodes, loadUsers, loadTasks, loadLogs, loadAnalytics]);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (tab === 'nodes') loadNodes();
    else if (tab === 'users') loadUsers();
    else if (tab === 'tasks') loadTasks();
    else if (tab === 'logs') loadLogs();
    else if (tab === 'analytics') loadAnalytics();
  }, [tab]);

  useEffect(() => {
    if (tab === 'logs') loadLogs();
  }, [logFilter]);

  const nodeAction = async (url, body, successMsg) => {
    try {
      await api(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      showToast(successMsg);
      await loadNodes();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const userAction = async (url, method, body, successMsg) => {
    try {
      await api(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      showToast(successMsg);
      await loadUsers();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const taskAction = async (url, body, successMsg) => {
    try {
      await api(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      showToast(successMsg);
      await loadTasks();
    } catch (e) { showToast(e.message, 'error'); }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Admin Control Panel</h1>
            <p className="text-xs text-slate-500">Distributed Compute Platform</p>
          </div>
        </div>
        <button
          onClick={refreshAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Alert banner */}
      {alerts.filter(a => a.level === 'error').length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700 font-medium">
            {alerts.filter(a => a.level === 'error').length} critical alert(s) require attention
          </p>
        </div>
      )}

      {/* Tab Nav */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-full overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
              tab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >

          {/* ─── OVERVIEW ─── */}
          {tab === 'overview' && dashboard && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={dashboard.totalUsers} icon={Users} color="text-indigo-600" bg="bg-indigo-50" />
                <StatCard label="Registered Nodes" value={dashboard.totalNodes} icon={Server} color="text-blue-600" bg="bg-blue-50" sub={`${dashboard.availableNodes} available · ${dashboard.busyNodes} busy`} />
                <StatCard label="Total Tasks" value={dashboard.totalTasks} icon={ListTodo} color="text-emerald-600" bg="bg-emerald-50" sub={`${dashboard.runningTasks} running`} />
                <StatCard label="Offline Nodes" value={dashboard.offlineNodes} icon={WifiOff} color="text-rose-600" bg="bg-rose-50" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Completed Tasks" value={dashboard.completedTasks} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
                <StatCard label="Failed Tasks" value={dashboard.failedTasks} icon={XCircle} color="text-rose-600" bg="bg-rose-50" />
                <StatCard label="Running Tasks" value={dashboard.runningTasks} icon={Activity} color="text-blue-600" bg="bg-blue-50" />
                <StatCard label="Pending Tasks" value={dashboard.pendingTasks} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
              </div>

              {/* Alerts */}
              {alerts.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-slate-800">Active Alerts</h3>
                    <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{alerts.length}</span>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
                    {alerts.map((a, i) => (
                      <div key={i} className="px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {a.level === 'error' ? <XCircle className="w-4 h-4 text-rose-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                          <span className="text-sm text-slate-700">{a.message}</span>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0 ml-4">{new Date(a.ts).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Tasks */}
              {dashboard.recentTasks?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">Recent Task Activity</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          {['Task ID', 'Buyer', 'Language', 'RAM', 'Node', 'Status', 'Time'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {dashboard.recentTasks.map(t => (
                          <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{String(t._id).slice(-8)}</td>
                            <td className="px-4 py-3 text-slate-700">{t.buyer?.name || '—'}</td>
                            <td className="px-4 py-3"><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{t.language || 'python'}</span></td>
                            <td className="px-4 py-3 text-slate-600">{t.requiredRam} GB</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{t.assignedNode?.hostname || 'local'}</td>
                            <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{new Date(t.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── NODES ─── */}
          {tab === 'nodes' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Server className="w-4 h-4 text-indigo-500" /> Node Management</h3>
                <span className="text-xs text-slate-500">{nodes.length} total nodes</span>
              </div>
              {nodes.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-sm">No nodes registered yet. Start agent.py on a node to register it.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Hostname', 'IP', 'CPU Cores', 'RAM Avail', 'Battery', 'Status', 'Last Seen', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {nodes.map(n => (
                        <tr key={n._id} className={`hover:bg-slate-50 transition-colors ${n.isDisabled ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3 font-medium text-slate-800">{n.hostname}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{n.ipAddress || '—'}</td>
                          <td className="px-4 py-3 text-slate-600">
                            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{n.cpu?.cores || 0}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <span className="flex items-center gap-1"><Database className="w-3 h-3" />{(n.ram?.available || 0).toFixed(1)} GB</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Battery className={`w-4 h-4 ${n.battery?.percent < 15 ? 'text-rose-500' : n.battery?.percent < 50 ? 'text-amber-500' : 'text-emerald-500'}`} />
                              <span className={`text-xs font-semibold ${n.battery?.percent < 15 ? 'text-rose-600' : 'text-slate-700'}`}>{n.battery?.percent}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <StatusBadge status={n.status} />
                              {n.isDisabled && <span className="text-xs text-rose-500 font-medium">Disabled</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{new Date(n.lastSeen).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {!n.isDisabled ? (
                                <ActionButton label="Disable" Icon={Ban} variant="danger"
                                  onClick={() => nodeAction('/api/admin/node/disable', { nodeId: n._id }, `Node ${n.hostname} disabled`)} />
                              ) : (
                                <ActionButton label="Enable" Icon={CheckCircle} variant="success"
                                  onClick={() => nodeAction('/api/admin/node/enable', { nodeId: n._id }, `Node ${n.hostname} enabled`)} />
                              )}
                              <ActionButton label="Offline" Icon={WifiOff} variant="warn"
                                disabled={n.status === 'offline'}
                                onClick={() => nodeAction('/api/admin/node/offline', { nodeId: n._id }, `Node ${n.hostname} marked offline`)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── USERS ─── */}
          {tab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" /> User Management</h3>
                <span className="text-xs text-slate-500">{users.length} total users</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u._id} className={`hover:bg-slate-50 transition-colors ${u.isBlocked ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                        <td className="px-4 py-3 text-slate-500">{u.email}</td>
                        <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
                        <td className="px-4 py-3">
                          {u.isBlocked
                            ? <span className="text-xs font-semibold text-rose-600 flex items-center gap-1"><UserX className="w-3 h-3" />Blocked</span>
                            : <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><UserCheck className="w-3 h-3" />Active</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {u.isBlocked ? (
                              <ActionButton label="Unblock" Icon={UserCheck} variant="success"
                                onClick={() => userAction('/api/admin/user/block', 'POST', { userId: u._id, block: false }, `${u.name} unblocked`)} />
                            ) : (
                              <ActionButton label="Block" Icon={UserX} variant="danger"
                                onClick={() => userAction('/api/admin/user/block', 'POST', { userId: u._id, block: true }, `${u.name} blocked`)} />
                            )}
                            {['buyer', 'seller', 'admin'].filter(r => r !== u.role).map(r => (
                              <ActionButton key={r} label={`→ ${r}`} Icon={Shield} variant="blue"
                                onClick={() => userAction('/api/admin/user/role', 'PUT', { userId: u._id, role: r }, `${u.name} is now ${r}`)} />
                            ))}
                            <ActionButton label="Delete" Icon={Trash2} variant="danger"
                              onClick={() => {
                                if (confirm(`Delete ${u.name}? This cannot be undone.`))
                                  userAction(`/api/admin/user/${u._id}`, 'DELETE', null, `${u.name} deleted`);
                              }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TASKS ─── */}
          {tab === 'tasks' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2"><ListTodo className="w-4 h-4 text-indigo-500" /> Task Monitor</h3>
                <span className="text-xs text-slate-500">{tasks.length} total tasks</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Task ID', 'Buyer', 'Lang', 'RAM', 'Assigned Node', 'Status', 'Started', 'Duration', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tasks.length === 0 ? (
                      <tr><td colSpan={9} className="py-12 text-center text-slate-400 text-sm">No tasks found</td></tr>
                    ) : tasks.map(t => {
                      const duration = t.startedAt && t.completedAt
                        ? `${((new Date(t.completedAt) - new Date(t.startedAt)) / 1000).toFixed(1)}s`
                        : t.startedAt ? 'Running...' : '—';
                      return (
                        <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-400">{String(t._id).slice(-8)}</td>
                          <td className="px-4 py-3 text-slate-700">{t.buyer?.name || '—'}<br /><span className="text-xs text-slate-400">{t.buyer?.email}</span></td>
                          <td className="px-4 py-3"><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{t.language || 'python'}</span></td>
                          <td className="px-4 py-3 text-slate-600">{t.requiredRam} GB</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{t.assignedNode?.hostname || '—'}</td>
                          <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{t.startedAt ? new Date(t.startedAt).toLocaleString() : '—'}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs font-mono">{duration}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {['running', 'pending'].includes(t.status) && (
                                <ActionButton label="Cancel" Icon={Square} variant="danger"
                                  onClick={() => taskAction('/api/admin/task/cancel', { taskId: t._id }, 'Task cancelled')} />
                              )}
                              {t.status === 'failed' && t.code && (
                                <ActionButton label="Retry" Icon={Play} variant="success"
                                  onClick={() => taskAction('/api/admin/task/retry', { taskId: t._id }, 'Task queued for retry')} />
                              )}
                              {t.output && (
                                <ActionButton label="Output" Icon={Eye} variant="default"
                                  onClick={() => alert(t.output?.slice(0, 1000) || 'No output')} />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── LOGS ─── */}
          {tab === 'logs' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
                <span className="text-sm font-medium text-slate-600">Filter:</span>
                <select value={logFilter.level} onChange={e => setLogFilter(p => ({ ...p, level: e.target.value }))}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
                <select value={logFilter.category} onChange={e => setLogFilter(p => ({ ...p, category: e.target.value }))}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All Categories</option>
                  <option value="task">Task</option>
                  <option value="node">Node</option>
                  <option value="auth">Auth</option>
                  <option value="system">System</option>
                  <option value="error">Error</option>
                </select>
                <span className="ml-auto text-xs text-slate-500">{logs.length} entries</span>
              </div>
              <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs space-y-1 max-h-[600px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No logs yet. Logs appear when tasks run or nodes register.</p>
                ) : logs.map((l, i) => (
                  <div key={i} className={`flex gap-3 py-1 border-b border-slate-800 ${
                    l.level === 'error' ? 'text-rose-400' : l.level === 'warn' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    <span className="text-slate-600 shrink-0">{new Date(l.createdAt).toLocaleTimeString()}</span>
                    <span className={`shrink-0 uppercase font-bold text-[10px] px-1.5 py-0.5 rounded ${
                      l.level === 'error' ? 'bg-rose-950 text-rose-400' : l.level === 'warn' ? 'bg-amber-950 text-amber-400' : 'bg-emerald-950 text-emerald-400'
                    }`}>{l.level}</span>
                    <span className="text-slate-500 shrink-0">[{l.category}]</span>
                    <span className="break-all">{l.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── ANALYTICS ─── */}
          {tab === 'analytics' && analytics && (
            <div className="space-y-6">
              {/* Node CPU/RAM chart */}
              {analytics.nodeChartData?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2"><Cpu className="w-4 h-4 text-indigo-500" /> Node CPU & RAM Usage</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={analytics.nodeChartData} margin={{ left: 0, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit="%" />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Legend />
                        <Bar dataKey="cpu" fill="#6366f1" name="CPU %" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="ram" fill="#10b981" name="RAM %" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="battery" fill="#f59e0b" name="Battery %" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tasks per hour */}
              {analytics.tasksPerHour?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Tasks Per Hour (Last 12h)</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <LineChart data={analytics.tasksPerHour} margin={{ left: 0, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="tasks" stroke="#6366f1" strokeWidth={2} name="Total" dot={false} />
                        <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" dot={false} />
                        <Line type="monotone" dataKey="failed" stroke="#f43f5e" strokeWidth={2} name="Failed" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {analytics.nodeChartData?.length === 0 && analytics.tasksPerHour?.every(t => t.tasks === 0) && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center text-slate-400">
                  <BarChart2 className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                  <p className="font-medium">No data yet</p>
                  <p className="text-sm mt-1">Analytics populate as nodes register and tasks are executed.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'analytics' && !analytics && (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-slate-300" />
              <p>Loading analytics...</p>
            </div>
          )}

          {tab === 'overview' && !dashboard && (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-slate-300" />
              <p>Loading dashboard...</p>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
