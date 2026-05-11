import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Leaf, Mail, Lock, Eye, EyeOff, User, MapPin, UserCheck, ChevronDown } from 'lucide-react';

const ROLES = [
  { value: 'super_admin',  label: 'Admin',       desc: 'Full system administrator' },
  { value: 'farmer',       label: 'Farmer',      desc: 'Farm owner & grower' },
  { value: 'farm_manager', label: 'Super Manager', desc: 'Full org & team control' },
  { value: 'worker',       label: 'Employee',    desc: 'Field & daily operations' },
  { value: 'accountant',   label: 'Accountant',  desc: 'Finance & payroll' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'farmer', farmName: '', location: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = account info, 2 = farm info

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const validateStep1 = () => {
    if (!form.name.trim()) return toast.error('Name is required'), false;
    if (!form.email.trim()) return toast.error('Email is required'), false;
    if (!/\S+@\S+\.\S+/.test(form.email)) return toast.error('Invalid email'), false;
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters'), false;
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match'), false;
    return true;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role };
      if (form.farmName.trim()) { payload.farm_name = form.farmName; payload.location = form.location; }
      await register(payload);
      toast.success('Account created! Welcome to CropMind.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 flex items-center justify-center p-4 py-10">
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

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= step ? 'bg-green-400' : 'bg-white/20'}`} />
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-1">
            {step === 1 ? 'Create your account' : 'Set up your farm'}
          </h2>
          <p className="text-green-200 text-sm mb-8">
            {step === 1 ? 'Step 1 of 2 — Account details' : 'Step 2 of 2 — Farm information (optional)'}
          </p>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-5">
                {/* Name */}
                <Field label="Full Name" icon={<User style={{width:18,height:18}} />}>
                  <input type="text" value={form.name} onChange={set('name')} placeholder="John Kamau" autoComplete="name"
                    className="input-glass" />
                </Field>

                {/* Email */}
                <Field label="Email Address" icon={<Mail style={{width:18,height:18}} />}>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="you@farm.com" autoComplete="email"
                    className="input-glass" />
                </Field>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-green-200 mb-2">Your Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r, i) => (
                      <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        className={`text-left p-3 rounded-xl border transition-all ${i === ROLES.length - 1 && ROLES.length % 2 !== 0 ? 'col-span-2' : ''} ${form.role === r.value ? 'bg-green-500/30 border-green-400 text-white' : 'bg-white/5 border-white/20 text-green-200 hover:bg-white/10'}`}>
                        <p className="font-medium text-sm">{r.label}</p>
                        <p className="text-xs opacity-70 mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password */}
                <Field label="Password" icon={<Lock style={{width:18,height:18}} />} extra={
                  <button type="button" onClick={() => setShowPw(v => !v)} className="text-green-400 hover:text-white transition">
                    {showPw ? <EyeOff style={{width:18,height:18}} /> : <Eye style={{width:18,height:18}} />}
                  </button>
                }>
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min. 6 characters" autoComplete="new-password" className="input-glass" />
                </Field>

                {/* Confirm password */}
                <Field label="Confirm Password" icon={<Lock style={{width:18,height:18}} />} extra={
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-green-400 hover:text-white transition">
                    {showConfirm ? <EyeOff style={{width:18,height:18}} /> : <Eye style={{width:18,height:18}} />}
                  </button>
                }>
                  <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" autoComplete="new-password" className="input-glass" />
                </Field>

                <button type="button" onClick={handleNext}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/30 active:scale-[.98]">
                  Continue <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <p className="text-green-300 text-sm bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                  You can skip this step and add your farm later from Farm Management settings.
                </p>

                {/* Farm name */}
                <Field label="Farm Name (optional)" icon={<Leaf style={{width:18,height:18}} />}>
                  <input type="text" value={form.farmName} onChange={set('farmName')} placeholder="Green Valley Farm"
                    className="input-glass" />
                </Field>

                {/* Location */}
                <Field label="Location (optional)" icon={<MapPin style={{width:18,height:18}} />}>
                  <input type="text" value={form.location} onChange={set('location')} placeholder="Nakuru, Kenya"
                    className="input-glass" />
                </Field>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3.5 rounded-xl transition-all">
                    Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/30 active:scale-[.98]">
                    {loading ? <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                      : <UserCheck className="w-5 h-5" />}
                    {loading ? 'Creating…' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-green-300 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-green-400 hover:text-white font-semibold underline underline-offset-2 transition">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center mt-4">
          <Link to="/landing" className="text-green-500 hover:text-green-300 text-sm transition">
            ← Back to home
          </Link>
        </p>
      </div>

      <style>{`
        .input-glass {
          width: 100%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          color: white;
          outline: none;
          transition: all 0.2s;
        }
        .input-glass::placeholder { color: rgba(134,239,172,0.5); }
        .input-glass:focus { outline: none; ring: 2px; border-color: rgb(74,222,128); box-shadow: 0 0 0 2px rgba(74,222,128,0.3); }
      `}</style>
    </div>
  );
}

function Field({ label, icon, children, extra }) {
  return (
    <div>
      <label className="block text-sm font-medium text-green-200 mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-400">{icon}</span>
        {children}
        {extra && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{extra}</span>}
      </div>
    </div>
  );
}
