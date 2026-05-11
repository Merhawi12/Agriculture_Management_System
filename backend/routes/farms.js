const express = require('express');
const router = express.Router();
const db = require('../db');

const parse = (farm) => ({
  ...farm,
  soil:   typeof farm.soil   === 'string' ? JSON.parse(farm.soil)   : farm.soil,
  fields: typeof farm.fields === 'string' ? JSON.parse(farm.fields) : farm.fields,
  boundary: typeof farm.boundary === 'string' ? JSON.parse(farm.boundary) : farm.boundary,
});

router.get('/', async (req, res) => {
  try { res.json((await db.all('farms')).map(parse)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', async (req, res) => {
  try {
    const farms = await db.all('farms');
    res.json({
      total: farms.length,
      active: farms.filter(f => f.status === 'active').length,
      total_area_ha: farms.reduce((s, f) => s + (f.total_area_ha || 0), 0),
      types: farms.reduce((acc, f) => { acc[f.farm_type] = (acc[f.farm_type] || 0) + 1; return acc; }, {}),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const f = await db.get('farms', req.params.id);
    if (!f) return res.status(404).json({ error: 'Not found' });
    res.json(parse(f));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, owner, location } = req.body;
    if (!name || !owner || !location) return res.status(400).json({ error: 'name, owner and location required' });
    const data = { ...req.body };
    if (data.soil   && typeof data.soil   !== 'string') data.soil   = JSON.stringify(data.soil);
    if (data.fields && typeof data.fields !== 'string') data.fields = JSON.stringify(data.fields);
    if (data.boundary && typeof data.boundary !== 'string') data.boundary = JSON.stringify(data.boundary);
    const farm = await db.insert('farms', data);
    res.json(parse(farm));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.soil   && typeof data.soil   !== 'string') data.soil   = JSON.stringify(data.soil);
    if (data.fields && typeof data.fields !== 'string') data.fields = JSON.stringify(data.fields);
    if (data.boundary && typeof data.boundary !== 'string') data.boundary = JSON.stringify(data.boundary);
    const r = await db.update('farms', req.params.id, data);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(parse(r));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('farms', req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
