const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try { res.json((await db.all('sales')).sort((a, b) => b.id - a.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/summary', async (req, res) => {
  try {
    const all   = await db.all('sales');
    const done  = all.filter(s => s.status === 'completed');
    const total_revenue = done.reduce((s, r) => s + (r.total_amount || 0), 0);
    const productMap = {};
    all.forEach(s => {
      if (!productMap[s.product]) productMap[s.product] = { product: s.product, total: 0, quantity: 0 };
      productMap[s.product].total    += s.total_amount || 0;
      productMap[s.product].quantity += s.quantity     || 0;
    });
    const by_product = Object.values(productMap).sort((a, b) => b.total - a.total);
    res.json({ total_revenue, total_orders: done.length, by_product });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (!req.body.product) return res.status(400).json({ error: 'Product required' });
    const data = {
      ...req.body,
      date: req.body.date || new Date().toISOString().split('T')[0],
      total_amount: req.body.total_amount || (parseFloat(req.body.quantity || 0) * parseFloat(req.body.unit_price || 0)),
    };
    res.status(201).json(await db.insert('sales', data));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const r = await db.update('sales', req.params.id, req.body);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('sales', req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
