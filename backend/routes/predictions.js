const express = require('express');
const axios   = require('axios');
const router  = express.Router();
const db      = require('../db');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

async function mlAvailable() {
  try {
    await axios.get(`${ML_URL}/health`, { timeout: 2000 });
    return true;
  } catch { return false; }
}

function simulatePredictions(crops, livestock, sales) {
  const saleMap = {};
  sales.forEach(s => { saleMap[s.product] = (saleMap[s.product] || 0) + (s.total_amount || 0); });
  const topProduct = Object.entries(saleMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Wheat';

  const crop_predictions = crops.map(c => ({
    algorithm: 'Simulation (ML service offline)',
    crop: c.name, field: c.field,
    yield_per_ha_kg: Math.round(c.area_hectares ? (2500 + Math.random() * 1500) : 3000),
    yield_total_kg: c.area_hectares ? Math.round(c.area_hectares * (2500 + Math.random() * 1500)) : null,
    predicted_revenue_kes: c.area_hectares ? Math.round(c.area_hectares * (2500 + Math.random() * 1500) * (18 + Math.random() * 12)) : null,
    confidence_pct: Math.round(70 + Math.random() * 25),
    risk_level: ['Low', 'Medium', 'Low', 'High', 'Medium'][Math.floor(Math.random() * 5)],
    harvest_date: c.expected_harvest,
    recommendations: ['Apply top dressing fertilizer in 2 weeks', 'Monitor for pest activity weekly'],
  }));

  const liveMap = {};
  livestock.forEach(l => {
    if (!liveMap[l.type]) liveMap[l.type] = { count: 0, animals: [] };
    liveMap[l.type].count++;
    liveMap[l.type].animals.push(l);
  });

  const livestock_predictions = Object.entries(liveMap).map(([type, { count, animals }]) => {
    const avgW = animals.reduce((s, a) => s + (a.weight_kg || 0), 0) / animals.length;
    return {
      algorithm: 'Simulation',
      type, count, avg_weight: Math.round(avgW),
      health_risk: ['Low', 'Low', 'Medium'][Math.floor(Math.random() * 3)],
      confidence_pct: Math.round(65 + Math.random() * 25),
      productivity_score: Math.round(65 + Math.random() * 30),
      recommendations: ['Maintain routine vaccination schedule', 'Monitor feed consumption'],
    };
  });

  return {
    ml_service: 'offline',
    crop_predictions,
    livestock_predictions,
    soil_predictions: [
      { field: 'Field A', health_score: 72, status: 'Good', recommendation: 'Maintain organic matter levels' },
      { field: 'Field B', health_score: 65, status: 'Good', recommendation: 'Monitor pH quarterly' },
      { field: 'Field C', health_score: 58, status: 'Fair', recommendation: 'Apply lime — pH slightly low' },
    ],
    financial_forecast: {
      algorithm: 'Simulation',
      next_month_revenue: Math.round(80000 + Math.random() * 40000),
      next_month_expenses: Math.round(30000 + Math.random() * 15000),
      net_profit: Math.round(50000 + Math.random() * 30000),
      revenue_trend: 'Increasing',
      confidence_pct: 72,
      risk_factors: ['Commodity price volatility', 'Seasonal weather uncertainty', 'Input cost fluctuations'],
    },
    generated_at: new Date().toISOString(),
  };
}

router.get('/', async (req, res) => {
  try {
    const [crops, livestock, sales, farms] = await Promise.all([
      db.filter('crops', c => ['growing', 'planned'].includes(c.status)),
      db.all('livestock'),
      db.filter('sales', s => s.status === 'completed'),
      db.all('farms'),
    ]);
    const farm = farms[0];

    const useML = await mlAvailable();

    if (!useML) {
      return res.json(simulatePredictions(crops, livestock, sales));
    }

    const farmFields = farm?.fields || [];
    const enrichedCrops = crops.map(c => {
      const field = farmFields.find(f => f.name === c.field) || {};
      const soil  = farm?.soil || {};
      return {
        name: c.name, field: c.field,
        area_hectares: c.area_hectares,
        expected_harvest: c.expected_harvest,
        soil_ph: soil.ph || 6.5,
        organic_matter: soil.organic_matter || 3.5,
        irrigation: field.irrigation || 'drip',
        avg_rainfall_mm: 700, avg_temp_c: 24, fertilizer_kg_ha: 150,
      };
    });

    const prevRevenue = sales.slice(-3).reduce((s, t) => s + (t.total_amount || 0), 0) / 3 || 80000;
    const totalArea   = farm?.total_area_ha || 100;
    const fieldsList  = farmFields.length ? farmFields.map(f => ({
      name: f.name,
      ph: farm?.soil?.ph || 6.5,
      nitrogen: 40, phosphorus: 25, potassium: 150,
      organic_matter: farm?.soil?.organic_matter || 3.5,
    })) : [{ name: 'Main Field', ph: 6.5, nitrogen: 40, phosphorus: 25, potassium: 150, organic_matter: 3.5 }];

    const { data } = await axios.post(`${ML_URL}/predict/bulk`, {
      crops: enrichedCrops,
      livestock: livestock.map(l => ({
        tag_id: l.tag_id, type: l.type, breed: l.breed,
        birth_date: l.birth_date || '2022-01-01',
        weight_kg: l.weight_kg || 100,
        days_since_vaccination: 90,
      })),
      fields: fieldsList,
      month: new Date().getMonth() + 1,
      prev_revenue: prevRevenue,
      farm_area_ha: totalArea,
    }, { timeout: 15000 });

    const liveByType = {};
    (data.livestock_predictions || []).forEach(l => {
      if (!liveByType[l.type]) {
        liveByType[l.type] = { ...l, count: 1 };
      } else {
        liveByType[l.type].count++;
        liveByType[l.type].productivity_score = Math.round(
          (liveByType[l.type].productivity_score + l.productivity_score) / 2
        );
      }
    });

    res.json({
      ml_service: 'online',
      crop_predictions: data.crop_predictions || [],
      livestock_predictions: Object.values(liveByType),
      soil_predictions: data.soil_predictions || [],
      financial_forecast: data.financial_forecast || {},
      models: data.models || {},
      generated_at: data.generated_at,
    });
  } catch (err) {
    console.error('ML service error:', err.message);
    try {
      const [crops, livestock, sales] = await Promise.all([
        db.filter('crops', c => ['growing', 'planned'].includes(c.status)),
        db.all('livestock'),
        db.filter('sales', s => s.status === 'completed'),
      ]);
      res.json(simulatePredictions(crops, livestock, sales));
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
});

// Direct model endpoints (proxy to Python service)
router.post('/yield',     async (req, res) => { try { const { data } = await axios.post(`${ML_URL}/predict/yield`, req.body, { timeout: 10000 }); res.json(data); } catch (e) { res.status(503).json({ error: 'ML service unavailable' }); } });
router.post('/health',    async (req, res) => { try { const { data } = await axios.post(`${ML_URL}/predict/livestock-health`, req.body, { timeout: 10000 }); res.json(data); } catch (e) { res.status(503).json({ error: 'ML service unavailable' }); } });
router.post('/soil',      async (req, res) => { try { const { data } = await axios.post(`${ML_URL}/predict/soil-health`, req.body, { timeout: 10000 }); res.json(data); } catch (e) { res.status(503).json({ error: 'ML service unavailable' }); } });
router.post('/financial', async (req, res) => { try { const { data } = await axios.post(`${ML_URL}/predict/financial`, req.body, { timeout: 10000 }); res.json(data); } catch (e) { res.status(503).json({ error: 'ML service unavailable' }); } });
router.get('/model-info', async (req, res) => { try { const { data } = await axios.get(`${ML_URL}/model-info`, { timeout: 5000 }); res.json(data); } catch (e) { res.status(503).json({ error: 'ML service unavailable' }); } });
router.get('/ml-status',  async (req, res) => {
  const online = await mlAvailable();
  let health = null;
  if (online) { try { const { data } = await axios.get(`${ML_URL}/health`, { timeout: 3000 }); health = data; } catch {} }
  res.json({ online, health });
});

module.exports = router;
