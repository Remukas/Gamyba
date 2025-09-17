/*
  # Inventorizacijos ciklų duomenų bazės schema

  1. Naujos lentelės
    - `inventory_cycle_settings` - bendri inventorizacijos nustatymai
    - `inventory_records` - inventorizacijos įrašai su neatitikimais
    - `component_cycle_overrides` - individualūs komponentų ciklai

  2. Saugumas
    - Įjungtas RLS visoms lentelėms
    - Politikos autentifikuotiems vartotojams

  3. Funkcionalumas
    - Automatinis laiko žymėjimas
    - Numatytosios vertės
    - Ryšiai tarp lentelių
*/

-- Inventorizacijos ciklų nustatymai
CREATE TABLE IF NOT EXISTS inventory_cycle_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  default_cycle_months integer DEFAULT 3,
  start_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventorizacijos įrašai
CREATE TABLE IF NOT EXISTS inventory_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id uuid NOT NULL,
  expected_stock integer NOT NULL DEFAULT 0,
  actual_stock integer NOT NULL DEFAULT 0,
  difference integer GENERATED ALWAYS AS (actual_stock - expected_stock) STORED,
  notes text DEFAULT '',
  inspector text NOT NULL DEFAULT 'Nežinomas',
  check_date date DEFAULT CURRENT_DATE,
  week_number text GENERATED ALWAYS AS ('W' || LPAD(EXTRACT(week FROM check_date)::text, 2, '0')) STORED,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Komponentų ciklų perrašymai
CREATE TABLE IF NOT EXISTS component_cycle_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id uuid NOT NULL,
  cycle_months integer NOT NULL DEFAULT 3,
  is_critical boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(component_id, user_id)
);

-- Įjungti RLS
ALTER TABLE inventory_cycle_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_cycle_overrides ENABLE ROW LEVEL SECURITY;

-- RLS politikos inventory_cycle_settings
CREATE POLICY "Users can manage their own cycle settings"
  ON inventory_cycle_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS politikos inventory_records
CREATE POLICY "Users can manage their own inventory records"
  ON inventory_records
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS politikos component_cycle_overrides
CREATE POLICY "Users can manage their own component overrides"
  ON component_cycle_overrides
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indeksai našumui
CREATE INDEX IF NOT EXISTS idx_inventory_records_component_date 
  ON inventory_records(component_id, check_date);

CREATE INDEX IF NOT EXISTS idx_inventory_records_week 
  ON inventory_records(week_number);

CREATE INDEX IF NOT EXISTS idx_component_cycle_overrides_component 
  ON component_cycle_overrides(component_id);