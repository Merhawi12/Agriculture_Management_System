import { useEffect, useState, useCallback } from 'react';
import {
  MapPin, Plus, Pencil, Trash2, X, Search, Layers,
  Leaf, Droplets, FlaskConical, Sun, TreePine, Ruler,
  Phone, Mail, User, Calendar, ChevronRight, Map,
  Navigation, Globe, BarChart3, CheckCircle, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { farmsApi } from '../services/api';
import GoogleMapView from '../components/GoogleMapView';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FARM_TYPES = ['Mixed', 'Arable', 'Horticulture', 'Livestock', 'Dairy', 'Poultry', 'Aquaculture', 'Organic'];
const STATUS_OPTS = ['active', 'inactive', 'fallow'];

const SOIL_TYPES  = ['Clay Loam', 'Sandy Loam', 'Loam', 'Clay', 'Sandy Clay', 'Silt Loam', 'Potting mix'];
const NUTRIENT_LEVELS = ['low', 'medium', 'high'];
const IRRIGATION_TYPES = ['drip', 'center pivot', 'furrow', 'flood', 'sprinkler', 'none'];

const phColor = ph => {
  if (ph < 5.5) return 'text-red-600 bg-red-50';
  if (ph < 6.0) return 'text-orange-600 bg-orange-50';
  if (ph < 7.0) return 'text-green-600 bg-green-50';
  if (ph < 7.5) return 'text-blue-600 bg-blue-50';
  return 'text-purple-600 bg-purple-50';
};

const nutrientColor = { low:'text-red-600 bg-red-50', medium:'text-yellow-600 bg-yellow-50', high:'text-green-600 bg-green-50' };

const FIELD_COLORS = [
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-emerald-100 border-emerald-300 text-emerald-800',
];

// ─── GPS Boundary Map ─────────────────────────────────────────────────────────
function GpsBoundaryMap({ farm }) {
  const boundary = farm.boundary || [];

  // Calculate min/max for normalisation to the canvas
  if (!boundary.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-300 flex-col gap-2">
        <Navigation size={32} />
        <p className="text-sm">No GPS boundary set</p>
      </div>
    );
  }

  const lats = boundary.map(p => p.lat);
  const lngs = boundary.map(p => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  const W = 400, H = 260;
  const pad = 30;
  const toX = lng => pad + ((lng - minLng) / (maxLng - minLng || 1)) * (W - pad * 2);
  const toY = lat => pad + (1 - (lat - minLat) / (maxLat - minLat || 1)) * (H - pad * 2);

  const points = boundary.map(p => `${toX(p.lng)},${toY(p.lat)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ maxHeight: 260 }}>
      {/* Grid lines */}
      {[0.25,0.5,0.75].map(t => (
        <g key={t}>
          <line x1={pad} y1={pad + t*(H-pad*2)} x2={W-pad} y2={pad + t*(H-pad*2)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
          <line x1={pad + t*(W-pad*2)} y1={pad} x2={pad + t*(W-pad*2)} y2={H-pad} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
        </g>
      ))}
      {/* Farm polygon */}
      <polygon points={points} fill="#bbf7d0" fillOpacity="0.6" stroke="#16a34a" strokeWidth="2" strokeLinejoin="round" />
      {/* Vertices */}
      {boundary.map((p, i) => (
        <g key={i}>
          <circle cx={toX(p.lng)} cy={toY(p.lat)} r="5" fill="#16a34a" />
          <text x={toX(p.lng)+7} y={toY(p.lat)+4} fontSize="9" fill="#374151">
            {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
          </text>
        </g>
      ))}
      {/* Center label */}
      <text
        x={boundary.reduce((s,p) => s + toX(p.lng), 0) / boundary.length}
        y={boundary.reduce((s,p) => s + toY(p.lat), 0) / boundary.length}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="13" fontWeight="600" fill="#166534"
      >
        {farm.name}
      </text>
      {/* Compass */}
      <text x={W-pad+4} y={pad} fontSize="11" fill="#9ca3af">N↑</text>
    </svg>
  );
}

// ─── Farm Map (fields layout) ─────────────────────────────────────────────────
function FieldMap({ fields }) {
  if (!fields || fields.length === 0) return (
    <div className="flex items-center justify-center h-48 text-gray-300 flex-col gap-2">
      <Layers size={28} />
      <p className="text-sm">No fields defined</p>
    </div>
  );

  const total = fields.reduce((s, f) => s + (f.area_ha || 0), 0);
  const cols = Math.ceil(Math.sqrt(fields.length));

  return (
    <div className="p-4">
      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {fields.map((field, i) => {
          const pct = total ? ((field.area_ha / total) * 100).toFixed(1) : 0;
          const cls = FIELD_COLORS[i % FIELD_COLORS.length];
          return (
            <div key={i} className={`border-2 rounded-xl p-3 ${cls}`} style={{ minHeight: 80 }}>
              <p className="font-bold text-xs truncate">{field.name}</p>
              <p className="text-xs mt-1 opacity-80">{field.area_ha} ha</p>
              {field.crop && <p className="text-xs opacity-70 truncate">{field.crop}</p>}
              <p className="text-xs opacity-60 mt-1">{pct}%</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {fields.map((f, i) => (
          <div key={i} className="flex items-center gap-1 text-xs text-gray-600">
            <span className={`w-3 h-3 rounded ${FIELD_COLORS[i % FIELD_COLORS.length].split(' ')[0]}`} />
            {f.name} ({f.irrigation || 'N/A'})
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Soil Panel ───────────────────────────────────────────────────────────────
function SoilPanel({ soil }) {
  if (!soil) return <p className="text-gray-400 text-sm p-4">No soil data recorded</p>;
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-400 mb-1">Soil Type</p>
          <p className="font-bold text-gray-800 text-sm">{soil.type || '—'}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-400 mb-1">pH Level</p>
          <span className={`font-bold text-sm px-2 py-0.5 rounded-lg ${phColor(soil.ph)}`}>{soil.ph ?? '—'}</span>
          <p className="text-xs text-gray-400 mt-1">{soil.ph < 6 ? 'Acidic' : soil.ph > 7 ? 'Alkaline' : 'Neutral'}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-400 mb-1">Organic Matter</p>
          <p className="font-bold text-gray-800 text-sm">{soil.organic_matter ?? '—'}%</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-400 mb-1">Last Tested</p>
          <p className="font-bold text-gray-800 text-sm">{soil.last_tested || '—'}</p>
          <p className="text-xs text-gray-400">{soil.lab || ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[['Nitrogen (N)', soil.nitrogen], ['Phosphorus (P)', soil.phosphorus], ['Potassium (K)', soil.potassium]].map(([label, val]) => (
          <div key={label} className="p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${nutrientColor[val] || 'bg-gray-100 text-gray-500'}`}>
              {val || '—'}
            </span>
          </div>
        ))}
      </div>

      {/* pH visual bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Acidic (4)</span><span>Neutral (7)</span><span>Alkaline (9)</span></div>
        <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-red-400 via-yellow-300 via-green-400 to-blue-500">
          {soil.ph && (
            <div
              className="absolute top-0 w-3 h-4 bg-white border-2 border-gray-800 rounded-full -translate-x-1/2"
              style={{ left: `${((soil.ph - 4) / 5) * 100}%` }}
            />
          )}
        </div>
        <p className="text-center text-xs mt-1 text-gray-600">Current pH: <strong>{soil.ph}</strong></p>
      </div>
    </div>
  );
}

// ─── Farm Modal ───────────────────────────────────────────────────────────────
const EMPTY_FARM = {
  name:'', owner:'', location:'', total_area_ha:'', farm_type:'Mixed', status:'active',
  established:'', phone:'', email:'', description:'',
  gps_lat:'', gps_lng:'',
  soil: { type:'Clay Loam', ph:6.5, organic_matter:3.5, nitrogen:'medium', phosphorus:'medium', potassium:'medium', last_tested:'', lab:'' },
  fields: [],
  boundary: [],
};

function FarmModal({ modal, onClose, onSave }) {
  const isNew = modal === 'add';
  const [form, setForm] = useState(() => isNew ? EMPTY_FARM : {
    ...modal,
    soil: modal.soil || EMPTY_FARM.soil,
    fields: modal.fields || [],
    boundary: modal.boundary || [],
  });
  const [tab, setTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [newField, setNewField] = useState({ name:'', area_ha:'', crop:'', soil_type:'Clay Loam', irrigation:'drip' });

  const f  = (k, v)    => setForm(p => ({ ...p, [k]: v }));
  const fs = (k, v)    => setForm(p => ({ ...p, soil: { ...p.soil, [k]: v } }));
  const addField = () => {
    if (!newField.name) return;
    setForm(p => ({ ...p, fields: [...p.fields, { ...newField, area_ha: parseFloat(newField.area_ha) || 0 }] }));
    setNewField({ name:'', area_ha:'', crop:'', soil_type:'Clay Loam', irrigation:'drip' });
  };
  const removeField = i => setForm(p => ({ ...p, fields: p.fields.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!form.name || !form.owner || !form.location) return toast.error('Name, owner and location are required');
    setSaving(true);
    try { await onSave({ ...form, total_area_ha: parseFloat(form.total_area_ha) || 0, gps_lat: parseFloat(form.gps_lat) || 0, gps_lng: parseFloat(form.gps_lng) || 0 }); }
    catch (e) { toast.error(String(e)); }
    setSaving(false);
  };

  const MODAL_TABS = [['basic','Basic Info'], ['soil','Soil Data'], ['fields','Fields']];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <h2 className="font-semibold text-gray-800">{isNew ? 'Register New Farm' : `Edit — ${modal.name}`}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {/* Modal tabs */}
        <div className="flex border-b px-5 flex-shrink-0">
          {MODAL_TABS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'basic' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Farm Name *</label><input className="input" value={form.name} onChange={e => f('name', e.target.value)} /></div>
              <div><label className="label">Owner / Operator *</label><input className="input" value={form.owner} onChange={e => f('owner', e.target.value)} /></div>
              <div><label className="label">Location *</label><input className="input" value={form.location} onChange={e => f('location', e.target.value)} placeholder="County, Country" /></div>
              <div><label className="label">Total Area (ha)</label><input type="number" className="input" value={form.total_area_ha} onChange={e => f('total_area_ha', e.target.value)} /></div>
              <div><label className="label">Farm Type</label>
                <select className="input" value={form.farm_type} onChange={e => f('farm_type', e.target.value)}>
                  {FARM_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => f('status', e.target.value)}>
                  {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="label">Established</label><input type="date" className="input" value={form.established || ''} onChange={e => f('established', e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={e => f('phone', e.target.value)} /></div>
              <div><label className="label">Email</label><input type="email" className="input" value={form.email || ''} onChange={e => f('email', e.target.value)} /></div>
              <div className="col-span-2"><label className="label">Description</label><textarea className="input" rows={2} value={form.description || ''} onChange={e => f('description', e.target.value)} /></div>
              <div className="col-span-2 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><Navigation size={12} />GPS Center Point</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label text-xs">Latitude</label><input type="number" step="0.0001" className="input" value={form.gps_lat} onChange={e => f('gps_lat', e.target.value)} placeholder="-0.3031" /></div>
                  <div><label className="label text-xs">Longitude</label><input type="number" step="0.0001" className="input" value={form.gps_lng} onChange={e => f('gps_lng', e.target.value)} placeholder="36.0800" /></div>
                </div>
              </div>
            </div>
          )}

          {tab === 'soil' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Soil Type</label>
                  <select className="input" value={form.soil?.type || ''} onChange={e => fs('type', e.target.value)}>
                    {SOIL_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">pH Level (4.0 – 9.0)</label><input type="number" step="0.1" min="4" max="9" className="input" value={form.soil?.ph || ''} onChange={e => fs('ph', parseFloat(e.target.value))} /></div>
                <div><label className="label">Organic Matter (%)</label><input type="number" step="0.1" className="input" value={form.soil?.organic_matter || ''} onChange={e => fs('organic_matter', parseFloat(e.target.value))} /></div>
                <div><label className="label">Last Tested</label><input type="date" className="input" value={form.soil?.last_tested || ''} onChange={e => fs('last_tested', e.target.value)} /></div>
                {['nitrogen','phosphorus','potassium'].map(n => (
                  <div key={n}><label className="label capitalize">{n} (N/P/K)</label>
                    <select className="input" value={form.soil?.[n] || ''} onChange={e => fs(n, e.target.value)}>
                      {NUTRIENT_LEVELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                ))}
                <div><label className="label">Testing Lab</label><input className="input" value={form.soil?.lab || ''} onChange={e => fs('lab', e.target.value)} /></div>
              </div>

              {/* pH preview */}
              {form.soil?.ph && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Acidic (4)</span><span>Neutral (7)</span><span>Alkaline (9)</span></div>
                  <div className="relative h-5 rounded-full overflow-hidden bg-gradient-to-r from-red-400 via-yellow-300 via-green-400 to-blue-500">
                    <div className="absolute top-0.5 w-4 h-4 bg-white border-2 border-gray-800 rounded-full -translate-x-1/2"
                      style={{ left: `${Math.min(100, Math.max(0, ((form.soil.ph - 4) / 5) * 100))}%` }} />
                  </div>
                  <p className="text-center text-xs mt-2 text-gray-600">pH <strong>{form.soil.ph}</strong> — {form.soil.ph < 6 ? '⚠ Acidic — may need liming' : form.soil.ph > 7.5 ? '⚠ Alkaline — may need acidifier' : '✓ Good range for most crops'}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'fields' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">{form.fields.length} field{form.fields.length !== 1 ? 's' : ''} · {form.fields.reduce((s,f) => s+(f.area_ha||0),0).toFixed(1)} ha total</p>

              {/* Existing fields */}
              {form.fields.map((field, i) => (
                <div key={i} className={`p-3 rounded-xl border-2 flex items-center justify-between ${FIELD_COLORS[i % FIELD_COLORS.length]}`}>
                  <div>
                    <p className="font-semibold text-sm">{field.name}</p>
                    <p className="text-xs opacity-80">{field.area_ha} ha · {field.crop || 'No crop'} · {field.irrigation}</p>
                  </div>
                  <button onClick={() => removeField(i)} className="p-1 hover:opacity-70"><X size={14} /></button>
                </div>
              ))}

              {/* Add field */}
              <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 space-y-3">
                <p className="text-sm font-semibold text-gray-600">Add Field / Block</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label text-xs">Field Name</label><input className="input" value={newField.name} onChange={e => setNewField(p => ({...p, name:e.target.value}))} placeholder="Field A" /></div>
                  <div><label className="label text-xs">Area (ha)</label><input type="number" className="input" value={newField.area_ha} onChange={e => setNewField(p => ({...p, area_ha:e.target.value}))} placeholder="25" /></div>
                  <div><label className="label text-xs">Current Crop</label><input className="input" value={newField.crop} onChange={e => setNewField(p => ({...p, crop:e.target.value}))} placeholder="Wheat" /></div>
                  <div><label className="label text-xs">Irrigation</label>
                    <select className="input" value={newField.irrigation} onChange={e => setNewField(p => ({...p, irrigation:e.target.value}))}>
                      {IRRIGATION_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={addField}>
                  <Plus size={15} /> Add Field
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t flex-shrink-0">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : isNew ? 'Register Farm' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Farm Card ────────────────────────────────────────────────────────────────
function FarmCard({ farm, onEdit, onDelete, onSelect, selected }) {
  const isSelected = selected?.id === farm.id;
  return (
    <div
      className={`card cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary-500 border-primary-200' : ''}`}
      onClick={() => onSelect(farm)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <TreePine size={22} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{farm.name}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={11} />{farm.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={e => { e.stopPropagation(); onEdit(farm); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100">
            <Pencil size={14} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(farm.id); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        {[
          [Ruler,       `${farm.total_area_ha} ha`],
          [Layers,      farm.farm_type],
          [User,        farm.owner],
          [Calendar,    farm.established ? `Est. ${farm.established.slice(0,4)}` : '—'],
        ].map(([Icon, val]) => (
          <div key={val} className="flex items-center gap-1.5 text-gray-600">
            <Icon size={11} className="text-gray-400 flex-shrink-0" />{val}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          farm.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>{farm.status}</span>
        <span className="text-xs text-gray-400">{(farm.fields || []).length} fields</span>
      </div>

      {farm.gps_lat && (
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <Navigation size={10} />{farm.gps_lat?.toFixed(4)}, {farm.gps_lng?.toFixed(4)}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FarmManagement() {
  const [farms, setFarms]     = useState([]);
  const [stats, setStats]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailTab, setDetailTab] = useState('map');
  const [modal, setModal]     = useState(null);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [f, s] = await Promise.all([farmsApi.getAll(), farmsApi.getStats()]);
      setFarms(f); setStats(s);
      if (!selected && f.length) setSelected(f[0]);
    } catch { toast.error('Failed to load farms'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveFarm = async (form) => {
    if (modal === 'add') { await farmsApi.create(form); toast.success('Farm registered'); }
    else { await farmsApi.update(modal.id, form); toast.success('Farm updated'); }
    await load(); setModal(null);
  };

  const deleteFarm = async (id) => {
    if (!confirm('Delete this farm?')) return;
    await farmsApi.delete(id);
    setSelected(null); toast.success('Farm deleted'); load();
  };

  const filtered = farms.filter(f =>
    !search || f.name?.toLowerCase().includes(search.toLowerCase()) || f.location?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );

  const DETAIL_TABS = [['map','GPS Map'], ['layout','Field Layout'], ['soil','Soil Info']];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          [TreePine,  'Total Farms',    stats?.total || 0,                  'bg-green-600'],
          [CheckCircle,'Active',        stats?.active || 0,                 'bg-primary-600'],
          [Ruler,     'Total Area',     `${stats?.total_area_ha || 0} ha`,  'bg-blue-600'],
          [Layers,    'Farm Types',     Object.keys(stats?.types || {}).length, 'bg-purple-500'],
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Farm List */}
        <div className="xl:col-span-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-9 !py-2 text-sm w-full" placeholder="Search farms..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-primary flex items-center gap-1.5 whitespace-nowrap text-sm" onClick={() => setModal('add')}>
              <Plus size={15} /> Add Farm
            </button>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && <p className="text-center text-gray-400 py-8">No farms found</p>}
            {filtered.map(farm => (
              <FarmCard
                key={farm.id}
                farm={farm}
                selected={selected}
                onSelect={f => { setSelected(f); setDetailTab('map'); }}
                onEdit={f => setModal(f)}
                onDelete={deleteFarm}
              />
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="xl:col-span-2">
          {!selected ? (
            <div className="card flex items-center justify-center h-64 text-gray-300 flex-col gap-3">
              <Map size={48} />
              <p>Select a farm to view details</p>
            </div>
          ) : (
            <div className="card !p-0 overflow-hidden">
              {/* Farm header */}
              <div className="p-5 bg-gradient-to-r from-primary-700 to-primary-600 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selected.name}</h2>
                    <p className="text-primary-200 text-sm flex items-center gap-1 mt-0.5"><MapPin size={13} />{selected.location}</p>
                    <p className="text-primary-300 text-xs mt-2">{selected.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{selected.total_area_ha}</p>
                    <p className="text-primary-300 text-xs">hectares</p>
                    <span className="mt-1 inline-block text-xs bg-primary-800 text-primary-100 px-2 py-0.5 rounded-full">{selected.farm_type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm text-primary-200">
                  {selected.phone && <span className="flex items-center gap-1"><Phone size={13} />{selected.phone}</span>}
                  {selected.email && <span className="flex items-center gap-1"><Mail size={13} />{selected.email}</span>}
                  {selected.owner && <span className="flex items-center gap-1"><User size={13} />{selected.owner}</span>}
                </div>
              </div>

              {/* Detail tabs */}
              <div className="flex border-b">
                {DETAIL_TABS.map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setDetailTab(id)}
                    className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                      detailTab === id ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {detailTab === 'map' && (
                <div className="p-4">
                  <GoogleMapView
                    center={{ lat: selected.gps_lat, lng: selected.gps_lng }}
                    zoom={14}
                    mapTypeId="hybrid"
                    polygon={selected.boundary || []}
                    markers={[{ lat: selected.gps_lat, lng: selected.gps_lng, title: selected.name, info: selected.location, color: '#16a34a' }]}
                    height="300px"
                  />
                  {selected.gps_lat && (
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-400">Center Latitude</p><p className="font-mono font-bold">{selected.gps_lat}</p></div>
                      <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-400">Center Longitude</p><p className="font-mono font-bold">{selected.gps_lng}</p></div>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'layout' && <FieldMap fields={selected.fields} />}
              {detailTab === 'soil' && <SoilPanel soil={selected.soil} />}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <FarmModal modal={modal} onClose={() => setModal(null)} onSave={saveFarm} />
      )}
    </div>
  );
}
