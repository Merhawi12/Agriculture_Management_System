import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { financeApi } from '../services/api';

const fmt = n => new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES',maximumFractionDigits:0}).format(n);
const empty = { type:'expense', category:'', amount:'', date:new Date().toISOString().split('T')[0], description:'', payment_method:'bank_transfer', reference:'' };
const incomeCategories = ['Crop Sales','Livestock Sales','Dairy Products','Equipment Rental','Government Subsidy','Other Income'];
const expenseCategories = ['Seeds','Fertilizer','Pesticide','Fuel','Labor','Equipment Maintenance','Irrigation','Transport','Marketing','Utilities','Other Expense'];

export default function Finance() {
  const [txs, setTxs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  const load = () => Promise.all([financeApi.getAll(), financeApi.getSummary()])
    .then(([t,s])=>{setTxs(t);setSummary(s);setLoading(false);}).catch(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const save = async () => {
    if (!form.amount) return toast.error('Amount required');
    setSaving(true);
    try {
      if (modal==='add'){await financeApi.create(form);toast.success('Transaction added');}
      else{await financeApi.update(modal.id,form);toast.success('Updated');}
      await load(); setModal(null);
    } catch(e){toast.error(e);}
    setSaving(false);
  };

  const del = async id => { if(!confirm('Delete?'))return; await financeApi.delete(id); toast.success('Deleted'); load(); };
  const filtered = txs.filter(t => filter==='all'||t.type===filter);

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card bg-green-50 border-green-100">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center"><TrendingUp size={18} className="text-white"/></div><div><p className="text-xs text-green-700">Total Income</p><p className="text-2xl font-bold text-green-800">{fmt(summary.income)}</p></div></div>
          </div>
          <div className="card bg-red-50 border-red-100">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center"><TrendingDown size={18} className="text-white"/></div><div><p className="text-xs text-red-700">Total Expenses</p><p className="text-2xl font-bold text-red-800">{fmt(summary.expenses)}</p></div></div>
          </div>
          <div className={`card ${summary.profit>=0?'bg-primary-50 border-primary-100':'bg-orange-50 border-orange-100'}`}>
            <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${summary.profit>=0?'bg-primary-500':'bg-orange-500'}`}><DollarSign size={18} className="text-white"/></div><div><p className={`text-xs ${summary.profit>=0?'text-primary-700':'text-orange-700'}`}>Net Profit</p><p className={`text-2xl font-bold ${summary.profit>=0?'text-primary-800':'text-orange-800'}`}>{fmt(summary.profit)}</p></div></div>
          </div>
        </div>
      )}

      {summary?.monthly && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="month" tick={{fontSize:12}}/>
              <YAxis tick={{fontSize:12}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>fmt(v)}/>
              <Legend/>
              <Bar dataKey="income" fill="#16a34a" name="Income" radius={[4,4,0,0]}/>
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100">
          <div className="flex gap-2">
            {['all','income','expense'].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter===f?'bg-primary-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={()=>{setForm(empty);setModal('add');}}><Plus size={16}/>Add Transaction</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Date','Type','Category','Description','Amount','Payment','Actions'].map(h=><th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading?<tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              :filtered.map(r=>(
                <tr key={r.id} className="table-row">
                  <td className="table-cell">{r.date}</td>
                  <td className="table-cell"><span className={r.type==='income'?'badge-green':'badge-red'}>{r.type}</span></td>
                  <td className="table-cell">{r.category||'-'}</td>
                  <td className="table-cell">{r.description||'-'}</td>
                  <td className={`table-cell font-semibold ${r.type==='income'?'text-green-600':'text-red-600'}`}>{r.type==='income'?'+':'-'}{fmt(r.amount)}</td>
                  <td className="table-cell text-xs">{r.payment_method?.replace('_',' ')}</td>
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
            <div className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">{modal==='add'?'Add Transaction':'Edit Transaction'}</h2><button onClick={()=>setModal(null)}><X size={20}/></button></div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div>
                <label className="label">Type *</label>
                <select className="input" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value,category:''}))}>
                  <option value="income">Income</option><option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category||''} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                  <option value="">Select...</option>
                  {(form.type==='income'?incomeCategories:expenseCategories).map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">Amount (KES) *</label><input type="number" className="input" value={form.amount||''} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/></div>
              <div><label className="label">Date</label><input type="date" className="input" value={form.date||''} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
              <div className="col-span-2"><label className="label">Description</label><input className="input" value={form.description||''} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
              <div>
                <label className="label">Payment Method</label>
                <select className="input" value={form.payment_method||''} onChange={e=>setForm(p=>({...p,payment_method:e.target.value}))}>
                  {['bank_transfer','cash','mobile_money','cheque'].map(m=><option key={m} value={m}>{m.replace('_',' ')}</option>)}
                </select>
              </div>
              <div><label className="label">Reference</label><input className="input" value={form.reference||''} onChange={e=>setForm(p=>({...p,reference:e.target.value}))}/></div>
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
