const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    let rows = (await db.all('payroll')).sort((a, b) =>
      b.month.localeCompare(a.month) || a.worker_name.localeCompare(b.worker_name));
    if (month) rows = rows.filter(r => r.month === month);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generate/:month', async (req, res) => {
  try {
    const { month } = req.params;

    // Clear existing for this month
    const existing = await db.filter('payroll', p => p.month === month);
    await Promise.all(existing.map(p => db.delete('payroll', p.id)));

    const workers    = await db.all('workers');
    const attendance = await db.filter('attendance', a => a.date && a.date.startsWith(month));

    const [y, m]   = month.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(y, m - 1, d).getDay();
      if (dow !== 0 && dow !== 6) workingDays++;
    }

    const records = await Promise.all(workers.map(async w => {
      const watt        = attendance.filter(a => String(a.worker_id) === String(w.id));
      const daysWorked  = watt.filter(a => ['present', 'late'].includes(a.status)).length;
      const daysAbsent  = watt.filter(a => a.status === 'absent').length;
      const leaveDays   = watt.filter(a => a.status === 'on_leave').length;
      const otHours     = Math.round(watt.reduce((s, a) => s + (a.overtime_hours || 0), 0) * 10) / 10;

      const base        = w.salary || 0;
      const dailyRate   = base / workingDays;
      const otRate      = (dailyRate / 8) * 1.5;
      const effectiveDays = daysWorked || (w.status === 'active' ? workingDays - daysAbsent : 0);
      const basePay     = effectiveDays * dailyRate;
      const otPay       = otHours * otRate;
      const grossPay    = basePay + otPay;

      const nhif = base > 100000 ? 1700 : base > 50000 ? 1200 : 600;
      const nssf = Math.min(Math.round(base * 0.06), 2160);
      const paye = Math.round(Math.max(0, grossPay * 0.1 - 2400));
      const totalDed  = nhif + nssf + paye;
      const netPay    = Math.round(Math.max(0, (grossPay || base) - totalDed));

      return await db.insert('payroll', {
        worker_id: w.id, worker_name: w.name, role: w.role, department: w.department,
        month, base_salary: base, working_days: workingDays,
        days_worked: effectiveDays, days_absent: daysAbsent, leave_days: leaveDays,
        overtime_hours: otHours, overtime_pay: Math.round(otPay),
        gross_pay: Math.round(grossPay || base),
        nhif, nssf, paye, total_deductions: totalDed,
        net_pay: netPay, status: 'pending',
      });
    }));

    res.json(records);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const r = await db.update('payroll', req.params.id, req.body);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('payroll', req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
