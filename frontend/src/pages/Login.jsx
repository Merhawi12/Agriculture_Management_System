import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Leaf, Mail, Lock, Eye, EyeOff, LogIn, Zap } from 'lucide-react';

export default function Login() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      toast.success('Logged in as Demo Admin');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/landing" className="inline-flex items-center gap-3 group">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">AgriFarm</h1>
              <p className="text-green-400 text-sm">Management System</p>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-green-200 text-sm mb-8">Sign in to manage your farm</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-green-200 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-green-400" style={{width:18,height:18}} />
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@farm.com"
                  autoComplete="email"
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-11 pr-4 text-white placeholder-green-400/60 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-green-200 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-400" style={{width:18,height:18}} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-11 pr-12 text-white placeholder-green-400/60 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-400 hover:text-white transition">
                  {showPw ? <EyeOff style={{width:18,height:18}} /> : <Eye style={{width:18,height:18}} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 active:scale-[.98]"
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              ) : <LogIn className="w-5 h-5" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-green-400 text-xs font-medium">OR</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Demo login */}
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[.98]"
          >
            {demoLoading ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            ) : <Zap className="w-4 h-4 text-yellow-400" />}
            Try Demo (admin@agrifarm.com)
          </button>

          {/* Demo credentials box */}
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3.5 text-xs space-y-1">
            <p className="text-yellow-300 font-semibold">Demo Credentials</p>
            <p className="text-yellow-200/80">Email: <span className="font-mono">admin@agrifarm.com</span></p>
            <p className="text-yellow-200/80">Password: <span className="font-mono">admin123</span></p>
          </div>

          {/* Register link */}
          <p className="text-center text-green-300 text-sm mt-6">
            New to AgriFarm?{' '}
            <Link to="/register" className="text-green-400 hover:text-white font-semibold underline underline-offset-2 transition">
              Create an account
            </Link>
          </p>
        </div>

        {/* Back to landing */}
        <p className="text-center mt-4">
          <Link to="/landing" className="text-green-500 hover:text-green-300 text-sm transition">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
