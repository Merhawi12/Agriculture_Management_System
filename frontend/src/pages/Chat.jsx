import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Send, MessageCircle, Hash, Users, Wifi, WifiOff } from 'lucide-react';
import { format } from 'date-fns';

const ROOMS = [
  { id: 'general',       label: 'General',       emoji: '💬' },
  { id: 'announcements', label: 'Announcements',  emoji: '📢' },
  { id: 'operations',    label: 'Operations',     emoji: '⚙️' },
  { id: 'finance',       label: 'Finance',        emoji: '💰' },
];

const ROLE_COLORS = {
  super_admin:  'bg-red-100 text-red-700',
  farmer:       'bg-green-100 text-green-700',
  farm_manager: 'bg-indigo-100 text-indigo-700',
  agronomist:   'bg-teal-100 text-teal-700',
  accountant:   'bg-yellow-100 text-yellow-700',
  worker:       'bg-gray-100 text-gray-600',
};

const ROLE_LABELS = {
  super_admin:  'Admin',
  farmer:       'Farmer',
  farm_manager: 'Manager',
  agronomist:   'Agronomist',
  accountant:   'Accountant',
  worker:       'Employee',
};

export default function Chat() {
  const { user } = useAuth();
  const [room, setRoom]       = useState('general');
  const [messages, setMessages] = useState([]);
  const [input, setInput]     = useState('');
  const [sending, setSending] = useState(false);
  const [online, setOnline]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Load history when room changes
  useEffect(() => {
    if (!supabase) return;
    setMessages([]);
    supabase
      .from('chat_messages')
      .select('*')
      .eq('room', room)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => setMessages(data || []));
  }, [room]);

  // Realtime subscription
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel(`room:${room}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room=eq.${room}` },
        (payload) => {
          setMessages(prev => {
            // avoid duplicates (optimistic + realtime)
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe((status) => {
        setOnline(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setOnline(false);
    };
  }, [room]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || !supabase) return;

    const optimistic = {
      id: `temp-${Date.now()}`,
      room,
      sender_name: user?.name || 'User',
      sender_role: user?.role  || 'worker',
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimistic]);
    setInput('');
    setSending(true);

    try {
      await supabase.from('chat_messages').insert({
        room,
        sender_name: user?.name || 'User',
        sender_role: user?.role  || 'worker',
        message: text,
      });
    } catch (err) {
      console.error('Chat send error:', err);
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const myName = user?.name || 'User';

  return (
    <div className="flex h-[calc(100vh-4.5rem)] overflow-hidden rounded-xl shadow-sm border border-gray-200 bg-white">

      {/* ── Rooms sidebar ── */}
      <div className="w-52 flex-shrink-0 bg-gray-50 border-r flex flex-col">
        <div className="px-4 py-4 border-b">
          <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
            <MessageCircle size={16} className="text-primary-600" />
            Team Chat
          </h2>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Rooms</p>
          {ROOMS.map(r => (
            <button
              key={r.id}
              onClick={() => setRoom(r.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors font-medium
                ${room === r.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <span className="text-base leading-none">{r.emoji}</span>
              <span className="truncate">{r.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {online
              ? <><Wifi size={12} className="text-green-500" /> Live</>
              : <><WifiOff size={12} className="text-gray-400" /> Connecting…</>}
          </div>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="px-5 py-3.5 border-b bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash size={16} className="text-gray-400" />
            <span className="font-semibold text-gray-800 capitalize">{room}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Users size={13} />
            Team channel
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle size={44} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1">Be the first to say something in #{room}</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.sender_name === myName;
            const showAvatar = i === 0 || messages[i - 1]?.sender_name !== msg.sender_name;

            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xs
                  ${isMe ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'}
                  ${!showAvatar ? 'invisible' : ''}`}>
                  {msg.sender_name?.[0]?.toUpperCase()}
                </div>

                {/* Bubble group */}
                <div className={`flex flex-col gap-1 max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && (
                    <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-semibold text-gray-700">{msg.sender_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                        ${ROLE_COLORS[msg.sender_role] || 'bg-gray-100 text-gray-500'}`}>
                        {ROLE_LABELS[msg.sender_role] || msg.sender_role}
                      </span>
                    </div>
                  )}
                  <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words
                    ${isMe
                      ? 'bg-primary-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">
                    {msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : ''}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-3 border-t bg-gray-50">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message #${room}…`}
              className="flex-1 border border-gray-300 bg-white rounded-xl px-4 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              disabled={!supabase}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending || !supabase}
              className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
          {!supabase && (
            <p className="text-xs text-red-500 mt-1.5">
              Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
