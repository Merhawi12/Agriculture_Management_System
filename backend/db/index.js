require('dotenv').config();
const fs   = require('fs');
const path = require('path');

// ── If Supabase is configured, use it ─────────────────────────────────────────
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY &&
    !process.env.SUPABASE_URL.includes('your-project-id') &&
    !process.env.SUPABASE_SERVICE_KEY.includes('your-service-role-key')) {
  console.log('[db] Using Supabase database');
  module.exports = require('./supabase-store');
  return;
}

// ── Fallback: local JSON file store (async-wrapped) ───────────────────────────
console.log('[db] SUPABASE_URL not set — using local JSON store');

const DB_PATH = path.join(__dirname, 'agri.json');

class JsonStore {
  constructor(filePath) {
    this.path = filePath;
    this.data = {};
    if (fs.existsSync(filePath)) {
      this.data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  }

  _save() { fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2)); }

  _table(name) {
    if (!this.data[name]) this.data[name] = { rows: [], seq: 0 };
    return this.data[name];
  }

  all(name)       { return [...this._table(name).rows]; }
  get(name, id)   { return this._table(name).rows.find(r => String(r.id) === String(id)) || null; }
  filter(name,fn) { return this._table(name).rows.filter(fn); }

  insert(name, data) {
    const tbl = this._table(name);
    tbl.seq++;
    const row = { ...data, id: tbl.seq, created_at: new Date().toISOString().replace('T',' ').slice(0,19) };
    Object.keys(row).forEach(k => { if (row[k] === '' || row[k] === undefined) row[k] = null; });
    tbl.rows.push(row);
    this._save();
    return row;
  }

  update(name, id, data) {
    const tbl = this._table(name);
    const idx = tbl.rows.findIndex(r => String(r.id) === String(id));
    if (idx === -1) return null;
    const existing = tbl.rows[idx];
    const updated  = { ...existing, ...data, id: existing.id, created_at: existing.created_at };
    Object.keys(updated).forEach(k => { if (updated[k] === '') updated[k] = null; });
    tbl.rows[idx] = updated;
    this._save();
    return updated;
  }

  delete(name, id) {
    const tbl = this._table(name);
    tbl.rows = tbl.rows.filter(r => String(r.id) !== String(id));
    this._save();
  }
}

// Async wrapper — keeps the same interface as the Supabase store
class AsyncJsonStore {
  constructor() { this._s = new JsonStore(DB_PATH); this._seed(); }

  async all(t)         { return this._s.all(t); }
  async get(t, id)     { return this._s.get(t, id); }
  async filter(t, fn)  { return this._s.filter(t, fn); }
  async insert(t, d)   { return this._s.insert(t, d); }
  async update(t,id,d) { return this._s.update(t, id, d); }
  async delete(t, id)  { return this._s.delete(t, id); }

  _seed() {
    const s = this._s;

    if (s.all('crops').length === 0) {
      [
        { name:'Wheat',     variety:'Winter Wheat',          field:'Field A',     area_hectares:25.5, planting_date:'2025-10-15', expected_harvest:'2026-06-20', status:'growing',  yield_kg:null, notes:'Main grain crop' },
        { name:'Corn',      variety:'Sweet Corn',            field:'Field B',     area_hectares:18.0, planting_date:'2025-04-10', expected_harvest:'2025-08-30', status:'harvested', yield_kg:8200, notes:'Excellent yield' },
        { name:'Soybeans',  variety:'Glyphosate-Resistant',  field:'Field C',     area_hectares:30.0, planting_date:'2025-05-01', expected_harvest:'2025-10-15', status:'harvested', yield_kg:5400, notes:'Good season' },
        { name:'Tomatoes',  variety:'Roma',                  field:'Greenhouse 1',area_hectares:2.5,  planting_date:'2026-02-01', expected_harvest:'2026-05-15', status:'growing',  yield_kg:null, notes:'Drip irrigation' },
        { name:'Sunflowers',variety:'Hybrid',                field:'Field D',     area_hectares:12.0, planting_date:'2026-04-20', expected_harvest:'2026-09-01', status:'planned',  yield_kg:null, notes:'Oil production' },
        { name:'Rice',      variety:'Jasmine',               field:'Field E',     area_hectares:20.0, planting_date:'2026-05-01', expected_harvest:'2026-10-30', status:'growing',  yield_kg:null, notes:'Paddy field' },
      ].forEach(r => s.insert('crops', r));

      [
        { tag_id:'COW-001', type:'Cattle',  breed:'Holstein', gender:'Female', birth_date:'2022-03-15', weight_kg:580, health_status:'healthy',       location:'Barn A' },
        { tag_id:'COW-002', type:'Cattle',  breed:'Angus',    gender:'Male',   birth_date:'2021-07-20', weight_kg:720, health_status:'healthy',       location:'Pasture 1' },
        { tag_id:'COW-003', type:'Cattle',  breed:'Jersey',   gender:'Female', birth_date:'2023-01-10', weight_kg:450, health_status:'healthy',       location:'Barn A' },
        { tag_id:'SHP-001', type:'Sheep',   breed:'Merino',   gender:'Female', birth_date:'2023-05-05', weight_kg:65,  health_status:'healthy',       location:'Pasture 2' },
        { tag_id:'SHP-002', type:'Sheep',   breed:'Suffolk',  gender:'Male',   birth_date:'2022-11-18', weight_kg:85,  health_status:'under_treatment',location:'Quarantine' },
        { tag_id:'PIG-001', type:'Pig',     breed:'Duroc',    gender:'Female', birth_date:'2024-01-20', weight_kg:120, health_status:'healthy',       location:'Pig House' },
        { tag_id:'CHK-001', type:'Chicken', breed:'Broiler',  gender:'Female', birth_date:'2025-09-01', weight_kg:2.8, health_status:'healthy',       location:'Poultry House' },
        { tag_id:'CHK-002', type:'Chicken', breed:'Layer',    gender:'Female', birth_date:'2025-06-15', weight_kg:1.9, health_status:'healthy',       location:'Poultry House' },
        { tag_id:'GOT-001', type:'Goat',    breed:'Boer',     gender:'Male',   birth_date:'2023-08-12', weight_kg:75,  health_status:'healthy',       location:'Pasture 3' },
      ].forEach(r => s.insert('livestock', r));

      [
        { name:'Wheat Seeds',       category:'Seeds',        quantity:500,  unit:'kg',   unit_price:2.50,  supplier:'AgriSupply Co',  location:'Warehouse A',  min_quantity:100 },
        { name:'NPK Fertilizer',    category:'Fertilizer',   quantity:1200, unit:'kg',   unit_price:1.80,  supplier:'FertileCrop Ltd', location:'Warehouse B',  min_quantity:200 },
        { name:'Herbicide X',       category:'Pesticide',    quantity:80,   unit:'L',    unit_price:15.00, supplier:'CropProtect',    location:'Chemical Store',min_quantity:20  },
        { name:'Diesel Fuel',       category:'Fuel',         quantity:3000, unit:'L',    unit_price:1.20,  supplier:'FuelMart',       location:'Fuel Tank',    min_quantity:500 },
        { name:'Irrigation Pipes',  category:'Equipment',    quantity:200,  unit:'m',    unit_price:3.50,  supplier:'IrriTech',       location:'Workshop',     min_quantity:50  },
        { name:'Corn Seeds',        category:'Seeds',        quantity:300,  unit:'kg',   unit_price:3.20,  supplier:'AgriSupply Co',  location:'Warehouse A',  min_quantity:80  },
        { name:'Lime',              category:'Soil Amendment',quantity:800, unit:'kg',   unit_price:0.90,  supplier:'SoilCo',         location:'Warehouse B',  min_quantity:150 },
        { name:'Insecticide Y',     category:'Pesticide',    quantity:45,   unit:'L',    unit_price:18.00, supplier:'CropProtect',    location:'Chemical Store',min_quantity:10  },
        { name:'Hay Bales',         category:'Feed',         quantity:150,  unit:'bale', unit_price:12.00, supplier:'LocalFarm',      location:'Feed Store',   min_quantity:30  },
        { name:'Vitamin Supplement',category:'Feed Additive',quantity:25,   unit:'kg',   unit_price:35.00, supplier:'VetSupply',      location:'Feed Store',   min_quantity:5   },
      ].forEach(r => s.insert('inventory', r));

      [
        { type:'income',  category:'Crop Sales',           amount:45000, date:'2026-01-15', description:'Wheat harvest sale',   payment_method:'bank_transfer' },
        { type:'income',  category:'Livestock Sales',       amount:12000, date:'2026-01-28', description:'Cattle sale',          payment_method:'bank_transfer' },
        { type:'expense', category:'Fertilizer',           amount:3200,  date:'2026-02-05', description:'NPK purchase Q1',      payment_method:'cash' },
        { type:'expense', category:'Labor',                amount:8500,  date:'2026-02-28', description:'Monthly wages',        payment_method:'bank_transfer' },
        { type:'income',  category:'Crop Sales',           amount:28000, date:'2026-03-10', description:'Corn sale',            payment_method:'bank_transfer' },
        { type:'expense', category:'Equipment Maintenance',amount:1500,  date:'2026-03-20', description:'Tractor service',      payment_method:'cash' },
        { type:'expense', category:'Seeds',                amount:2800,  date:'2026-04-01', description:'Spring planting seeds',payment_method:'bank_transfer' },
        { type:'income',  category:'Dairy Products',       amount:6000,  date:'2026-04-15', description:'Milk sales',           payment_method:'bank_transfer' },
        { type:'expense', category:'Fuel',                 amount:1800,  date:'2026-04-30', description:'Monthly fuel cost',    payment_method:'cash' },
        { type:'income',  category:'Livestock Sales',       amount:9500,  date:'2026-05-05', description:'Pig sale',             payment_method:'bank_transfer' },
        { type:'expense', category:'Labor',                amount:8500,  date:'2026-05-01', description:'Monthly wages',        payment_method:'bank_transfer' },
        { type:'income',  category:'Crop Sales',           amount:15000, date:'2026-05-08', description:'Soybean sale',         payment_method:'bank_transfer' },
      ].forEach(r => s.insert('transactions', r));

      [
        { name:'James Mwangi',   role:'Farm Manager',         phone:'0712-345-678', email:'james@farm.com',  hire_date:'2020-03-01', salary:85000, status:'active',   department:'Management' },
        { name:'Fatuma Ochieng', role:'Agronomist',           phone:'0723-456-789', email:'fatuma@farm.com', hire_date:'2021-06-15', salary:65000, status:'active',   department:'Agronomy' },
        { name:'Peter Kamau',    role:'Livestock Supervisor', phone:'0734-567-890', email:'peter@farm.com',  hire_date:'2019-11-01', salary:55000, status:'active',   department:'Livestock' },
        { name:'Grace Wanjiku',  role:'Finance Officer',      phone:'0745-678-901', email:'grace@farm.com',  hire_date:'2022-01-10', salary:60000, status:'active',   department:'Finance' },
        { name:'David Otieno',   role:'Equipment Operator',   phone:'0756-789-012', email:'david@farm.com',  hire_date:'2021-08-20', salary:42000, status:'active',   department:'Operations' },
        { name:'Mary Njeri',     role:'Field Supervisor',     phone:'0767-890-123', email:'mary@farm.com',   hire_date:'2020-05-15', salary:48000, status:'active',   department:'Operations' },
        { name:'Samuel Kibet',   role:'Irrigation Technician',phone:'0778-901-234', email:'samuel@farm.com', hire_date:'2023-02-01', salary:40000, status:'active',   department:'Operations' },
        { name:'Aisha Hassan',   role:'Accountant',           phone:'0789-012-345', email:'aisha@farm.com',  hire_date:'2022-09-01', salary:55000, status:'on_leave', department:'Finance' },
      ].forEach(r => s.insert('workers', r));

      [
        { name:'John Deere 6M',    type:'Tractor',  model:'6130M',         serial_number:'JD6M-2021-001',  purchase_date:'2021-03-15', purchase_price:4500000,  status:'operational',       last_maintenance:'2026-03-01', next_maintenance:'2026-09-01', location:'Equipment Yard' },
        { name:'New Holland T5',   type:'Tractor',  model:'T5.120',        serial_number:'NH5-2020-002',   purchase_date:'2020-07-20', purchase_price:3800000,  status:'operational',       last_maintenance:'2026-04-15', next_maintenance:'2026-10-15', location:'Field B' },
        { name:'Combine Harvester',type:'Harvester',model:'Claas Lexion 750',serial_number:'CL750-2022-001',purchase_date:'2022-01-10',purchase_price:12000000, status:'operational',       last_maintenance:'2025-12-01', next_maintenance:'2026-06-01', location:'Equipment Yard' },
        { name:'Irrigation Pump',  type:'Pump',     model:'Grundfos CM5',  serial_number:'GF-2021-003',    purchase_date:'2021-05-01', purchase_price:180000,   status:'operational',       last_maintenance:'2026-02-01', next_maintenance:'2026-08-01', location:'Field A' },
        { name:'Sprayer',          type:'Sprayer',  model:'AGCO 4200',     serial_number:'AG4200-2023-001',purchase_date:'2023-08-15', purchase_price:650000,   status:'operational',       last_maintenance:'2026-01-15', next_maintenance:'2026-07-15', location:'Equipment Yard' },
        { name:'Seed Drill',       type:'Planter',  model:'Horsch Maestro',serial_number:'HM-2022-002',    purchase_date:'2022-11-20', purchase_price:950000,   status:'under_maintenance', last_maintenance:'2026-05-01', next_maintenance:'2026-05-30', location:'Workshop' },
        { name:'Grain Dryer',      type:'Dryer',    model:'Sukup 2410',    serial_number:'SK2410-2020-001',purchase_date:'2020-09-10', purchase_price:1200000,  status:'operational',       last_maintenance:'2025-11-01', next_maintenance:'2026-05-01', location:'Warehouse A' },
        { name:'Pickup Truck',     type:'Vehicle',  model:'Toyota Hilux',  serial_number:'TH-2023-003',    purchase_date:'2023-04-01', purchase_price:2800000,  status:'operational',       last_maintenance:'2026-04-01', next_maintenance:'2026-10-01', location:'Farm Office' },
      ].forEach(r => s.insert('equipment', r));

      [
        { product:'Wheat',            customer:'Nairobi Millers Ltd', quantity:20000, unit:'kg',   unit_price:22.50, total_amount:450000, date:'2026-01-15', status:'completed', payment_method:'bank_transfer' },
        { product:'Cattle (5 head)',  customer:'Local Butcher',       quantity:5,     unit:'head', unit_price:65000, total_amount:325000, date:'2026-01-28', status:'completed', payment_method:'bank_transfer' },
        { product:'Corn',             customer:'Feed & Grain Co',     quantity:14000, unit:'kg',   unit_price:20.00, total_amount:280000, date:'2026-03-10', status:'completed', payment_method:'bank_transfer' },
        { product:'Fresh Milk',       customer:'Dairy Cooperative',   quantity:3000,  unit:'L',    unit_price:60,    total_amount:180000, date:'2026-04-15', status:'completed', payment_method:'bank_transfer' },
        { product:'Pig (6 head)',     customer:'Meat Processor',      quantity:6,     unit:'head', unit_price:25000, total_amount:150000, date:'2026-05-05', status:'completed', payment_method:'cash' },
        { product:'Soybeans',         customer:'Oil Processor',       quantity:8000,  unit:'kg',   unit_price:45,    total_amount:360000, date:'2026-05-08', status:'completed', payment_method:'bank_transfer' },
        { product:'Tomatoes',         customer:'City Market',         quantity:500,   unit:'kg',   unit_price:80,    total_amount:40000,  date:'2026-05-09', status:'pending',   payment_method:'cash' },
      ].forEach(r => s.insert('sales', r));

      [
        { name:'Admin User',    email:'admin@agrifarm.com', phone:'0700-000-001', role:'super_admin',  status:'active',    farm_ids:[1,2], avatar_color:'bg-red-500',    last_login:'2026-05-10 07:30:00', password_hash:'hashed_admin123' },
        { name:'James Mwangi', email:'james@farm.com',     phone:'0712-345-678', role:'farm_manager', status:'active',    farm_ids:[1],   avatar_color:'bg-blue-600',   last_login:'2026-05-10 07:45:00', password_hash:'hashed_james123' },
        { name:'Fatuma Ochieng',email:'fatuma@farm.com',   phone:'0723-456-789', role:'agronomist',   status:'active',    farm_ids:[1],   avatar_color:'bg-green-600',  last_login:'2026-05-09 08:10:00', password_hash:'hashed_fatuma123' },
        { name:'Peter Kamau',  email:'peter@farm.com',     phone:'0734-567-890', role:'worker',       status:'active',    farm_ids:[1],   avatar_color:'bg-purple-500', last_login:'2026-05-10 07:52:00', password_hash:'hashed_peter123' },
        { name:'Grace Wanjiku',email:'grace@farm.com',     phone:'0745-678-901', role:'accountant',   status:'active',    farm_ids:[1,2], avatar_color:'bg-yellow-600', last_login:'2026-05-09 09:00:00', password_hash:'hashed_grace123' },
        { name:'David Otieno', email:'david@farm.com',     phone:'0756-789-012', role:'worker',       status:'active',    farm_ids:[1],   avatar_color:'bg-orange-500', last_login:'2026-05-10 07:30:00', password_hash:'hashed_david123' },
        { name:'Mary Njeri',   email:'mary@farm.com',      phone:'0767-890-123', role:'farm_manager', status:'active',    farm_ids:[2],   avatar_color:'bg-teal-500',   last_login:'2026-05-08 08:00:00', password_hash:'hashed_mary123' },
        { name:'Samuel Kibet', email:'samuel@farm.com',    phone:'0778-901-234', role:'worker',       status:'inactive',  farm_ids:[1],   avatar_color:'bg-cyan-500',   last_login:'2026-05-07 07:30:00', password_hash:'hashed_samuel123' },
        { name:'Aisha Hassan', email:'aisha@farm.com',     phone:'0789-012-345', role:'accountant',   status:'suspended', farm_ids:[1],   avatar_color:'bg-pink-500',   last_login:'2026-04-30 09:15:00', password_hash:'hashed_aisha123' },
        { name:'Demo Viewer',  email:'demo@agrifarm.com',  phone:'0700-000-010', role:'worker',       status:'active',    farm_ids:[1,2], avatar_color:'bg-gray-500',   last_login:'2026-05-10 06:00:00', password_hash:'hashed_demo123' },
      ].forEach(r => s.insert('users', r));

      [
        {
          name:'Mwangi Family Farm', owner:'James Mwangi', location:'Nakuru County, Kenya',
          total_area_ha:108, farm_type:'Mixed', status:'active', established:'2010-03-01',
          phone:'0712-345-678', email:'james@farm.com',
          description:'Large mixed farm with crops, livestock and horticulture',
          gps_lat:-0.3031, gps_lng:36.0800,
          boundary: JSON.stringify([{lat:-0.2990,lng:36.0750},{lat:-0.2990,lng:36.0870},{lat:-0.3075,lng:36.0870},{lat:-0.3075,lng:36.0750}]),
          soil: JSON.stringify({type:'Clay Loam',ph:6.2,organic_matter:3.8,nitrogen:'medium',phosphorus:'high',potassium:'medium',last_tested:'2026-03-15',lab:'Kenya Soil Health Labs'}),
          fields: JSON.stringify([{name:'Field A',area_ha:25.5,crop:'Wheat',soil_type:'Clay Loam',irrigation:'center pivot'},{name:'Field B',area_ha:18.0,crop:'Corn',soil_type:'Sandy Loam',irrigation:'drip'},{name:'Field C',area_ha:30.0,crop:'Soybeans',soil_type:'Clay Loam',irrigation:'furrow'},{name:'Field D',area_ha:12.0,crop:'Sunflowers',soil_type:'Loam',irrigation:'none'},{name:'Field E',area_ha:20.0,crop:'Rice',soil_type:'Clay',irrigation:'flood'},{name:'Greenhouse 1',area_ha:2.5,crop:'Tomatoes',soil_type:'Potting mix',irrigation:'drip'}]),
        },
        {
          name:'Green Valley Horticultural Farm', owner:'Mary Njeri', location:'Kiambu County, Kenya',
          total_area_ha:45, farm_type:'Horticulture', status:'active', established:'2018-06-01',
          phone:'0767-890-123', email:'mary@greenvalley.com',
          description:'Specialised horticultural farm for export vegetables',
          gps_lat:-1.0320, gps_lng:37.0700,
          boundary: JSON.stringify([{lat:-1.0300,lng:37.0670},{lat:-1.0300,lng:37.0730},{lat:-1.0340,lng:37.0730},{lat:-1.0340,lng:37.0670}]),
          soil: JSON.stringify({type:'Sandy Loam',ph:6.8,organic_matter:5.2,nitrogen:'high',phosphorus:'medium',potassium:'high',last_tested:'2026-02-20',lab:'AgroTest Kenya'}),
          fields: JSON.stringify([{name:'Block 1',area_ha:15.0,crop:'French Beans',soil_type:'Sandy Loam',irrigation:'drip'},{name:'Block 2',area_ha:12.0,crop:'Snow Peas',soil_type:'Sandy Loam',irrigation:'drip'},{name:'Block 3',area_ha:10.0,crop:'Capsicum',soil_type:'Loam',irrigation:'drip'},{name:'Greenhouse A',area_ha:4.0,crop:'Roses',soil_type:'Potting mix',irrigation:'drip'},{name:'Greenhouse B',area_ha:4.0,crop:'Herbs',soil_type:'Potting mix',irrigation:'drip'}]),
        },
      ].forEach(r => s.insert('farms', r));
    }

    if (s.all('tasks').length === 0) {
      [
        { worker_id:2, worker_name:'Fatuma Ochieng', title:'Inspect wheat growth stages — Field A',    field:'Field A',       category:'inspection',  date:'2026-05-09', priority:'high',   status:'in_progress', assigned_by:'James Mwangi', estimated_hours:3, actual_hours:null, notes:'Check for rust disease' },
        { worker_id:5, worker_name:'David Otieno',   title:'Apply NPK fertilizer — Field D',           field:'Field D',       category:'fertilizing', date:'2026-05-09', priority:'high',   status:'in_progress', assigned_by:'James Mwangi', estimated_hours:4, actual_hours:null, notes:'Top dress Sunflowers' },
        { worker_id:3, worker_name:'Peter Kamau',    title:'Livestock health check — Barn A',          field:'Barn A',        category:'livestock',   date:'2026-05-09', priority:'high',   status:'completed',   assigned_by:'James Mwangi', estimated_hours:2, actual_hours:2,    notes:'Visual inspection' },
        { worker_id:7, worker_name:'Samuel Kibet',   title:'Repair irrigation pipe — Section E-3',     field:'Field E',       category:'maintenance', date:'2026-05-09', priority:'urgent', status:'pending',     assigned_by:'Mary Njeri',   estimated_hours:3, actual_hours:null, notes:'Leaking joint near pump' },
        { worker_id:6, worker_name:'Mary Njeri',     title:'Supervise tomato harvest — Greenhouse 1',  field:'Greenhouse 1',  category:'harvesting',  date:'2026-05-09', priority:'medium', status:'completed',   assigned_by:'James Mwangi', estimated_hours:4, actual_hours:3.5,  notes:'Coordinate picking team' },
        { worker_id:1, worker_name:'James Mwangi',   title:'Weekly farm management review',            field:'Farm Office',   category:'management',  date:'2026-05-09', priority:'medium', status:'pending',     assigned_by:'self',         estimated_hours:2, actual_hours:null, notes:'Review all department reports' },
        { worker_id:2, worker_name:'Fatuma Ochieng', title:'Weekly disease surveillance — Field A',    field:'Field A',       category:'inspection',  date:'2026-05-10', priority:'medium', status:'pending',     assigned_by:'James Mwangi', estimated_hours:2, actual_hours:null, notes:'Monitor rust and aphid populations' },
        { worker_id:5, worker_name:'David Otieno',   title:'Combine harvester pre-season service',     field:'Equipment Yard',category:'maintenance', date:'2026-05-11', priority:'high',   status:'pending',     assigned_by:'James Mwangi', estimated_hours:6, actual_hours:null, notes:'Full service before wheat harvest' },
        { worker_id:3, worker_name:'Peter Kamau',    title:'Deworming — all cattle',                   field:'Barn A',        category:'livestock',   date:'2026-05-12', priority:'high',   status:'pending',     assigned_by:'James Mwangi', estimated_hours:3, actual_hours:null, notes:'Cattle in Barn A and Pasture 1' },
      ].forEach(r => s.insert('tasks', r));
    }

    if (s.all('notifications').length === 0) {
      const now = new Date();
      const ago = m => new Date(now - m * 60000).toISOString().replace('T',' ').slice(0,19);
      [
        { type:'weather',    title:'Heavy Rain Warning',         message:'Heavy rainfall (45mm) expected in Nakuru from 14:00 today. Delay spraying operations.',       channels:['in_app','sms'],         recipient_role:'all',          read:false, created_at:ago(15)  },
        { type:'irrigation', title:'Irrigation Alert — Field A', message:'Soil moisture in Field A dropped below 35%. Wheat requires immediate irrigation.',              channels:['in_app','sms'],         recipient_role:'farm_manager', read:false, created_at:ago(45)  },
        { type:'disease',    title:'Early Blight Detected',      message:'Suspected early blight on tomatoes. Isolate affected plants and apply copper fungicide.',       channels:['in_app','sms','email'], recipient_role:'agronomist',   read:false, created_at:ago(120) },
        { type:'market',     title:'Wheat Price Alert +15%',     message:'Nairobi grain market: Wheat prices rose 15% to KES 25.30/kg. Consider selling current stock.',  channels:['in_app'],               recipient_role:'farm_manager', read:true,  created_at:ago(180) },
        { type:'system',     title:'May 2026 Payroll Generated', message:'Payroll for 8 workers computed. Total payout: KES 448,000. Pending approval.',                  channels:['in_app','email'],       recipient_role:'accountant',   read:true,  created_at:ago(240) },
      ].forEach(r => s.insert('notifications', r));
    }
  }
}

module.exports = new AsyncJsonStore();
