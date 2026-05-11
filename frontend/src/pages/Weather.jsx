import { useEffect, useState } from 'react';
import {
  Cloud, Droplets, Wind, Eye, Thermometer, RefreshCw,
  AlertTriangle, CheckCircle, Sun, Sunset, Gauge, Map,
  Navigation, Wifi
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { weatherApi } from '../services/api';
import GoogleMapView from '../components/GoogleMapView';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uvLevel = uv =>
  uv >= 11 ? ['Extreme', 'text-purple-700', 'bg-purple-100']
  : uv >= 8  ? ['Very High', 'text-red-600',    'bg-red-100']
  : uv >= 6  ? ['High',      'text-orange-600',  'bg-orange-100']
  : uv >= 3  ? ['Moderate',  'text-yellow-600',  'bg-yellow-100']
  :            ['Low',       'text-green-600',   'bg-green-100'];

const windDir = deg => {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8] || '—';
};

const dayLabel = (dateStr, i) => {
  if (i === 0) return 'Today';
  if (i === 1) return 'Tomorrow';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}{p.unit || ''}</strong></p>
      ))}
    </div>
  );
};

// ─── Alert banner ─────────────────────────────────────────────────────────────
function AlertBanner({ alerts }) {
  if (!alerts?.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${
          a.severity === 'danger'
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <AlertTriangle size={20} className={a.severity === 'danger' ? 'text-red-600' : 'text-yellow-600'} />
          <div>
            <p className={`font-semibold text-sm ${a.severity === 'danger' ? 'text-red-800' : 'text-yellow-800'}`}>{a.type}</p>
            <p className={`text-sm mt-0.5 ${a.severity === 'danger' ? 'text-red-700' : 'text-yellow-700'}`}>{a.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Current weather card ──────────────────────────────────────────────────────
function CurrentWeather({ current, location, source, onRefresh, refreshing }) {
  const [uvLabel, uvText, uvBg] = uvLevel(current.uv_index || 0);

  return (
    <div className="card bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Navigation size={14} className="text-blue-300" />
            <span className="text-blue-200 text-sm">{location}{current.country ? `, ${current.country}` : ''}</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-7xl leading-none">{current.icon}</span>
            <div>
              <p className="text-6xl font-bold leading-none">{current.temp_high}°<span className="text-3xl text-blue-300">C</span></p>
              <p className="text-blue-200 text-lg mt-1">{current.condition}</p>
              <p className="text-blue-300 text-sm mt-0.5">Feels like {current.feels_like}°C</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-blue-200">
            {current.sunrise && <span className="flex items-center gap-1">↑ {current.sunrise}</span>}
            {current.sunset  && <span className="flex items-center gap-1">↓ {current.sunset}</span>}
          </div>
        </div>

        <div className="text-right flex flex-col items-end gap-3">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${uvBg} ${uvText}`}>
            UV {current.uv_index} — {uvLabel}
          </div>
          {source && (
            <p className="text-xs text-blue-400 flex items-center gap-1">
              <Wifi size={10} />{source}
            </p>
          )}
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-white/20">
        {[
          [Droplets,   'Humidity',    `${current.humidity}%`],
          [Wind,       'Wind',        `${current.wind_speed} km/h ${current.wind_deg != null ? windDir(current.wind_deg) : ''}`],
          [Eye,        'Visibility',  `${current.visibility_km ?? '—'} km`],
          [Cloud,      'Rainfall',    `${current.rainfall_mm ?? 0} mm`],
          [Gauge,      'Pressure',    `${current.pressure_hpa ?? '—'} hPa`],
        ].map(([Icon, label, val]) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon size={16} />
            </div>
            <div>
              <p className="text-xs text-blue-300">{label}</p>
              <p className="font-semibold text-sm">{val}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hourly forecast ──────────────────────────────────────────────────────────
function HourlyForecast({ hourly }) {
  if (!hourly?.length) return null;
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Thermometer size={16} className="text-blue-500" /> Hourly Forecast (next 24h)
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {hourly.map((h, i) => (
          <div key={i} className="flex-shrink-0 text-center bg-gray-50 rounded-xl p-3 min-w-[72px]">
            <p className="text-xs text-gray-500 font-medium">{h.time}</p>
            <p className="text-2xl my-2">{h.icon}</p>
            <p className="text-sm font-bold text-gray-900">{h.temp}°</p>
            <p className="text-xs text-blue-500">{h.humidity}%</p>
            {h.rainfall_mm > 0 && <p className="text-xs text-blue-400 mt-0.5">💧{h.rainfall_mm}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 7-day forecast ────────────────────────────────────────────────────────────
function SevenDayForecast({ forecast }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-4">7-Day Forecast</h3>
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
        {forecast.map((day, i) => (
          <div key={day.date} className={`text-center p-3 rounded-xl border ${i === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
            <p className="text-xs text-gray-500 font-medium">{dayLabel(day.date, i)}</p>
            <p className="text-2xl my-2">{day.icon}</p>
            <p className="text-sm font-bold text-gray-900">{day.temp_high}°</p>
            <p className="text-xs text-gray-400">{day.temp_low}°</p>
            <div className="mt-1 flex items-center justify-center gap-1">
              <Droplets size={10} className="text-blue-400" />
              <span className="text-xs text-blue-500">{day.humidity}%</span>
            </div>
            {day.rainfall_mm > 0 && <p className="text-xs text-blue-400 mt-0.5">💧{day.rainfall_mm}mm</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Temperature chart ────────────────────────────────────────────────────────
function TempChart({ forecast }) {
  const data = forecast.slice(0, 7).map((d, i) => ({
    day: dayLabel(d.date, i).slice(0, 3),
    High: d.temp_high,
    Low:  d.temp_low,
    Rain: d.rainfall_mm,
    Humidity: d.humidity,
  }));

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-4">Temperature & Rainfall Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="°" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area type="monotone" dataKey="High" stroke="#f97316" fill="url(#highGrad)" strokeWidth={2} dot={{ r: 3 }} unit="°C" />
          <Area type="monotone" dataKey="Low"  stroke="#3b82f6" fill="url(#lowGrad)"  strokeWidth={2} dot={{ r: 3 }} unit="°C" />
        </AreaChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={100} className="mt-2">
        <BarChart data={data} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="mm" width={35} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Rain" fill="#60a5fa" radius={[3, 3, 0, 0]} unit="mm" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Farming advice ────────────────────────────────────────────────────────────
function FarmingAdvice({ advice }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <CheckCircle size={18} className="text-primary-600" /> Today's Farming Advice
      </h3>
      <div className="space-y-3">
        {advice.map((a, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
            <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">{i + 1}</span>
            </div>
            <p className="text-sm text-primary-800">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Farm location map ─────────────────────────────────────────────────────────
function WeatherMap({ lat, lon, location }) {
  if (!lat || !lon) return null;
  return (
    <div className="card !p-4">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Map size={16} className="text-primary-600" /> Farm Location
      </h3>
      <GoogleMapView
        center={{ lat, lng: lon }}
        zoom={12}
        mapTypeId="hybrid"
        markers={[{ lat, lng: lon, title: location, info: `Weather station: ${location}`, color: '#1d4ed8' }]}
        height="280px"
      />
      <p className="text-xs text-gray-400 mt-2 text-center">{lat.toFixed(4)}, {lon.toFixed(4)}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Weather() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMap,    setShowMap]    = useState(true);

  const load = async () => {
    try {
      const d = await weatherApi.get();
      setData(d);
    } catch { /* use stale */ }
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

  if (!data) return (
    <div className="card text-center text-gray-500 py-12">Failed to load weather data</div>
  );

  const { current, hourly, forecast, alerts, farming_advice, location, source, lat, lon } = data;

  return (
    <div className="space-y-6">
      <AlertBanner alerts={alerts} />
      <CurrentWeather current={current} location={location} source={source} onRefresh={refresh} refreshing={refreshing} />
      <HourlyForecast hourly={hourly} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SevenDayForecast forecast={forecast} />
        <TempChart forecast={forecast} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FarmingAdvice advice={farming_advice} />
        <WeatherMap lat={lat} lon={lon} location={location} />
      </div>
    </div>
  );
}
