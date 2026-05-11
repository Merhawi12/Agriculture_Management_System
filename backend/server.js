require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

const ALLOWED = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map(o => o.trim());

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED.includes('*') || ALLOWED.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/livestock', require('./routes/livestock'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/farms', require('./routes/farms'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/notifications', require('./routes/notifications'));

// Public stats endpoint for landing page
app.get('/api/public/stats', async (req, res) => {
  try {
    const db = require('./db');
    const [workers, crops, livestock, farms, transactions, users, products] = await Promise.all([
      db.all('workers'), db.all('crops'), db.all('livestock'), db.all('farms'),
      db.all('transactions'), db.all('users'), db.all('marketplace_products'),
    ]);
    res.json({
      farmers:     workers.length,
      crops:       crops.length,
      livestock:   livestock.length,
      farms:       farms.length,
      revenue:     transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0),
      users:       users.length,
      products:    products.length,
      predictions: 1247,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Agriculture API running on http://localhost:${PORT}`));
