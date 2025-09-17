/*
  # Create inventory cycle management tables

  1. New Tables
    - `inventory_cycle_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `default_cycle_months` (integer, default 3)
      - `start_date` (date, default current date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `inventory_records`
      - `id` (uuid, primary key)
      - `component_id` (uuid, foreign key to components)
      - `expected_stock` (integer)
      - `actual_stock` (integer)
      - `difference` (computed column)
      - `notes` (text)
      - `inspector` (text)
      - `check_date` (date)
      - `week_number` (computed text)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
    
    - `component_cycle_overrides`
      - `id` (uuid, primary key)
      - `component_id` (uuid, foreign key to components)
      - `cycle_months` (integer)
      - `is_critical` (boolean)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Add performance indexes for common queries
</sql>

-- Create inventory cycle settings table
CREATE TABLE IF NOT EXISTS inventory_cycle_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  default_cycle_months integer DEFAULT 3,
  start_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory records table
CREATE TABLE IF NOT EXISTS inventory_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id uuid NOT NULL,
  expected_stock integer DEFAULT 0 NOT NULL,
  actual_stock integer DEFAULT 0 NOT NULL,
  difference integer GENERATED ALWAYS AS (actual_stock - expected_stock) STORED,
  notes text DEFAULT '',
  inspector text DEFAULT 'Nežinomas' NOT NULL,
  check_date date DEFAULT CURRENT_DATE,
  week_number text GENERATED ALWAYS AS ('W' || lpad(EXTRACT(week FROM check_date)::text, 2, '0')) STORED,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create component cycle overrides table
CREATE TABLE IF NOT EXISTS component_cycle_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id uuid NOT NULL,
  cycle_months integer DEFAULT 3 NOT NULL,
  is_critical boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE inventory_cycle_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_cycle_overrides ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory_cycle_settings
CREATE POLICY "Users can manage their own cycle settings"
  ON inventory_cycle_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for inventory_records
CREATE POLICY "Users can manage their own inventory records"
  ON inventory_records
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for component_cycle_overrides
CREATE POLICY "Users can manage their own component overrides"
  ON component_cycle_overrides
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_records_component_date 
  ON inventory_records(component_id, check_date);

CREATE INDEX IF NOT EXISTS idx_inventory_records_week 
  ON inventory_records(week_number);

CREATE INDEX IF NOT EXISTS idx_component_cycle_overrides_component 
  ON component_cycle_overrides(component_id);

-- Create unique constraint for component overrides per user
CREATE UNIQUE INDEX IF NOT EXISTS component_cycle_overrides_component_id_user_id_key 
  ON component_cycle_overrides(component_id, user_id);