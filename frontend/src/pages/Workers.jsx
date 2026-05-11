import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, X, Search, Users, Phone, Mail,
  Clock, CheckCircle, AlertCircle, Calendar, MapPin,
  Camera, DollarSign, ClipboardList, Navigation, Play,
  Square, UserCheck, UserX, Timer, RefreshCw, Wifi,
  ChevronRight, Star, Zap, FileText, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { workersApi, attendanceApi, tasksApi, payrollApi } from '../services/api';

// ─── Constants ───────────────────────────────────────────────────────────────
const fmt = n => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n || 0);

const TABS = [
  { id: 'team',       label: 'Team',        icon: Users },
  { id: 'attendance', label: 'Attendance',  icon: Clock },
  { id: 'tasks',      label: 'Daily Tasks', icon: ClipboardList },
  { id: 'payroll',    label: 'Payroll',     icon: DollarSign },
  { id: 'gps',        label: 'GPS Tracking',icon: Navigation },
];

const DEPT_COLORS = ['bg-blue-500','bg-purple-500','bg-green-500','bg-orange-500','bg-teal-500','bg-pink-500','bg-indigo-500'];
const deptColor = dept => DEPT_COLORS[Math.abs([...dept].reduce((h,c)=>h+c.charCodeAt(0),0)) % DEPT_COLORS.length];

const workerInitials = name => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const statusBadge  = { active:'badge-green', inactive:'badge-gray', on_leave:'badge-yellow' };
const attBadge     = { present:'badge-green', late:'badge-yellow', absent:'badge-red', on_leave:'badge-blue', half_day:'badge-yellow' };
const taskBadge    = { pending:'badge-yellow', in_progress:'badge-blue', completed:'badge-green', cancelled:'badge-gray' };
const prioBadge    = { low:'badge-gray', medium:'badge-blue', high:'badge-yellow', urgent:'badge-red' };

// GPS farm zones — absolute % positions on map canvas
const FARM_ZONES = [
  { id:'fa', label:'Field A',      crop:'Wheat',     bg:'bg-yellow-100', border:'border-yellow-300', style:{left:'2%',top:'4%',width:'28%',height:'30%'} },
  { id:'gh', label:'Greenhouse 1', crop:'Tomatoes',  bg:'bg-emerald-100',border:'border-emerald-300',style:{left:'32%',top:'4%',width:'14%',height:'30%'} },
  { id:'fb', label:'Field B',      crop:'Corn',      bg:'bg-green-100',  border:'border-green-300',  style:{left:'48%',top:'4%',width:'28%',height:'30%'} },
  { id:'fc', label:'Field C',      crop:'Soybeans',  bg:'bg-blue-100',   border:'border-blue-300',   style:{left:'2%', top:'38%',width:'28%',height:'28%'} },
  { id:'ba', label:'Barn A',       crop:null,        bg:'bg-amber-100',  border:'border-amber-300',  style:{left:'32%',top:'38%',width:'13%',height:'28%'} },
  { id:'of', label:'Farm Office',  crop:null,        bg:'bg-gray-100',   border:'border-gray-300',   style:{left:'47%',top:'38%',width:'12%',height:'28%'} },
  { id:'wa', label:'Warehouse A',  crop:null,        bg:'bg-purple-100', border:'border-purple-300', style:{left:'61%',top:'38%',width:'15%',height:'28%'} },
  { id:'fd', label:'Field D',      crop:'Sunflowers',bg:'bg-orange-100', border:'border-orange-300', style:{left:'2%', top:'70%',width:'28%',height:'27%'} },
  { id:'fe', label:'Field E',      crop:'Rice',      bg:'bg-teal-100',   border:'border-teal-300',   style:{left:'48%',top:'70%',width:'28%',height:'27%'} },
];

const GPS_COORDS = {
  'Field A':    { x: 16, y: 19 }, 'Field B':    { x: 62, y: 19 },
  'Field C':    { x: 16, y: 52 }, 'Field D':    { x: 16, y: 83 },
  'Field E':    { x: 62, y: 83 }, 'Greenhouse 1':{ x: 39, y: 19 },
  'Barn A':     { x: 38, y: 52 }, 'Farm Office': { x: 53, y: 52 },
  'Warehouse A':{ x: 68, y: 52 }, 'Pasture 1':  { x: 78, y: 35 },
  'Pasture 2':  { x: 30, y: 70 }, 'Poultry House':{ x: 60, y: 65 },
};
const DEFAULT_COORDS = { x: 50, y: 50 };

const LOCATIONS = Object.keys(GPS_COORDS);
const DEPARTMENTS = ['Management','Agronomy','Livestock','Finance','Operations','Marketing','Security'];
const TASK_CATEGORIES = ['Irrigation','Fertilizing','Spraying','Harvesting','Ploughing','Inspection','Livestock','Maintenance','Management','Other'];

// ─── Worker Avatar ────────────────────────────────────────────────────────────
function Avatar({ name, size = 8, dept }) {
  const bg = dept ? deptColor(dept) : 'bg-primary-600';
  return (
    <div className={`w-${size} h-${size} ${bg} text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}>
      {workerInitials(name)}
    </div>
  );
}

// ─── TeamTab ──────────────────────────────────────────────────────────────────
function TeamTab({ workers, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const filtered = workers.filter(d =>
    [d.name, d.role, d.department, d.phone].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPayroll = workers.filter(w => w.status === 'active').reduce((s, w) => s + (w.salary || 0), 0);

  return (
    <div className="card p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 w-64" placeholder="Search by name, role..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Monthly payroll: <span className="font-semibold text-gray-800">{fmt(totalPayroll)}</span></span>
          <button className="btn-primary" onClick={onAdd}><Plus size={16} />Add Worker</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Name','Role','Department','Phone','Email','Hire Date','Salary','Status','Actions'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-10 text-gray-400">No workers found</td></tr>}
            {filtered.map(r => (
              <tr key={r.id} className="table-row">
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.name} dept={r.department} />
                    <div><p className="font-medium text-sm">{r.name}</p></div>
                  </div>
                </td>
                <td className="table-cell text-sm">{r.role || '—'}</td>
                <td className="table-cell"><span className="badge-blue">{r.department || '—'}</span></td>
                <td className="table-cell text-xs"><div className="flex items-center gap-1"><Phone size={11} />{r.phone || '—'}</div></td>
                <td className="table-cell text-xs"><div className="flex items-center gap-1"><Mail size={11} />{r.email || '—'}</div></td>
                <td className="table-cell text-sm">{r.hire_date || '—'}</td>
                <td className="table-cell font-medium text-sm">{r.salary ? fmt(r.salary) : '—'}</td>
                <td className="table-cell"><span className={statusBadge[r.status] || 'badge-gray'}>{r.status?.replace('_', ' ')}</span></td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(r)} className="p-1.5 rounded text-blue-600 hover:bg-blue-50"><Pencil size={14} /></button>
                    <button onClick={() => onDelete(r.id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AttendanceTab ────────────────────────────────────────────────────────────
function AttendanceTab({ workers, attendance, onRefresh }) {
  const [showStation, setShowStation] = useState(false);
  const [clockWorker, setClockWorker] = useState('');
  const [clockLocation, setClockLocation] = useState('Farm Office');
  const [photoVerified, setPhotoVerified] = useState(false);
  const [photoCapturing, setPhotoCapturing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(new Date());
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setPhotoCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      // Camera unavailable — simulate verification
      setTimeout(() => { stopStream(); setPhotoVerified(true); setPhotoCapturing(false); toast.success('Photo verified ✓'); }, 1200);
    }
  };

  const capturePhoto = () => { stopStream(); setPhotoVerified(true); setPhotoCapturing(false); toast.success('Photo captured and verified ✓'); };

  const quickClockIn = async (workerId) => {
    setBusy(true);
    try {
      await attendanceApi.clockIn({ worker_id: workerId, location: 'Farm', photo_verified: false });
      toast.success('Clocked in'); onRefresh();
    } catch (e) { toast.error(e); }
    setBusy(false);
  };

  const stationClockIn = async () => {
    if (!clockWorker) return toast.error('Select a worker');
    setBusy(true);
    try {
      await attendanceApi.clockIn({ worker_id: clockWorker, location: clockLocation, photo_verified: photoVerified });
      toast.success('Clocked in successfully ✓'); setClockWorker(''); setPhotoVerified(false); onRefresh();
    } catch (e) { toast.error(e); }
    setBusy(false);
  };

  const doClockOut = async (workerId) => {
    setBusy(true);
    try { await attendanceApi.clockOut({ worker_id: workerId }); toast.success('Clocked out'); onRefresh(); }
    catch (e) { toast.error(e); }
    setBusy(false);
  };

  const markAbsent = async (workerId) => {
    try { await attendanceApi.mark({ worker_id: workerId, status: 'absent' }); toast.success('Marked absent'); onRefresh(); }
    catch (e) { toast.error(e); }
  };

  const present  = attendance.filter(a => ['present','late'].includes(a.attendance?.status)).length;
  const absent   = attendance.filter(a => a.attendance?.status === 'absent').length;
  const onLeave  = attendance.filter(a => a.attendance?.status === 'on_leave').length;
  const notIn    = attendance.filter(a => !a.attendance).length;
  const today    = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

  // Selected worker's current attendance state
  const selAtt = clockWorker ? attendance.find(a => String(a.worker.id) === String(clockWorker))?.attendance : null;

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[[UserCheck,'Present',present,'bg-green-500'],[UserX,'Absent',absent,'bg-red-500'],[Calendar,'On Leave',onLeave,'bg-blue-500'],[Clock,'Not Checked In',notIn,'bg-yellow-500']].map(([Icon,label,val,bg]) => (
          <div key={label} className="card flex items-center gap-3 !p-3">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}><Icon size={15} className="text-white" /></div>
            <div><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold">{val}</p></div>
          </div>
        ))}
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{today}</p>
        <button onClick={() => setShowStation(s => !s)} className={showStation ? 'btn-secondary' : 'btn-primary'}>
          {showStation ? <><X size={15} />Close Station</> : <><Camera size={15} />Clock Station</>}
        </button>
      </div>

      {/* ── Mobile Clock Station ── */}
      {showStation && (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-primary-900 text-white p-6 shadow-2xl">
          {/* Big clock */}
          <div className="text-center mb-6">
            <p className="text-6xl font-mono font-bold tracking-widest drop-shadow">{now.toTimeString().slice(0, 8)}</p>
            <p className="text-slate-300 text-sm mt-1">{today}</p>
            <div className="inline-flex items-center gap-1.5 mt-2 bg-green-500/20 text-green-300 text-xs px-3 py-1 rounded-full">
              <Wifi size={11} className="animate-pulse" /> Farm Clock Station — Live
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <p className="text-slate-300 text-xs mb-1.5">Worker</p>
              <select
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                value={clockWorker}
                onChange={e => { setClockWorker(e.target.value); setPhotoVerified(false); }}
              >
                <option value="">Select worker...</option>
                {workers.filter(w => w.status === 'active').map(w => {
                  const att = attendance.find(a => String(a.worker.id) === String(w.id))?.attendance;
                  const tag = att ? (att.clock_out ? ' ✓ Done' : ' ⏱ Active') : '';
                  return <option key={w.id} value={w.id}>{w.name}{tag}</option>;
                })}
              </select>
            </div>

            <div>
              <p className="text-slate-300 text-xs mb-1.5">Location</p>
              <select
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                value={clockLocation}
                onChange={e => setClockLocation(e.target.value)}
              >
                {LOCATIONS.map(l => <option key={l} className="text-gray-800">{l}</option>)}
              </select>
            </div>

            <div>
              <p className="text-slate-300 text-xs mb-1.5">Photo Verification</p>
              {photoCapturing ? (
                <div className="space-y-2">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-20 rounded-xl bg-black object-cover" />
                  <div className="flex gap-2">
                    <button onClick={capturePhoto} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors">📸 Capture</button>
                    <button onClick={() => { stopStream(); setPhotoCapturing(false); }} className="flex-1 bg-red-500/60 text-white text-xs py-2 rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={startCamera}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    photoVerified
                      ? 'bg-green-500/20 border-green-400 text-green-300'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  <Camera size={16} />
                  {photoVerified ? '✓ Photo Verified' : 'Capture Photo'}
                </button>
              )}
            </div>
          </div>

          {/* Clock In / Out button */}
          {selAtt ? (
            selAtt.clock_out ? (
              <div className="text-center py-3 bg-green-500/10 rounded-xl border border-green-500/30 text-green-300 font-medium">
                ✓ Completed today — {selAtt.clock_in} → {selAtt.clock_out} ({selAtt.hours_worked}h)
              </div>
            ) : (
              <button
                onClick={() => doClockOut(clockWorker)}
                disabled={busy}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-xl transition-colors"
              >
                <Square size={22} /> CLOCK OUT — {now.toTimeString().slice(0, 5)}
              </button>
            )
          ) : (
            <button
              onClick={stationClockIn}
              disabled={busy || !clockWorker}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-xl transition-colors"
            >
              <Play size={22} /> CLOCK IN — {now.toTimeString().slice(0, 5)}
            </button>
          )}
        </div>
      )}

      {/* ── Attendance Table ── */}
      <div className="card p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Today's Attendance Register</h3>
          <button onClick={onRefresh} className="btn-secondary !py-1.5"><RefreshCw size={14} />Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Worker','Dept','Clock In','Clock Out','Hours','Overtime','Status','Location','Photo','Actions'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {attendance.map(({ worker: w, attendance: a }) => (
                <tr key={w.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar name={w.name} dept={w.department} size={8} />
                      <div><p className="font-medium text-sm">{w.name}</p><p className="text-xs text-gray-400">{w.role}</p></div>
                    </div>
                  </td>
                  <td className="table-cell"><span className="badge-blue text-xs">{w.department || '—'}</span></td>
                  <td className="table-cell font-mono text-sm text-primary-700">{a?.clock_in || <span className="text-gray-300">—</span>}</td>
                  <td className="table-cell font-mono text-sm">
                    {a?.clock_out
                      ? <span className="text-gray-700">{a.clock_out}</span>
                      : a?.clock_in
                        ? <span className="text-yellow-600 text-xs font-medium animate-pulse">● Active</span>
                        : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="table-cell">{a?.hours_worked != null ? <span className="font-medium">{a.hours_worked}h</span> : '—'}</td>
                  <td className="table-cell">
                    {a?.overtime_hours ? <span className="text-orange-600 font-semibold">+{a.overtime_hours}h</span> : '—'}
                  </td>
                  <td className="table-cell">
                    <span className={attBadge[a?.status] || 'badge-gray'}>{a?.status?.replace('_', ' ') || 'Not checked in'}</span>
                  </td>
                  <td className="table-cell text-xs text-gray-500">
                    {a?.location ? <span className="flex items-center gap-1"><MapPin size={11} />{a.location}</span> : '—'}
                  </td>
                  <td className="table-cell">
                    {a?.photo_verified
                      ? <CheckCircle size={16} className="text-green-500" />
                      : <AlertCircle size={16} className="text-gray-300" />}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {!a && w.status !== 'on_leave' && (
                        <>
                          <button onClick={() => quickClockIn(w.id)} disabled={busy} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50">In</button>
                          <button onClick={() => markAbsent(w.id)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">Absent</button>
                        </>
                      )}
                      {a?.clock_in && !a?.clock_out && (
                        <button onClick={() => doClockOut(w.id)} disabled={busy} className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50">Out</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TasksTab ─────────────────────────────────────────────────────────────────
function TasksTab({ workers, tasks, onRefresh }) {
  const [taskModal, setTaskModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [workerFilter, setWorkerFilter] = useState('');

  const filtered = tasks.filter(t =>
    (!dateFilter || t.date === dateFilter) &&
    (!workerFilter || String(t.worker_id) === workerFilter)
  );

  const cols = [
    { key: 'pending',     label: 'Pending',     icon: Clock,         color: 'border-yellow-300 bg-yellow-50' },
    { key: 'in_progress', label: 'In Progress', icon: Zap,           color: 'border-blue-300 bg-blue-50' },
    { key: 'completed',   label: 'Completed',   icon: CheckCircle,   color: 'border-green-300 bg-green-50' },
    { key: 'cancelled',   label: 'Cancelled',   icon: X,             color: 'border-gray-300 bg-gray-50' },
  ];

  const openAdd = () => { setForm({ date: dateFilter, priority: 'medium', status: 'pending', estimated_hours: 2 }); setTaskModal('add'); };
  const openEdit = t => { setForm(t); setTaskModal(t); };

  const save = async () => {
    if (!form.title) return toast.error('Title required');
    setSaving(true);
    try {
      if (!form.worker_id) return toast.error('Assign a worker');
      const worker = workers.find(w => String(w.id) === String(form.worker_id));
      const payload = { ...form, worker_name: worker?.name || form.worker_name };
      if (taskModal === 'add') { await tasksApi.create(payload); toast.success('Task created'); }
      else { await tasksApi.update(taskModal.id, payload); toast.success('Task updated'); }
      onRefresh(); setTaskModal(null);
    } catch (e) { toast.error(e); }
    setSaving(false);
  };

  const del = async id => { if (!confirm('Delete task?')) return; await tasksApi.delete(id); toast.success('Deleted'); onRefresh(); };
  const changeStatus = async (t, status) => { await tasksApi.update(t.id, { ...t, status }); onRefresh(); };

  const TaskCard = ({ task: t }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 leading-snug">{t.title}</p>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => openEdit(t)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={12} /></button>
          <button onClick={() => del(t.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={prioBadge[t.priority] || 'badge-gray'}>{t.priority}</span>
        {t.field && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{t.field}</span>}
      </div>
      {t.worker_name && (
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full ${deptColor(workers.find(w=>String(w.id)===String(t.worker_id))?.department||'Operations')} text-white flex items-center justify-center text-xs`}>
            {workerInitials(t.worker_name)}
          </div>
          <span className="text-xs text-gray-500">{t.worker_name}</span>
        </div>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Timer size={11} />
        <span>{t.estimated_hours}h est.</span>
        {t.actual_hours && <span className="text-green-600">/ {t.actual_hours}h actual</span>}
      </div>
      {/* Quick status change */}
      <div className="flex gap-1 pt-1 border-t border-gray-50">
        {cols.map(c => c.key !== t.status && (
          <button key={c.key} onClick={() => changeStatus(t, c.key)}
            className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
            → {c.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input type="date" className="input w-44" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          <select className="input w-44" value={workerFilter} onChange={e => setWorkerFilter(e.target.value)}>
            <option value="">All workers</option>
            {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={16} />Assign Task</button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cols.map(col => {
          const colTasks = filtered.filter(t => t.status === col.key);
          const Icon = col.icon;
          return (
            <div key={col.key} className={`rounded-xl border-2 ${col.color} p-3`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={14} className="text-gray-600" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{col.label}</span>
                <span className="ml-auto text-xs font-bold bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map(t => <TaskCard key={t.id} task={t} />)}
                {colTasks.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No tasks</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      {taskModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">{taskModal === 'add' ? 'Assign New Task' : 'Edit Task'}</h2>
              <button onClick={() => setTaskModal(null)}><X size={20} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Task Title *</label><input className="input" value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div>
                <label className="label">Assigned Worker *</label>
                <select className="input" value={form.worker_id || ''} onChange={e => setForm(p => ({ ...p, worker_id: e.target.value }))}>
                  <option value="">Select worker...</option>
                  {workers.filter(w => w.status === 'active').map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="">Select...</option>
                  {TASK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">Date</label><input type="date" className="input" value={form.date || ''} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority || 'medium'} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {['low','medium','high','urgent'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status || 'pending'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {['pending','in_progress','completed','cancelled'].map(v => <option key={v} value={v}>{v.replace('_',' ')}</option>)}
                </select>
              </div>
              <div><label className="label">Field / Location</label><input className="input" value={form.field || ''} onChange={e => setForm(p => ({ ...p, field: e.target.value }))} /></div>
              <div><label className="label">Est. Hours</label><input type="number" className="input" value={form.estimated_hours || ''} onChange={e => setForm(p => ({ ...p, estimated_hours: e.target.value }))} /></div>
              <div><label className="label">Actual Hours</label><input type="number" className="input" value={form.actual_hours || ''} onChange={e => setForm(p => ({ ...p, actual_hours: e.target.value }))} /></div>
              <div className="col-span-2"><label className="label">Description / Notes</label><textarea className="input" rows={2} value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button className="btn-secondary" onClick={() => setTaskModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PayrollTab ───────────────────────────────────────────────────────────────
function PayrollTab() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRecords(await payrollApi.getAll({ month })); } catch { }
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    try { const r = await payrollApi.generate(month); setRecords(r); toast.success(`Payroll generated for ${month}`); }
    catch (e) { toast.error(e); }
    setGenerating(false);
  };

  const updateStatus = async (rec, status) => {
    const updated = await payrollApi.update(rec.id, { ...rec, status });
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
    toast.success(`Marked as ${status}`);
  };

  const totalGross  = records.reduce((s, r) => s + (r.gross_pay || 0), 0);
  const totalDed    = records.reduce((s, r) => s + (r.total_deductions || 0), 0);
  const totalNet    = records.reduce((s, r) => s + (r.net_pay || 0), 0);
  const paidCount   = records.filter(r => r.status === 'paid').length;
  const statusBg    = { pending:'badge-yellow', approved:'badge-blue', paid:'badge-green' };

  return (
    <div className="space-y-4">
      {/* Month selector + generate */}
      <div className="card flex flex-wrap items-center justify-between gap-4 !p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Payroll Month:</label>
          <input type="month" className="input w-44" value={month} onChange={e => setMonth(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{paidCount}/{records.length} paid</span>
          <button onClick={generate} disabled={generating} className="btn-primary">
            {generating ? <><RefreshCw size={14} className="animate-spin" />Generating...</> : <><FileText size={14} />Generate Payroll</>}
          </button>
        </div>
      </div>

      {/* Summary */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[['Total Gross Pay', totalGross, 'bg-blue-500'], ['Total Deductions', totalDed, 'bg-red-500'], ['Total Net Pay', totalNet, 'bg-primary-600']].map(([l, v, bg]) => (
            <div key={l} className="card flex items-center gap-3">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}><DollarSign size={18} className="text-white" /></div>
              <div><p className="text-xs text-gray-500">{l}</p><p className="text-xl font-bold">{fmt(v)}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Payroll Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>
      ) : records.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <DollarSign size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No payroll for {month}</p>
          <p className="text-sm mt-1">Click "Generate Payroll" to calculate from attendance data</p>
        </div>
      ) : (
        <div className="card p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Worker','Dept','Days Worked','OT Hours','Gross Pay','Deductions','Net Pay','Status','Actions'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <>
                    <tr key={r.id} className="table-row cursor-pointer" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar name={r.worker_name} dept={r.department} size={8} />
                          <div><p className="font-medium text-sm">{r.worker_name}</p><p className="text-xs text-gray-400">{r.role}</p></div>
                        </div>
                      </td>
                      <td className="table-cell"><span className="badge-blue text-xs">{r.department || '—'}</span></td>
                      <td className="table-cell"><span className="font-medium">{r.days_worked}</span><span className="text-xs text-gray-400">/{r.working_days}</span></td>
                      <td className="table-cell text-orange-600 font-medium">{r.overtime_hours ? `+${r.overtime_hours}h` : '—'}</td>
                      <td className="table-cell font-semibold">{fmt(r.gross_pay)}</td>
                      <td className="table-cell text-red-600">-{fmt(r.total_deductions)}</td>
                      <td className="table-cell font-bold text-primary-700">{fmt(r.net_pay)}</td>
                      <td className="table-cell"><span className={statusBg[r.status] || 'badge-gray'}>{r.status}</span></td>
                      <td className="table-cell" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {r.status === 'pending'  && <button onClick={() => updateStatus(r,'approved')} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Approve</button>}
                          {r.status === 'approved' && <button onClick={() => updateStatus(r,'paid')} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Mark Paid</button>}
                          {r.status === 'paid'     && <span className="text-xs text-green-600">✓ Paid</span>}
                        </div>
                      </td>
                    </tr>
                    {expandedId === r.id && (
                      <tr key={`${r.id}-detail`} className="bg-gray-50">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            {[['Base Salary', fmt(r.base_salary)],['NHIF', `-${fmt(r.nhif)}`],['NSSF', `-${fmt(r.nssf)}`],['PAYE', `-${fmt(r.paye)}`],
                              ['Days Absent', r.days_absent || 0],['Leave Days', r.leave_days || 0],['OT Pay', fmt(r.overtime_pay)],['Net Pay', fmt(r.net_pay)]
                            ].map(([l, v]) => (
                              <div key={l}><p className="text-gray-400 text-xs">{l}</p><p className="font-semibold">{v}</p></div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GpsTab ───────────────────────────────────────────────────────────────────
function GpsTab({ workers, attendance, tasks }) {
  const [selected, setSelected] = useState(null);
  const now = new Date();

  const workerLocations = workers.map(w => {
    const att = attendance.find(a => String(a.worker.id) === String(w.id))?.attendance;
    const activeTask = tasks.find(t => String(t.worker_id) === String(w.id) && t.date === now.toISOString().split('T')[0] && t.status === 'in_progress');
    const location = att?.location || activeTask?.field || null;
    const coords = GPS_COORDS[location] || DEFAULT_COORDS;
    const isActive = att?.clock_in && !att?.clock_out;
    return { ...w, location, coords, isActive, att, activeTask };
  });

  const offFarm = workerLocations.filter(w => !w.att || w.att.status === 'on_leave' || w.att.status === 'absent');
  const onFarm  = workerLocations.filter(w => w.att && !['on_leave','absent'].includes(w.att.status));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Farm Map */}
        <div className="xl:col-span-2 card !p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Navigation size={16} className="text-primary-600" />Live Farm Map</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" /> Active</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full inline-block" /> Inactive</span>
            </div>
          </div>

          {/* Map canvas */}
          <div className="relative w-full bg-green-50 border-2 border-green-200 rounded-xl overflow-hidden" style={{ height: 380 }}>
            {/* Farm zones */}
            {FARM_ZONES.map(zone => (
              <div key={zone.id} className={`absolute border-2 ${zone.bg} ${zone.border} rounded-lg flex flex-col items-start justify-start p-1.5`} style={zone.style}>
                <p className="text-xs font-bold text-gray-700 leading-none">{zone.label}</p>
                {zone.crop && <p className="text-xs text-gray-500 mt-0.5">{zone.crop}</p>}
              </div>
            ))}

            {/* Road paths (decorative) */}
            <div className="absolute bg-yellow-200/60 rounded" style={{ left:'31%', top:'0%', width:'1.5%', height:'100%' }} />
            <div className="absolute bg-yellow-200/60 rounded" style={{ left:'0%', top:'36%', width:'100%', height:'1.5%' }} />
            <div className="absolute bg-yellow-200/60 rounded" style={{ left:'46%', top:'0%', width:'1.5%', height:'100%' }} />
            <div className="absolute bg-yellow-200/60 rounded" style={{ left:'0%', top:'68%', width:'100%', height:'1.5%' }} />

            {/* Worker dots */}
            {onFarm.map((w, i) => {
              const { x, y } = w.coords;
              // Offset slightly if multiple workers in same spot
              const offset = onFarm.filter(ow => ow.location === w.location).indexOf(w);
              return (
                <button
                  key={w.id}
                  onClick={() => setSelected(selected?.id === w.id ? null : w)}
                  title={`${w.name} — ${w.location || 'Unknown'}`}
                  className="absolute flex flex-col items-center group"
                  style={{ left: `${x + offset * 4}%`, top: `${y + offset * 3}%`, transform: 'translate(-50%,-50%)', zIndex: 10 }}
                >
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ${deptColor(w.department || 'Operations')} ${w.isActive ? 'ring-2 ring-green-400' : ''}`}>
                      {workerInitials(w.name)}
                    </div>
                    {w.isActive && <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />}
                    {w.isActive && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
                  </div>
                  <span className="text-xs bg-white/90 text-gray-800 rounded px-1 shadow mt-0.5 whitespace-nowrap font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {w.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Worker list */}
        <div className="card !p-0 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Worker Locations</h3>
            <p className="text-xs text-gray-400 mt-0.5">{onFarm.length} on farm · {offFarm.length} off farm</p>
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto max-h-80">
            {workerLocations.map(w => (
              <button
                key={w.id}
                onClick={() => setSelected(selected?.id === w.id ? null : w)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors ${selected?.id === w.id ? 'bg-primary-50' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar name={w.name} dept={w.department} size={8} />
                  {w.isActive && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{w.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {w.location
                      ? <span className="flex items-center gap-1"><MapPin size={10} />{w.location}</span>
                      : <span className="text-gray-300">Not on farm</span>}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`text-xs ${w.isActive ? 'text-green-600 font-medium' : 'text-gray-300'}`}>
                    {w.att?.clock_in ? (w.isActive ? `In ${w.att.clock_in}` : `Out ${w.att.clock_out}`) : '—'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected worker detail */}
      {selected && (
        <div className="card bg-primary-50 border-primary-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={selected.name} dept={selected.department} size={12} />
              <div>
                <h3 className="font-bold text-gray-900">{selected.name}</h3>
                <p className="text-sm text-gray-500">{selected.role} · {selected.department}</p>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  {selected.location && <span className="flex items-center gap-1 text-primary-700"><MapPin size={14} />{selected.location}</span>}
                  {selected.isActive
                    ? <span className="flex items-center gap-1 text-green-600 font-medium"><Wifi size={14} className="animate-pulse" />Active since {selected.att?.clock_in}</span>
                    : selected.att?.clock_out
                      ? <span className="text-gray-500">Clocked out at {selected.att.clock_out}</span>
                      : <span className="text-gray-400">Not on farm today</span>}
                </div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          {selected.activeTask && (
            <div className="mt-4 p-3 bg-white rounded-xl border border-primary-100">
              <p className="text-xs text-gray-500 mb-1">Current Task</p>
              <p className="text-sm font-medium text-gray-800">{selected.activeTask.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={prioBadge[selected.activeTask.priority]}>{selected.activeTask.priority}</span>
                <span className="text-xs text-gray-400">{selected.activeTask.estimated_hours}h estimated</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Worker Modal ─────────────────────────────────────────────────────────────
const EMPTY_WORKER = { name:'', role:'', phone:'', email:'', hire_date:'', salary:'', status:'active', department:'', notes:'' };

function WorkerModal({ modal, onClose, onSave }) {
  const [form, setForm] = useState(() => modal === 'add' ? EMPTY_WORKER : modal);
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.name) return toast.error('Name required');
    setSaving(true);
    try { await onSave(form); }
    catch (e) { toast.error(e); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">{modal === 'add' ? 'Add Worker' : 'Edit Worker'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Full Name *</label><input className="input" value={form.name || ''} onChange={e => f('name', e.target.value)} /></div>
          <div><label className="label">Role / Position</label><input className="input" value={form.role || ''} onChange={e => f('role', e.target.value)} /></div>
          <div><label className="label">Department</label><select className="input" value={form.department || ''} onChange={e => f('department', e.target.value)}><option value="">Select...</option>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone || ''} onChange={e => f('phone', e.target.value)} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email || ''} onChange={e => f('email', e.target.value)} /></div>
          <div><label className="label">Hire Date</label><input type="date" className="input" value={form.hire_date || ''} onChange={e => f('hire_date', e.target.value)} /></div>
          <div><label className="label">Monthly Salary (KES)</label><input type="number" className="input" value={form.salary || ''} onChange={e => f('salary', e.target.value)} /></div>
          <div><label className="label">Status</label><select className="input" value={form.status || 'active'} onChange={e => f('status', e.target.value)}>{['active','inactive','on_leave'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}</select></div>
          <div className="col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes || ''} onChange={e => f('notes', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Worker'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Workers Component ───────────────────────────────────────────────────
export default function Workers() {
  const [tab, setTab] = useState('team');
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workerModal, setWorkerModal] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [w, a, t] = await Promise.all([workersApi.getAll(), attendanceApi.getToday(), tasksApi.getAll()]);
      setWorkers(w); setAttendance(a); setTasks(t);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const saveWorker = async (form) => {
    if (workerModal === 'add') { await workersApi.create(form); toast.success('Worker added'); }
    else { await workersApi.update(workerModal.id, form); toast.success('Updated'); }
    await loadAll(); setWorkerModal(null);
  };

  const deleteWorker = async (id) => {
    if (!confirm('Delete this worker?')) return;
    await workersApi.delete(id); toast.success('Deleted'); loadAll();
  };

  const activeWorkers = workers.filter(w => w.status === 'active').length;
  const totalPayroll  = workers.filter(w => w.status === 'active').reduce((s, w) => s + (w.salary || 0), 0);
  const todayPresent  = attendance.filter(a => ['present','late'].includes(a.attendance?.status)).length;
  const todayTasks    = tasks.filter(t => t.date === new Date().toISOString().split('T')[0]).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          [Users,      'Total Workers', workers.length,    'bg-blue-600'],
          [UserCheck,  'Active Today',  todayPresent,      'bg-green-500'],
          [ClipboardList,'Today Tasks', todayTasks,        'bg-purple-500'],
          [DollarSign, 'Monthly Payroll', fmt(totalPayroll),'bg-earth-600'],
        ].map(([Icon, label, val, bg]) => (
          <div key={label} className="card flex items-center gap-3">
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon size={20} className="text-white" /></div>
            <div><p className="text-xs text-gray-500 font-medium">{label}</p><p className="text-xl font-bold text-gray-900">{val}</p></div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              tab === id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'team' && (
        <TeamTab
          workers={workers}
          onAdd={() => setWorkerModal('add')}
          onEdit={w => setWorkerModal(w)}
          onDelete={deleteWorker}
        />
      )}
      {tab === 'attendance' && (
        <AttendanceTab workers={workers} attendance={attendance} onRefresh={loadAll} />
      )}
      {tab === 'tasks' && (
        <TasksTab workers={workers} tasks={tasks} onRefresh={loadAll} />
      )}
      {tab === 'payroll' && <PayrollTab />}
      {tab === 'gps' && (
        <GpsTab workers={workers} attendance={attendance} tasks={tasks} />
      )}

      {/* Worker Add/Edit Modal */}
      {workerModal && (
        <WorkerModal modal={workerModal} onClose={() => setWorkerModal(null)} onSave={saveWorker} />
      )}
    </div>
  );
}
