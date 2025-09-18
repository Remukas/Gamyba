/*
  # Create inventory system tables

  1. New Tables
    - `users` - system users for authentication
    - `inventory_cycle_settings` - global inventory cycle configuration
    - `inventory_records` - individual inventory check records
    - `component_cycle_overrides` - component-specific cycle settings

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Features
    - Weekly inventory tracking
    - Discrepancy recording
    - Inspector assignment
    - Historical analysis
*/

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'operator',
  department text,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Inventory cycle settings table
CREATE TABLE IF NOT EXISTS inventory_cycle_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  default_cycle_months integer DEFAULT 3,
  start_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_cycle_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cycle settings"
  ON inventory_cycle_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Inventory records table
CREATE TABLE IF NOT EXISTS inventory_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id uuid NOT NULL,
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

ALTER TABLE inventory_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own inventory records"
  ON inventory_records
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Component cycle overrides table
CREATE TABLE IF NOT EXISTS component_cycle_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id uuid NOT NULL,
  cycle_months integer NOT NULL DEFAULT 3,
  is_critical boolean DEFAULT false,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(component_id, user_id)
);

ALTER TABLE component_cycle_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own component overrides"
  ON component_cycle_overrides
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_records_component_date ON inventory_records(component_id, check_date);
CREATE INDEX IF NOT EXISTS idx_inventory_records_week ON inventory_records(week_number);
CREATE INDEX IF NOT EXISTS idx_component_cycle_overrides_component ON component_cycle_overrides(component_id);