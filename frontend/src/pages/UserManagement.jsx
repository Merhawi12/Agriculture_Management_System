import { useEffect, useState, useCallback } from 'react';
import {
  Users, UserPlus, Shield, Key, Search, Pencil, Trash2, X,
  CheckCircle, XCircle, Clock, Mail, Phone, Building2,
  ChevronDown, ChevronUp, Eye, EyeOff, Lock, Unlock,
  Crown, User, Leaf, Calculator, Wrench
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi, farmsApi } from '../services/api';

// ─── Constants ───────────────────────────────────────────────────────────────
const ROLES = [
  { id:'super_admin',  label:'Super Admin',   icon:Crown,      color:'bg-red-500',    badge:'badge-red' },
  { id:'farm_manager', label:'Farm Manager',  icon:Building2,  color:'bg-blue-600',   badge:'badge-blue' },
  { id:'agronomist',   label:'Agronomist',    icon:Leaf,       color:'bg-green-600',  badge:'badge-green' },
  { id:'accountant',   label:'Accountant',    icon:Calculator, color:'bg-yellow-600', badge:'badge-yellow' },
  { id:'worker',       label:'Worker',        icon:User,       color:'bg-gray-500',   badge:'badge-gray' },
];

const PERMISSIONS = [
  { key:'manage_users',     label:'Manage Users' },
  { key:'manage_farms',     label:'Manage Farms' },
  { key:'manage_finance',   label:'Finance' },
  { key:'manage_workers',   label:'Workers / HR' },
  { key:'manage_crops',     label:'Crop Management' },
  { key:'manage_livestock', label:'Livestock' },
  { key:'manage_inventory', label:'Inventory' },
  { key:'manage_equipment', label:'Equipment' },
  { key:'manage_payroll',   label:'Payroll' },
  { key:'view_reports',     label:'View Reports' },
];

const STATUS_OPTS = ['active','inactive','suspended'];

const roleInfo  = id => ROLES.find(r => r.id === id) || ROLES[4];
const statusBadge = { active:'badge-green', inactive:'badge-gray', suspended:'badge-red' };
const statusIcon  = { active: CheckCircle, inactive: Clock, suspended: XCircle };

const initials = name => name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

function Avatar({ name, color, size = 10 }) {
  return (
    <div className={`w-${size} h-${size} ${color || 'bg-gray-400'} rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold text-sm">{initials(name || '?')}</span>
    </div>
  );
}

// ─── Permission Matrix ────────────────────────────────────────────────────────
function PermissionMatrix({ roles }) {
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Shield size={18} className="text-primary-600" />
        <h3 className="font-semibold text-gray-800">Role Permission Matrix</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-40">Permission</th>
              {ROLES.map(r => (
                <th key={r.id} className="px-3 py-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 ${r.color} rounded-lg flex items-center justify-center`}>
                      <r.icon size={14} className="text-white" />
                    </div>
                    <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{r.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {PERMISSIONS.map(p => (
              <tr key={p.key} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-700 font-medium text-xs">{p.label}</td>
                {ROLES.map(r => {
                  const allowed = roles[r.id]?.[p.key];
                  return (
                    <td key={r.id} className="px-3 py-2.5 text-center">
                      {allowed
                        ? <CheckCircle size={16} className="text-green-500 mx-auto" />
                        : <XCircle    size={16} className="text-gray-200 mx-auto" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── User Modal ───────────────────────────────────────────────────────────────
const EMPTY = { name:'', email:'', phone:'', role:'worker', status:'active', farm_ids:[] };

function UserModal({ modal, farms, onClose, onSave }) {
  const [form, setForm] = useState(() => modal === 'add' ? EMPTY : { ...modal, farm_ids: modal.farm_ids || [] });
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleFarm = id => {
    setForm(p => ({
      ...p,
      farm_ids: p.farm_ids.includes(id) ? p.farm_ids.filter(x => x !== id) : [...p.farm_ids, id],
    }));
  };

  const save = async () => {
    if (!form.name || !form.email || !form.role) return toast.error('Name, email and role are required');
    setSaving(true);
    try { await onSave(form); }
    catch (e) { toast.error(String(e)); }
    setSaving(false);
  };

  const ri = roleInfo(form.role);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-800">{modal === 'add' ? 'Add User' : 'Edit User'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <Avatar name={form.name || 'New User'} color={modal !== 'add' ? modal.avatar_color : ri.color} size={14} />
            <div>
              <p className="font-semibold text-gray-800">{form.name || 'New User'}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full text-white ${ri.color}`}>{ri.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input className="input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="John Doe" />
            </div>
            <div className="col-span-2">
              <label className="label">Email Address *</label>
              <input type="email" className="input" value={form.email} onChange={e => f('email', e.target.value)} placeholder="user@farm.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone || ''} onChange={e => f('phone', e.target.value)} placeholder="0700-000-000" />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => f('status', e.target.value)}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className="label">Role *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => f('role', r.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.role === r.id
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-6 h-6 ${r.color} rounded-md flex items-center justify-center flex-shrink-0`}>
                      <r.icon size={12} className="text-white" />
                    </div>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="label">Farm Access</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {farms.map(farm => (
                  <button
                    key={farm.id}
                    type="button"
                    onClick={() => toggleFarm(farm.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      (form.farm_ids || []).includes(farm.id)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {farm.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions preview */}
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><Key size={12} />Permissions for {roleInfo(form.role).label}</p>
            <div className="flex flex-wrap gap-1">
              {PERMISSIONS.map(p => {
                const allowed = ROLES.find(r => r.id === form.role);
                return null; // permissions come from server; just show role label
              })}
              <span className="text-xs text-gray-500">Permissions are determined by role and cannot be customised individually.</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : modal === 'add' ? 'Create User' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UserManagement() {
  const [tab, setTab]       = useState('users');
  const [users, setUsers]   = useState([]);
  const [farms, setFarms]   = useState([]);
  const [roles, setRoles]   = useState({});
  const [stats, setStats]   = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState(null);

  const load = useCallback(async () => {
    try {
      const [u, r, s, f] = await Promise.all([
        usersApi.getAll(), usersApi.getRoles(), usersApi.getStats(), farmsApi.getAll(),
      ]);
      setUsers(u); setRoles(r); setStats(s); setFarms(f);
    } catch (e) { toast.error('Failed to load users'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveUser = async (form) => {
    if (modal === 'add') { await usersApi.create(form); toast.success('User created'); }
    else { await usersApi.update(modal.id, form); toast.success('User updated'); }
    await load(); setModal(null);
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await usersApi.delete(id); toast.success('User deleted'); load();
  };

  const toggleStatus = async (user) => {
    const next = user.status === 'active' ? 'inactive' : 'active';
    await usersApi.update(user.id, { status: next });
    toast.success(`User ${next}`); load();
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.includes(q);
    const matchR = !filterRole   || u.role   === filterRole;
    const matchS = !filterStatus || u.status === filterStatus;
    return matchQ && matchR && matchS;
  });

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
          [Users,        'Total Users',    stats?.total || 0,     'bg-blue-600'],
          [CheckCircle,  'Active',         stats?.active || 0,    'bg-green-500'],
          [XCircle,      'Suspended',      stats?.suspended || 0, 'bg-red-500'],
          [Shield,       'Roles',          ROLES.length,          'bg-purple-500'],
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

      {/* Role KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ROLES.map(r => (
          <div key={r.id} className="card !p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${r.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <r.icon size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{r.label}</p>
              <p className="text-xl font-bold text-gray-900">{stats?.by_role?.[r.id] || 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[['users','Users & Accounts', Users], ['permissions','Role Permissions', Shield]].map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="card !p-0 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2 flex-1">
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-9 !py-2 text-sm w-full"
                  placeholder="Search users..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="input !py-2 text-sm w-auto" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                <option value="">All Roles</option>
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <select className="input !py-2 text-sm w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <button className="btn-primary flex items-center gap-2 whitespace-nowrap" onClick={() => setModal('add')}>
              <UserPlus size={16} /> Add User
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {['User','Role','Status','Farm Access','Last Login','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">No users found</td></tr>
                )}
                {filtered.map(user => {
                  const ri = roleInfo(user.role);
                  const SIcon = statusIcon[user.status] || Clock;
                  const farmNames = farms.filter(f => (user.farm_ids || []).includes(f.id)).map(f => f.name);
                  const isExpanded = expandedUser === user.id;

                  return (
                    <>
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.name} color={user.avatar_color} size={9} />
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={11} />{user.email}</p>
                              {user.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={11} />{user.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 ${ri.color} rounded-md flex items-center justify-center`}>
                              <ri.icon size={12} className="text-white" />
                            </div>
                            <span className="text-gray-700 font-medium">{ri.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`${statusBadge[user.status]} flex items-center gap-1 w-fit`}>
                            <SIcon size={11} />{user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {farmNames.length === 0
                            ? <span className="text-gray-300 text-xs">No farm</span>
                            : <div className="flex flex-wrap gap-1">
                                {farmNames.map(n => (
                                  <span key={n} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full border border-primary-100">{n}</span>
                                ))}
                              </div>
                          }
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {user.last_login ? user.last_login.slice(0,16) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                              title="View permissions"
                            >
                              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                            <button
                              onClick={() => toggleStatus(user)}
                              className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100"
                              title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {user.status === 'active' ? <Lock size={15} /> : <Unlock size={15} />}
                            </button>
                            <button onClick={() => setModal(user)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => deleteUser(user.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${user.id}-perm`} className="bg-blue-50">
                          <td colSpan={6} className="px-6 py-4">
                            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><Key size={12} />Permissions — {ri.label}</p>
                            <div className="flex flex-wrap gap-2">
                              {PERMISSIONS.map(p => {
                                const allowed = user.permissions?.[p.key];
                                return (
                                  <span key={p.key} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                                    allowed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 line-through'
                                  }`}>
                                    {allowed ? <CheckCircle size={11} /> : <XCircle size={11} />}
                                    {p.label}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {users.length} users
          </div>
        </div>
      )}

      {tab === 'permissions' && <PermissionMatrix roles={roles} />}

      {modal && (
        <UserModal modal={modal} farms={farms} onClose={() => setModal(null)} onSave={saveUser} />
      )}
    </div>
  );
}
