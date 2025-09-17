/*
  # Išsami gamybos valdymo sistema

  1. Naujos Lentelės
    - `users` - vartotojų duomenys ir profiliai
    - `categories` - produktų kategorijos
    - `components` - komponentų katalogas
    - `subassemblies` - subasemblių katalogas
    - `subassembly_components` - komponentų priskyrimas subasembliams
    - `production_history` - gamybos istorija ir pakeitimai
    - `inventory_records` - inventorizacijos įrašai
    - `quality_checks` - kokybės kontrolės įrašai
    - `maintenance_tasks` - priežiūros užduotys
    - `system_logs` - sistemos veiklos žurnalai
    - `component_cycle_overrides` - komponentų ciklų nustatymai
    - `inventory_cycle_settings` - inventorizacijos nustatymai

  2. Saugumas
    - RLS įjungtas visoms lentelėms
    - Vartotojų duomenų apsauga
    - Rolių valdymas

  3. Istorijos Sekimas
    - Visų pakeitimų fiksavimas
    - Audito žurnalai
    - Tendencijų analizė
*/

-- Vartotojų lentelė
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'operator',
  department text DEFAULT '',
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Kategorijos
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#6b7280',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Komponentai
CREATE TABLE IF NOT EXISTS components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  stock integer DEFAULT 0,
  lead_time_days integer DEFAULT 0,
  unit_cost decimal(10,2) DEFAULT 0,
  supplier text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subasembliai
CREATE TABLE IF NOT EXISTS subassemblies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES subassemblies(id) ON DELETE CASCADE,
  quantity integer DEFAULT 0,
  target_quantity integer DEFAULT 1,
  status text DEFAULT 'pending',
  position_x real DEFAULT 0,
  position_y real DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, category_id, parent_id)
);

-- Subasemblių komponentai
CREATE TABLE IF NOT EXISTS subassembly_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subassembly_id uuid NOT NULL REFERENCES subassemblies(id) ON DELETE CASCADE,
  component_id uuid NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  required_quantity integer DEFAULT 1,
  UNIQUE(subassembly_id, component_id)
);

-- Gamybos istorija
CREATE TABLE IF NOT EXISTS production_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'component' arba 'subassembly'
  entity_id uuid NOT NULL,
  entity_name text NOT NULL,
  action_type text NOT NULL, -- 'created', 'updated', 'deleted', 'stock_changed'
  old_value jsonb,
  new_value jsonb,
  changed_by uuid REFERENCES users(id),
  change_reason text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Inventorizacijos įrašai
CREATE TABLE IF NOT EXISTS inventory_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id uuid NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  expected_stock integer NOT NULL DEFAULT 0,
  actual_stock integer NOT NULL DEFAULT 0,
  difference integer GENERATED ALWAYS AS (actual_stock - expected_stock) STORED,
  notes text DEFAULT '',
  inspector text NOT NULL DEFAULT 'Nežinomas',
  check_date date DEFAULT CURRENT_DATE,
  week_number text GENERATED ALWAYS AS ('W' || lpad(EXTRACT(week FROM check_date)::text, 2, '0')) STORED,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Kokybės patikrinimai
CREATE TABLE IF NOT EXISTS quality_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  inspector text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'passed', 'failed'
  score integer DEFAULT 100,
  defects text[] DEFAULT '{}',
  notes text DEFAULT '',
  check_date date DEFAULT CURRENT_DATE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Priežiūros užduotys
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_name text NOT NULL,
  task_type text NOT NULL DEFAULT 'Prevencinė priežiūra',
  priority text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status text NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'overdue'
  assigned_to text NOT NULL,
  scheduled_date date NOT NULL,
  completed_date date,
  estimated_hours real DEFAULT 1,
  actual_hours real,
  description text DEFAULT '',
  notes text DEFAULT '',
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sistemos žurnalai
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Komponentų ciklų nustatymai
CREATE TABLE IF NOT EXISTS component_cycle_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id uuid NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  cycle_months integer DEFAULT 3,
  is_critical boolean DEFAULT false,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(component_id, user_id)
);

-- Inventorizacijos ciklų nustatymai
CREATE TABLE IF NOT EXISTS inventory_cycle_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  default_cycle_months integer DEFAULT 3,
  start_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Komentarai subasembliams
CREATE TABLE IF NOT EXISTS subassembly_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subassembly_id uuid NOT NULL REFERENCES subassemblies(id) ON DELETE CASCADE,
  comment text NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Indeksai našumui
CREATE INDEX IF NOT EXISTS idx_production_history_entity ON production_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_production_history_created_at ON production_history(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_records_component_date ON inventory_records(component_id, check_date);
CREATE INDEX IF NOT EXISTS idx_inventory_records_week ON inventory_records(week_number);
CREATE INDEX IF NOT EXISTS idx_quality_checks_date ON quality_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_date ON maintenance_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_component_cycle_overrides_component ON component_cycle_overrides(component_id);

-- RLS įjungimas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE subassemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subassembly_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_cycle_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_cycle_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subassembly_comments ENABLE ROW LEVEL SECURITY;

-- RLS politikos - visi duomenys viešai prieinami (demo režimas)
CREATE POLICY "Public users are viewable by everyone." ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own users." ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own users." ON users FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own users." ON users FOR DELETE USING (true);

CREATE POLICY "Public categories are viewable by everyone." ON categories FOR SELECT USING (true);
CREATE POLICY "Users can insert their own categories." ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own categories." ON categories FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own categories." ON categories FOR DELETE USING (true);

CREATE POLICY "Public components are viewable by everyone." ON components FOR SELECT USING (true);
CREATE POLICY "Users can insert their own components." ON components FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own components." ON components FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own components." ON components FOR DELETE USING (true);

CREATE POLICY "Public subassemblies are viewable by everyone." ON subassemblies FOR SELECT USING (true);
CREATE POLICY "Users can insert their own subassemblies." ON subassemblies FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own subassemblies." ON subassemblies FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own subassemblies." ON subassemblies FOR DELETE USING (true);

CREATE POLICY "Public subassembly_components are viewable by everyone." ON subassembly_components FOR SELECT USING (true);
CREATE POLICY "Users can insert their own subassembly_components." ON subassembly_components FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own subassembly_components." ON subassembly_components FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own subassembly_components." ON subassembly_components FOR DELETE USING (true);

CREATE POLICY "Users can view all production history" ON production_history FOR SELECT USING (true);
CREATE POLICY "Users can insert production history" ON production_history FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their own inventory records" ON inventory_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own quality checks" ON quality_checks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own maintenance tasks" ON maintenance_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view system logs" ON system_logs FOR SELECT USING (true);
CREATE POLICY "System can insert logs" ON system_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their own component overrides" ON component_cycle_overrides FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cycle settings" ON inventory_cycle_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage subassembly comments" ON subassembly_comments FOR ALL USING (true) WITH CHECK (true);