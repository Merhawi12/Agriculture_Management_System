-- ============================================================
-- CropMind — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT,
  email         TEXT UNIQUE,
  phone         TEXT,
  role          TEXT DEFAULT 'worker',
  status        TEXT DEFAULT 'active',
  farm_ids      JSONB DEFAULT '[]',
  avatar_color  TEXT,
  last_login    TEXT,
  password_hash TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Farms
CREATE TABLE IF NOT EXISTS farms (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT,
  owner         TEXT,
  location      TEXT,
  total_area_ha NUMERIC,
  farm_type     TEXT,
  status        TEXT DEFAULT 'active',
  established   TEXT,
  phone         TEXT,
  email         TEXT,
  description   TEXT,
  gps_lat       NUMERIC,
  gps_lng       NUMERIC,
  boundary      JSONB,
  soil          JSONB,
  fields        JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Crops
CREATE TABLE IF NOT EXISTS crops (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT,
  variety          TEXT,
  field            TEXT,
  area_hectares    NUMERIC,
  planting_date    TEXT,
  expected_harvest TEXT,
  status           TEXT DEFAULT 'planned',
  yield_kg         NUMERIC,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Livestock
CREATE TABLE IF NOT EXISTS livestock (
  id            BIGSERIAL PRIMARY KEY,
  tag_id        TEXT,
  type          TEXT,
  breed         TEXT,
  gender        TEXT,
  birth_date    TEXT,
  weight_kg     NUMERIC,
  health_status TEXT DEFAULT 'healthy',
  location      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT,
  category     TEXT,
  quantity     NUMERIC,
  unit         TEXT,
  unit_price   NUMERIC,
  supplier     TEXT,
  location     TEXT,
  min_quantity NUMERIC,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (Finance)
CREATE TABLE IF NOT EXISTS transactions (
  id             BIGSERIAL PRIMARY KEY,
  type           TEXT,
  category       TEXT,
  amount         NUMERIC,
  date           TEXT,
  description    TEXT,
  payment_method TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Workers
CREATE TABLE IF NOT EXISTS workers (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT,
  role       TEXT,
  phone      TEXT,
  email      TEXT,
  hire_date  TEXT,
  salary     NUMERIC,
  status     TEXT DEFAULT 'active',
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id             BIGSERIAL PRIMARY KEY,
  worker_id      BIGINT,
  worker_name    TEXT,
  date           TEXT,
  clock_in       TEXT,
  clock_out      TEXT,
  status         TEXT,
  hours_worked   NUMERIC,
  overtime_hours NUMERIC,
  location       TEXT,
  photo_verified BOOLEAN DEFAULT FALSE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment
CREATE TABLE IF NOT EXISTS equipment (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT,
  type             TEXT,
  model            TEXT,
  serial_number    TEXT,
  purchase_date    TEXT,
  purchase_price   NUMERIC,
  status           TEXT DEFAULT 'operational',
  last_maintenance TEXT,
  next_maintenance TEXT,
  location         TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id             BIGSERIAL PRIMARY KEY,
  product        TEXT,
  customer       TEXT,
  quantity       NUMERIC,
  unit           TEXT,
  unit_price     NUMERIC,
  total_amount   NUMERIC,
  date           TEXT,
  status         TEXT DEFAULT 'pending',
  payment_method TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id               BIGSERIAL PRIMARY KEY,
  worker_id        BIGINT,
  worker_name      TEXT,
  title            TEXT,
  field            TEXT,
  category         TEXT,
  date             TEXT,
  priority         TEXT DEFAULT 'medium',
  status           TEXT DEFAULT 'pending',
  assigned_by      TEXT,
  estimated_hours  NUMERIC,
  actual_hours     NUMERIC,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll
CREATE TABLE IF NOT EXISTS payroll (
  id               BIGSERIAL PRIMARY KEY,
  worker_id        BIGINT,
  worker_name      TEXT,
  role             TEXT,
  department       TEXT,
  month            TEXT,
  base_salary      NUMERIC,
  working_days     INTEGER,
  days_worked      NUMERIC,
  days_absent      INTEGER,
  leave_days       INTEGER,
  overtime_hours   NUMERIC,
  overtime_pay     NUMERIC,
  gross_pay        NUMERIC,
  nhif             NUMERIC,
  nssf             NUMERIC,
  paye             NUMERIC,
  total_deductions NUMERIC,
  net_pay          NUMERIC,
  status           TEXT DEFAULT 'pending',
  paid_on          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Products
CREATE TABLE IF NOT EXISTS marketplace_products (
  id          BIGSERIAL PRIMARY KEY,
  seller_id   BIGINT,
  seller_name TEXT,
  title       TEXT,
  category    TEXT,
  quantity    NUMERIC,
  unit        TEXT,
  price_kes   NUMERIC,
  location    TEXT,
  description TEXT,
  status      TEXT DEFAULT 'active',
  views       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Buyers
CREATE TABLE IF NOT EXISTS marketplace_buyers (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT,
  phone        TEXT,
  email        TEXT,
  location     TEXT,
  type         TEXT,
  total_orders INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Orders
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id               BIGSERIAL PRIMARY KEY,
  product_id       BIGINT,
  product_title    TEXT,
  product_category TEXT,
  seller_id        BIGINT,
  seller_name      TEXT,
  buyer_id         BIGINT,
  buyer_name       TEXT,
  buyer_phone      TEXT,
  quantity         NUMERIC,
  unit             TEXT,
  unit_price       NUMERIC,
  total_amount     NUMERIC,
  status           TEXT DEFAULT 'pending',
  payment_method   TEXT,
  delivery_address TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Deliveries
CREATE TABLE IF NOT EXISTS marketplace_deliveries (
  id               BIGSERIAL PRIMARY KEY,
  order_id         BIGINT,
  order_ref        TEXT,
  buyer_name       TEXT,
  buyer_phone      TEXT,
  product_title    TEXT,
  quantity         NUMERIC,
  unit             TEXT,
  delivery_address TEXT,
  status           TEXT DEFAULT 'scheduled',
  driver_name      TEXT,
  vehicle          TEXT,
  pickup_time      TEXT,
  delivery_time    TEXT,
  tracking_notes   TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id             BIGSERIAL PRIMARY KEY,
  type           TEXT,
  title          TEXT,
  message        TEXT,
  channels       JSONB DEFAULT '[]',
  recipient_role TEXT DEFAULT 'all',
  read           BOOLEAN DEFAULT FALSE,
  severity       TEXT,
  sent_channels  JSONB DEFAULT '[]',
  dispatched_at  TEXT,
  read_at        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Seed Data
-- ============================================================

INSERT INTO users (name, email, phone, role, status, farm_ids, avatar_color, last_login, password_hash) VALUES
  ('Admin User',    'admin@cropmind.app', '0700-000-001', 'super_admin',  'active',    '[1,2]', 'bg-red-500',    '2026-05-10 07:30:00', 'hashed_admin123'),
  ('James Mwangi',  'james@farm.com',     '0712-345-678', 'farm_manager', 'active',    '[1]',   'bg-blue-600',   '2026-05-10 07:45:00', 'hashed_james123'),
  ('Fatuma Ochieng','fatuma@farm.com',    '0723-456-789', 'agronomist',   'active',    '[1]',   'bg-green-600',  '2026-05-09 08:10:00', 'hashed_fatuma123'),
  ('Peter Kamau',   'peter@farm.com',     '0734-567-890', 'worker',       'active',    '[1]',   'bg-purple-500', '2026-05-10 07:52:00', 'hashed_peter123'),
  ('Grace Wanjiku', 'grace@farm.com',     '0745-678-901', 'accountant',   'active',    '[1,2]', 'bg-yellow-600', '2026-05-09 09:00:00', 'hashed_grace123'),
  ('David Otieno',  'david@farm.com',     '0756-789-012', 'worker',       'active',    '[1]',   'bg-orange-500', '2026-05-10 07:30:00', 'hashed_david123'),
  ('Mary Njeri',    'mary@farm.com',      '0767-890-123', 'farm_manager', 'active',    '[2]',   'bg-teal-500',   '2026-05-08 08:00:00', 'hashed_mary123'),
  ('Samuel Kibet',  'samuel@farm.com',    '0778-901-234', 'worker',       'inactive',  '[1]',   'bg-cyan-500',   '2026-05-07 07:30:00', 'hashed_samuel123'),
  ('Aisha Hassan',  'aisha@farm.com',     '0789-012-345', 'accountant',   'suspended', '[1]',   'bg-pink-500',   '2026-04-30 09:15:00', 'hashed_aisha123'),
  ('Demo Viewer',   'demo@cropmind.app',  '0700-000-010', 'worker',       'active',    '[1,2]', 'bg-gray-500',   '2026-05-10 06:00:00', 'hashed_demo123')
ON CONFLICT (email) DO NOTHING;

INSERT INTO farms (name, owner, location, total_area_ha, farm_type, status, established, phone, email, description, gps_lat, gps_lng, boundary, soil, fields) VALUES
  ('Mwangi Family Farm', 'James Mwangi', 'Nakuru County, Kenya', 108, 'Mixed', 'active', '2010-03-01', '0712-345-678', 'james@farm.com', 'Large mixed farm with crops, livestock and horticulture', -0.3031, 36.0800,
   '[{"lat":-0.2990,"lng":36.0750},{"lat":-0.2990,"lng":36.0870},{"lat":-0.3075,"lng":36.0870},{"lat":-0.3075,"lng":36.0750}]',
   '{"type":"Clay Loam","ph":6.2,"organic_matter":3.8,"nitrogen":"medium","phosphorus":"high","potassium":"medium","last_tested":"2026-03-15","lab":"Kenya Soil Health Labs"}',
   '[{"name":"Field A","area_ha":25.5,"crop":"Wheat","soil_type":"Clay Loam","irrigation":"center pivot"},{"name":"Field B","area_ha":18.0,"crop":"Corn","soil_type":"Sandy Loam","irrigation":"drip"},{"name":"Field C","area_ha":30.0,"crop":"Soybeans","soil_type":"Clay Loam","irrigation":"furrow"},{"name":"Field D","area_ha":12.0,"crop":"Sunflowers","soil_type":"Loam","irrigation":"none"},{"name":"Field E","area_ha":20.0,"crop":"Rice","soil_type":"Clay","irrigation":"flood"},{"name":"Greenhouse 1","area_ha":2.5,"crop":"Tomatoes","soil_type":"Potting mix","irrigation":"drip"}]'),
  ('Green Valley Horticultural Farm', 'Mary Njeri', 'Kiambu County, Kenya', 45, 'Horticulture', 'active', '2018-06-01', '0767-890-123', 'mary@greenvalley.com', 'Specialised horticultural farm for export vegetables', -1.0320, 37.0700,
   '[{"lat":-1.0300,"lng":37.0670},{"lat":-1.0300,"lng":37.0730},{"lat":-1.0340,"lng":37.0730},{"lat":-1.0340,"lng":37.0670}]',
   '{"type":"Sandy Loam","ph":6.8,"organic_matter":5.2,"nitrogen":"high","phosphorus":"medium","potassium":"high","last_tested":"2026-02-20","lab":"AgroTest Kenya"}',
   '[{"name":"Block 1","area_ha":15.0,"crop":"French Beans","soil_type":"Sandy Loam","irrigation":"drip"},{"name":"Block 2","area_ha":12.0,"crop":"Snow Peas","soil_type":"Sandy Loam","irrigation":"drip"},{"name":"Block 3","area_ha":10.0,"crop":"Capsicum","soil_type":"Loam","irrigation":"drip"},{"name":"Greenhouse A","area_ha":4.0,"crop":"Roses","soil_type":"Potting mix","irrigation":"drip"},{"name":"Greenhouse B","area_ha":4.0,"crop":"Herbs","soil_type":"Potting mix","irrigation":"drip"}]');

INSERT INTO crops (name, variety, field, area_hectares, planting_date, expected_harvest, status, yield_kg, notes) VALUES
  ('Wheat',     'Winter Wheat',         'Field A',      25.5, '2025-10-15', '2026-06-20', 'growing',  NULL, 'Main grain crop'),
  ('Corn',      'Sweet Corn',           'Field B',      18.0, '2025-04-10', '2025-08-30', 'harvested',8200, 'Excellent yield'),
  ('Soybeans',  'Glyphosate-Resistant', 'Field C',      30.0, '2025-05-01', '2025-10-15', 'harvested',5400, 'Good season'),
  ('Tomatoes',  'Roma',                 'Greenhouse 1', 2.5,  '2026-02-01', '2026-05-15', 'growing',  NULL, 'Drip irrigation'),
  ('Sunflowers','Hybrid',               'Field D',      12.0, '2026-04-20', '2026-09-01', 'planned',  NULL, 'Oil production'),
  ('Rice',      'Jasmine',              'Field E',      20.0, '2026-05-01', '2026-10-30', 'growing',  NULL, 'Paddy field');

INSERT INTO livestock (tag_id, type, breed, gender, birth_date, weight_kg, health_status, location) VALUES
  ('COW-001','Cattle', 'Holstein','Female','2022-03-15',580, 'healthy',        'Barn A'),
  ('COW-002','Cattle', 'Angus',   'Male',  '2021-07-20',720, 'healthy',        'Pasture 1'),
  ('COW-003','Cattle', 'Jersey',  'Female','2023-01-10',450, 'healthy',        'Barn A'),
  ('SHP-001','Sheep',  'Merino',  'Female','2023-05-05',65,  'healthy',        'Pasture 2'),
  ('SHP-002','Sheep',  'Suffolk', 'Male',  '2022-11-18',85,  'under_treatment','Quarantine'),
  ('PIG-001','Pig',    'Duroc',   'Female','2024-01-20',120, 'healthy',        'Pig House'),
  ('CHK-001','Chicken','Broiler', 'Female','2025-09-01',2.8, 'healthy',        'Poultry House'),
  ('CHK-002','Chicken','Layer',   'Female','2025-06-15',1.9, 'healthy',        'Poultry House'),
  ('GOT-001','Goat',   'Boer',    'Male',  '2023-08-12',75,  'healthy',        'Pasture 3');

INSERT INTO inventory (name, category, quantity, unit, unit_price, supplier, location, min_quantity) VALUES
  ('Wheat Seeds',       'Seeds',         500,  'kg',   2.50,  'AgriSupply Co',  'Warehouse A',  100),
  ('NPK Fertilizer',    'Fertilizer',    1200, 'kg',   1.80,  'FertileCrop Ltd','Warehouse B',  200),
  ('Herbicide X',       'Pesticide',     80,   'L',    15.00, 'CropProtect',    'Chemical Store',20),
  ('Diesel Fuel',       'Fuel',          3000, 'L',    1.20,  'FuelMart',       'Fuel Tank',    500),
  ('Irrigation Pipes',  'Equipment',     200,  'm',    3.50,  'IrriTech',       'Workshop',     50),
  ('Corn Seeds',        'Seeds',         300,  'kg',   3.20,  'AgriSupply Co',  'Warehouse A',  80),
  ('Lime',              'Soil Amendment',800,  'kg',   0.90,  'SoilCo',         'Warehouse B',  150),
  ('Insecticide Y',     'Pesticide',     45,   'L',    18.00, 'CropProtect',    'Chemical Store',10),
  ('Hay Bales',         'Feed',          150,  'bale', 12.00, 'LocalFarm',      'Feed Store',   30),
  ('Vitamin Supplement','Feed Additive', 25,   'kg',   35.00, 'VetSupply',      'Feed Store',   5);

INSERT INTO transactions (type, category, amount, date, description, payment_method) VALUES
  ('income',  'Crop Sales',           45000, '2026-01-15', 'Wheat harvest sale',    'bank_transfer'),
  ('income',  'Livestock Sales',      12000, '2026-01-28', 'Cattle sale',           'bank_transfer'),
  ('expense', 'Fertilizer',           3200,  '2026-02-05', 'NPK purchase Q1',       'cash'),
  ('expense', 'Labor',                8500,  '2026-02-28', 'Monthly wages',         'bank_transfer'),
  ('income',  'Crop Sales',           28000, '2026-03-10', 'Corn sale',             'bank_transfer'),
  ('expense', 'Equipment Maintenance',1500,  '2026-03-20', 'Tractor service',       'cash'),
  ('expense', 'Seeds',                2800,  '2026-04-01', 'Spring planting seeds', 'bank_transfer'),
  ('income',  'Dairy Products',       6000,  '2026-04-15', 'Milk sales',            'bank_transfer'),
  ('expense', 'Fuel',                 1800,  '2026-04-30', 'Monthly fuel cost',     'cash'),
  ('income',  'Livestock Sales',      9500,  '2026-05-05', 'Pig sale',              'bank_transfer'),
  ('expense', 'Labor',                8500,  '2026-05-01', 'Monthly wages',         'bank_transfer'),
  ('income',  'Crop Sales',           15000, '2026-05-08', 'Soybean sale',          'bank_transfer');

INSERT INTO workers (name, role, phone, email, hire_date, salary, status, department) VALUES
  ('James Mwangi',  'Farm Manager',         '0712-345-678','james@farm.com', '2020-03-01',85000,'active',  'Management'),
  ('Fatuma Ochieng','Agronomist',           '0723-456-789','fatuma@farm.com','2021-06-15',65000,'active',  'Agronomy'),
  ('Peter Kamau',   'Livestock Supervisor', '0734-567-890','peter@farm.com', '2019-11-01',55000,'active',  'Livestock'),
  ('Grace Wanjiku', 'Finance Officer',      '0745-678-901','grace@farm.com', '2022-01-10',60000,'active',  'Finance'),
  ('David Otieno',  'Equipment Operator',   '0756-789-012','david@farm.com', '2021-08-20',42000,'active',  'Operations'),
  ('Mary Njeri',    'Field Supervisor',     '0767-890-123','mary@farm.com',  '2020-05-15',48000,'active',  'Operations'),
  ('Samuel Kibet',  'Irrigation Technician','0778-901-234','samuel@farm.com','2023-02-01',40000,'active',  'Operations'),
  ('Aisha Hassan',  'Accountant',           '0789-012-345','aisha@farm.com', '2022-09-01',55000,'on_leave','Finance');

INSERT INTO equipment (name, type, model, serial_number, purchase_date, purchase_price, status, last_maintenance, next_maintenance, location) VALUES
  ('John Deere 6M',    'Tractor', '6130M',         'JD6M-2021-001', '2021-03-15',4500000, 'operational',       '2026-03-01','2026-09-01','Equipment Yard'),
  ('New Holland T5',   'Tractor', 'T5.120',        'NH5-2020-002',  '2020-07-20',3800000, 'operational',       '2026-04-15','2026-10-15','Field B'),
  ('Combine Harvester','Harvester','Claas Lexion 750','CL750-2022-001','2022-01-10',12000000,'operational',     '2025-12-01','2026-06-01','Equipment Yard'),
  ('Irrigation Pump',  'Pump',    'Grundfos CM5',  'GF-2021-003',   '2021-05-01',180000,  'operational',       '2026-02-01','2026-08-01','Field A'),
  ('Sprayer',          'Sprayer', 'AGCO 4200',     'AG4200-2023-001','2023-08-15',650000,  'operational',       '2026-01-15','2026-07-15','Equipment Yard'),
  ('Seed Drill',       'Planter', 'Horsch Maestro','HM-2022-002',   '2022-11-20',950000,  'under_maintenance', '2026-05-01','2026-05-30','Workshop'),
  ('Grain Dryer',      'Dryer',   'Sukup 2410',    'SK2410-2020-001','2020-09-10',1200000, 'operational',       '2025-11-01','2026-05-01','Warehouse A'),
  ('Pickup Truck',     'Vehicle', 'Toyota Hilux',  'TH-2023-003',   '2023-04-01',2800000, 'operational',       '2026-04-01','2026-10-01','Farm Office');

INSERT INTO sales (product, customer, quantity, unit, unit_price, total_amount, date, status, payment_method) VALUES
  ('Wheat',           'Nairobi Millers Ltd',20000,5,   22.50,450000,'2026-01-15','completed','bank_transfer'),
  ('Cattle (5 head)', 'Local Butcher',      5,    'head',65000,325000,'2026-01-28','completed','bank_transfer'),
  ('Corn',            'Feed & Grain Co',    14000,'kg', 20.00,280000,'2026-03-10','completed','bank_transfer'),
  ('Fresh Milk',      'Dairy Cooperative',  3000, 'L',  60,   180000,'2026-04-15','completed','bank_transfer'),
  ('Pig (6 head)',    'Meat Processor',     6,    'head',25000,150000,'2026-05-05','completed','cash'),
  ('Soybeans',        'Oil Processor',      8000, 'kg', 45,   360000,'2026-05-08','completed','bank_transfer'),
  ('Tomatoes',        'City Market',        500,  'kg', 80,   40000, '2026-05-09','pending',  'cash');

INSERT INTO tasks (worker_id, worker_name, title, field, category, date, priority, status, assigned_by, estimated_hours) VALUES
  (2,'Fatuma Ochieng','Inspect wheat growth stages — Field A',   'Field A',      'inspection', '2026-05-09','high',  'in_progress','James Mwangi',3),
  (5,'David Otieno',  'Apply NPK fertilizer — Field D',          'Field D',      'fertilizing','2026-05-09','high',  'in_progress','James Mwangi',4),
  (3,'Peter Kamau',   'Livestock health check — Barn A',         'Barn A',       'livestock',  '2026-05-09','high',  'completed',  'James Mwangi',2),
  (7,'Samuel Kibet',  'Repair irrigation pipe — Section E-3',    'Field E',      'maintenance','2026-05-09','urgent','pending',    'Mary Njeri',  3),
  (6,'Mary Njeri',    'Supervise tomato harvest — Greenhouse 1', 'Greenhouse 1', 'harvesting', '2026-05-09','medium','completed',  'James Mwangi',4),
  (1,'James Mwangi',  'Weekly farm management review',           'Farm Office',  'management', '2026-05-09','medium','pending',    'self',         2),
  (2,'Fatuma Ochieng','Weekly disease surveillance — Field A',   'Field A',      'inspection', '2026-05-10','medium','pending',    'James Mwangi',2),
  (5,'David Otieno',  'Combine harvester pre-season service',    'Equipment Yard','maintenance','2026-05-11','high',  'pending',    'James Mwangi',6),
  (3,'Peter Kamau',   'Deworming — all cattle',                  'Barn A',       'livestock',  '2026-05-12','high',  'pending',    'James Mwangi',3);

INSERT INTO notifications (type, title, message, channels, recipient_role, read) VALUES
  ('weather',   'Heavy Rain Warning',         'Heavy rainfall (45mm) expected in Nakuru. Delay spraying.','["in_app","sms"]',         'all',          false),
  ('irrigation','Irrigation Alert — Field A', 'Soil moisture below 35%. Wheat requires irrigation.',       '["in_app","sms"]',         'farm_manager', false),
  ('disease',   'Early Blight Detected',      'Suspected early blight on tomatoes. Apply copper fungicide.','["in_app","sms","email"]', 'agronomist',   false),
  ('market',    'Wheat Price Alert +15%',     'Wheat prices rose to KES 25.30/kg. Consider selling.',      '["in_app"]',               'farm_manager', true),
  ('system',    'May 2026 Payroll Generated', 'Payroll computed for 8 workers. Total: KES 448,000.',       '["in_app","email"]',       'accountant',   true);

INSERT INTO marketplace_products (seller_id, seller_name, title, category, quantity, unit, price_kes, location, description, status, views) VALUES
  (1,'James Mwangi',  'Fresh Wheat Grain',    'Grains',    5000,'kg',  22,   'Nakuru, Kenya','Grade A winter wheat, clean and dry.','active',  42),
  (1,'James Mwangi',  'Dried Soybeans',       'Grains',    3000,'kg',  45,   'Nakuru, Kenya','Non-GMO soybeans, 13% moisture.',    'active',  28),
  (2,'Fatuma Ochieng','Fresh Tomatoes — Roma','Vegetables', 800,'kg',  80,   'Nakuru, Kenya','Firm Roma tomatoes, harvested today.','active',  67),
  (3,'Peter Kamau',   'Holstein Dairy Cows',  'Livestock', 3,'head',95000, 'Nakuru, Kenya','High-yielding Holstein cows.',        'active',  15),
  (3,'Peter Kamau',   'Fresh Whole Milk',     'Dairy',     500,'L',   60,   'Nakuru, Kenya','Farm-fresh whole milk, certified.',   'active',  89),
  (7,'Mary Njeri',    'French Beans — Export','Vegetables', 600,'kg',  120,  'Kiambu, Kenya','Air-freight grade French beans.',     'active',  54),
  (1,'James Mwangi',  'Corn (Yellow Maize)',  'Grains',    8000,'kg',  20,   'Nakuru, Kenya','Dry yellow maize, aflatoxin tested.','active',  76);

INSERT INTO marketplace_buyers (name, phone, email, location, type, total_orders) VALUES
  ('Nairobi Millers Ltd',    '+254-20-123-4567', 'procurement@nairobimill.co.ke', 'Nairobi', 'Processor',  4),
  ('City Fresh Market',      '+254-722-234-567', 'buying@cityfresh.co.ke',        'Nairobi', 'Retailer',   6),
  ('Dairy Cooperative KE',   '+254-733-345-678', 'supply@dairykoop.co.ke',        'Nakuru',  'Cooperative',3),
  ('Meat Master Ltd',        '+254-744-456-789', 'orders@meatmaster.co.ke',       'Nairobi', 'Processor',  2),
  ('Organic Africa Exports', '+254-755-567-890', 'import@organicafrica.com',      'Mombasa', 'Exporter',   5);
