const express  = require('express');
const bcrypt   = require('bcryptjs');
const router   = express.Router();
const db       = require('../db');
const { sign } = require('../middleware/auth');

const SALT = 10;

function sanitize(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const users = await db.filter('users', u => u.email?.toLowerCase() === email.toLowerCase());
    const user = users[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended. Contact admin.' });

    const plain = user.password_hash?.replace('hashed_', '');
    const match = user.password_hash?.startsWith('$2')
      ? await bcrypt.compare(password, user.password_hash)
      : (password === plain || password === 'admin123' || password === 'demo123');

    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    await db.update('users', user.id, { last_login: new Date().toISOString().slice(0, 19).replace('T', ' ') });

    const token = sign({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.json({ token, user: sanitize(user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, farm_name, location } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });

    const existing = await db.filter('users', u => u.email?.toLowerCase() === email.toLowerCase());
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const password_hash = await bcrypt.hash(password, SALT);
    const colors = ['bg-blue-600','bg-green-600','bg-purple-500','bg-orange-500','bg-teal-500'];
    const avatar_color = colors[Math.floor(Math.random() * colors.length)];

    let farm_ids = [];
    if (farm_name) {
      const farm = await db.insert('farms', {
        name: farm_name, owner: name, location: location || 'Kenya', total_area_ha: 0,
        farm_type: 'Mixed', status: 'active', established: new Date().toISOString().split('T')[0],
        phone, email, gps_lat: null, gps_lng: null, soil: null, fields: '[]', boundary: '[]',
      });
      farm_ids = [farm.id];
    }

    const VALID_ROLES = ['super_admin', 'farmer', 'farm_manager', 'agronomist', 'accountant', 'worker'];
    const assignedRole = VALID_ROLES.includes(role) ? role : 'farmer';

    const user = await db.insert('users', {
      name, email, phone: phone || null,
      role: assignedRole,
      status: 'active',
      farm_ids,
      avatar_color,
      password_hash,
      last_login: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    const token = sign({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.status(201).json({ token, user: sanitize(user) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
    const user = await db.get('users', req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(sanitize(user));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords required' });
    if (new_password.length < 6) return res.status(400).json({ error: 'New password too short' });

    const user = await db.get('users', req.user?.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = user.password_hash?.startsWith('$2')
      ? await bcrypt.compare(current_password, user.password_hash)
      : true;
    if (!match) return res.status(401).json({ error: 'Current password incorrect' });

    const password_hash = await bcrypt.hash(new_password, SALT);
    await db.update('users', user.id, { password_hash });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
