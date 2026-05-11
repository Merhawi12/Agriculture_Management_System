import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, CreditCard, Zap, Crown, Clock, ArrowUpRight, Shield } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || '/api';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    color: 'border-gray-200 bg-white',
    buttonClass: '',
    features: [
      'Crop Management',
      'Livestock Tracking',
      'Basic Weather Insights',
      'Inventory Management',
      'Community Support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 89000,
    color: 'border-primary-500 bg-primary-50',
    buttonClass: 'bg-primary-600 hover:bg-primary-700 text-white',
    badge: 'Most Popular',
    features: [
      'Access to All 14 Modules',
      'AI & ML Predictions',
      'SMS & Email Alerts',
      'Marketplace Access',
      'Supply Chain Management',
      'Equipment Tracking',
      'Financial & Accounting Tools',
      'Priority Support',
      'Dedicated Success Manager',
    ],
  },
];

function loadFlutterwaveScript() {
  return new Promise((resolve) => {
    if (window.FlutterwaveCheckout) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.flutterwave.com/v3.js';
    s.onload = resolve;
    document.body.appendChild(s);
  });
}

export default function Billing() {
  const { user, token } = useAuth();
  const [currentPlan] = useState(user?.plan || 'free');
  const [payments, setPayments]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${BASE}/payments/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setPayments(r.data || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [token]);

  const handleUpgrade = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${BASE}/payments/initiate`,
        { plan: 'pro', amount: 89000, currency: 'UGX' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data.public_key) {
        toast.error('Payment gateway not configured. Add FLUTTERWAVE_PUBLIC_KEY to the backend.');
        setLoading(false);
        return;
      }

      await loadFlutterwaveScript();

      window.FlutterwaveCheckout({
        public_key:      data.public_key,
        tx_ref:          data.tx_ref,
        amount:          89000,
        currency:        'UGX',
        payment_options: 'mobilemoney,card,ussd',
        customer: {
          email: user?.email || '',
          name:  user?.name  || '',
        },
        customizations: {
          title:       'CropMind Pro',
          description: 'Monthly subscription — CropMind Pro plan',
          logo:        '',
        },
        callback: async (response) => {
          if (response.status === 'successful') {
            try {
              const res = await axios.post(
                `${BASE}/payments/verify`,
                { tx_ref: data.tx_ref, transaction_id: response.transaction_id },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (res.data.verified) {
                toast.success('Payment successful! You are now on the Pro plan.');
                setPayments(prev => [res.data.payment, ...prev]);
              } else {
                toast.error('Payment verification failed. Contact support.');
              }
            } catch {
              toast.error('Could not verify payment. Contact support.');
            }
          } else {
            toast.error('Payment was not completed.');
          }
          setLoading(false);
        },
        onclose: () => setLoading(false),
      });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not initiate payment');
      setLoading(false);
    }
  }, [loading, token, user]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your plan and view payment history</p>
      </div>

      {/* Current plan banner */}
      <div className={`rounded-xl p-5 flex items-center gap-4 border
        ${currentPlan === 'pro'
          ? 'bg-primary-50 border-primary-200'
          : 'bg-gray-50 border-gray-200'}`}>
        {currentPlan === 'pro'
          ? <Crown size={28} className="text-primary-600 flex-shrink-0" />
          : <Clock  size={28} className="text-gray-400 flex-shrink-0" />}
        <div>
          <p className="font-semibold text-gray-800">
            You are on the{' '}
            <span className={currentPlan === 'pro' ? 'text-primary-600' : 'text-gray-600'}>
              {currentPlan === 'pro' ? 'Pro' : 'Free'} Plan
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {currentPlan === 'pro'
              ? 'Full access to all 14 modules and premium features'
              : 'Upgrade to unlock AI predictions, advanced analytics and all modules'}
          </p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {PLANS.map(plan => (
          <div key={plan.id}
            className={`relative border-2 rounded-xl p-6 transition-shadow
              ${plan.color}
              ${currentPlan === plan.id ? 'shadow-md' : 'hover:shadow-sm'}`}>

            {plan.badge && (
              <span className="absolute -top-3 left-5 bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                {plan.badge}
              </span>
            )}
            {currentPlan === plan.id && (
              <span className="absolute -top-3 right-5 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                Current
              </span>
            )}

            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <div className="mt-2 mb-5">
              {plan.price === 0 ? (
                <span className="text-3xl font-extrabold text-gray-700">Free</span>
              ) : (
                <>
                  <span className="text-3xl font-extrabold text-gray-900">
                    UGX {plan.price.toLocaleString()}
                  </span>
                  <span className="text-gray-500 text-sm">/month</span>
                </>
              )}
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {plan.id === 'pro' && currentPlan !== 'pro' && (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2
                  transition-colors disabled:opacity-50 ${plan.buttonClass}`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Upgrade to Pro
                    <ArrowUpRight size={14} />
                  </>
                )}
              </button>
            )}

            {currentPlan === plan.id && (
              <div className="w-full py-2.5 text-center text-sm text-gray-400 font-medium">
                ✓ Your current plan
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <Shield size={13} className="text-green-500" />
          Secure payment via Flutterwave
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard size={13} className="text-blue-400" />
          MTN Mobile Money · Airtel Money · Visa / Mastercard
        </div>
      </div>

      {/* Payment history */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Payment History</h2>

        {historyLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-400">
            <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No payments yet</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Date', 'Plan', 'Amount', 'Method', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium capitalize text-gray-800">{p.plan}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {p.currency} {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize">
                      {p.payment_method || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold
                        ${p.status === 'successful' ? 'bg-green-100 text-green-700'
                          : p.status === 'pending'    ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
