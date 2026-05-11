import { useEffect, useState } from 'react';
import {
  Brain, TrendingUp, Sprout, Beef, RefreshCw, AlertTriangle,
  CheckCircle, BarChart2, Cpu, Wifi, WifiOff, ChevronDown,
  ChevronUp, FlaskConical, DollarSign, Leaf, Target, Zap
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';
import { predictionsApi } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = n => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n || 0);
const fmtNum = n => new Intl.NumberFormat().format(Math.round(n || 0));

const riskBadge = { Low: 'badge-green', Medium: 'badge-yellow', High: 'badge-red' };
const riskGrad  = { Low: 'from-green-500', Medium: 'from-yellow-500', High: 'from-red-500' };

function ConfidenceBar({ pct, color = 'bg-primary-500' }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{pct}%</span>
    </div>
  );
}

function StatusBadge({ online }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
      online ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
    }`}>
      {online ? <Wifi size={11} /> : <WifiOff size={11} />}
      ML Service: {online ? 'Online' : 'Offline (simulation)'}
    </div>
  );
}

// ─── Model info card ──────────────────────────────────────────────────────────
function ModelBadge({ algorithm }) {
  const isTF = algorithm?.toLowerCase().includes('tensorflow') || algorithm?.toLowerCase().includes('neural');
  const isSK = algorithm?.toLowerCase().includes('forest') || algorithm?.toLowerCase().includes('regression') || algorithm?.toLowerCase().includes('logistic');
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className={`w-5 h-5 rounded flex items-center justify-center ${isTF ? 'bg-orange-100' : 'bg-blue-100'}`}>
        {isTF ? <Zap size={11} className="text-orange-600" /> : <Cpu size={11} className="text-blue-600" />}
      </div>
      <span className="text-gray-500 truncate max-w-xs">{algorithm || 'ML Model'}</span>
    </div>
  );
}

// ─── Crop Yield Card ──────────────────────────────────────────────────────────
function CropCard({ pred }) {
  const [expanded, setExpanded] = useState(false);
  const hasAmendments = pred.amendments?.length > 0;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              {pred.crop}
              {pred.field && <span className="text-gray-400 font-normal"> — {pred.field}</span>}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Harvest: {pred.harvest_date || 'TBD'}</p>
            <ModelBadge algorithm={pred.algorithm} />
          </div>
          <div className="text-right ml-4">
            <span className={`${riskBadge[pred.risk_level] || 'badge-gray'} text-xs`}>
              {pred.risk_level} Risk
            </span>
            <p className="text-xs text-gray-400 mt-1">Confidence</p>
            <p className="font-bold text-primary-600 text-lg">{pred.confidence_pct}%</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-3">
          <ConfidenceBar pct={pred.confidence_pct}
            color={pred.risk_level === 'High' ? 'bg-red-400' : pred.risk_level === 'Medium' ? 'bg-yellow-400' : 'bg-green-500'}
          />
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Yield/ha</p>
            <p className="font-bold text-gray-900">{fmtNum(pred.yield_per_ha_kg)} kg</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Total Yield</p>
            <p className="font-bold text-gray-900">{pred.yield_total_kg ? fmtNum(pred.yield_total_kg) + ' kg' : '—'}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xs text-green-600">Revenue</p>
            <p className="font-bold text-green-700">{pred.predicted_revenue_kes ? fmt(pred.predicted_revenue_kes) : '—'}</p>
          </div>
        </div>

        {/* RF vs NN comparison */}
        {pred.rf_yield_per_ha && pred.nn_yield_per_ha && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg p-2">
              <Cpu size={11} className="text-blue-500" />
              <span className="text-blue-700">Random Forest: {fmtNum(pred.rf_yield_per_ha)} kg/ha</span>
            </div>
            <div className="flex items-center gap-2 text-xs bg-orange-50 rounded-lg p-2">
              <Zap size={11} className="text-orange-500" />
              <span className="text-orange-700">Neural Net: {fmtNum(pred.nn_yield_per_ha)} kg/ha</span>
            </div>
          </div>
        )}
      </div>

      {/* Expandable recommendations */}
      {pred.recommendations?.length > 0 && (
        <>
          <button
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            <span>{pred.recommendations.length} recommendation{pred.recommendations.length > 1 ? 's' : ''}</span>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {expanded && (
            <div className="px-4 pb-4 space-y-2 bg-gray-50">
              {pred.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <CheckCircle size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                  {r}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Soil Health Grid ──────────────────────────────────────────────────────────
function SoilGrid({ soilPredictions }) {
  if (!soilPredictions?.length) return null;

  const scoreColor = s => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : s >= 40 ? 'text-orange-600' : 'text-red-600';
  const scoreBg    = s => s >= 80 ? 'bg-green-50 border-green-200' : s >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-orange-50 border-orange-200';

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <FlaskConical size={18} className="text-earth-600" />
        <h3 className="font-semibold text-gray-800">Soil Health Analysis — Random Forest</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {soilPredictions.map((s, i) => (
          <div key={i} className={`rounded-xl border p-4 ${scoreBg(s.health_score)}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-800 text-sm">{s.field}</p>
              <div className="text-right">
                <p className={`text-2xl font-bold ${scoreColor(s.health_score)}`}>{s.health_score}</p>
                <p className="text-xs text-gray-500">/100</p>
              </div>
            </div>
            <div className="mb-2">
              <ConfidenceBar pct={s.health_score} color={s.health_score >= 70 ? 'bg-green-500' : 'bg-yellow-400'} />
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block mb-2 ${
              s.status === 'Excellent' ? 'bg-green-200 text-green-800'
              : s.status === 'Good' ? 'bg-yellow-100 text-yellow-800'
              : 'bg-orange-100 text-orange-800'
            }`}>{s.status}</span>
            <p className="text-xs text-gray-600 flex items-start gap-1">
              <CheckCircle size={11} className="text-primary-500 mt-0.5 flex-shrink-0" />
              {s.recommendation}
            </p>
            {s.amendments?.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                {s.amendments.slice(0, 2).map((a, j) => (
                  <p key={j} className="text-xs text-gray-500">• {a.input} @ {a.rate_kg_ha} kg/ha</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Financial Forecast ────────────────────────────────────────────────────────
function FinancialForecast({ fc }) {
  if (!fc) return null;

  const bars = [
    { name: 'Revenue', value: fc.next_month_revenue, fill: '#22c55e' },
    { name: 'Expenses', value: fc.next_month_expenses, fill: '#ef4444' },
    { name: 'Profit', value: fc.net_profit, fill: '#3b82f6' },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-600" /> Financial Forecast
        </h3>
        <ModelBadge algorithm={fc.algorithm} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium">Next Month Revenue</p>
          <p className="text-xl font-bold text-green-800 mt-1">{fmt(fc.next_month_revenue)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs text-red-600 font-medium">Expenses</p>
          <p className="text-xl font-bold text-red-800 mt-1">{fmt(fc.next_month_expenses)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium">Net Profit</p>
          <p className="text-xl font-bold text-blue-800 mt-1">{fmt(fc.net_profit)}</p>
          {fc.profit_margin_pct && <p className="text-xs text-blue-500 mt-0.5">Margin: {fc.profit_margin_pct}%</p>}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={bars} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
          <Tooltip formatter={v => fmt(v)} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {bars.map((b, i) => <Cell key={i} fill={b.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp size={14} className={fc.revenue_trend === 'Increasing' ? 'text-green-500' : 'text-red-500'} />
          <span className={fc.revenue_trend === 'Increasing' ? 'text-green-600' : 'text-red-600'}>{fc.revenue_trend}</span>
        </div>
        <ConfidenceBar pct={fc.confidence_pct} color="bg-blue-500" />
      </div>

      {fc.risk_factors?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {fc.risk_factors.map(r => (
            <span key={r} className="badge-yellow text-xs flex items-center gap-1">
              <AlertTriangle size={9} />{r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Livestock predictions ────────────────────────────────────────────────────
function LivestockCard({ pred }) {
  const riskClass = riskBadge[pred.health_risk] || 'badge-gray';
  const probas = pred.risk_probabilities;

  return (
    <div className="p-4 border-b border-gray-50 last:border-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {pred.type}
            {pred.count > 1 && <span className="text-gray-400 font-normal"> ({pred.count} head)</span>}
          </p>
          {pred.breed && <p className="text-xs text-gray-500">{pred.breed}</p>}
          <ModelBadge algorithm={pred.algorithm} />
        </div>
        <div className="text-right">
          <span className={`${riskClass} text-xs`}>Health: {pred.health_risk}</span>
          <p className="text-xs text-gray-400 mt-1">Productivity</p>
          <div className="flex items-center gap-1">
            <BarChart2 size={12} className="text-primary-500" />
            <span className="text-sm font-bold text-primary-600">{pred.productivity_score}%</span>
          </div>
        </div>
      </div>

      {probas && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {Object.entries(probas).map(([label, pct]) => (
            <div key={label} className="text-center">
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`text-sm font-bold ${label === 'Low' ? 'text-green-600' : label === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>{pct}%</p>
            </div>
          ))}
        </div>
      )}

      {pred.recommendations?.length > 0 && (
        <div className="mt-2 space-y-1">
          {pred.recommendations.slice(0, 2).map((r, i) => (
            <p key={i} className="text-xs text-gray-500 flex items-start gap-1">
              <CheckCircle size={10} className="text-green-400 mt-0.5 flex-shrink-0" />{r}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Model info panel ─────────────────────────────────────────────────────────
function ModelInfoPanel({ models }) {
  if (!models) return null;
  const entries = Object.entries(models);
  const icons = { yield: Sprout, health: Beef, soil: FlaskConical, finance: DollarSign };

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Cpu size={18} className="text-blue-600" />
        <h3 className="font-semibold text-gray-800">Active ML Models</h3>
      </div>
      <div className="grid grid-cols-2 gap-px bg-gray-100">
        {entries.map(([key, algo]) => {
          const Icon = icons[key] || Brain;
          const isTF = algo?.toLowerCase().includes('neural') || algo?.toLowerCase().includes('tensorflow');
          return (
            <div key={key} className="bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={15} className="text-gray-500" />
                <span className="text-xs font-semibold text-gray-600 capitalize">{key}</span>
              </div>
              <p className="text-xs text-gray-500">{algo}</p>
              {isTF && (
                <span className="mt-1.5 inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  <Zap size={9} /> TensorFlow
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Predictions() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const d = await predictionsApi.get();
      setData(d);
    } catch { }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);
  const refresh = () => { setRefreshing(true); load(); };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!data) return <div className="card text-center text-gray-500 py-12">Failed to load predictions</div>;

  const { crop_predictions, livestock_predictions, soil_predictions, financial_forecast, models, ml_service, generated_at } = data;
  const isOnline = ml_service === 'online';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-primary-700 via-primary-800 to-indigo-900 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <Brain size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI-Powered Farm Predictions</h2>
              <p className="text-primary-200 text-sm mt-0.5">
                scikit-learn · TensorFlow/Keras · FastAPI ML Service
              </p>
              {generated_at && (
                <p className="text-primary-400 text-xs mt-1">
                  Last computed: {new Date(generated_at).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={refresh} disabled={refreshing} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
            <StatusBadge online={isOnline} />
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          [Sprout,      'Crops Predicted',  crop_predictions?.length || 0,       'bg-green-500'],
          [Beef,        'Livestock Groups',  livestock_predictions?.length || 0,  'bg-earth-600'],
          [FlaskConical,'Soil Analyses',    soil_predictions?.length || 0,       'bg-blue-600'],
          [Cpu,         'Models Active',    isOnline ? Object.keys(models||{}).length : 0, 'bg-purple-500'],
        ].map(([Icon, label, val, bg]) => (
          <div key={label} className="card flex items-center gap-3">
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Crop Yield Predictions */}
      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Sprout size={18} className="text-primary-600" /> Crop Yield Predictions
          </h3>
          <span className="text-xs text-gray-400">{isOnline ? 'Random Forest + Neural Net ensemble' : 'Simulated'}</span>
        </div>
        {crop_predictions?.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No active crops to predict</p>
        ) : (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {crop_predictions?.map((c, i) => <CropCard key={i} pred={c} />)}
          </div>
        )}
      </div>

      {/* Soil Health + Financial */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SoilGrid soilPredictions={soil_predictions} />
        </div>
        <div>
          <FinancialForecast fc={financial_forecast} />
        </div>
      </div>

      {/* Livestock + Model Info */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card !p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Beef size={18} className="text-earth-600" />
            <h3 className="font-semibold text-gray-800">Livestock Health — Logistic Regression</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {livestock_predictions?.length === 0 && <p className="text-center text-gray-400 py-8">No livestock data</p>}
            {livestock_predictions?.map((l, i) => <LivestockCard key={i} pred={l} />)}
          </div>
        </div>

        <ModelInfoPanel models={models} />
      </div>
    </div>
  );
}
