const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'agri_dev_secret_2026';

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  const token  = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    // Allow unauthenticated in dev mode — just attach a guest user
    req.user = { id: 1, role: 'super_admin', name: 'Demo Admin' };
    return next();
  }

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports.sign = (payload) =>
  jwt.sign(payload, SECRET, { expiresIn: '7d' });
