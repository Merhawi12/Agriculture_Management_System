import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../services/api';
import toast from 'react-hot-toast';
import {
  Bell, CloudRain, Droplets, Bug, Info, CheckCircle, AlertTriangle,
  Trash2, MailOpen, Mail, RefreshCw, Send, X, BellOff, MessageSquare,
  Smartphone, AtSign, Plus, Check
} from 'lucide-react';

const TYPE_META = {
  weather:    { icon: CloudRain,  color: 'bg-blue-100 text-blue-600',    label: 'Weather' },
  irrigation: { icon: Droplets,  color: 'bg-cyan-100 text-cyan-600',     label: 'Irrigation' },
  disease:    { icon: Bug,       color: 'bg-red-100 text-red-600',       label: 'Disease' },
  system:     { icon: Info,      color: 'bg-gray-100 text-gray-600',     label: 'System' },
  alert:      { icon: AlertTriangle, color: 'bg-orange-100 text-orange-600', label: 'Alert' },
  general:    { icon: Bell,      color: 'bg-green-100 text-green-600',   label: 'General' },
};

const FILTER_TYPES = ['all', 'weather', 'irrigation', 'disease', 'system', 'general'];
const CHANNELS = [
  { id: 'sms',   icon: Smartphone, label: 'SMS' },
  { id: 'email', icon: AtSign,     label: 'Email' },
  { id: 'push',  icon: Bell,       label: 'Push' },
];

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

function NotificationItem({ n, onRead, onDelete }) {
  const meta = TYPE_META[n.type] || TYPE_META.general;
  const Icon = meta.icon;
  return (
    <div className={`flex gap-3 p-4 rounded-2xl border transition-all ${n.is_read ? 'bg-white border-gray-100' : 'bg-blue-50/50 border-blue-100'}`}>
      <div className={`w-10 h-10 ${meta.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`text-sm font-semibold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!n.is_read && (
              <button onClick={() => onRead(n.id)} title="Mark as read"
                className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-500 transition">
                <MailOpen className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => onDelete(n.id)} title="Delete"
              className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
            {meta.label}
          </span>
          <span className="text-xs text-gray-400">{timeAgo(n.created_at || n.timestamp)}</span>
          {n.channels && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              {n.channels.includes('sms') && <Smartphone className="w-3 h-3" />}
              {n.channels.includes('email') && <AtSign className="w-3 h-3" />}
              {n.channels.includes('push') && <Bell className="w-3 h-3" />}
            </span>
          )}
          {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
        </div>
      </div>
    </div>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [sending, setSending]   = useState(false);
  const [quickSending, setQuickSending] = useState('');

  const [form, setForm] = useState({
    type: 'general', title: '', message: '',
    channels: ['push'],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (unreadOnly) params.unread = true;
      const data = await notificationsApi.getAll(params);
      setNotifications(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }, [typeFilter, unreadOnly]);

  useEffect(() => { load(); }, [load]);

  const handleRead = async id => {
    try { await notificationsApi.markRead(id); setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n)); }
    catch { toast.error('Failed'); }
  };

  const handleMarkAll = async () => {
    try { await notificationsApi.markAllRead(); setNotifications(ns => ns.map(n => ({ ...n, is_read: true }))); toast.success('All marked as read'); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async id => {
    try { await notificationsApi.delete(id); setNotifications(ns => ns.filter(n => n.id !== id)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const toggleChannel = ch => {
    setForm(f => ({ ...f, channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch] }));
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) return toast.error('Title and message required');
    if (form.channels.length === 0) return toast.error('Select at least one channel');
    setSending(true);
    try {
      await notificationsApi.create(form);
      toast.success('Notification sent!');
      setForm(f => ({ ...f, title: '', message: '' }));
      load();
    } catch (err) { toast.error(err.response?.data?.error || err.message || 'Send failed'); }
    finally { setSending(false); }
  };

  const quickSend = async type => {
    setQuickSending(type);
    try {
      const fn = type === 'weather' ? notificationsApi.weatherAlert
               : type === 'irrigation' ? notificationsApi.irrigationAlert
               : notificationsApi.diseaseAlert;
      await fn({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} alert sent from dashboard` });
      toast.success(`${type} alert sent!`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || err.message || 'Failed to send alert'); }
    finally { setQuickSending(''); }
  };

  const stats = {
    total:   notifications.length,
    unread:  notifications.filter(n => !n.is_read).length,
    alerts:  notifications.filter(n => ['weather','irrigation','disease','alert'].includes(n.type)).length,
    system:  notifications.filter(n => n.type === 'system').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="w-7 h-7 text-green-600" /> Notifications
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Alerts, messages &amp; farm notifications</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Bell}          label="Total"       value={stats.total}  color="bg-green-500" />
        <StatCard icon={Mail}          label="Unread"      value={stats.unread} color="bg-blue-500" />
        <StatCard icon={AlertTriangle} label="Alerts"      value={stats.alerts} color="bg-orange-500" />
        <StatCard icon={Info}          label="System"      value={stats.system} color="bg-gray-500" />
      </div>

      {/* Quick Send Buttons */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Quick Alerts</p>
        <div className="flex flex-wrap gap-3">
          {[
            { type: 'weather',    icon: CloudRain, label: 'Weather Alert',    cls: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' },
            { type: 'irrigation', icon: Droplets,  label: 'Irrigation Alert', cls: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200' },
            { type: 'disease',    icon: Bug,       label: 'Disease Alert',    cls: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' },
          ].map(q => {
            const Icon = q.icon;
            return (
              <button key={q.type} onClick={() => quickSend(q.type)} disabled={!!quickSending}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${q.cls} disabled:opacity-60`}>
                {quickSending === q.type
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <Icon className="w-4 h-4" />}
                {q.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notification List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {FILTER_TYPES.map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${typeFilter === t ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
              <button onClick={() => setUnreadOnly(v => !v)}
                className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${unreadOnly ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {unreadOnly ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
                Unread only
              </button>
            </div>
            {stats.unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition">
                <Check className="w-3.5 h-3.5" /> Mark all as read ({stats.unread})
              </button>
            )}
          </div>

          {/* List */}
          <div className="space-y-2">
            {loading && (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading…
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="flex flex-col items-center py-20 text-gray-400">
                <BellOff className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No notifications found</p>
              </div>
            )}
            {!loading && notifications.map(n => (
              <NotificationItem key={n.id} n={n} onRead={handleRead} onDelete={handleDelete} />
            ))}
          </div>
        </div>

        {/* Send Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" /> Send Notification
            </h3>

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(TYPE_META).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button key={key} onClick={() => setForm(f => ({ ...f, type: key }))}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition ${form.type === key ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        <Icon className="w-4 h-4" />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Notification title…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Message *</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={3} placeholder="Notification message…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
              </div>

              {/* Channels */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Channels</label>
                <div className="flex gap-2">
                  {CHANNELS.map(ch => {
                    const Icon = ch.icon;
                    const active = form.channels.includes(ch.id);
                    return (
                      <button key={ch.id} onClick={() => toggleChannel(ch.id)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition ${active ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        <Icon className="w-4 h-4" />
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Send button */}
              <button onClick={handleSend} disabled={sending}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-green-500/20 active:scale-[.98]">
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending…' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
