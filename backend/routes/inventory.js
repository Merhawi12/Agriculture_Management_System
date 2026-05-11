const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try { res.json((await db.all('inventory')).sort((a, b) => a.name.localeCompare(b.name))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/low-stock', async (req, res) => {
  try { res.json(await db.filter('inventory', i => (i.quantity || 0) <= (i.min_quantity || 0))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await db.get('inventory', req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (!req.body.name) return res.status(400).json({ error: 'Name required' });
    res.status(201).json(await db.insert('inventory', req.body));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const r = await db.update('inventory', req.params.id, req.body);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('inventory', req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
