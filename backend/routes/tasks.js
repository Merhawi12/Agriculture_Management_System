const express = require('express');
const router  = express.Router();
const db      = require('../db');

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
const byPriority = (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);

router.get('/', async (req, res) => {
  try {
    const { date, worker_id, status } = req.query;
    let tasks = (await db.all('tasks')).sort(byPriority);
    if (date)      tasks = tasks.filter(t => t.date === date);
    if (worker_id) tasks = tasks.filter(t => String(t.worker_id) === String(worker_id));
    if (status)    tasks = tasks.filter(t => t.status === status);
    res.json(tasks);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    res.json((await db.filter('tasks', t => t.date === today)).sort(byPriority));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (!req.body.title) return res.status(400).json({ error: 'Title required' });
    res.status(201).json(await db.insert('tasks', {
      ...req.body,
      date: req.body.date || new Date().toISOString().split('T')[0],
    }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const r = await db.update('tasks', req.params.id, req.body);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('tasks', req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
