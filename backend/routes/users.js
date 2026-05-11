const express = require('express');
const router = express.Router();
const db = require('../db');

const ROLE_PERMISSIONS = {
  super_admin:  { manage_users:true, manage_farms:true, manage_finance:true, manage_workers:true, manage_crops:true, manage_livestock:true, manage_inventory:true, manage_equipment:true, view_reports:true, manage_payroll:true },
  farm_manager: { manage_users:false, manage_farms:true, manage_finance:true, manage_workers:true, manage_crops:true, manage_livestock:true, manage_inventory:true, manage_equipment:true, view_reports:true, manage_payroll:true },
  agronomist:   { manage_users:false, manage_farms:false, manage_finance:false, manage_workers:false, manage_crops:true, manage_livestock:false, manage_inventory:true, manage_equipment:false, view_reports:true, manage_payroll:false },
  accountant:   { manage_users:false, manage_farms:false, manage_finance:true, manage_workers:false, manage_crops:false, manage_livestock:false, manage_inventory:true, manage_equipment:false, view_reports:true, manage_payroll:true },
  worker:       { manage_users:false, manage_farms:false, manage_finance:false, manage_workers:false, manage_crops:false, manage_livestock:false, manage_inventory:false, manage_equipment:false, view_reports:false, manage_payroll:false },
};

router.get('/', async (req, res) => {
  try {
    const { role, status } = req.query;
    let rows = (await db.all('users')).map(u => ({ ...u, password_hash: undefined, permissions: ROLE_PERMISSIONS[u.role] || {} }));
    if (role)   rows = rows.filter(r => r.role === role);
    if (status) rows = rows.filter(r => r.status === status);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/roles', (req, res) => {
  res.json(ROLE_PERMISSIONS);
});

router.get('/stats', async (req, res) => {
  try {
    const users = await db.all('users');
    const byRole = {};
    users.forEach(u => { byRole[u.role] = (byRole[u.role] || 0) + 1; });
    res.json({
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      suspended: users.filter(u => u.status === 'suspended').length,
      by_role: byRole,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const u = await db.get('users', req.params.id);
    if (!u) return res.status(404).json({ error: 'Not found' });
    res.json({ ...u, password_hash: undefined, permissions: ROLE_PERMISSIONS[u.role] || {} });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, role, phone, status, farm_ids } = req.body;
    if (!name || !email || !role) return res.status(400).json({ error: 'name, email and role required' });
    const exists = await db.filter('users', u => u.email === email);
    if (exists.length) return res.status(409).json({ error: 'Email already registered' });
    const colors = ['bg-blue-600','bg-green-600','bg-purple-500','bg-orange-500','bg-teal-500','bg-pink-500','bg-indigo-500','bg-red-500'];
    const avatar_color = colors[Math.floor(Math.random() * colors.length)];
    const user = await db.insert('users', { name, email, phone: phone || null, role, status: status || 'active', farm_ids: farm_ids || [], avatar_color, last_login: null, password_hash: 'hashed_' + name.split(' ')[0].toLowerCase() });
    res.json({ ...user, password_hash: undefined, permissions: ROLE_PERMISSIONS[user.role] || {} });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { password_hash, ...data } = req.body;
    const r = await db.update('users', req.params.id, data);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json({ ...r, password_hash: undefined, permissions: ROLE_PERMISSIONS[r.role] || {} });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try { await db.delete('users', req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
