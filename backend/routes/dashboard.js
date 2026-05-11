const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/stats', async (req, res) => {
  try {
    const [crops, livestock, workers, equipment, txs, inventory, sales] = await Promise.all([
      db.all('crops'),
      db.all('livestock'),
      db.all('workers'),
      db.all('equipment'),
      db.all('transactions'),
      db.all('inventory'),
      db.all('sales'),
    ]);

    const income   = txs.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

    const monthMap = {};
    txs.forEach(t => {
      const m = t.date ? t.date.substring(0, 7) : null;
      if (!m) return;
      if (!monthMap[m]) monthMap[m] = { month: m, income: 0, expense: 0 };
      if (t.type === 'income') monthMap[m].income += t.amount || 0;
      else monthMap[m].expense += t.amount || 0;
    });

    const months = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
    const monthly_income  = months.map(m => ({ month: m.month, total: m.income }));
    const monthly_expense = months.map(m => ({ month: m.month, total: m.expense }));

    res.json({
      crops:     { total: crops.length,     growing: crops.filter(c => c.status === 'growing').length },
      livestock: { total: livestock.length, healthy: livestock.filter(l => l.health_status === 'healthy').length },
      workers:   { total: workers.length,   active:  workers.filter(w => w.status === 'active').length },
      equipment: { total: equipment.length, operational: equipment.filter(e => e.status === 'operational').length },
      revenue:   income,
      expenses,
      profit:    income - expenses,
      inventory_low: inventory.filter(i => (i.quantity || 0) <= (i.min_quantity || 0)).length,
      recent_sales: sales.sort((a, b) => b.id - a.id).slice(0, 5),
      monthly_income,
      monthly_expense,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
