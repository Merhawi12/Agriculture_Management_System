const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

// GET /api/chat/messages?room=general
router.get('/messages', async (req, res) => {
  try {
    const { room = 'general' } = req.query;
    const { data, error } = await sb()
      .from('chat_messages')
      .select('*')
      .eq('room', room)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/chat/messages
router.post('/messages', async (req, res) => {
  try {
    const { room = 'general', message, sender_name, sender_role = 'worker' } = req.body;
    if (!message?.trim() || !sender_name?.trim()) {
      return res.status(400).json({ error: 'message and sender_name are required' });
    }
    const { data, error } = await sb()
      .from('chat_messages')
      .insert({ room, message: message.trim(), sender_name: sender_name.trim(), sender_role })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
