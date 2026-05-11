import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsApi } from '../services/api';

const pageTitles = {
  '/dashboard':     'Dashboard',
  '/crops':         'Crop Management',
  '/livestock':     'Livestock Management',
  '/inventory':     'Inventory & Warehouse',
  '/finance':       'Finance & Expenses',
  '/workers':       'Workers Management',
  '/equipment':     'Equipment',
  '/sales':         'Sales & Supply Chain',
  '/weather':       'Weather Monitoring',
  '/predictions':   'AI Predictions',
  '/monitoring':    'Satellite & Drone Monitoring',
  '/users':         'User Management',
  '/farms':         'Farm Management',
  '/marketplace':   'Marketplace',
  '/notifications': 'Notifications',
};

const ROLE_LABELS = {
  super_admin:  'Admin',
  farmer:       'Farmer',
  farm_manager: 'Super Manager',
  agronomist:   'Agronomist',
  accountant:   'Accountant',
  worker:       'Employee',
};

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await notificationsApi.getUnreadCount();
        setUnreadCount(data?.count ?? 0);
      } catch { /* silent */ }
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/landing');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{pageTitles[pathname] || 'CropMind'}</h1>
          <p className="text-xs text-gray-400">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* User dropdown */}
        <div className="relative pl-3 border-l border-gray-200" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-2 rounded-lg hover:bg-gray-50 px-2 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-700 leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400 leading-tight">{ROLE_LABELS[user?.role] || user?.role || 'Manager'}</p>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
                <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                  {ROLE_LABELS[user?.role] || user?.role || 'Manager'}
                </span>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); navigate('/users'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Settings size={15} className="text-gray-400" /> Account Settings
              </button>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
