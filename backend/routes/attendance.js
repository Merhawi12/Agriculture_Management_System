const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const { date, worker_id } = req.query;
    let rows = (await db.all('attendance')).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    if (date)      rows = rows.filter(r => r.date === date);
    if (worker_id) rows = rows.filter(r => String(r.worker_id) === String(worker_id));
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/today', async (req, res) => {
  try {
    const today    = new Date().toISOString().split('T')[0];
    const workers  = await db.all('workers');
    const todayRecs= await db.filter('attendance', r => r.date === today);
    res.json(workers.map(w => ({
      worker: w,
      attendance: todayRecs.find(r => String(r.worker_id) === String(w.id)) || null,
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/summary', async (req, res) => {
  try {
    const { month } = req.query;
    const rows = month
      ? await db.filter('attendance', r => r.date && r.date.startsWith(month))
      : await db.all('attendance');
    res.json({
      total:          rows.length,
      present:        rows.filter(r => r.status === 'present').length,
      absent:         rows.filter(r => r.status === 'absent').length,
      late:           rows.filter(r => r.status === 'late').length,
      on_leave:       rows.filter(r => r.status === 'on_leave').length,
      total_hours:    Math.round(rows.reduce((s, r) => s + (r.hours_worked   || 0), 0) * 10) / 10,
      total_overtime: Math.round(rows.reduce((s, r) => s + (r.overtime_hours || 0), 0) * 10) / 10,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/clock-in', async (req, res) => {
  try {
    const { worker_id, location, photo_verified } = req.body;
    if (!worker_id) return res.status(400).json({ error: 'worker_id required' });
    const today  = new Date().toISOString().split('T')[0];
    const time   = new Date().toTimeString().slice(0, 5);
    const worker = await db.get('workers', worker_id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    const existing = await db.filter('attendance', r => r.date === today && String(r.worker_id) === String(worker_id));
    if (existing.length) return res.status(400).json({ error: 'Already clocked in today' });
    const isLate = time > '08:00';
    const record = await db.insert('attendance', {
      worker_id, worker_name: worker.name, date: today,
      clock_in: time, clock_out: null,
      status: isLate ? 'late' : 'present',
      hours_worked: null, overtime_hours: null,
      location: location || 'Farm', photo_verified: photo_verified || false,
      notes: isLate ? `Late arrival at ${time}` : null,
    });
    res.status(201).json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/clock-out', async (req, res) => {
  try {
    const { worker_id } = req.body;
    if (!worker_id) return res.status(400).json({ error: 'worker_id required' });
    const today  = new Date().toISOString().split('T')[0];
    const time   = new Date().toTimeString().slice(0, 5);
    const active = await db.filter('attendance', r =>
      r.date === today && String(r.worker_id) === String(worker_id) && r.clock_in && !r.clock_out);
    if (!active.length) return res.status(400).json({ error: 'No active clock-in found for today' });
    const rec = active[0];
    const [ih, im] = rec.clock_in.split(':').map(Number);
    const [oh, om] = time.split(':').map(Number);
    const hours    = ((oh * 60 + om) - (ih * 60 + im)) / 60;
    const overtime = Math.max(0, hours - 8);
    const updated  = await db.update('attendance', rec.id, {
      ...rec, clock_out: time,
      hours_worked:   Math.round(hours    * 100) / 100,
      overtime_hours: Math.round(overtime * 100) / 100,
    });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/mark', async (req, res) => {
  try {
    const { worker_id, status, date, notes } = req.body;
    if (!worker_id || !status) return res.status(400).json({ error: 'worker_id and status required' });
    const targetDate = date || new Date().toISOString().split('T')[0];
    const worker     = await db.get('workers', worker_id);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    const existing = await db.filter('attendance', r => r.date === targetDate && String(r.worker_id) === String(worker_id));
    const record = existing.length
      ? await db.update('attendance', existing[0].id, { ...existing[0], status, notes })
      : await db.insert('attendance', {
          worker_id, worker_name: worker.name, date: targetDate,
          clock_in: null, clock_out: null, status,
          hours_worked: 0, overtime_hours: 0, location: null, photo_verified: false, notes,
        });
    res.json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try { res.status(201).json(await db.insert('attendance', req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const r = await db.update('attendance', req.params.id, req.body);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('attendance', req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
