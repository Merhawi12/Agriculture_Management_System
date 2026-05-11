import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, Package, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryApi } from '../services/api';

const catColors = { Seeds:'badge-green', Fertilizer:'badge-blue', Pesticide:'badge-red', Fuel:'badge-yellow', Equipment:'badge-gray', Feed:'badge-green', 'Feed Additive':'badge-blue', 'Soil Amendment':'badge-gray' };
const empty = { name:'', category:'Seeds', quantity:'', unit:'kg', unit_price:'', supplier:'', location:'', min_quantity:'0', expiry_date:'', notes:'' };

export default function Inventory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [saving, setSaving] = useState(false);

  const load = () => inventoryApi.getAll().then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const save = async () => {
    if (!form.name) return toast.error('Name required');
    setSaving(true);
    try {
      if (modal==='add'){await inventoryApi.create(form);toast.success('Item added');}
      else{await inventoryApi.update(modal.id,form);toast.success('Updated');}
      await load(); setModal(null);
    } catch(e){toast.error(e);}
    setSaving(false);
  };

  const del = async id => { if(!confirm('Delete?'))return; await inventoryApi.delete(id); toast.success('Deleted'); load(); };
  const cats = ['All',...new Set(data.map(d=>d.category).filter(Boolean))];
  const lowStock = data.filter(d => d.quantity <= d.min_quantity);
  const totalValue = data.reduce((s,d) => s + (d.quantity||0)*(d.unit_price||0), 0);
  const filtered = data.filter(d =>
    (catFilter==='All'||d.category===catFilter) &&
    (d.name.toLowerCase().includes(search.toLowerCase())||d.supplier?.toLowerCase().includes(search.toLowerCase()))
  );

  const fmt = n => new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES',maximumFractionDigits:0}).format(n);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[['Total Items',data.length,'bg-primary-600',Package],['Low Stock',lowStock.length,'bg-red-500',AlertTriangle],['Categories',cats.length-1,'bg-blue-500',Package],['Total Value',fmt(totalValue),'bg-earth-600',Package]].map(([l,v,c,I])=>(
          <div key={l} className="card flex items-center gap-3">
            <div className={`w-10 h-10 ${c} rounded-lg flex items-center justify-center`}><I size={18} className="text-white"/></div>
            <div><p className="text-xs text-gray-500">{l}</p><p className="text-lg font-bold">{v}</p></div>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-medium text-red-800 flex items-center gap-2"><AlertTriangle size={16}/>Low Stock Alert</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {lowStock.map(i=><span key={i.id} className="badge-red">{i.name}: {i.quantity} {i.unit} (min: {i.min_quantity})</span>)}
          </div>
        </div>
      )}

      <div className="card p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9 w-56" placeholder="Search items..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <select className="input w-40" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
              {cats.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={()=>{setForm(empty);setModal('add');}}><Plus size={16}/>Add Item</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Item','Category','Quantity','Unit','Unit Price','Value','Supplier','Min Qty','Actions'].map(h=><th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading?<tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
              :filtered.map(r=>(
                <tr key={r.id} className={`table-row ${r.quantity<=r.min_quantity?'bg-red-50/50':''}`}>
                  <td className="table-cell font-medium">{r.name}</td>
                  <td className="table-cell"><span className={catColors[r.category]||'badge-gray'}>{r.category}</span></td>
                  <td className={`table-cell font-semibold ${r.quantity<=r.min_quantity?'text-red-600':''}`}>{r.quantity}</td>
                  <td className="table-cell">{r.unit}</td>
                  <td className="table-cell">{r.unit_price?fmt(r.unit_price):'-'}</td>
                  <td className="table-cell">{r.unit_price?fmt(r.quantity*r.unit_price):'-'}</td>
                  <td className="table-cell">{r.supplier||'-'}</td>
                  <td className="table-cell">{r.min_quantity}</td>
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
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">{modal==='add'?'Add Item':'Edit Item'}</h2><button onClick={()=>setModal(null)}><X size={20}/></button></div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Name *</label><input className="input" value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
              <div><label className="label">Category</label><select className="input" value={form.category||'Seeds'} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>{['Seeds','Fertilizer','Pesticide','Fuel','Equipment','Feed','Feed Additive','Soil Amendment','Other'].map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label className="label">Quantity</label><input type="number" className="input" value={form.quantity||''} onChange={e=>setForm(p=>({...p,quantity:e.target.value}))}/></div>
              <div><label className="label">Unit</label><input className="input" value={form.unit||''} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}/></div>
              <div><label className="label">Unit Price (KES)</label><input type="number" className="input" value={form.unit_price||''} onChange={e=>setForm(p=>({...p,unit_price:e.target.value}))}/></div>
              <div><label className="label">Min Quantity</label><input type="number" className="input" value={form.min_quantity||0} onChange={e=>setForm(p=>({...p,min_quantity:e.target.value}))}/></div>
              <div><label className="label">Supplier</label><input className="input" value={form.supplier||''} onChange={e=>setForm(p=>({...p,supplier:e.target.value}))}/></div>
              <div><label className="label">Location</label><input className="input" value={form.location||''} onChange={e=>setForm(p=>({...p,location:e.target.value}))}/></div>
              <div><label className="label">Expiry Date</label><input type="date" className="input" value={form.expiry_date||''} onChange={e=>setForm(p=>({...p,expiry_date:e.target.value}))}/></div>
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
