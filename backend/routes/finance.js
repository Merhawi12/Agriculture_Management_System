const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try { res.json((await db.all('transactions')).sort((a, b) => b.id - a.id)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/summary', async (req, res) => {
  try {
    const txs     = await db.all('transactions');
    const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expenses= txs.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

    const catMap = {};
    txs.forEach(t => {
      const key = `${t.type}::${t.category || 'Other'}`;
      catMap[key] = (catMap[key] || 0) + (t.amount || 0);
    });
    const by_category = Object.entries(catMap).map(([k, total]) => {
      const [type, category] = k.split('::');
      return { type, category, total };
    }).sort((a, b) => b.total - a.total);

    const monthMap = {};
    txs.forEach(t => {
      const m = t.date ? t.date.substring(0, 7) : 'Unknown';
      if (!monthMap[m]) monthMap[m] = { month: m, income: 0, expenses: 0 };
      if (t.type === 'income') monthMap[m].income += t.amount || 0;
      else monthMap[m].expenses += t.amount || 0;
    });
    const monthly = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    res.json({ income, expenses, profit: income - expenses, by_category, monthly });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (!req.body.type || !req.body.amount) return res.status(400).json({ error: 'Type and amount required' });
    const data = { ...req.body, date: req.body.date || new Date().toISOString().split('T')[0] };
    res.status(201).json(await db.insert('transactions', data));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const r = await db.update('transactions', req.params.id, req.body);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('transactions', req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
