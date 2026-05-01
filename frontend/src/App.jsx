import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Users, Server, CheckCircle, XCircle, Cpu, Database, Activity } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Navbar from './pages/Navbar';
import Dashboard from './pages/Dashboard';
import SellResources from './pages/SellResources';
import RentResources from './pages/RentResources';
import MyBookings from './pages/MyBookings';
import LoginPage from './pages/Login';
import ZeppelinNotebook from './pages/ZeppelinNotebook';

function AdminDashboard({ stats, onRefresh }) {
  if (!stats) return <div className="text-slate-400 text-center py-20">Loading admin data...</div>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers ?? 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Shared Resources', value: stats.totalResources ?? 0, icon: Server, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Registered Nodes', value: stats.totalNodes ?? 0, icon: Cpu, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Available Nodes', value: stats.availableNodes ?? 0, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Busy Nodes', value: stats.busyNodes ?? 0, icon: Database, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Running Tasks', value: stats.runningTasks ?? 0, icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed Tasks', value: stats.completedTasks ?? 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Failed Tasks', value: stats.failedTasks ?? 0, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="text-3xl font-bold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      {Array.isArray(stats.recentTasks) && stats.recentTasks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Recent Task Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Buyer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Language</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">RAM</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Node</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.recentTasks.map(t => (
                  <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-slate-700">{t.buyer?.name || t.buyer?.email || '—'}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">{t.language || 'python'}</span>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{t.requiredRam} GB</td>
                    <td className="px-6 py-3 text-slate-500 text-xs">{t.assignedNode?.hostname || 'local-executor'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        t.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        t.status === 'failed' ? 'bg-rose-50 text-rose-700' :
                        t.status === 'running' ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{t.status}</span>
                    </td>
                    <td className="px-6 py-3 text-slate-400 text-xs">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rg_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authError, setAuthError] = useState('');

  const handleLogin = (userData) => {
    localStorage.setItem('rg_current_user', JSON.stringify(userData));
    setUser(userData);
    setAuthError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('rg_current_user');
    setUser(null);
    setAuthError('');
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [resources, setResources] = useState({ cpu: { cores: 0 }, ram: { total: '0 GB' } });
  const [listings, setListings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [monitorData, setMonitorData] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const pollRef = useRef(null);

  const authFetch = async (url, options = {}) => {
    const token = user?.token;
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      setAuthError('Session expired. Please log in again.');
      handleLogout();
      throw new Error('Unauthorized');
    }
    return response;
  };

  const fetchSystemResources = async () => {
    try {
      const res = await fetch('/api/system-resources');
      if (!res.ok) return;
      const raw = await res.json();

      const ramTotal = typeof raw.ram?.total === 'number' ? `${raw.ram.total} GB` : (raw.ram?.total || '0 GB');
      const ramAvail = typeof raw.ram?.available === 'number' ? `${raw.ram.available} GB` : (raw.ram?.available || '0 GB');
      const storTotal = typeof raw.storage?.total === 'number' ? `${raw.storage.total} GB` : (raw.storage?.total || 'N/A');
      const storAvail = typeof raw.storage?.available === 'number' ? `${raw.storage.available} GB` : (raw.storage?.available || 'N/A');

      const formatted = {
        ...raw,
        ram: { ...raw.ram, total: ramTotal, available: ramAvail },
        storage: { ...raw.storage, total: storTotal, available: storAvail },
      };

      setResources(formatted);

      const now = new Date();
      const timeLabel = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const cpuPct = Math.round(parseFloat(raw.cpu?.usage || 0) * 100);
      const ramPct = Math.round(raw.ram?.usagePercent || 0);
      setMonitorData(prev => [...prev, { time: timeLabel, cpu: cpuPct, ram: ramPct }].slice(-20));
    } catch (err) {
      console.error('System resources fetch failed:', err);
    }
  };

  const navByRole = {
    admin: [
      { id: 'dashboard', label: 'Admin Dashboard' },
    ],
    seller: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'sell', label: 'Share Resources' },
    ],
    buyer: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'notebook', label: 'Notebook' },
      { id: 'rent', label: 'Request Resources' },
      { id: 'bookings', label: 'My Tasks' },
    ],
  };

  const fetchResources = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === 'seller') {
        const res = await authFetch('/api/resource/mine');
        if (!res.ok) { setListings([]); return; }
        const data = await res.json();
        setListings(Array.isArray(data) ? data : []);
        const totalRam = (Array.isArray(data) ? data : []).reduce((s, i) => s + (i.ram || 0), 0);
        setResources({
          cpu: { cores: Array.isArray(data) ? data.length : 0, usage: 'N/A' },
          ram: { total: `${totalRam} GB`, usagePercent: 'N/A', available: `${totalRam} GB` },
          battery: { percent: null, is_charging: false },
        });
      } else if (user.role === 'buyer') {
        const res = await authFetch('/api/resource/available');
        if (!res.ok) { setListings([]); return; }
        const data = await res.json();
        setListings(Array.isArray(data) ? data : []);
      } else if (user.role === 'admin') {
        const res = await authFetch('/api/admin/dashboard');
        if (res.ok) setAdminStats(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    if (!user) return;
    try {
      const url = user.role === 'seller' ? '/api/resource/mine' : '/api/resource/available';
      const res = await authFetch(url);
      if (!res.ok) { setListings([]); return; }
      setListings(await res.json().then(d => Array.isArray(d) ? d : []));
    } catch { setListings([]); }
  };

  const fetchBookings = async () => {
    if (!user || user.role !== 'buyer') return;
    try {
      const res = await authFetch('/api/task/mine');
      if (!res.ok) { setMyBookings([]); return; }
      setMyBookings(await res.json().then(d => Array.isArray(d) ? d : []));
    } catch { setMyBookings([]); }
  };

  useEffect(() => {
    if (!user) {
      clearInterval(pollRef.current);
      return;
    }
    setActiveTab('dashboard');
    fetchResources();
    fetchListings();
    fetchBookings();
    fetchSystemResources();
    clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchSystemResources, 10000);
    return () => clearInterval(pollRef.current);
  }, [user]);

  const handleBook = async (listingId, hours) => {
    try {
      const selected = listings.find(i => i._id === listingId);
      const requiredRam = selected?.ram || Math.max(1, Number(hours) || 1);
      const res = await authFetch('/api/task/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requiredRam }),
      });
      if (res.ok) {
        alert('Resource assigned successfully!');
        fetchListings();
        fetchBookings();
        setActiveTab('bookings');
      }
    } catch (err) { console.error(err); }
  };

  const handleListResource = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const res = await authFetch('/api/resource/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpu: Number(fd.get('cpu') || 1),
          ram: Number(fd.get('ram') || 1),
          battery: Number(fd.get('battery') || 100),
        }),
      });
      if (res.ok) {
        alert('Resource listed successfully!');
        fetchListings();
        e.currentTarget.reset();
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to list resource.');
      }
    } catch (err) { console.error(err); }
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const roleTabs = navByRole[user.role] || navByRole.buyer;
  const tabLabel = roleTabs.find(t => t.id === activeTab)?.label || activeTab;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        navItems={roleTabs}
      />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-slate-800 capitalize">{tabLabel}</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Role: <b className="text-indigo-600">{user.role}</b></span>
            <button
              onClick={() => { fetchResources(); fetchListings(); fetchBookings(); fetchSystemResources(); }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {authError && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-rose-50 text-rose-600 text-sm">{authError}</div>
          )}
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && user.role === 'admin' && (
              <AdminDashboard stats={adminStats} onRefresh={fetchResources} />
            )}
            {activeTab === 'dashboard' && user.role !== 'admin' && (
              <Dashboard key="dashboard" resources={resources} setActiveTab={setActiveTab} monitorData={monitorData} />
            )}
            {activeTab === 'sell' && user.role === 'seller' && (
              <SellResources key="sell" resources={resources} listings={listings} handleListResource={handleListResource} />
            )}
            {activeTab === 'rent' && user.role === 'buyer' && (
              <RentResources key="rent" listings={listings} handleBook={handleBook} />
            )}
            {activeTab === 'bookings' && user.role === 'buyer' && (
              <MyBookings key="bookings" myBookings={myBookings} />
            )}
            {activeTab === 'notebook' && user.role === 'buyer' && (
              <ZeppelinNotebook key="notebook" user={user} authFetch={authFetch} />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
