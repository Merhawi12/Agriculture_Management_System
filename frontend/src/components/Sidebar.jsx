import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Sprout, Beef, Package, DollarSign,
  Users, Wrench, ShoppingCart, Cloud, Brain, Satellite, Wheat,
  UserCog, Map, ShoppingBag, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../utils/permissions';

const NAV_ITEMS = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard',        group: 'Overview' },
  { to: '/users',         icon: UserCog,         label: 'User Management',  group: 'Admin' },
  { to: '/farms',         icon: Map,             label: 'Farm Management',  group: 'Admin' },
  { to: '/crops',         icon: Sprout,          label: 'Crop Management',  group: 'Operations' },
  { to: '/livestock',     icon: Beef,            label: 'Livestock',        group: 'Operations' },
  { to: '/inventory',     icon: Package,         label: 'Inventory',        group: 'Operations' },
  { to: '/finance',       icon: DollarSign,      label: 'Finance',          group: 'Operations' },
  { to: '/workers',       icon: Users,           label: 'Workers',          group: 'Operations' },
  { to: '/equipment',     icon: Wrench,          label: 'Equipment',        group: 'Operations' },
  { to: '/sales',         icon: ShoppingCart,    label: 'Sales & Supply',   group: 'Operations' },
  { to: '/marketplace',   icon: ShoppingBag,     label: 'Marketplace',      group: 'Operations' },
  { to: '/weather',       icon: Cloud,           label: 'Weather',          group: 'Tools' },
  { to: '/predictions',   icon: Brain,           label: 'AI Predictions',   group: 'Tools' },
  { to: '/monitoring',    icon: Satellite,       label: 'Monitoring',       group: 'Tools' },
  { to: '/notifications', icon: Bell,            label: 'Notifications',    group: 'Tools' },
];

const ROLE_LABELS = {
  super_admin:  'Admin',
  farmer:       'Farmer',
  farm_manager: 'Super Manager',
  agronomist:   'Agronomist',
  accountant:   'Accountant',
  worker:       'Employee',
};

export default function Sidebar({ open, setOpen }) {
  const { user } = useAuth();
  const role = user?.role || 'worker';

  const visibleItems = NAV_ITEMS.filter(item => canAccess(role, item.to));

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <aside className={`
        ${open ? 'w-64' : 'w-0 lg:w-16'}
        flex-shrink-0 bg-primary-900 text-white flex flex-col transition-all duration-300 overflow-hidden z-30
        fixed lg:relative h-full
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-primary-700 min-w-[4rem]">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wheat size={18} className="text-white" />
          </div>
          {open && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm whitespace-nowrap">CropMind</p>
              <p className="text-primary-400 text-xs whitespace-nowrap">Farm Management System</p>
            </div>
          )}
        </div>

        {/* Role badge */}
        {open && (
          <div className="px-4 py-3 border-b border-primary-700/50">
            <p className="text-[10px] text-primary-400 uppercase tracking-widest mb-1">Signed in as</p>
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-primary-600 text-primary-200 rounded-full">
              {ROLE_LABELS[role] || role}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          {(() => {
            let lastGroup = null;
            return visibleItems.map(({ to, icon: Icon, label, group }) => {
              const showGroup = open && group !== lastGroup;
              lastGroup = group;
              return (
                <div key={to}>
                  {showGroup && (
                    <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-primary-500 whitespace-nowrap">{group}</p>
                  )}
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors text-sm font-medium
                      ${isActive
                        ? 'bg-primary-700 text-white'
                        : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {open && <span className="whitespace-nowrap">{label}</span>}
                  </NavLink>
                </div>
              );
            });
          })()}
        </nav>

        {/* Footer */}
        {open && (
          <div className="p-4 border-t border-primary-700 text-xs text-primary-400">
            <p className="font-medium text-primary-300">AgriFarm</p>
            <p>Season 2025/2026</p>
          </div>
        )}
      </aside>
    </>
  );
}
