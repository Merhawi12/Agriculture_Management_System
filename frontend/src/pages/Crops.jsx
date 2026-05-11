import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Sprout, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { cropsApi } from '../services/api';

const statusColors = { growing: 'badge-green', planned: 'badge-blue', harvested: 'badge-gray', failed: 'badge-red' };
const empty = { name:'', variety:'', field:'', area_hectares:'', planting_date:'', expected_harvest:'', status:'planned', yield_kg:'', notes:'' };

export default function Crops() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | crop_object
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => cropsApi.getAll().then(d => { setCrops(d); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(empty); setModal('add'); };
  const openEdit = c => { setForm(c); setModal(c); };
  const close = () => setModal(null);

  const save = async () => {
    if (!form.name) return toast.error('Crop name is required');
    setSaving(true);
    try {
      if (modal === 'add') { await cropsApi.create(form); toast.success('Crop added'); }
      else { await cropsApi.update(modal.id, form); toast.success('Crop updated'); }
      await load(); close();
    } catch (e) { toast.error(e); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm('Delete this crop?')) return;
    await cropsApi.delete(id); toast.success('Deleted'); load();
  };

  const filtered = crops.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.field?.toLowerCase().includes(search.toLowerCase()));
  const stats = { total: crops.length, growing: crops.filter(c=>c.status==='growing').length, harvested: crops.filter(c=>c.status==='harvested').length, planned: crops.filter(c=>c.status==='planned').length };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[['Total Crops',stats.total,'bg-primary-600'],['Growing',stats.growing,'bg-green-500'],['Harvested',stats.harvested,'bg-blue-500'],['Planned',stats.planned,'bg-yellow-500']].map(([l,v,c]) => (
          <div key={l} className="card flex items-center gap-3">
            <div className={`w-10 h-10 ${c} rounded-lg flex items-center justify-center`}><Sprout size={18} className="text-white"/></div>
            <div><p className="text-xs text-gray-500">{l}</p><p className="text-xl font-bold">{v}</p></div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 w-64" placeholder="Search crops..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={openAdd}><Plus size={16}/>Add Crop</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Crop','Variety','Field','Area (ha)','Planted','Expected Harvest','Status','Yield (kg)','Actions'].map(h=><th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No crops found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-cell font-medium text-gray-900">{c.name}</td>
                  <td className="table-cell text-gray-500">{c.variety||'-'}</td>
                  <td className="table-cell">{c.field||'-'}</td>
                  <td className="table-cell">{c.area_hectares||'-'}</td>
                  <td className="table-cell">{c.planting_date||'-'}</td>
                  <td className="table-cell">{c.expected_harvest||'-'}</td>
                  <td className="table-cell"><span className={statusColors[c.status]||'badge-gray'}>{c.status}</span></td>
                  <td className="table-cell">{c.yield_kg ? new Intl.NumberFormat().format(c.yield_kg) : '-'}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={()=>openEdit(c)} className="p-1.5 rounded text-blue-600 hover:bg-blue-50"><Pencil size={14}/></button>
                      <button onClick={()=>del(c.id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">{modal==='add'?'Add Crop':'Edit Crop'}</h2><button onClick={close}><X size={20}/></button></div>
            <div className="p-4 grid grid-cols-2 gap-4">
              {[['name','Crop Name',true],['variety','Variety'],['field','Field'],['area_hectares','Area (hectares)'],['planting_date','Planting Date'],['expected_harvest','Expected Harvest'],['actual_harvest','Actual Harvest'],['yield_kg','Yield (kg)']].map(([k,l,req])=>(
                <div key={k} className={k==='name'?'col-span-2':''}>
                  <label className="label">{l}{req&&<span className="text-red-500">*</span>}</label>
                  <input type={k.includes('date')||k.includes('harvest')?'date':'text'} className="input" value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} />
                </div>
              ))}
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                  {['planned','growing','harvested','failed'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button className="btn-secondary" onClick={close}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
