import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wheat, LayoutDashboard, Sprout, Beef, Package, DollarSign,
  Users, Wrench, ShoppingCart, Cloud, Brain, Satellite, Map,
  UserCog, Shield, Bell, Store, Check, ChevronRight, Globe,
  Wifi, MessageSquare, Lock, Database, RefreshCw, Menu, X,
  TrendingUp, BarChart2, Leaf, Star, Phone, Mail, Twitter,
  Facebook, Linkedin, ArrowRight, Play, Zap, Award, Heart
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { publicApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─── Data ────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: LayoutDashboard, label: 'Dashboard',       desc: 'Real-time KPIs & analytics',        color: 'text-blue-600',   bg: 'bg-blue-50' },
  { icon: Sprout,          label: 'Crop Management', desc: 'Planting to harvest tracking',        color: 'text-green-600',  bg: 'bg-green-50' },
  { icon: Beef,            label: 'Livestock',        desc: 'Health, weight & vaccination',       color: 'text-amber-600',  bg: 'bg-amber-50' },
  { icon: Package,         label: 'Inventory',        desc: 'Warehouse & stock alerts',           color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: DollarSign,      label: 'Finance',          desc: 'Income, expenses & payroll',         color: 'text-emerald-600',bg: 'bg-emerald-50' },
  { icon: Users,           label: 'Workers & HR',     desc: 'Attendance, tasks & GPS tracking',   color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: Wrench,          label: 'Equipment',        desc: 'Maintenance scheduling & logs',      color: 'text-gray-600',   bg: 'bg-gray-50' },
  { icon: ShoppingCart,    label: 'Marketplace',      desc: 'Sell produce, manage buyers',        color: 'text-pink-600',   bg: 'bg-pink-50' },
  { icon: Cloud,           label: 'Weather',          desc: 'OpenWeather + farm advisories',      color: 'text-sky-600',    bg: 'bg-sky-50' },
  { icon: Brain,           label: 'AI Predictions',   desc: 'TensorFlow & scikit-learn models',   color: 'text-violet-600', bg: 'bg-violet-50' },
  { icon: Satellite,       label: 'Monitoring',       desc: 'Satellite & drone integration',      color: 'text-rose-600',   bg: 'bg-rose-50' },
  { icon: Map,             label: 'Farm Management',  desc: 'GPS boundaries & soil data',         color: 'text-teal-600',   bg: 'bg-teal-50' },
  { icon: UserCog,         label: 'User Management',  desc: 'Roles, permissions & multi-farm',    color: 'text-orange-600', bg: 'bg-orange-50' },
  { icon: Bell,            label: 'Notifications',    desc: 'SMS, email & push alerts',           color: 'text-red-600',    bg: 'bg-red-50' },
];

const TESTIMONIALS = [
  { name: 'James M.', role: 'Farm Manager', location: 'Nakuru, Kenya', avatar: '👨🏾‍🌾', rating: 5,
    text: 'AgriManager transformed how I run my 108-hectare farm. The AI yield predictions helped me increase output by 35% in one season. The SMS alerts are a game-changer!' },
  { name: 'Amara D.', role: 'Agribusiness Owner', location: 'Accra, Ghana', avatar: '👩🏾‍💼', rating: 5,
    text: 'The marketplace feature connected me directly to processors in Accra. No more middlemen. My revenue doubled in 6 months. Works perfectly offline too!' },
  { name: 'Fatuma O.', role: 'Agronomist', location: 'Dar es Salaam, Tanzania', avatar: '👩🏿‍🔬', rating: 5,
    text: 'The disease alert system and soil health predictions from the TensorFlow model caught early blight before it spread. Saved my entire tomato crop. Incredible tool!' },
];

const PRICING = [
  { plan: 'Starter', price: 'Free', period: '', color: 'border-gray-200',
    desc: 'Perfect for smallholder farmers', badge: null,
    features: ['1 Farm', '3 Users', 'Crop & Livestock tracking', 'Basic weather', 'Community support'] },
  { plan: 'Pro', price: 'KES 2,999', period: '/month', color: 'border-primary-500', badge: 'Most Popular',
    desc: 'For growing commercial farms',
    features: ['5 Farms', '20 Users', 'All 14 modules', 'AI/ML predictions', 'SMS & email alerts', 'Marketplace access', 'Priority support'] },
  { plan: 'Enterprise', price: 'Custom', period: '', color: 'border-gray-200',
    desc: 'For large agribusinesses & cooperatives', badge: null,
    features: ['Unlimited farms', 'Unlimited users', 'Custom ML models', 'API access', 'White-label option', 'Dedicated success manager', 'SLA guarantee'] },
];

const AFRICA_FEATURES = [
  { icon: Wifi,           label: 'Works Offline',        desc: 'PWA with service worker caching. Full functionality even with poor connectivity. Data syncs when back online.', color: 'bg-green-500' },
  { icon: MessageSquare,  label: 'SMS Support',           desc: "Africa's Talking integration for SMS alerts. Works on any phone — no smartphone required. USSD support coming.", color: 'bg-blue-500' },
  { icon: Globe,          label: 'Local Languages',       desc: 'Interface available in English, Kiswahili, and Français. More languages (Hausa, Amharic, Zulu) in roadmap.',   color: 'bg-amber-500' },
  { icon: Phone,          label: 'Mobile-First Design',   desc: 'Optimized for all screen sizes. Low-data mode for 2G/3G networks. APK available for Android devices.',          color: 'bg-purple-500' },
];

const SECURITY_ITEMS = [
  'JWT Authentication (RS256)',
  'HTTPS/TLS encryption',
  'bcrypt password hashing',
  'Role-based access control',
  'Daily automated backups',
  'Database field encryption',
  'API rate limiting',
  'Audit logs & activity trail',
];

const REVENUE_DATA = [
  { month: 'Dec', revenue: 65000, expenses: 28000 },
  { month: 'Jan', revenue: 82000, expenses: 31000 },
  { month: 'Feb', revenue: 71000, expenses: 29000 },
  { month: 'Mar', revenue: 95000, expenses: 35000 },
  { month: 'Apr', revenue: 88000, expenses: 32000 },
  { month: 'May', revenue: 115000, expenses: 38000 },
];

const CROP_DATA = [
  { name: 'Wheat', value: 35, fill: '#f59e0b' },
  { name: 'Corn',  value: 25, fill: '#10b981' },
  { name: 'Soy',   value: 20, fill: '#3b82f6' },
  { name: 'Rice',  value: 12, fill: '#8b5cf6' },
  { name: 'Other', value: 8,  fill: '#6b7280' },
];

const LANGUAGES = [
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'sw', label: 'Kiswahili', flag: '🇹🇿' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
];

const TRANSLATIONS = {
  en: { hero1: 'The #1 Farm Management', hero2: 'Platform Built for Africa', heroSub: 'AI-powered crop predictions · Real-time weather · Integrated marketplace · SMS alerts · Works offline', cta1: 'Start Free Today', cta2: 'Watch Demo' },
  sw: { hero1: 'Jukwaa Bora la Usimamizi', hero2: 'wa Shamba kwa Afrika', heroSub: 'Ubashiri wa mazao wa AI · Hali ya hewa ya wakati halisi · Soko lililounganishwa · Arifa za SMS · Inafanya kazi nje ya mtandao', cta1: 'Anza Bure Leo', cta2: 'Tazama Demo' },
  fr: { hero1: 'La Plateforme de Gestion', hero2: 'Agricole N°1 pour l\'Afrique', heroSub: 'Prédictions IA des récoltes · Météo en temps réel · Marché intégré · Alertes SMS · Fonctionne hors ligne', cta1: 'Commencer Gratuitement', cta2: 'Voir la Démo' },
};

// ─── Animated counter ────────────────────────────────────────────────────────
function AnimatedCounter({ target, prefix = '', suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const steps = 60;
        const inc = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += inc;
          if (current >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.round(current));
        }, duration / steps);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Landing() {
  const [lang,       setLang]       = useState('en');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [stats,      setStats]      = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, demoLogin } = useAuth();

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (isAuthenticated) { navigate('/dashboard', { replace: true }); return; }
    publicApi.getStats().then(setStats).catch(() => {});
  }, [isAuthenticated, navigate]);

  const handleDemo = async () => {
    setDemoLoading(true);
    try { await demoLogin(); navigate('/dashboard'); }
    catch { setDemoLoading(false); }
  };

  const STAT_CARDS = [
    { label: 'Farmers Using Platform', value: stats?.users || 850, suffix: '+' },
    { label: 'Crops Tracked',          value: stats?.crops || 6,   suffix: '' },
    { label: 'Countries',              value: 12,                  suffix: '' },
    { label: 'Revenue Tracked',        value: stats ? Math.round(stats.revenue / 1000) : 1247, suffix: 'K KES' },
    { label: 'AI Predictions Made',    value: stats?.predictions || 1247, suffix: '+' },
    { label: 'Uptime',                 value: 99, suffix: '.9%' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-primary-900/95 backdrop-blur border-b border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Wheat size={18} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg">CropMind</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-primary-200">
            {['Features', 'Marketplace', 'Security', 'Pricing'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>

          {/* Right: lang + auth */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-primary-800 rounded-lg p-1">
              {LANGUAGES.map(lg => (
                <button key={lg.code} onClick={() => setLang(lg.code)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${lang === lg.code ? 'bg-primary-600 text-white' : 'text-primary-300 hover:text-white'}`}>
                  {lg.flag} {lg.code.toUpperCase()}
                </button>
              ))}
            </div>
            <Link to="/login"    className="hidden sm:block text-primary-200 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-primary-800 transition-colors">Login</Link>
            <Link to="/register" className="bg-primary-500 hover:bg-primary-400 text-white text-sm px-4 py-1.5 rounded-lg font-medium transition-colors">Get Started</Link>
            <button className="md:hidden text-primary-200 p-1" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-primary-900 border-t border-primary-700 px-4 py-3 space-y-2">
            {['Features', 'Marketplace', 'Security', 'Pricing'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileMenu(false)}
                className="block text-primary-200 hover:text-white py-2 text-sm">{l}</a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link to="/login"    className="flex-1 text-center py-2 text-sm text-primary-200 border border-primary-600 rounded-lg">Login</Link>
              <Link to="/register" className="flex-1 text-center py-2 text-sm bg-primary-500 text-white rounded-lg font-medium">Register</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col justify-center bg-gray-50 pt-16 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-green-400 leading-tight tracking-tight">
            {t.hero1}
            <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              {t.hero2}
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-green-600 max-w-3xl mx-auto leading-relaxed">
            {t.heroSub}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-400 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary-900/50 transition-all hover:scale-105">
              {t.cta1} <ArrowRight size={20} />
            </Link>
            <button onClick={handleDemo} disabled={demoLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white border border-green-400 px-8 py-4 rounded-xl font-medium text-lg transition-all">
              <Play size={18} /> {demoLoading ? 'Signing in...' : t.cta2}
            </button>
          </div>

          <p className="mt-4 text-sm text-green-600">
            Demo login: <span className="text-green-400 font-mono">admin@agrifarm.com</span> / <span className="text-green-400 font-mono">admin123</span>
          </p>

          {/* Dashboard mockup */}
          <div className="mt-16 mx-auto max-w-5xl">
            <div className="bg-primary-800/40 border border-primary-600/50 rounded-2xl p-4 backdrop-blur shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-2 text-primary-400 text-xs font-mono">agrimanager.app/dashboard</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[['🌾','Crops','6 Active'],['🐄','Livestock','9 Animals'],['👥','Workers','8 Staff'],['💰','Revenue','KES 1.5M']].map(([e,l,v]) => (
                  <div key={l} className="bg-primary-900/60 rounded-xl p-3 text-left">
                    <span className="text-2xl">{e}</span>
                    <p className="text-primary-400 text-xs mt-1">{l}</p>
                    <p className="text-white font-bold text-sm">{v}</p>
                  </div>
                ))}
              </div>
              <div className="bg-primary-900/60 rounded-xl p-4">
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={REVENUE_DATA}>
                    <defs>
                      <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#heroGrad)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="expenses" stroke="#f97316" fill="none" strokeWidth={1.5} strokeDasharray="4" dot={false} />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => `KES ${v.toLocaleString()}`} contentStyle={{ background: '#1e3a29', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-primary-500 animate-bounce">
          <div className="w-5 h-8 border-2 border-primary-600 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-primary-500 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-primary-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center text-white">
            {STAT_CARDS.map(({ label, value, suffix }) => (
              <div key={label}>
                <p className="text-3xl sm:text-4xl font-extrabold text-green-400">
                  <AnimatedCounter target={value} suffix={suffix} />
                </p>
                <p className="text-primary-300 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Everything You Need</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">14 Integrated Modules</h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">From soil to sale — every aspect of farm management in one unified platform.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {FEATURES.map(({ icon: Icon, label, desc, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className={color} />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-gray-400 text-xs mt-1 leading-snug hidden sm:block">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Analytics ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Live Analytics</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Real-Time Farm Intelligence</h2>
            <p className="text-gray-500 mt-4">All analytics update automatically from your farm data. Below is from a real farm using the platform.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-green-500" /> 6-Month Revenue vs Expenses
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={REVENUE_DATA}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v/1000}K`} />
                  <Tooltip formatter={v => `KES ${v.toLocaleString()}`} />
                  <Area type="monotone" dataKey="revenue"  name="Revenue"  stroke="#22c55e" fill="url(#rev)" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="url(#exp)" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 mt-2 text-center">Data from Mwangi Family Farm, Nakuru — updated daily</p>
            </div>

            {/* Crop distribution */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-500" /> Crop Distribution
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={CROP_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {CROP_DATA.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={v => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {CROP_DATA.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: d.fill }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Simple Setup</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Up & Running in Minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step:'01', icon:'🗺️', title:'Register Your Farm', desc:'Sign up, enter your farm details, GPS boundaries, and soil information. Invite your team members with specific roles.' },
              { step:'02', icon:'📊', title:'Track Everything', desc:'Record crops, livestock, workers, equipment, and finances. Get real-time analytics and AI-powered predictions daily.' },
              { step:'03', icon:'💰', title:'Grow & Sell', desc:'Use marketplace to sell produce directly to buyers. Get SMS alerts for weather, disease, and market prices. Increase profits.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="relative bg-white rounded-2xl p-8 shadow-sm border border-primary-100">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center font-bold text-sm">{step}</div>
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Marketplace ── */}
      <section id="marketplace" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Marketplace</span>
              <h2 className="text-4xl font-bold text-gray-900 mt-2">Sell Directly to Buyers.<br />No Middlemen.</h2>
              <p className="text-gray-500 mt-4 text-lg">List your produce, connect with verified buyers, manage orders and track deliveries — all in one place.</p>
              <ul className="mt-6 space-y-3">
                {['Post products in seconds — grains, livestock, dairy, vegetables','Verified buyer network across Kenya, Ghana, Tanzania','Real-time order tracking with SMS delivery updates','MPESA, bank transfer, and cash on delivery payment options','Export-grade quality certification support'].map(f => (
                  <li key={f} className="flex items-start gap-3 text-gray-600">
                    <Check size={18} className="text-primary-600 mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="mt-8 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                Open Your Shop <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { emoji:'🌾', name:'Fresh Wheat Grain',     price:'KES 22/kg',  seller:'James M.',  badge:'In Stock' },
                { emoji:'🍅', name:'Roma Tomatoes',         price:'KES 80/kg',  seller:'Fatuma O.', badge:'Hot' },
                { emoji:'🐄', name:'Holstein Dairy Cow',    price:'KES 95,000', seller:'Peter K.',  badge:'Available' },
                { emoji:'🥦', name:'French Beans (Export)', price:'KES 120/kg', seller:'Mary N.',   badge:'Export Grade' },
              ].map(p => (
                <div key={p.name} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-primary-200 transition-colors">
                  <div className="text-3xl mb-2">{p.emoji}</div>
                  <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                  <p className="text-primary-600 font-bold text-sm mt-1">{p.price}</p>
                  <p className="text-gray-400 text-xs mt-1">by {p.seller}</p>
                  <span className="mt-2 inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{p.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Africa Section ── */}
      <section className="py-24 bg-gradient-to-br from-primary-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-green-400 font-semibold text-sm uppercase tracking-wider">Built for Africa 🌍</span>
            <h2 className="text-4xl font-bold text-white mt-2">Designed for African Realities</h2>
            <p className="text-primary-300 mt-4 max-w-2xl mx-auto">We understand intermittent connectivity, mobile-first users, and the importance of SMS in African agriculture.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AFRICA_FEATURES.map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{label}</h3>
                <p className="text-primary-300 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[['🇰🇪','Kenya'],['🇬🇭','Ghana'],['🇹🇿','Tanzania'],['🇺🇬','Uganda'],['🇷🇼','Rwanda'],['🇨🇮','Côte d\'Ivoire'],['🇿🇦','South Africa'],['🇳🇬','Nigeria']].map(([f, c]) => (
              <div key={c} className="bg-white/5 rounded-xl p-3 text-sm text-primary-200">{f} {c}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section id="security" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Enterprise Security</span>
              <h2 className="text-4xl font-bold text-gray-900 mt-2">Your Farm Data is Safe</h2>
              <p className="text-gray-500 mt-4 text-lg">Bank-grade security protecting your sensitive farm data, financial records, and worker information.</p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {SECURITY_ITEMS.map(item => (
                  <div key={item} className="flex items-center gap-2 text-gray-700 text-sm">
                    <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={11} className="text-primary-700" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                  <Shield size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Security Dashboard</p>
                  <p className="text-green-600 text-sm flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full inline-block" /> All systems operational</p>
                </div>
              </div>
              {[
                { label:'JWT Auth',         status:'Active',  color:'text-green-600' },
                { label:'HTTPS/TLS',        status:'Enabled', color:'text-green-600' },
                { label:'Daily Backup',     status:'02:00 AM',color:'text-green-600' },
                { label:'Role-based Access',status:'5 Roles', color:'text-blue-600' },
                { label:'Last Login Check', status:'Passed',  color:'text-green-600' },
                { label:'API Rate Limit',   status:'100/min', color:'text-amber-600' },
              ].map(({ label, status, color }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600 text-sm">{label}</span>
                  <span className={`text-sm font-semibold ${color}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Farmer Stories</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Trusted by African Farmers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(({ name, role, location, avatar, rating, text }) => (
              <div key={name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: rating }).map((_, i) => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-gray-700 leading-relaxed italic">"{text}"</p>
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-2xl">{avatar}</div>
                  <div>
                    <p className="font-bold text-gray-900">{name}</p>
                    <p className="text-sm text-gray-500">{role}</p>
                    <p className="text-xs text-primary-600">{location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Simple Pricing</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">Start Free, Scale as You Grow</h2>
            <p className="text-gray-500 mt-4">No hidden fees. Cancel anytime. Local currency billing available.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING.map(({ plan, price, period, color, desc, badge, features }) => (
              <div key={plan} className={`relative bg-white rounded-2xl border-2 ${color} p-8 shadow-sm ${badge ? 'shadow-primary-100 shadow-lg scale-105' : ''} transition-transform hover:shadow-md`}>
                {badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">{badge}</div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan}</h3>
                <p className="text-gray-500 text-sm mt-1">{desc}</p>
                <div className="mt-6 mb-8">
                  <span className="text-4xl font-extrabold text-gray-900">{price}</span>
                  {period && <span className="text-gray-400 text-sm ml-1">{period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-gray-600 text-sm">
                      <Check size={16} className="text-primary-600 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/register"
                  className={`block text-center py-3 px-6 rounded-xl font-semibold transition-colors ${
                    badge ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}>
                  {plan === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Countries ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Our Reach</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">Available Across Africa</h2>
            <p className="text-gray-500 mt-3">Trusted by farmers in these countries and growing every day.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { flag: '🇰🇪', name: 'Kenya' },
              { flag: '🇳🇬', name: 'Nigeria' },
              { flag: '🇬🇭', name: 'Ghana' },
              { flag: '🇹🇿', name: 'Tanzania' },
              { flag: '🇪🇹', name: 'Ethiopia' },
              { flag: '🇺🇬', name: 'Uganda' },
              { flag: '🇷🇼', name: 'Rwanda' },
              { flag: '🇿🇦', name: 'South Africa' },
              { flag: '🇦🇴', name: 'Angola' },
              { flag: '🇿🇲', name: 'Zambia' },
              { flag: '🇳🇦', name: 'Namibia' },
              { flag: '🇨🇩', name: 'Congo' },
            ].map(({ flag, name }) => (
              <div key={name} className="flex items-center gap-2 bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 px-5 py-3 rounded-xl transition-all group">
                <span className="text-2xl">{flag}</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-gradient-to-r from-primary-700 to-primary-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-5xl mb-6">🌍🌾</div>
          <h2 className="text-4xl font-extrabold">Ready to Transform Your Farm?</h2>
          <p className="mt-4 text-primary-200 text-xl">Join thousands of African farmers already using AgriManager to increase yields, reduce costs, and grow profits.</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-primary-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-50 transition-colors">
              Start Free Today <ArrowRight size={20} />
            </Link>
            <button onClick={handleDemo} className="w-full sm:w-auto flex items-center justify-center gap-2 border border-white/30 text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/10 transition-colors">
              <Play size={18} /> Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Wheat size={18} className="text-white" />
                </div>
                <span className="font-bold text-white">CropMind</span>
              </div>
              <p className="text-sm leading-relaxed">The smart farm management platform built for African farmers. AI-powered, offline-first, and mobile-optimized.</p>
              <div className="flex gap-3 mt-4">
                {[Twitter, Facebook, Linkedin].map((Icon, i) => (
                  <div key={i} className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-700 cursor-pointer transition-colors">
                    <Icon size={14} className="text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
            {[
              { title:'Product',   links:['Dashboard', 'Crop Management', 'Marketplace', 'AI Predictions', 'Weather'] },
              { title:'Company',   links:['About Us', 'Blog', 'Careers', 'Partners', 'Contact'] },
              { title:'Resources', links:['Documentation', 'API Reference', 'Community', 'Changelog', 'Status'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="font-semibold text-white mb-4 text-sm">{title}</p>
                <ul className="space-y-2">
                  {links.map(l => <li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p>© 2026 CropMind. Built with <Heart size={12} className="inline text-red-500 fill-red-500" /> for Africa 🌍</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
