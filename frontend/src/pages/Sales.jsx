import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { salesApi } from '../services/api';

const statusColors = { completed:'badge-green', pending:'badge-yellow', cancelled:'badge-red' };
const empty = { product:'', customer:'', quantity:'', unit:'kg', unit_price:'', total_amount:'', date:new Date().toISOString().split('T')[0], status:'pending', payment_method:'bank_transfer', notes:'' };
const fmt = n => new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES',maximumFractionDigits:0}).format(n);

export default function Sales() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => Promise.all([salesApi.getAll(), salesApi.getSummary()])
    .then(([d,s])=>{setData(d);setSummary(s);setLoading(false);}).catch(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const save = async () => {
    if (!form.product) return toast.error('Product required');
    const payload = { ...form, total_amount: form.total_amount || (parseFloat(form.quantity||0) * parseFloat(form.unit_price||0)) };
    setSaving(true);
    try {
      if (modal==='add'){await salesApi.create(payload);toast.success('Sale recorded');}
      else{await salesApi.update(modal.id,payload);toast.success('Updated');}
      await load(); setModal(null);
    } catch(e){toast.error(e);}
    setSaving(false);
  };

  const del = async id => { if(!confirm('Delete?'))return; await salesApi.delete(id); toast.success('Deleted'); load(); };
  const filtered = data.filter(d => d.product.toLowerCase().includes(search.toLowerCase())||d.customer?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[['Total Revenue',fmt(summary.total_revenue),'bg-primary-600'],['Total Orders',summary.total_orders,'bg-blue-500'],['Pending',data.filter(d=>d.status==='pending').length,'bg-yellow-500'],['Completed',data.filter(d=>d.status==='completed').length,'bg-green-500']].map(([l,v,c])=>(
            <div key={l} className="card flex items-center gap-3">
              <div className={`w-10 h-10 ${c} rounded-lg flex items-center justify-center`}><ShoppingCart size={18} className="text-white"/></div>
              <div><p className="text-xs text-gray-500">{l}</p><p className="text-lg font-bold">{v}</p></div>
            </div>
          ))}
        </div>
      )}

      {summary?.by_product && summary.by_product.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Revenue by Product</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={summary.by_product.slice(0,8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis type="number" tick={{fontSize:11}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <YAxis type="category" dataKey="product" tick={{fontSize:11}} width={100}/>
              <Tooltip formatter={v=>fmt(v)}/>
              <Bar dataKey="total" fill="#16a34a" radius={[0,4,4,0]} name="Revenue"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card p-0">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9 w-64" placeholder="Search sales..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <button className="btn-primary" onClick={()=>{setForm(empty);setModal('add');}}><Plus size={16}/>Record Sale</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Date','Product','Customer','Qty','Unit Price','Total','Payment','Status','Actions'].map(h=><th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading?<tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
              :filtered.map(r=>(
                <tr key={r.id} className="table-row">
                  <td className="table-cell">{r.date}</td>
                  <td className="table-cell font-medium">{r.product}</td>
                  <td className="table-cell">{r.customer||'-'}</td>
                  <td className="table-cell">{r.quantity} {r.unit}</td>
                  <td className="table-cell">{r.unit_price?fmt(r.unit_price):'-'}</td>
                  <td className="table-cell font-semibold text-green-600">{fmt(r.total_amount)}</td>
                  <td className="table-cell text-xs">{r.payment_method?.replace('_',' ')}</td>
                  <td className="table-cell"><span className={statusColors[r.status]||'badge-gray'}>{r.status}</span></td>
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
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">{modal==='add'?'Record Sale':'Edit Sale'}</h2><button onClick={()=>setModal(null)}><X size={20}/></button></div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Product *</label><input className="input" value={form.product||''} onChange={e=>setForm(p=>({...p,product:e.target.value}))}/></div>
              <div><label className="label">Customer</label><input className="input" value={form.customer||''} onChange={e=>setForm(p=>({...p,customer:e.target.value}))}/></div>
              <div><label className="label">Date</label><input type="date" className="input" value={form.date||''} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
              <div><label className="label">Quantity</label><input type="number" className="input" value={form.quantity||''} onChange={e=>setForm(p=>({...p,quantity:e.target.value}))}/></div>
              <div><label className="label">Unit</label><input className="input" value={form.unit||''} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}/></div>
              <div><label className="label">Unit Price (KES)</label><input type="number" className="input" value={form.unit_price||''} onChange={e=>setForm(p=>({...p,unit_price:e.target.value}))}/></div>
              <div><label className="label">Total Amount (KES)</label><input type="number" className="input" value={form.total_amount||''} placeholder="Auto-calculated" onChange={e=>setForm(p=>({...p,total_amount:e.target.value}))}/></div>
              <div><label className="label">Payment Method</label><select className="input" value={form.payment_method||''} onChange={e=>setForm(p=>({...p,payment_method:e.target.value}))}>{['bank_transfer','cash','mobile_money','cheque'].map(m=><option key={m} value={m}>{m.replace('_',' ')}</option>)}</select></div>
              <div><label className="label">Status</label><select className="input" value={form.status||'pending'} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{['pending','completed','cancelled'].map(s=><option key={s}>{s}</option>)}</select></div>
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
