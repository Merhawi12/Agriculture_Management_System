const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── Products ──────────────────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const { category, status, seller_id, q } = req.query;
    let rows = await db.all('marketplace_products');
    if (category)  rows = rows.filter(r => r.category === category);
    if (status)    rows = rows.filter(r => r.status === status);
    if (seller_id) rows = rows.filter(r => String(r.seller_id) === String(seller_id));
    if (q) {
      const ql = q.toLowerCase();
      rows = rows.filter(r => r.title?.toLowerCase().includes(ql) || r.category?.toLowerCase().includes(ql) || r.location?.toLowerCase().includes(ql));
    }
    res.json(rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/products/:id', async (req, res) => {
  try {
    const r = await db.get('marketplace_products', req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/products', async (req, res) => {
  try {
    const { title, category, quantity, unit, price_kes } = req.body;
    if (!title || !category || !quantity || !price_kes) return res.status(400).json({ error: 'Required fields missing' });
    res.json(await db.insert('marketplace_products', { ...req.body, status: 'active', views: 0 }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/products/:id', async (req, res) => {
  try {
    const r = await db.update('marketplace_products', req.params.id, req.body);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/products/:id', async (req, res) => {
  try { await db.delete('marketplace_products', req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Buyers ────────────────────────────────────────────────────────────────────
router.get('/buyers', async (req, res) => {
  try { res.json(await db.all('marketplace_buyers')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/buyers', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
    res.json(await db.insert('marketplace_buyers', req.body));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/buyers/:id', async (req, res) => {
  try {
    const r = await db.update('marketplace_buyers', req.params.id, req.body);
    r ? res.json(r) : res.status(404).json({ error: 'Not found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/buyers/:id', async (req, res) => {
  try { await db.delete('marketplace_buyers', req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Orders ────────────────────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { status, buyer_id, seller_id } = req.query;
    let rows = await db.all('marketplace_orders');
    if (status)    rows = rows.filter(r => r.status === status);
    if (buyer_id)  rows = rows.filter(r => String(r.buyer_id) === String(buyer_id));
    if (seller_id) rows = rows.filter(r => String(r.seller_id) === String(seller_id));
    res.json(rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/orders', async (req, res) => {
  try {
    const { product_id, buyer_id, quantity } = req.body;
    if (!product_id || !buyer_id || !quantity) return res.status(400).json({ error: 'Required fields missing' });

    const product = await db.get('marketplace_products', product_id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.quantity < quantity) return res.status(400).json({ error: 'Insufficient quantity available' });

    const buyer = await db.get('marketplace_buyers', buyer_id);
    const total_amount = Math.round(quantity * product.price_kes);
    const order = await db.insert('marketplace_orders', {
      product_id, product_title: product.title, product_category: product.category,
      seller_id: product.seller_id, seller_name: product.seller_name,
      buyer_id, buyer_name: buyer?.name || 'Unknown', buyer_phone: buyer?.phone,
      quantity, unit: product.unit, unit_price: product.price_kes, total_amount,
      status: 'pending', payment_method: req.body.payment_method || 'mpesa',
      delivery_address: req.body.delivery_address, notes: req.body.notes,
    });

    await db.update('marketplace_products', product_id, { quantity: product.quantity - quantity });
    if (buyer) await db.update('marketplace_buyers', buyer_id, { total_orders: (buyer.total_orders || 0) + 1 });

    res.json(order);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/orders/:id', async (req, res) => {
  try {
    const r = await db.update('marketplace_orders', req.params.id, req.body);
    if (!r) return res.status(404).json({ error: 'Not found' });

    if (req.body.status === 'confirmed') {
      const existing = await db.filter('marketplace_deliveries', d => String(d.order_id) === String(r.id));
      if (!existing.length) {
        await db.insert('marketplace_deliveries', {
          order_id: r.id, order_ref: `ORD-${String(r.id).padStart(4,'0')}`,
          buyer_name: r.buyer_name, buyer_phone: r.buyer_phone,
          product_title: r.product_title, quantity: r.quantity, unit: r.unit,
          delivery_address: r.delivery_address,
          status: 'scheduled', driver_name: null, vehicle: null,
          pickup_time: null, delivery_time: null, tracking_notes: 'Order confirmed — awaiting pickup',
        });
      }
    }
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/orders/:id', async (req, res) => {
  try { await db.delete('marketplace_orders', req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Deliveries ────────────────────────────────────────────────────────────────
router.get('/deliveries', async (req, res) => {
  try {
    const { status } = req.query;
    let rows = await db.all('marketplace_deliveries');
    if (status) rows = rows.filter(r => r.status === status);
    res.json(rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/deliveries/:id', async (req, res) => {
  try {
    const r = await db.update('marketplace_deliveries', req.params.id, req.body);
    if (!r) return res.status(404).json({ error: 'Not found' });

    const statusMap = { scheduled:'confirmed', picked_up:'shipped', in_transit:'shipped', delivered:'delivered', failed:'pending' };
    if (statusMap[r.status] && r.order_id) {
      await db.update('marketplace_orders', r.order_id, { status: statusMap[r.status] });
    }
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Summary stats ─────────────────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const [products, orders, deliveries, buyers] = await Promise.all([
      db.all('marketplace_products'),
      db.all('marketplace_orders'),
      db.all('marketplace_deliveries'),
      db.all('marketplace_buyers'),
    ]);

    res.json({
      total_products: products.filter(p => p.status === 'active').length,
      total_orders: orders.length,
      pending_orders: orders.filter(o => o.status === 'pending').length,
      revenue: orders.filter(o => ['confirmed','shipped','delivered'].includes(o.status)).reduce((s, o) => s + (o.total_amount || 0), 0),
      total_buyers: buyers.length,
      in_transit: deliveries.filter(d => d.status === 'in_transit').length,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
