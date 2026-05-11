import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, Beef } from 'lucide-react';
import toast from 'react-hot-toast';
import { livestockApi } from '../services/api';

const healthColors = { healthy:'badge-green', under_treatment:'badge-yellow', sick:'badge-red', deceased:'badge-gray' };
const empty = { tag_id:'', type:'Cattle', breed:'', gender:'Female', birth_date:'', weight_kg:'', health_status:'healthy', location:'', notes:'' };

export default function Livestock() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => livestockApi.getAll().then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const openAdd = () => { setForm(empty); setModal('add'); };
  const openEdit = r => { setForm(r); setModal(r); };
  const close = () => setModal(null);

  const save = async () => {
    if (!form.type) return toast.error('Type is required');
    setSaving(true);
    try {
      if (modal === 'add') { await livestockApi.create(form); toast.success('Animal added'); }
      else { await livestockApi.update(modal.id, form); toast.success('Updated'); }
      await load(); close();
    } catch(e){ toast.error(e); }
    setSaving(false);
  };

  const del = async id => { if(!confirm('Delete?'))return; await livestockApi.delete(id); toast.success('Deleted'); load(); };

  const types = [...new Set(data.map(d=>d.type))];
  const filtered = data.filter(d=>
    d.type.toLowerCase().includes(search.toLowerCase()) ||
    d.tag_id?.toLowerCase().includes(search.toLowerCase()) ||
    d.breed?.toLowerCase().includes(search.toLowerCase())
  );

  const statsByType = types.map(t=>({ type:t, count:data.filter(d=>d.type===t).length }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[['Total Animals',data.length,'bg-earth-600'],['Healthy',data.filter(d=>d.health_status==='healthy').length,'bg-green-500'],['Under Treatment',data.filter(d=>d.health_status==='under_treatment').length,'bg-yellow-500'],['Types',types.length,'bg-blue-500']].map(([l,v,c])=>(
          <div key={l} className="card flex items-center gap-3">
            <div className={`w-10 h-10 ${c} rounded-lg flex items-center justify-center`}><Beef size={18} className="text-white"/></div>
            <div><p className="text-xs text-gray-500">{l}</p><p className="text-xl font-bold">{v}</p></div>
          </div>
        ))}
      </div>

      {/* By type */}
      <div className="flex gap-3 flex-wrap">
        {statsByType.map(t=>(
          <div key={t.type} className="card !p-3 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{t.type}:</span>
            <span className="badge-green">{t.count} head</span>
          </div>
        ))}
      </div>

      <div className="card p-0">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9 w-64" placeholder="Search livestock..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <button className="btn-primary" onClick={openAdd}><Plus size={16}/>Add Animal</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Tag ID','Type','Breed','Gender','Birth Date','Weight (kg)','Health','Location','Actions'].map(h=><th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading?<tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
              :filtered.length===0?<tr><td colSpan={9} className="text-center py-12 text-gray-400">No animals found</td></tr>
              :filtered.map(r=>(
                <tr key={r.id} className="table-row">
                  <td className="table-cell font-mono text-xs">{r.tag_id||'-'}</td>
                  <td className="table-cell font-medium">{r.type}</td>
                  <td className="table-cell">{r.breed||'-'}</td>
                  <td className="table-cell">{r.gender||'-'}</td>
                  <td className="table-cell">{r.birth_date||'-'}</td>
                  <td className="table-cell">{r.weight_kg||'-'}</td>
                  <td className="table-cell"><span className={healthColors[r.health_status]||'badge-gray'}>{r.health_status?.replace('_',' ')}</span></td>
                  <td className="table-cell">{r.location||'-'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={()=>openEdit(r)} className="p-1.5 rounded text-blue-600 hover:bg-blue-50"><Pencil size={14}/></button>
                      <button onClick={()=>del(r.id)} className="p-1.5 rounded text-red-600 hover:bg-red-50"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">{modal==='add'?'Add Animal':'Edit Animal'}</h2><button onClick={close}><X size={20}/></button></div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div><label className="label">Tag ID</label><input className="input" value={form.tag_id||''} onChange={e=>setForm(p=>({...p,tag_id:e.target.value}))}/></div>
              <div>
                <label className="label">Type *</label>
                <select className="input" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                  {['Cattle','Sheep','Goat','Pig','Chicken','Duck','Horse','Rabbit'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="label">Breed</label><input className="input" value={form.breed||''} onChange={e=>setForm(p=>({...p,breed:e.target.value}))}/></div>
              <div>
                <label className="label">Gender</label>
                <select className="input" value={form.gender||'Female'} onChange={e=>setForm(p=>({...p,gender:e.target.value}))}>
                  {['Male','Female'].map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
              <div><label className="label">Birth Date</label><input type="date" className="input" value={form.birth_date||''} onChange={e=>setForm(p=>({...p,birth_date:e.target.value}))}/></div>
              <div><label className="label">Weight (kg)</label><input type="number" className="input" value={form.weight_kg||''} onChange={e=>setForm(p=>({...p,weight_kg:e.target.value}))}/></div>
              <div>
                <label className="label">Health Status</label>
                <select className="input" value={form.health_status||'healthy'} onChange={e=>setForm(p=>({...p,health_status:e.target.value}))}>
                  {['healthy','under_treatment','sick','deceased'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="label">Location</label><input className="input" value={form.location||''} onChange={e=>setForm(p=>({...p,location:e.target.value}))}/></div>
              <div className="col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
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
