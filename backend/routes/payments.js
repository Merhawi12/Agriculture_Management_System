const express = require('express');
const router = express.Router();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY || '';
const FLW_PUBLIC = process.env.FLUTTERWAVE_PUBLIC_KEY || '';

function sb() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

function txRef() {
  return `cropmind-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// POST /api/payments/initiate
router.post('/initiate', async (req, res) => {
  try {
    const { plan = 'pro', amount = 89000, currency = 'UGX' } = req.body;
    const ref = txRef();

    await sb().from('payments').insert({
      tx_ref: ref,
      amount,
      currency,
      plan,
      status: 'pending',
    });

    res.json({ tx_ref: ref, public_key: FLW_PUBLIC, amount, currency });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/payments/verify
router.post('/verify', async (req, res) => {
  try {
    const { tx_ref, transaction_id } = req.body;
    if (!tx_ref || !transaction_id) {
      return res.status(400).json({ error: 'tx_ref and transaction_id required' });
    }

    const { data: flw } = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      { headers: { Authorization: `Bearer ${FLW_SECRET}` } }
    );

    const ok =
      flw.status === 'success' &&
      flw.data?.status === 'successful' &&
      flw.data?.tx_ref === tx_ref;

    if (ok) {
      const { data: payment } = await sb()
        .from('payments')
        .update({
          status: 'successful',
          flw_ref: flw.data.flw_ref,
          payment_method: flw.data.payment_type,
          updated_at: new Date().toISOString(),
        })
        .eq('tx_ref', tx_ref)
        .select()
        .single();
      return res.json({ verified: true, payment });
    }

    await sb().from('payments').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('tx_ref', tx_ref);
    res.json({ verified: false });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/payments/history
router.get('/history', async (req, res) => {
  try {
    const { data } = await sb()
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
