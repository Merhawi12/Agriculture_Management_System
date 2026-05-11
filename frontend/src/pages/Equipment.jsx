import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, Wrench, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { equipmentApi } from '../services/api';

const statusColors = { operational:'badge-green', under_maintenance:'badge-yellow', broken:'badge-red', retired:'badge-gray' };
const empty = { name:'', type:'', model:'', serial_number:'', purchase_date:'', purchase_price:'', status:'operational', last_maintenance:'', next_maintenance:'', location:'', notes:'' };
const types = ['Tractor','Harvester','Planter','Sprayer','Pump','Dryer','Vehicle','Trailer','Generator','Other'];

export default function Equipment() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => equipmentApi.getAll().then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const save = async () => {
    if (!form.name) return toast.error('Name required');
    setSaving(true);
    try {
      if (modal==='add'){await equipmentApi.create(form);toast.success('Equipment added');}
      else{await equipmentApi.update(modal.id,form);toast.success('Updated');}
      await load(); setModal(null);
    } catch(e){toast.error(e);}
    setSaving(false);
  };

  const del = async id => { if(!confirm('Delete?'))return; await equipmentApi.delete(id); toast.success('Deleted'); load(); };
  const filtered = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase())||d.type?.toLowerCase().includes(search.toLowerCase()));
  const totalValue = data.reduce((s,d)=>s+(d.purchase_price||0),0);
  const dueMaintenance = data.filter(d=>d.next_maintenance && new Date(d.next_maintenance)<=new Date());
  const fmt = n => new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES',maximumFractionDigits:0}).format(n);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[['Total Equipment',data.length,'bg-purple-600'],['Operational',data.filter(d=>d.status==='operational').length,'bg-green-500'],['Maintenance Due',dueMaintenance.length,'bg-yellow-500'],['Total Asset Value',fmt(totalValue),'bg-blue-600']].map(([l,v,c])=>(
          <div key={l} className="card flex items-center gap-3">
            <div className={`w-10 h-10 ${c} rounded-lg flex items-center justify-center`}><Wrench size={18} className="text-white"/></div>
            <div><p className="text-xs text-gray-500">{l}</p><p className="text-lg font-bold">{v}</p></div>
          </div>
        ))}
      </div>

      {dueMaintenance.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-medium text-yellow-800 flex items-center gap-2 mb-2"><AlertTriangle size={16}/>Maintenance Due</h3>
          <div className="flex flex-wrap gap-2">
            {dueMaintenance.map(e=><span key={e.id} className="badge-yellow">{e.name} — due {e.next_maintenance}</span>)}
          </div>
        </div>
      )}

      <div className="card p-0">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9 w-64" placeholder="Search equipment..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <button className="btn-primary" onClick={()=>{setForm(empty);setModal('add');}}><Plus size={16}/>Add Equipment</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Name','Type','Model','Status','Location','Purchase Date','Value','Last Maintenance','Next Maintenance','Actions'].map(h=><th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading?<tr><td colSpan={10} className="text-center py-12 text-gray-400">Loading...</td></tr>
              :filtered.map(r=>(
                <tr key={r.id} className="table-row">
                  <td className="table-cell font-medium">{r.name}</td>
                  <td className="table-cell">{r.type||'-'}</td>
                  <td className="table-cell text-xs text-gray-500">{r.model||'-'}</td>
                  <td className="table-cell"><span className={statusColors[r.status]||'badge-gray'}>{r.status?.replace('_',' ')}</span></td>
                  <td className="table-cell">{r.location||'-'}</td>
                  <td className="table-cell">{r.purchase_date||'-'}</td>
                  <td className="table-cell">{r.purchase_price?fmt(r.purchase_price):'-'}</td>
                  <td className="table-cell">{r.last_maintenance||'-'}</td>
                  <td className={`table-cell ${r.next_maintenance&&new Date(r.next_maintenance)<=new Date()?'text-red-600 font-medium':''}`}>{r.next_maintenance||'-'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={()=>{setForm(r);setModal(r);}} className="p-1.5 rounded text-blue-600 hover:bg-blue-50"><Pencil size={14}/></button>
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
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">{modal==='add'?'Add Equipment':'Edit Equipment'}</h2><button onClick={()=>setModal(null)}><X size={20}/></button></div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Name *</label><input className="input" value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
              <div><label className="label">Type</label><select className="input" value={form.type||''} onChange={e=>setForm(p=>({...p,type:e.target.value}))}><option value="">Select...</option>{types.map(t=><option key={t}>{t}</option>)}</select></div>
              <div><label className="label">Model</label><input className="input" value={form.model||''} onChange={e=>setForm(p=>({...p,model:e.target.value}))}/></div>
              <div><label className="label">Serial Number</label><input className="input" value={form.serial_number||''} onChange={e=>setForm(p=>({...p,serial_number:e.target.value}))}/></div>
              <div><label className="label">Purchase Date</label><input type="date" className="input" value={form.purchase_date||''} onChange={e=>setForm(p=>({...p,purchase_date:e.target.value}))}/></div>
              <div><label className="label">Purchase Price (KES)</label><input type="number" className="input" value={form.purchase_price||''} onChange={e=>setForm(p=>({...p,purchase_price:e.target.value}))}/></div>
              <div><label className="label">Status</label><select className="input" value={form.status||'operational'} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{['operational','under_maintenance','broken','retired'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}</select></div>
              <div><label className="label">Location</label><input className="input" value={form.location||''} onChange={e=>setForm(p=>({...p,location:e.target.value}))}/></div>
              <div><label className="label">Last Maintenance</label><input type="date" className="input" value={form.last_maintenance||''} onChange={e=>setForm(p=>({...p,last_maintenance:e.target.value}))}/></div>
              <div><label className="label">Next Maintenance</label><input type="date" className="input" value={form.next_maintenance||''} onChange={e=>setForm(p=>({...p,next_maintenance:e.target.value}))}/></div>
              <div className="col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
