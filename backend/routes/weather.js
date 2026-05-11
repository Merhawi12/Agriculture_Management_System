const express = require('express');
const axios   = require('axios');
const router  = express.Router();
const db      = require('../db');

const OW_KEY  = process.env.OPENWEATHER_API_KEY;
const OW_BASE = 'https://api.openweathermap.org/data/2.5';

// 10-minute cache per location
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getCache(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}
function setCache(key, data) { cache.set(key, { data, ts: Date.now() }); }

function owIcon(code) {
  const map = {
    '01':'☀️','02':'⛅','03':'☁️','04':'☁️',
    '09':'🌦️','10':'🌧️','11':'⛈️','13':'❄️','50':'🌫️',
  };
  return map[code?.slice(0, 2)] || '🌤️';
}

function owCondition(desc) {
  return desc ? desc.charAt(0).toUpperCase() + desc.slice(1) : 'Unknown';
}

function getFarmingAdvice(weather) {
  const advice = [];
  const { rainfall_mm, temp_high, humidity, wind_speed, uv_index } = weather;
  if (rainfall_mm > 15)  advice.push('Avoid spraying pesticides — rain will wash them away');
  if (temp_high > 32)    advice.push('Water crops early morning or evening to reduce evaporation');
  if (humidity > 80)     advice.push('Monitor for fungal diseases — high humidity conditions');
  if (wind_speed > 20)   advice.push('Delay aerial spraying operations due to high winds');
  if (uv_index > 8)      advice.push('Ensure livestock have adequate shade and fresh water');
  if (rainfall_mm === 0 && temp_high > 28) advice.push('Consider irrigation — hot and dry conditions forecast');
  if (advice.length === 0) advice.push('Conditions are favorable for regular farm operations');
  return advice;
}

async function fetchLive(lat, lon) {
  const cacheKey = `${lat},${lon}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const [curRes, fcastRes, uvRes] = await Promise.all([
    axios.get(`${OW_BASE}/weather?lat=${lat}&lon=${lon}&appid=${OW_KEY}&units=metric`),
    axios.get(`${OW_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${OW_KEY}&units=metric&cnt=40`),
    axios.get(`${OW_BASE}/uvi?lat=${lat}&lon=${lon}&appid=${OW_KEY}`).catch(() => ({ data: { value: 5 } })),
  ]);

  const cur  = curRes.data;
  const list = fcastRes.data.list;

  const hourly = list.slice(0, 8).map(h => ({
    time: new Date(h.dt * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    temp: Math.round(h.main.temp),
    feels_like: Math.round(h.main.feels_like),
    humidity: h.main.humidity,
    wind_speed: Math.round(h.wind.speed * 3.6),
    rainfall_mm: Math.round((h.rain?.['3h'] || 0) * 10) / 10,
    icon: owIcon(h.weather[0]?.icon),
    condition: owCondition(h.weather[0]?.description),
  }));

  const byDay = {};
  list.forEach(h => {
    const d = new Date(h.dt * 1000).toISOString().split('T')[0];
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(h);
  });

  const forecast = Object.entries(byDay).slice(0, 7).map(([date, slots]) => {
    const temps = slots.map(s => s.main.temp);
    const rain  = slots.reduce((s, h) => s + (h.rain?.['3h'] || 0), 0);
    const rep   = slots[Math.floor(slots.length / 2)];
    return {
      date,
      condition: owCondition(rep.weather[0]?.description),
      icon: owIcon(rep.weather[0]?.icon),
      temp_high: Math.round(Math.max(...temps)),
      temp_low:  Math.round(Math.min(...temps)),
      humidity:  Math.round(rep.main.humidity),
      wind_speed: Math.round(rep.wind.speed * 3.6),
      rainfall_mm: Math.round(rain * 10) / 10,
      uv_index: Math.round(uvRes.data.value || 5),
      pressure_hpa: Math.round(rep.main.pressure),
    };
  });

  const currentDay = forecast[0] || {};
  const current = {
    ...currentDay,
    temp_high: Math.round(cur.main.temp),
    feels_like: Math.round(cur.main.feels_like),
    humidity: cur.main.humidity,
    wind_speed: Math.round(cur.wind.speed * 3.6),
    wind_deg: cur.wind.deg,
    pressure_hpa: cur.main.pressure,
    visibility_km: Math.round((cur.visibility || 10000) / 1000),
    rainfall_mm: Math.round((cur.rain?.['1h'] || 0) * 10) / 10,
    icon: owIcon(cur.weather[0]?.icon),
    condition: owCondition(cur.weather[0]?.description),
    uv_index: Math.round(uvRes.data.value || 5),
    sunrise: new Date(cur.sys.sunrise * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    sunset:  new Date(cur.sys.sunset  * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };

  const alerts = [];
  if (currentDay.rainfall_mm > 20) alerts.push({ type: 'Heavy Rain Warning', message: 'Heavy rain expected. Consider delaying field operations.', severity: 'warning' });
  if (current.wind_speed > 40)     alerts.push({ type: 'High Wind Warning',   message: 'Strong winds. Secure farm structures and delay spraying.', severity: 'danger' });
  if (current.temp_high > 36)      alerts.push({ type: 'Heat Advisory',        message: 'Extreme heat. Ensure livestock water supply. Irrigate early.', severity: 'warning' });

  const data = {
    source: 'OpenWeatherMap',
    location: cur.name || 'Farm Location',
    country:  cur.sys?.country,
    lat, lon,
    current,
    hourly,
    forecast,
    alerts,
    farming_advice: getFarmingAdvice(current),
  };

  setCache(cacheKey, data);
  return data;
}

function buildMock(lat, lon, locationName) {
  const now = new Date();
  const seed = Math.abs(lat * 1000) % 100;
  const conditions = ['Sunny','Partly Cloudy','Cloudy','Light Rain','Heavy Rain','Thunderstorm','Windy','Foggy'];
  const icons       = ['☀️',  '⛅',         '☁️',    '🌦️',        '🌧️',        '⛈️',         '💨',   '🌫️'];

  const forecast = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const ci = (Math.floor(seed + i * 3.7)) % conditions.length;
    const rain = ci >= 3 && ci <= 5 ? Math.round((seed % 25) + i * 2) : 0;
    return {
      date: d.toISOString().split('T')[0],
      condition: conditions[ci], icon: icons[ci],
      temp_high: Math.round(22 + (seed % 12) + i),
      temp_low:  Math.round(12 + (seed % 8)),
      humidity:  Math.round(55 + (seed % 30)),
      wind_speed: Math.round(8 + (seed % 22)),
      rainfall_mm: rain,
      uv_index: Math.round(3 + (seed % 8)),
      pressure_hpa: Math.round(1008 + (seed % 15)),
    };
  });

  const hourly = Array.from({ length: 8 }, (_, i) => {
    const h = new Date(now);
    h.setHours(h.getHours() + i * 3);
    const ci = (Math.floor(seed + i)) % conditions.length;
    return {
      time: h.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(forecast[0].temp_high - 3 + i),
      humidity: Math.round(55 + (i % 20)),
      wind_speed: forecast[0].wind_speed,
      rainfall_mm: ci >= 3 ? Math.round(seed % 5) : 0,
      icon: icons[ci], condition: conditions[ci],
    };
  });

  const current = {
    ...forecast[0],
    temp_high: forecast[0].temp_high,
    feels_like: forecast[0].temp_high - 2,
    visibility_km: Math.round(8 + (seed % 12)),
    sunrise: '06:15', sunset: '18:45',
    wind_deg: 180,
  };

  return {
    source: 'Simulated (set OPENWEATHER_API_KEY for live data)',
    location: locationName,
    lat, lon,
    current,
    hourly,
    forecast,
    alerts: current.rainfall_mm > 20 ? [{ type: 'Heavy Rain Warning', message: 'Heavy rain expected.', severity: 'warning' }] : [],
    farming_advice: getFarmingAdvice(current),
  };
}

router.get('/', async (req, res) => {
  try {
    const farms = (await db.all('farms')).filter(f => f.status === 'active' && f.gps_lat);
    const farm  = farms[0];
    const lat   = parseFloat(req.query.lat || farm?.gps_lat  || -0.3031);
    const lon   = parseFloat(req.query.lon || farm?.gps_lng  || 36.0800);
    const name  = req.query.name || farm?.name || 'Farm Location';

    if (OW_KEY && OW_KEY !== 'your_openweather_api_key_here') {
      try {
        return res.json(await fetchLive(lat, lon));
      } catch (err) {
        console.warn('OpenWeather API error, falling back to mock:', err.message);
      }
    }

    res.json(buildMock(lat, lon, name));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
