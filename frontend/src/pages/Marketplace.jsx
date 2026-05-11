import { useState, useEffect, useCallback } from 'react';
import { marketplaceApi } from '../services/api';
import toast from 'react-hot-toast';
import {
  ShoppingBag, Plus, Search, Filter, Package, Users, ClipboardList, Truck,
  BarChart2, Edit2, Trash2, X, ChevronDown, Tag, MapPin, Star, TrendingUp,
  CheckCircle, Clock, AlertCircle, DollarSign, RefreshCw, Eye
} from 'lucide-react';

const TABS = [
  { id: 'products',   label: 'Products',    icon: Package },
  { id: 'orders',     label: 'Orders',      icon: ClipboardList },
  { id: 'deliveries', label: 'Deliveries',  icon: Truck },
  { id: 'buyers',     label: 'Buyers',      icon: Users },
];

const STATUS_COLORS = {
  available:   'bg-green-100 text-green-700',
  sold:        'bg-gray-100 text-gray-600',
  reserved:    'bg-yellow-100 text-yellow-700',
  pending:     'bg-yellow-100 text-yellow-700',
  confirmed:   'bg-blue-100 text-blue-700',
  processing:  'bg-blue-100 text-blue-700',
  shipped:     'bg-purple-100 text-purple-700',
  delivered:   'bg-green-100 text-green-700',
  cancelled:   'bg-red-100 text-red-700',
  in_transit:  'bg-purple-100 text-purple-700',
};

const CATEGORIES = ['Grains', 'Vegetables', 'Fruits', 'Livestock', 'Dairy', 'Poultry', 'Seeds', 'Fertilizers', 'Equipment', 'Other'];
const UNITS = ['kg', 'bag', 'crate', 'piece', 'litre', 'ton', 'dozen'];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

/* ── Product Modal ─────────────────────────────────────────── */
function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product || {
    name: '', category: 'Grains', quantity: '', unit: 'kg',
    price_per_unit: '', quality_grade: 'A', location: '', description: '', status: 'available'
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name || !form.quantity || !form.price_per_unit) return toast.error('Fill required fields');
    setSaving(true);
    try {
      if (form.id) await marketplaceApi.updateProduct(form.id, form);
      else await marketplaceApi.createProduct(form);
      toast.success(form.id ? 'Product updated' : 'Product listed');
      onSave();
    } catch (err) { toast.error(typeof err === 'string' ? err : 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={form.id ? 'Edit Product' : 'List New Product'} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label">Product Name *</label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Premium Maize" />
          </div>
          <div>
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Quality Grade</label>
            <select className="form-input" value={form.quality_grade} onChange={set('quality_grade')}>
              {['A+','A','B','C'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Quantity *</label>
            <input className="form-input" type="number" value={form.quantity} onChange={set('quantity')} placeholder="0" />
          </div>
          <div>
            <label className="form-label">Unit</label>
            <select className="form-input" value={form.unit} onChange={set('unit')}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Price per Unit (KES) *</label>
            <input className="form-input" type="number" value={form.price_per_unit} onChange={set('price_per_unit')} placeholder="0" />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={set('status')}>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="form-label">Location</label>
            <input className="form-input" value={form.location} onChange={set('location')} placeholder="e.g. Nakuru, Kenya" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={set('description')} placeholder="Details about your product..." />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary">
            {saving ? 'Saving…' : 'Save Listing'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Order Modal ───────────────────────────────────────────── */
function OrderModal({ products, buyers, onClose, onSave }) {
  const [form, setForm] = useState({ product_id: '', buyer_id: '', quantity: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const selectedProduct = products.find(p => String(p.id) === String(form.product_id));

  const handleSave = async () => {
    if (!form.product_id || !form.buyer_id || !form.quantity) return toast.error('Fill required fields');
    setSaving(true);
    try {
      await marketplaceApi.createOrder({ ...form, quantity: Number(form.quantity) });
      toast.success('Order placed');
      onSave();
    } catch (err) { toast.error(typeof err === 'string' ? err : 'Order failed'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Place New Order" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="form-label">Product *</label>
          <select className="form-input" value={form.product_id} onChange={set('product_id')}>
            <option value="">Select product…</option>
            {products.filter(p => p.status === 'available').map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.quantity} {p.unit} @ KES {Number(p.price_per_unit).toLocaleString()}</option>
            ))}
          </select>
        </div>
        {selectedProduct && (
          <div className="bg-green-50 rounded-xl p-3 text-sm text-green-800 flex gap-4">
            <span>Available: <strong>{selectedProduct.quantity} {selectedProduct.unit}</strong></span>
            <span>Price: <strong>KES {Number(selectedProduct.price_per_unit).toLocaleString()}/{selectedProduct.unit}</strong></span>
          </div>
        )}
        <div>
          <label className="form-label">Buyer *</label>
          <select className="form-input" value={form.buyer_id} onChange={set('buyer_id')}>
            <option value="">Select buyer…</option>
            {buyers.map(b => <option key={b.id} value={b.id}>{b.name} — {b.company || b.location}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Quantity *</label>
          <input className="form-input" type="number" value={form.quantity} onChange={set('quantity')}
            max={selectedProduct?.quantity} placeholder="0" />
          {selectedProduct && form.quantity && (
            <p className="text-xs text-gray-500 mt-1">
              Total: KES {(Number(form.quantity) * Number(selectedProduct.price_per_unit)).toLocaleString()}
            </p>
          )}
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-input" rows={2} value={form.notes} onChange={set('notes')} placeholder="Special instructions…" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary">
            {saving ? 'Placing…' : 'Place Order'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Buyer Modal ───────────────────────────────────────────── */
function BuyerModal({ buyer, onClose, onSave }) {
  const [form, setForm] = useState(buyer || { name: '', company: '', phone: '', email: '', location: '', buyer_type: 'individual' });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required');
    setSaving(true);
    try {
      if (form.id) await marketplaceApi.updateBuyer(form.id, form);
      else await marketplaceApi.createBuyer(form);
      toast.success(form.id ? 'Buyer updated' : 'Buyer added');
      onSave();
    } catch (err) { toast.error(typeof err === 'string' ? err : 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={form.id ? 'Edit Buyer' : 'Add Buyer'} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="Buyer name" />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select className="form-input" value={form.buyer_type} onChange={set('buyer_type')}>
              <option value="individual">Individual</option>
              <option value="company">Company</option>
              <option value="cooperative">Cooperative</option>
              <option value="ngo">NGO</option>
            </select>
          </div>
          <div>
            <label className="form-label">Company / Org</label>
            <input className="form-input" value={form.company} onChange={set('company')} placeholder="Optional" />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="+254 7XX XXX XXX" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="buyer@email.com" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Location</label>
            <input className="form-input" value={form.location} onChange={set('location')} placeholder="City, Country" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary">
            {saving ? 'Saving…' : 'Save Buyer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Generic Modal wrapper ─────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function Marketplace() {
  const [tab, setTab] = useState('products');
  const [products, setProducts]   = useState([]);
  const [orders, setOrders]       = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [buyers, setBuyers]       = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // { type, data }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, o, d, b, s] = await Promise.all([
        marketplaceApi.getProducts(),
        marketplaceApi.getOrders(),
        marketplaceApi.getDeliveries(),
        marketplaceApi.getBuyers(),
        marketplaceApi.getSummary(),
      ]);
      setProducts(Array.isArray(p) ? p : []);
      setOrders(Array.isArray(o) ? o : []);
      setDeliveries(Array.isArray(d) ? d : []);
      setBuyers(Array.isArray(b) ? b : []);
      setSummary(s);
    } catch { toast.error('Failed to load marketplace data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const closeModal = () => { setModal(null); load(); };

  const deleteProduct = async id => {
    if (!confirm('Delete this product?')) return;
    try { await marketplaceApi.deleteProduct(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const deleteOrder = async id => {
    if (!confirm('Cancel this order?')) return;
    try { await marketplaceApi.deleteOrder(id); toast.success('Order cancelled'); load(); }
    catch { toast.error('Failed'); }
  };

  const updateOrderStatus = async (id, status) => {
    try { await marketplaceApi.updateOrder(id, { status }); toast.success(`Order ${status}`); load(); }
    catch { toast.error('Update failed'); }
  };

  const updateDelivery = async (id, status) => {
    try { await marketplaceApi.updateDelivery(id, { status }); toast.success('Delivery updated'); load(); }
    catch { toast.error('Update failed'); }
  };

  const deleteBuyer = async id => {
    if (!confirm('Remove this buyer?')) return;
    try { await marketplaceApi.deleteBuyer(id); toast.success('Removed'); load(); }
    catch { toast.error('Delete failed'); }
  };

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.location?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category === catFilter;
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const filteredOrders = orders.filter(o => {
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchSearch = !search || o.product_name?.toLowerCase().includes(search.toLowerCase()) || o.buyer_name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 text-green-500 animate-spin mx-auto mb-2" />
        <p className="text-gray-500">Loading marketplace…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-green-600" /> Marketplace
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Sell your farm products &amp; manage orders</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Package}      label="Active Listings" value={summary.activeListings ?? 0}         color="bg-green-500" />
          <StatCard icon={ClipboardList} label="Total Orders"    value={summary.totalOrders ?? 0}            color="bg-blue-500" />
          <StatCard icon={DollarSign}   label="Revenue (KES)"   value={`${((summary.totalRevenue ?? 0)/1000).toFixed(0)}K`} color="bg-emerald-500" />
          <StatCard icon={Truck}        label="In Transit"       value={summary.inTransitDeliveries ?? 0}    color="bg-purple-500" />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); setStatusFilter(''); setCatFilter(''); }}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex-1 min-w-[180px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab}…`}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>

            {tab === 'products' && (
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            )}
            {(tab === 'products' || tab === 'orders') && (
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                <option value="">All Status</option>
                {tab === 'products'
                  ? ['available','reserved','sold'].map(s => <option key={s} value={s}>{s}</option>)
                  : ['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)
                }
              </select>
            )}

            {tab === 'products' && (
              <button onClick={() => setModal({ type: 'product', data: null })} className="btn-primary flex items-center gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> List Product
              </button>
            )}
            {tab === 'orders' && (
              <button onClick={() => setModal({ type: 'order' })} className="btn-primary flex items-center gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> New Order
              </button>
            )}
            {tab === 'buyers' && (
              <button onClick={() => setModal({ type: 'buyer', data: null })} className="btn-primary flex items-center gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> Add Buyer
              </button>
            )}
          </div>

          {/* ── PRODUCTS ── */}
          {tab === 'products' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.length === 0 && <EmptyState icon={Package} text="No products found" />}
              {filteredProducts.map(p => (
                <div key={p.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{p.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{p.category} · Grade {p.quality_grade}</p>
                    </div>
                    <Badge status={p.status} />
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-green-500" /><span className="font-semibold text-gray-800">KES {Number(p.price_per_unit).toLocaleString()}/{p.unit}</span></div>
                    <div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-blue-500" />{p.quantity} {p.unit} available</div>
                    {p.location && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-400" />{p.location}</div>}
                  </div>
                  {p.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{p.description}</p>}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal({ type: 'product', data: p })} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs py-1.5 flex items-center justify-center gap-1 transition">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── ORDERS ── */}
          {tab === 'orders' && (
            <div className="space-y-3">
              {filteredOrders.length === 0 && <EmptyState icon={ClipboardList} text="No orders found" />}
              {filteredOrders.map(o => (
                <div key={o.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{o.product_name}</span>
                        <Badge status={o.status} />
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Buyer: <span className="font-medium text-gray-700">{o.buyer_name}</span> ·
                        Qty: <span className="font-medium">{o.quantity} {o.unit}</span> ·
                        <span className="text-green-600 font-semibold"> KES {Number(o.total_price || 0).toLocaleString()}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(o.order_date || o.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>
                    </div>
                    <div className="flex gap-2">
                      {o.status === 'pending' && (
                        <>
                          <button onClick={() => updateOrderStatus(o.id, 'confirmed')} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Confirm
                          </button>
                          <button onClick={() => updateOrderStatus(o.id, 'cancelled')} className="bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs py-1.5 px-3 flex items-center gap-1 transition">
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </>
                      )}
                      {o.status === 'confirmed' && (
                        <button onClick={() => updateOrderStatus(o.id, 'processing')} className="btn-secondary text-xs py-1.5 px-3">
                          Mark Processing
                        </button>
                      )}
                      {o.status === 'processing' && (
                        <button onClick={() => updateOrderStatus(o.id, 'shipped')} className="btn-secondary text-xs py-1.5 px-3">
                          Mark Shipped
                        </button>
                      )}
                      {!['pending','confirmed','processing'].includes(o.status) && (
                        <button onClick={() => deleteOrder(o.id)} className="bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs py-1.5 px-3 transition">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  {o.notes && <p className="text-xs text-gray-400 mt-2 bg-gray-50 rounded-lg px-3 py-2">{o.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {/* ── DELIVERIES ── */}
          {tab === 'deliveries' && (
            <div className="space-y-3">
              {deliveries.length === 0 && <EmptyState icon={Truck} text="No deliveries yet" />}
              {deliveries.map(d => (
                <div key={d.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold text-gray-800">Order #{d.order_id}</span>
                        <Badge status={d.status} />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">{d.delivery_address || 'Address TBD'}</span>
                        {d.tracking_number && <> · Track: <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{d.tracking_number}</span></>}
                      </p>
                      {d.estimated_delivery && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Est. {new Date(d.estimated_delivery).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {d.status === 'pending' && (
                        <button onClick={() => updateDelivery(d.id, 'in_transit')} className="btn-secondary text-xs py-1.5 px-3">
                          Mark In Transit
                        </button>
                      )}
                      {d.status === 'in_transit' && (
                        <button onClick={() => updateDelivery(d.id, 'delivered')} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── BUYERS ── */}
          {tab === 'buyers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {buyers.filter(b => !search || b.name?.toLowerCase().includes(search.toLowerCase())).length === 0 && <EmptyState icon={Users} text="No buyers found" />}
              {buyers.filter(b => !search || b.name?.toLowerCase().includes(search.toLowerCase())).map(b => (
                <div key={b.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {b.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{b.name}</p>
                      <p className="text-xs text-gray-500">{b.buyer_type} {b.company ? `· ${b.company}` : ''}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    {b.phone && <p>📞 {b.phone}</p>}
                    {b.email && <p>✉️ {b.email}</p>}
                    {b.location && <p>📍 {b.location}</p>}
                    {b.total_orders !== undefined && <p className="text-green-600 font-medium">🛒 {b.total_orders} orders</p>}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal({ type: 'buyer', data: b })} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => deleteBuyer(b.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs py-1.5 flex items-center justify-center gap-1 transition">
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'product' && <ProductModal product={modal.data} onClose={closeModal} onSave={closeModal} />}
      {modal?.type === 'order'   && <OrderModal products={products} buyers={buyers} onClose={closeModal} onSave={closeModal} />}
      {modal?.type === 'buyer'   && <BuyerModal buyer={modal.data} onClose={closeModal} onSave={closeModal} />}

      <style>{`
        .form-label  { display: block; font-size: 0.8rem; font-weight: 500; color: #374151; margin-bottom: 0.375rem; }
        .form-input  { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.625rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; transition: box-shadow 0.15s; }
        .form-input:focus { box-shadow: 0 0 0 2px rgba(34,197,94,0.3); border-color: #22c55e; }
        .btn-primary  { background: linear-gradient(135deg, #22c55e, #10b981); color: white; font-weight: 600; padding: 0.5rem 1rem; border-radius: 0.625rem; transition: opacity 0.15s; cursor: pointer; }
        .btn-primary:hover  { opacity: 0.9; }
        .btn-secondary { background: #f3f4f6; color: #374151; font-weight: 500; padding: 0.5rem 1rem; border-radius: 0.625rem; transition: background 0.15s; cursor: pointer; }
        .btn-secondary:hover { background: #e5e7eb; }
      `}</style>
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="col-span-full flex flex-col items-center py-16 text-gray-400">
      <Icon className="w-12 h-12 mb-3 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
