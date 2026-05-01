import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Navbar from './pages/Navbar';
import Dashboard from './pages/Dashboard';
import SellResources from './pages/SellResources';
import RentResources from './pages/RentResources';
import MyBookings from './pages/MyBookings';
import LoginPage from './pages/Login';
import ZeppelinNotebook from './pages/ZeppelinNotebook';
import AdminDashboard from './pages/AdminDashboard';

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

      setResources({
        ...raw,
        ram: { ...raw.ram, total: ramTotal, available: ramAvail },
        storage: { ...raw.storage, total: storTotal, available: storAvail },
      });

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
    admin: [{ id: 'dashboard', label: 'Admin Dashboard' }],
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
      } else if (user.role === 'buyer') {
        const res = await authFetch('/api/resource/available');
        if (!res.ok) { setListings([]); return; }
        setListings(await res.json().then(d => Array.isArray(d) ? d : []));
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
    if (user.role !== 'admin') {
      fetchResources();
      fetchListings();
      fetchBookings();
      fetchSystemResources();
      clearInterval(pollRef.current);
      pollRef.current = setInterval(fetchSystemResources, 10000);
    }
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
        {user.role !== 'admin' && (
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
        )}

        <div className={user.role === 'admin' ? 'p-6 max-w-full' : 'p-8 max-w-7xl mx-auto'}>
          {authError && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-rose-50 text-rose-600 text-sm">{authError}</div>
          )}
          <AnimatePresence mode="wait">
            {user.role === 'admin' && (
              <AdminDashboard key="admin" authFetch={authFetch} />
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
