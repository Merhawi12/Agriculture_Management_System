const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { dispatch } = require('../services/notificationService');

const TYPES = ['weather','irrigation','disease','market','system','payroll','task','general','alert'];

router.get('/', async (req, res) => {
  try {
    const { type, unread } = req.query;
    let rows = (await db.all('notifications')).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (type)   rows = rows.filter(r => r.type === type);
    if (unread === 'true') rows = rows.filter(r => !r.read);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/unread-count', async (req, res) => {
  try {
    const count = (await db.filter('notifications', n => !n.read)).length;
    res.json({ count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { type, title, message, channels = ['in_app'], recipient_role } = req.body;
    if (!type || !title || !message) return res.status(400).json({ error: 'type, title, message required' });
    if (!TYPES.includes(type)) return res.status(400).json({ error: `Invalid type. Use: ${TYPES.join(', ')}` });

    const notification = await db.insert('notifications', {
      type, title, message, channels, recipient_role: recipient_role || 'all',
      read: false, sent_channels: [],
    });

    const recipients = (await db.all('users')).filter(u => u.status === 'active');
    try {
      const result = await dispatch(notification, recipients);
      await db.update('notifications', notification.id, { sent_channels: Object.keys(result), dispatched_at: new Date().toISOString() });
    } catch (e) { console.error('Dispatch error:', e.message); }

    res.json(notification);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/read', async (req, res) => {
  try {
    const r = await db.update('notifications', req.params.id, { read: true, read_at: new Date().toISOString() });
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/mark-all-read', async (req, res) => {
  try {
    const unread = await db.filter('notifications', n => !n.read);
    await Promise.all(unread.map(n => db.update('notifications', n.id, { read: true, read_at: new Date().toISOString() })));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('notifications', req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Quick-send endpoints for specific alert types
router.post('/weather-alert', async (req, res) => {
  try {
    const { condition, severity = 'warning' } = req.body;
    const n = await db.insert('notifications', {
      type: 'weather', title: `Weather Alert: ${condition}`,
      message: req.body.message || `${condition} conditions expected. Take necessary precautions.`,
      channels: ['in_app', 'sms'], recipient_role: 'all', read: false,
      severity, sent_channels: [],
    });
    res.json(n);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/irrigation-alert', async (req, res) => {
  try {
    const { field } = req.body;
    const n = await db.insert('notifications', {
      type: 'irrigation', title: `Irrigation Alert — ${field || 'Farm'}`,
      message: req.body.message || `Soil moisture below threshold. Irrigation recommended immediately.`,
      channels: ['in_app', 'sms'], recipient_role: 'farm_manager', read: false, sent_channels: [],
    });
    res.json(n);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/disease-alert', async (req, res) => {
  try {
    const { crop, disease } = req.body;
    const n = await db.insert('notifications', {
      type: 'disease', title: `Disease Alert: ${disease || 'Pathogen Detected'}`,
      message: req.body.message || `Suspected ${disease} detected in ${crop}. Immediate inspection required.`,
      channels: ['in_app', 'sms', 'email'], recipient_role: 'agronomist', read: false, sent_channels: [],
    });
    res.json(n);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
