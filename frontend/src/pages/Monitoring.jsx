import { useState } from 'react';
import { Satellite, MapPin, Activity, Thermometer, Droplets, ZapOff, Camera, RefreshCw } from 'lucide-react';

const fields = [
  { id:'A', name:'Field A', crop:'Wheat', area:25.5, ndvi:0.72, moisture:68, temp:24, status:'healthy', lat:0.5, lng:37.1 },
  { id:'B', name:'Field B', crop:'Corn', area:18.0, ndvi:0.45, moisture:42, temp:27, status:'attention', lat:0.51, lng:37.12 },
  { id:'C', name:'Field C', crop:'Soybeans', area:30.0, ndvi:0.65, moisture:58, temp:25, status:'healthy', lat:0.49, lng:37.09 },
  { id:'D', name:'Field D', crop:'Sunflowers', area:12.0, ndvi:0.38, moisture:35, temp:29, status:'critical', lat:0.52, lng:37.11 },
  { id:'E', name:'Field E', crop:'Rice', area:20.0, ndvi:0.78, moisture:85, temp:23, status:'healthy', lat:0.505, lng:37.105 },
  { id:'GH1', name:'Greenhouse 1', crop:'Tomatoes', area:2.5, ndvi:0.81, moisture:72, temp:26, status:'healthy', lat:0.498, lng:37.108 },
];

const ndviColor = v => v >= 0.7 ? 'text-green-600' : v >= 0.5 ? 'text-yellow-600' : 'text-red-600';
const ndviLabel = v => v >= 0.7 ? 'Excellent' : v >= 0.5 ? 'Moderate' : 'Poor';
const statusStyle = { healthy:'badge-green', attention:'badge-yellow', critical:'badge-red' };

const drones = [
  { id:'DRN-001', name:'Scout Drone Alpha', status:'active', battery:87, location:'Field A', last_flight:'2026-05-09 08:30', altitude:50 },
  { id:'DRN-002', name:'Scout Drone Beta', status:'charging', battery:23, location:'Base Station', last_flight:'2026-05-08 16:00', altitude:0 },
  { id:'SAT-001', name:'Sentinel-2 Pass', status:'scheduled', battery:null, location:'Orbital', last_flight:'2026-05-09 06:15', altitude:786000 },
];

export default function Monitoring() {
  const [selected, setSelected] = useState(fields[0]);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => { setRefreshing(true); setTimeout(()=>setRefreshing(false),1200); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center"><Satellite size={28}/></div>
            <div>
              <h2 className="text-xl font-bold">Satellite & Drone Monitoring</h2>
              <p className="text-slate-300 text-sm">Real-time NDVI, soil moisture, and thermal imaging analysis</p>
            </div>
          </div>
          <button onClick={refresh} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm">
            <RefreshCw size={14} className={refreshing?'animate-spin':''}/> Refresh Data
          </button>
        </div>
      </div>

      {/* Field Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Field list */}
        <div className="card p-0">
          <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800 flex items-center gap-2"><MapPin size={16}/>Field Overview</h3></div>
          <div className="divide-y divide-gray-50">
            {fields.map(f=>(
              <button key={f.id} onClick={()=>setSelected(f)} className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selected.id===f.id?'bg-primary-50 border-l-2 border-primary-500':''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{f.name}</p>
                    <p className="text-xs text-gray-500">{f.crop} · {f.area} ha</p>
                  </div>
                  <span className={statusStyle[f.status]}>{f.status}</span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`text-xs font-medium ${ndviColor(f.ndvi)}`}>NDVI: {f.ndvi}</span>
                  <span className="text-xs text-blue-600">💧{f.moisture}%</span>
                  <span className="text-xs text-orange-600">🌡{f.temp}°C</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Field detail */}
        <div className="xl:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selected.name} — {selected.crop}</h3>
                <p className="text-sm text-gray-500">{selected.area} hectares · GPS: {selected.lat.toFixed(3)}°N, {selected.lng.toFixed(3)}°E</p>
              </div>
              <span className={statusStyle[selected.status]+' text-sm px-3 py-1'}>{selected.status}</span>
            </div>

            {/* Pseudo satellite image */}
            <div className="w-full h-48 rounded-xl overflow-hidden relative bg-gradient-to-br from-green-800 via-green-600 to-green-400 flex items-center justify-center">
              <div className="absolute inset-0 opacity-30" style={{backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(0,0,0,.1) 20px,rgba(0,0,0,.1) 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(0,0,0,.1) 20px,rgba(0,0,0,.1) 21px)'}}/>
              <div className="text-white text-center z-10">
                <Satellite size={32} className="mx-auto mb-2 opacity-80"/>
                <p className="text-sm font-medium opacity-80">Live Satellite Feed</p>
                <p className="text-xs opacity-60">NDVI Overlay Active</p>
              </div>
              <div className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-1 rounded">
                Sentinel-2 · 10m resolution
              </div>
              <div className={`absolute bottom-2 left-2 text-xs px-2 py-1 rounded font-bold ${selected.ndvi>=0.7?'bg-green-500':selected.ndvi>=0.5?'bg-yellow-500':'bg-red-500'} text-white`}>
                NDVI {selected.ndvi}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {[
                [Activity,'NDVI Score',selected.ndvi,ndviLabel(selected.ndvi),ndviColor(selected.ndvi)],
                [Droplets,'Soil Moisture',`${selected.moisture}%`,selected.moisture>60?'Optimal':selected.moisture>40?'Low':'Critical',selected.moisture>60?'text-blue-600':selected.moisture>40?'text-yellow-600':'text-red-600'],
                [Thermometer,'Canopy Temp',`${selected.temp}°C`,selected.temp<28?'Normal':'High',selected.temp<28?'text-green-600':'text-red-600'],
                [Camera,'Image Quality','High','Last scan: Today','text-primary-600'],
              ].map(([Icon,label,val,sub,col])=>(
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1"><Icon size={14} className="text-gray-400"/><p className="text-xs text-gray-500">{label}</p></div>
                  <p className={`text-xl font-bold ${col}`}>{val}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Drone Status */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><ZapOff size={16}/>Drone & Satellite Fleet</h3>
            <div className="space-y-3">
              {drones.map(d=>(
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${d.status==='active'?'bg-green-500 animate-pulse':d.status==='charging'?'bg-yellow-500':'bg-blue-500'}`}/>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.name}</p>
                      <p className="text-xs text-gray-500">{d.location} · Last: {d.last_flight}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={d.status==='active'?'badge-green':d.status==='charging'?'badge-yellow':'badge-blue'}>{d.status}</span>
                    {d.battery && <p className="text-xs text-gray-400 mt-1">🔋{d.battery}%</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
