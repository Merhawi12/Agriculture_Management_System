import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
  Sprout, Beef, Users, Wrench, TrendingUp, TrendingDown,
  Package, AlertTriangle, ShoppingCart, Cloud, Brain,
  ShoppingBag, Bell, ClipboardList, CheckCircle2, Clock,
  DollarSign, ChevronRight, Shield, Building2
} from 'lucide-react';
import { dashboardApi, tasksApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const fmt = n => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);
const num = n => new Intl.NumberFormat().format(n);

const ROLE_LABELS = {
  super_admin:  'Admin Dashboard',
  farmer:       'Farmer Dashboard',
  farm_manager: 'Super Manager Dashboard',
  agronomist:   'Agronomist Dashboard',
  accountant:   'Accountant Dashboard',
  worker:       'Employee Dashboard',
};

const ROLE_COLORS = {
  super_admin:  'bg-violet-100 text-violet-700',
  farmer:       'bg-lime-100 text-lime-700',
  farm_manager: 'bg-indigo-100 text-indigo-700',
  agronomist:   'bg-emerald-100 text-emerald-700',
  accountant:   'bg-blue-100 text-blue-700',
  worker:       'bg-amber-100 text-amber-700',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function KpiCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

const COLORS = ['#16a34a', '#22c55e', '#86efac', '#d97706', '#ea580c', '#ef4444'];

// ─── Worker dashboard ────────────────────────────────────────────────────────
function WorkerDashboard({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    tasksApi.getToday()
      .then(data => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
      .finally(() => setLoadingTasks(false));
  }, []);

  const myTasks   = tasks.filter(t => t.worker_name?.toLowerCase() === user?.name?.toLowerCase());
  const pending   = myTasks.filter(t => t.status === 'pending');
  const inProgress= myTasks.filter(t => t.status === 'in_progress');
  const done      = myTasks.filter(t => t.status === 'completed');

  const PRIORITY_COLOR = { high: 'text-red-600 bg-red-50', medium: 'text-amber-600 bg-amber-50', low: 'text-green-600 bg-green-50' };

  return (
    <div className="space-y-6">
      {/* Quick access */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/weather" className="card hover:shadow-md transition-shadow flex items-center gap-4 group">
          <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center group-hover:bg-sky-200 transition-colors">
            <Cloud size={22} className="text-sky-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Weather</p>
            <p className="text-xs text-gray-400">Check today's forecast</p>
          </div>
        </Link>
        <Link to="/marketplace" className="card hover:shadow-md transition-shadow flex items-center gap-4 group">
          <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center group-hover:bg-pink-200 transition-colors">
            <ShoppingBag size={22} className="text-pink-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Marketplace</p>
            <p className="text-xs text-gray-400">Browse & list products</p>
          </div>
        </Link>
        <Link to="/notifications" className="card hover:shadow-md transition-shadow flex items-center gap-4 group">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
            <Bell size={22} className="text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Notifications</p>
            <p className="text-xs text-gray-400">View your alerts</p>
          </div>
        </Link>
      </div>

      {/* My tasks today */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ClipboardList size={16} className="text-primary-600" />
          My Tasks Today
        </h3>
        {loadingTasks ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full" />
          </div>
        ) : myTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ClipboardList size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No tasks assigned to you today.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="mt-0.5">
                  {task.status === 'completed'
                    ? <CheckCircle2 size={16} className="text-green-500" />
                    : task.status === 'in_progress'
                    ? <Clock size={16} className="text-blue-500" />
                    : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {task.title}
                  </p>
                  {task.field && <p className="text-xs text-gray-400 mt-0.5">Field: {task.field}</p>}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority] || 'text-gray-600 bg-gray-100'}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
        {/* Summary chips */}
        {myTasks.length > 0 && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">{pending.length} pending</span>
            <span className="text-xs text-blue-600">{inProgress.length} in progress</span>
            <span className="text-xs text-green-600">{done.length} done</span>
          </div>
        )}
      </div>

      {/* All tasks today (farm overview) */}
      {tasks.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <ClipboardList size={16} className="text-gray-400" />
            Farm Tasks Today
            <span className="ml-auto text-xs text-gray-400">{tasks.length} total</span>
          </h3>
          <div className="space-y-1">
            {tasks.slice(0, 6).map(task => (
              <div key={task.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 text-sm">
                <span className="text-gray-700 truncate flex-1">{task.title}</span>
                <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{task.worker_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Agronomist dashboard ────────────────────────────────────────────────────
function AgronomistDashboard({ stats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard icon={Sprout} label="Total Crops" value={num(stats.crops.total)} sub={`${stats.crops.growing} currently growing`} color="bg-primary-600" trend={8} />
        <KpiCard icon={Package} label="Inventory Items" value={num(stats.inventory_low)} sub="items below minimum level" color="bg-amber-600" />
      </div>

      {stats.inventory_low > 0 && (
        <div className="card bg-yellow-50 border-yellow-100">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">{stats.inventory_low} inventory item(s) are low on stock</p>
              <p className="text-sm text-yellow-600 mt-0.5">Check the Inventory module to reorder supplies.</p>
              <Link to="/inventory" className="inline-block mt-2 text-xs font-semibold text-yellow-700 underline">Go to Inventory →</Link>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Sprout size={16} className="text-primary-600" /> Crop Status
        </h3>
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Sprout size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">{stats.crops.growing} crops currently growing</p>
            <p className="text-xs text-blue-600 mt-0.5">Monitor growth stages and irrigation schedules</p>
            <Link to="/crops" className="inline-block mt-1 text-xs font-semibold text-blue-700 underline">Manage Crops →</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/weather',     icon: Cloud,  label: 'Weather',        desc: 'Forecasts & advisories',  color: 'bg-sky-100 text-sky-600' },
          { to: '/predictions', icon: Brain,  label: 'AI Predictions', desc: 'Yield & disease models',  color: 'bg-violet-100 text-violet-600' },
          { to: '/monitoring',  icon: Sprout, label: 'Monitoring',     desc: 'Satellite & field data',  color: 'bg-green-100 text-green-600' },
        ].map(({ to, icon: Icon, label, desc, color }) => (
          <Link key={to} to={to} className="card hover:shadow-md transition-shadow flex items-center gap-3 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Farmer dashboard ────────────────────────────────────────────────────────
function FarmerDashboard({ stats }) {
  const months = Array.from(new Set([...stats.monthly_income.map(m => m.month), ...stats.monthly_expense.map(m => m.month)])).sort();
  const chartData = months.map(m => ({
    month: m.substring(5),
    income:   stats.monthly_income.find(i => i.month === m)?.total  || 0,
    expenses: stats.monthly_expense.find(e => e.month === m)?.total || 0,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Sprout}       label="Active Crops"  value={num(stats.crops.growing)}   sub="currently growing"        color="bg-primary-600" trend={8} />
        <KpiCard icon={Beef}         label="Livestock"     value={num(stats.livestock.total)} sub={`${stats.livestock.healthy} healthy`} color="bg-earth-600" trend={3} />
        <div className="card bg-green-50 border-green-100">
          <p className="text-sm text-green-700 font-medium">Season Revenue</p>
          <p className="text-2xl font-bold text-green-800 mt-1">{fmt(stats.revenue)}</p>
          <div className="flex items-center gap-1 text-green-600 text-xs mt-1"><TrendingUp size={12} /> This season</div>
        </div>
        <div className={`card ${stats.profit >= 0 ? 'bg-primary-50 border-primary-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className={`text-sm font-medium ${stats.profit >= 0 ? 'text-primary-700' : 'text-orange-700'}`}>Net Profit</p>
          <p className={`text-2xl font-bold mt-1 ${stats.profit >= 0 ? 'text-primary-800' : 'text-orange-800'}`}>{fmt(stats.profit)}</p>
          <div className="text-xs mt-1 text-gray-500">Revenue − Expenses</div>
        </div>
      </div>

      {/* Income chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Season Income Overview</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => fmt(v)} />
            <Legend />
            <Area type="monotone" dataKey="income"   stroke="#16a34a" fill="url(#fi)" strokeWidth={2} name="Income" />
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#fe)" strokeWidth={2} name="Expenses" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/weather',     icon: Cloud,      label: 'Weather',        desc: 'Forecasts & farm advisories', color: 'bg-sky-100 text-sky-600' },
          { to: '/marketplace', icon: ShoppingBag,label: 'Marketplace',    desc: 'Sell produce & manage buyers', color: 'bg-pink-100 text-pink-600' },
          { to: '/predictions', icon: Brain,      label: 'AI Predictions', desc: 'Yield & disease forecasts',   color: 'bg-violet-100 text-violet-600' },
        ].map(({ to, icon: Icon, label, desc, color }) => (
          <Link key={to} to={to} className="card hover:shadow-md transition-shadow flex items-center gap-3 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {stats.inventory_low > 0 && (
        <div className="card bg-yellow-50 border-yellow-100">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">{stats.inventory_low} inventory item(s) are running low</p>
              <p className="text-sm text-yellow-600 mt-0.5">Reorder supplies to avoid operational delays.</p>
              <Link to="/inventory" className="inline-block mt-2 text-xs font-semibold text-yellow-700 underline">Go to Inventory →</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Accountant dashboard ────────────────────────────────────────────────────
function AccountantDashboard({ stats }) {
  const months = Array.from(new Set([...stats.monthly_income.map(m => m.month), ...stats.monthly_expense.map(m => m.month)])).sort();
  const chartData = months.map(m => ({
    month: m.substring(5),
    income: stats.monthly_income.find(i => i.month === m)?.total || 0,
    expenses: stats.monthly_expense.find(e => e.month === m)?.total || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-green-50 border-green-100">
          <p className="text-sm text-green-700 font-medium">Total Revenue</p>
          <p className="text-3xl font-bold text-green-800 mt-1">{fmt(stats.revenue)}</p>
          <div className="flex items-center gap-1 text-green-600 text-xs mt-1"><TrendingUp size={12} /> This season</div>
        </div>
        <div className="card bg-red-50 border-red-100">
          <p className="text-sm text-red-700 font-medium">Total Expenses</p>
          <p className="text-3xl font-bold text-red-800 mt-1">{fmt(stats.expenses)}</p>
          <div className="flex items-center gap-1 text-red-600 text-xs mt-1"><TrendingDown size={12} /> This season</div>
        </div>
        <div className={`card ${stats.profit >= 0 ? 'bg-primary-50 border-primary-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className={`text-sm font-medium ${stats.profit >= 0 ? 'text-primary-700' : 'text-orange-700'}`}>Net Profit</p>
          <p className={`text-3xl font-bold mt-1 ${stats.profit >= 0 ? 'text-primary-800' : 'text-orange-800'}`}>{fmt(stats.profit)}</p>
          <div className="text-xs mt-1 text-gray-500">Revenue - Expenses</div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Monthly Financial Overview</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => fmt(v)} />
            <Legend />
            <Area type="monotone" dataKey="income" stroke="#16a34a" fill="url(#inc)" strokeWidth={2} name="Income" />
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#exp)" strokeWidth={2} name="Expenses" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ShoppingCart size={16} className="text-primary-600" /> Recent Sales
        </h3>
        <div className="space-y-2">
          {stats.recent_sales.map(sale => (
            <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{sale.product}</p>
                <p className="text-xs text-gray-400">{sale.customer} · {sale.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{fmt(sale.total_amount)}</p>
                <span className={sale.status === 'completed' ? 'badge-green' : 'badge-yellow'}>{sale.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Super Manager dashboard (farm_manager) ─────────────────────────────────
function SuperManagerDashboard({ stats, user }) {
  const DEPARTMENTS = [
    {
      label: 'Workers & HR',
      desc:  `${stats.workers.active} active · ${stats.workers.total} total staff`,
      route: '/workers',
      icon:  Users,
      iconBg: 'bg-blue-600',
      cardBg: 'bg-blue-50 border-blue-100',
      badge:  null,
    },
    {
      label: 'Finance & Payroll',
      desc:  `Revenue ${fmt(stats.revenue)}`,
      route: '/finance',
      icon:  DollarSign,
      iconBg: 'bg-green-600',
      cardBg: 'bg-green-50 border-green-100',
      badge:  null,
    },
    {
      label: 'Inventory & Stock',
      desc:  stats.inventory_low > 0 ? `${stats.inventory_low} items below minimum` : 'Stock levels OK',
      route: '/inventory',
      icon:  Package,
      iconBg: stats.inventory_low > 0 ? 'bg-amber-600' : 'bg-gray-600',
      cardBg: stats.inventory_low > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100',
      badge:  stats.inventory_low > 0 ? { text: 'Low Stock', color: 'bg-red-100 text-red-700' } : null,
    },
    {
      label: 'Sales & Supply',
      desc:  `${stats.recent_sales.length} recent transactions`,
      route: '/sales',
      icon:  ShoppingCart,
      iconBg: 'bg-purple-600',
      cardBg: 'bg-purple-50 border-purple-100',
      badge:  null,
    },
    {
      label: 'Livestock',
      desc:  `${stats.livestock.healthy} healthy · ${stats.livestock.total} total`,
      route: '/livestock',
      icon:  Beef,
      iconBg: 'bg-orange-600',
      cardBg: 'bg-orange-50 border-orange-100',
      badge:  null,
    },
    {
      label: 'Equipment',
      desc:  `${stats.equipment.operational} operational · ${stats.equipment.total} units`,
      route: '/equipment',
      icon:  Wrench,
      iconBg: 'bg-slate-600',
      cardBg: 'bg-slate-50 border-slate-100',
      badge:  null,
    },
    {
      label: 'Marketplace',
      desc:  'Products, buyers & transactions',
      route: '/marketplace',
      icon:  ShoppingBag,
      iconBg: 'bg-pink-600',
      cardBg: 'bg-pink-50 border-pink-100',
      badge:  null,
    },
    {
      label: 'Crop Management',
      desc:  `${stats.crops.growing} growing · ${stats.crops.total} total`,
      route: '/crops',
      icon:  Sprout,
      iconBg: 'bg-emerald-600',
      cardBg: 'bg-emerald-50 border-emerald-100',
      badge:  null,
    },
  ];

  const months = Array.from(new Set([...stats.monthly_income.map(m => m.month), ...stats.monthly_expense.map(m => m.month)])).sort();
  const chartData = months.map(m => ({
    month:    m.substring(5),
    income:   stats.monthly_income.find(i  => i.month === m)?.total || 0,
    expenses: stats.monthly_expense.find(e => e.month === m)?.total || 0,
  }));

  return (
    <div className="space-y-6">

      {/* Organization control banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 rounded-2xl p-5 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={16} className="text-indigo-300" />
              <span className="text-indigo-300 text-sm font-medium">Organization Control Center</span>
            </div>
            <h3 className="text-xl font-bold">Full Management Access — 8 Departments</h3>
            <p className="text-indigo-300 text-xs mt-1.5">
              You have exclusive control over your organization's staff, operations, and financial activities.
            </p>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-2 gap-2 flex-shrink-0">
            {[
              { label: 'Staff',  value: num(stats.workers.total) },
              { label: 'Crops',  value: num(stats.crops.total) },
              { label: 'Revenue', value: `${(stats.revenue / 1000).toFixed(0)}k` },
              { label: 'Animals', value: num(stats.livestock.total) },
            ].map(s => (
              <div key={s.label} className="bg-white/15 rounded-xl px-3 py-2 text-center">
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-indigo-300">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department cards grid */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Departments Under Your Control</h3>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {DEPARTMENTS.map(({ label, desc, route, icon: Icon, iconBg, cardBg, badge }) => (
            <Link
              key={route}
              to={route}
              className={`relative flex flex-col gap-3 p-4 rounded-2xl border ${cardBg} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group`}
            >
              {badge && (
                <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                  {badge.text}
                </span>
              )}
              <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm leading-tight">{label}</p>
                <p className="text-xs text-gray-500 mt-1">{desc}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-indigo-600 transition-colors font-medium">
                Manage <ChevronRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Financial summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-green-50 border-green-100">
          <p className="text-sm text-green-700 font-medium">Total Revenue</p>
          <p className="text-3xl font-bold text-green-800 mt-1">{fmt(stats.revenue)}</p>
          <div className="flex items-center gap-1 text-green-600 text-xs mt-1"><TrendingUp size={12} /> This season</div>
        </div>
        <div className="card bg-red-50 border-red-100">
          <p className="text-sm text-red-700 font-medium">Total Expenses</p>
          <p className="text-3xl font-bold text-red-800 mt-1">{fmt(stats.expenses)}</p>
          <div className="flex items-center gap-1 text-red-600 text-xs mt-1"><TrendingDown size={12} /> This season</div>
        </div>
        <div className={`card ${stats.profit >= 0 ? 'bg-primary-50 border-primary-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className={`text-sm font-medium ${stats.profit >= 0 ? 'text-primary-700' : 'text-orange-700'}`}>Net Profit</p>
          <p className={`text-3xl font-bold mt-1 ${stats.profit >= 0 ? 'text-primary-800' : 'text-orange-800'}`}>{fmt(stats.profit)}</p>
          <div className="text-xs mt-1 text-gray-500">Revenue − Expenses</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Organization Financial Performance</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="smi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sme" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => fmt(v)} />
            <Legend />
            <Area type="monotone" dataKey="income"   stroke="#4f46e5" fill="url(#smi)" strokeWidth={2} name="Income" />
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#sme)" strokeWidth={2} name="Expenses" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts + Recent Sales */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" /> Operations Alerts
          </h3>
          <div className="space-y-3">
            {stats.inventory_low > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <Package size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">{stats.inventory_low} inventory item(s) below minimum</p>
                  <Link to="/inventory" className="text-xs text-yellow-700 underline mt-0.5 inline-block">Review Inventory →</Link>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <Sprout size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800">{stats.crops.growing} crops in active growth phase</p>
                <Link to="/crops" className="text-xs text-emerald-700 underline mt-0.5 inline-block">Monitor Crops →</Link>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Users size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">{stats.workers.active} employees active today</p>
                <Link to="/workers" className="text-xs text-blue-700 underline mt-0.5 inline-block">View Team →</Link>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <Beef size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800">{stats.livestock.healthy} of {stats.livestock.total} livestock healthy</p>
                <Link to="/livestock" className="text-xs text-orange-700 underline mt-0.5 inline-block">Manage Livestock →</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingCart size={16} className="text-indigo-600" /> Recent Sales Activity
          </h3>
          <div className="space-y-2">
            {stats.recent_sales.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No recent sales recorded.</p>
            ) : stats.recent_sales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{sale.product}</p>
                  <p className="text-xs text-gray-400">{sale.customer} · {sale.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{fmt(sale.total_amount)}</p>
                  <span className={sale.status === 'completed' ? 'badge-green' : 'badge-yellow'}>{sale.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Full dashboard (super_admin only) ───────────────────────────────────────
function FullDashboard({ stats, user }) {
  const months = Array.from(new Set([...stats.monthly_income.map(m => m.month), ...stats.monthly_expense.map(m => m.month)])).sort();
  const chartData = months.map(m => ({
    month: m.substring(5),
    income: stats.monthly_income.find(i => i.month === m)?.total || 0,
    expenses: stats.monthly_expense.find(e => e.month === m)?.total || 0,
  }));

  const pieData = [
    { name: 'Crops',     value: stats.crops.total },
    { name: 'Livestock', value: stats.livestock.total },
    { name: 'Workers',   value: stats.workers.total },
    { name: 'Equipment', value: stats.equipment.total },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Sprout} label="Total Crops"   value={num(stats.crops.total)}     sub={`${stats.crops.growing} currently growing`}       color="bg-primary-600" trend={8} />
        <KpiCard icon={Beef}   label="Livestock"     value={num(stats.livestock.total)} sub={`${stats.livestock.healthy} healthy`}              color="bg-earth-600"   trend={3} />
        <KpiCard icon={Users}  label="Workers"       value={num(stats.workers.total)}   sub={`${stats.workers.active} active`}                  color="bg-blue-600" />
        <KpiCard icon={Wrench} label="Equipment"     value={num(stats.equipment.total)} sub={`${stats.equipment.operational} operational`}      color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-green-50 border-green-100">
          <p className="text-sm text-green-700 font-medium">Total Revenue</p>
          <p className="text-3xl font-bold text-green-800 mt-1">{fmt(stats.revenue)}</p>
          <div className="flex items-center gap-1 text-green-600 text-xs mt-1"><TrendingUp size={12} /> This season</div>
        </div>
        <div className="card bg-red-50 border-red-100">
          <p className="text-sm text-red-700 font-medium">Total Expenses</p>
          <p className="text-3xl font-bold text-red-800 mt-1">{fmt(stats.expenses)}</p>
          <div className="flex items-center gap-1 text-red-600 text-xs mt-1"><TrendingDown size={12} /> This season</div>
        </div>
        <div className={`card ${stats.profit >= 0 ? 'bg-primary-50 border-primary-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className={`text-sm font-medium ${stats.profit >= 0 ? 'text-primary-700' : 'text-orange-700'}`}>Net Profit</p>
          <p className={`text-3xl font-bold mt-1 ${stats.profit >= 0 ? 'text-primary-800' : 'text-orange-800'}`}>{fmt(stats.profit)}</p>
          <div className="text-xs mt-1 text-gray-500">Revenue - Expenses</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Financial Overview</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmt(v)} />
              <Legend />
              <Area type="monotone" dataKey="income"   stroke="#16a34a" fill="url(#income)"   strokeWidth={2} name="Income" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenses)" strokeWidth={2} name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Farm Assets</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                <span className="text-gray-600">{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" /> Alerts & Notifications
          </h3>
          <div className="space-y-3">
            {stats.inventory_low > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <Package size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">{stats.inventory_low} item(s) low in stock</p>
                  <p className="text-xs text-yellow-600">Check inventory for items below minimum levels</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Sprout size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">{stats.crops.growing} crops currently growing</p>
                <p className="text-xs text-blue-600">Monitor growth stages and irrigation schedules</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-primary-50 rounded-lg border border-primary-100">
              <Users size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary-800">{stats.workers.active} workers active today</p>
                <p className="text-xs text-primary-600">All field operations are on schedule</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingCart size={16} className="text-primary-600" /> Recent Sales
          </h3>
          <div className="space-y-2">
            {stats.recent_sales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{sale.product}</p>
                  <p className="text-xs text-gray-400">{sale.customer} · {sale.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{fmt(sale.total_amount)}</p>
                  <span className={sale.status === 'completed' ? 'badge-green' : 'badge-yellow'}>{sale.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || 'worker';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const needsStats = !['worker'].includes(role);

  useEffect(() => {
    if (!needsStats) { setLoading(false); return; }
    dashboardApi.getStats()
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [needsStats]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );

  if (needsStats && !stats) return (
    <div className="card text-center text-gray-500 py-12">
      Failed to load dashboard. Make sure the backend is running.
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Personalized greeting banner */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-2xl px-6 py-5 text-white flex items-center justify-between">
        <div>
          <p className="text-primary-300 text-sm">{greeting()},</p>
          <h2 className="text-2xl font-bold mt-0.5">{user?.name || 'User'}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-700'}`}>
              {ROLE_LABELS[role] || role}
            </span>
            {user?.email && (
              <span className="text-primary-400 text-xs">{user.email}</span>
            )}
          </div>
        </div>
        <div className="hidden sm:flex w-14 h-14 bg-white/10 rounded-2xl items-center justify-center text-2xl font-bold border border-white/20">
          {user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U'}
        </div>
      </div>

      {/* Role-specific content */}
      {role === 'worker' && (
        <WorkerDashboard user={user} />
      )}
      {role === 'agronomist' && stats && (
        <AgronomistDashboard stats={stats} />
      )}
      {role === 'accountant' && stats && (
        <AccountantDashboard stats={stats} />
      )}
      {role === 'farmer' && stats && (
        <FarmerDashboard stats={stats} />
      )}
      {role === 'farm_manager' && stats && (
        <SuperManagerDashboard stats={stats} user={user} />
      )}
      {role === 'super_admin' && stats && (
        <FullDashboard stats={stats} user={user} />
      )}
    </div>
  );
}
