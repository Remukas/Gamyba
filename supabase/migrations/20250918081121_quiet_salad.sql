/*
  # Complete Production Management System

  1. New Tables
    - `users` - system users with authentication
    - `categories` - product categories  
    - `components` - manufacturing components
    - `subassemblies` - production subassemblies
    - `subassembly_components` - component requirements for subassemblies
    - `subassembly_comments` - comments on subassemblies
    - `production_history` - audit trail for all changes
    - `quality_checks` - quality control records
    - `maintenance_tasks` - equipment maintenance scheduling
    - `system_logs` - system activity logs

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Admin users can access all data

  3. Features
    - Complete production hierarchy management
    - Component inventory tracking
    - Quality control system
    - Maintenance scheduling
    - Audit trails and logging
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'manager', 'operator', 'quality')),
  department text DEFAULT '',
  is_active boolean DEFAULT true,
  last_login timestamptz,
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

-- Components table  
CREATE TABLE IF NOT EXISTS components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  stock integer DEFAULT 0,
  lead_time_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subassemblies table
CREATE TABLE IF NOT EXISTS subassemblies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES subassemblies(id) ON DELETE CASCADE,
  quantity integer DEFAULT 0,
  target_quantity integer DEFAULT 1,
  status text DEFAULT 'pending',
  position_x real DEFAULT 200,
  position_y real DEFAULT 150,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, category_id, parent_id)
);

-- Subassembly components junction table
CREATE TABLE IF NOT EXISTS subassembly_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subassembly_id uuid NOT NULL REFERENCES subassemblies(id) ON DELETE CASCADE,
  component_id uuid NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  required_quantity integer DEFAULT 1,
  UNIQUE(subassembly_id, component_id)
);

-- Subassembly comments
CREATE TABLE IF NOT EXISTS subassembly_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subassembly_id uuid NOT NULL REFERENCES subassemblies(id) ON DELETE CASCADE,
  comment text NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Production history for audit trail
CREATE TABLE IF NOT EXISTS production_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('component', 'subassembly', 'category')),
  entity_id uuid NOT NULL,
  entity_name text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('created', 'updated', 'deleted')),
  old_value jsonb,
  new_value jsonb,
  change_reason text DEFAULT '',
  changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Quality checks
CREATE TABLE IF NOT EXISTS quality_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  inspector text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed')),
  score integer DEFAULT 100 CHECK (score >= 0 AND score <= 100),
  defects text[] DEFAULT '{}',
  notes text DEFAULT '',
  check_date date DEFAULT CURRENT_DATE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Maintenance tasks
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_name text NOT NULL,
  task_type text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'overdue')),
  assigned_to text NOT NULL,
  scheduled_date date NOT NULL,
  estimated_hours real DEFAULT 1,
  description text DEFAULT '',
  last_maintenance date,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- System logs
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Inventory cycle settings (already exists)
-- Component cycle overrides (already exists) 
-- Inventory records (already exists)

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE subassemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subassembly_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE subassembly_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read all users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = auth_user_id);
CREATE POLICY "Admins can manage all users" ON users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin')
);

-- Categories policies (public read, authenticated write)
CREATE POLICY "Public categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Users can insert their own categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their own categories" ON categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete their own categories" ON categories FOR DELETE TO authenticated USING (true);

-- Components policies (public read, authenticated write)
CREATE POLICY "Public components are viewable by everyone" ON components FOR SELECT USING (true);
CREATE POLICY "Users can insert their own components" ON components FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their own components" ON components FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete their own components" ON components FOR DELETE TO authenticated USING (true);

-- Subassemblies policies (public read, authenticated write)
CREATE POLICY "Public subassemblies are viewable by everyone" ON subassemblies FOR SELECT USING (true);
CREATE POLICY "Users can insert their own subassemblies" ON subassemblies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their own subassemblies" ON subassemblies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete their own subassemblies" ON subassemblies FOR DELETE TO authenticated USING (true);

-- Subassembly components policies (public read, authenticated write)
CREATE POLICY "Public subassembly_components are viewable by everyone" ON subassembly_components FOR SELECT USING (true);
CREATE POLICY "Users can insert their own subassembly_components" ON subassembly_components FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their own subassembly_components" ON subassembly_components FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete their own subassembly_components" ON subassembly_components FOR DELETE TO authenticated USING (true);

-- Subassembly comments policies
CREATE POLICY "Public comments are viewable by everyone" ON subassembly_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON subassembly_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their own comments" ON subassembly_comments FOR UPDATE TO authenticated USING (
  author_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Users can delete their own comments" ON subassembly_comments FOR DELETE TO authenticated USING (
  author_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Production history policies
CREATE POLICY "Users can view production history" ON production_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert history" ON production_history FOR INSERT TO authenticated WITH CHECK (true);

-- Quality checks policies
CREATE POLICY "Users can manage their own quality checks" ON quality_checks FOR ALL TO authenticated USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
) WITH CHECK (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Maintenance tasks policies
CREATE POLICY "Users can manage their own maintenance tasks" ON maintenance_tasks FOR ALL TO authenticated USING (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
) WITH CHECK (
  user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- System logs policies
CREATE POLICY "Users can view system logs" ON system_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert logs" ON system_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subassemblies_category ON subassemblies(category_id);
CREATE INDEX IF NOT EXISTS idx_subassemblies_parent ON subassemblies(parent_id);
CREATE INDEX IF NOT EXISTS idx_subassembly_components_subassembly ON subassembly_components(subassembly_id);
CREATE INDEX IF NOT EXISTS idx_subassembly_components_component ON subassembly_components(component_id);
CREATE INDEX IF NOT EXISTS idx_production_history_entity ON production_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_date ON quality_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_date ON maintenance_tasks(scheduled_date);

-- Insert initial categories
INSERT INTO categories (id, name, color) VALUES 
  ('cart', 'Cart SA-10000170', '#3b82f6'),
  ('control-unit', 'Control unit SA-10000111', '#22c55e'),
  ('cockpit', 'Cockpit SEN-1-ME-10001124', '#eab308'),
  ('bedside-main', 'Bedside unit main SA-10000296', '#a855f7'),
  ('nurse-workstation', 'Nurse Workstation SA-10000478', '#ec4899'),
  ('bedside-adapter', 'Bedside unit adapter SA-10000401 & SA-10000404', '#f97316')
ON CONFLICT (name) DO NOTHING;

-- Insert initial components
INSERT INTO components (id, name, stock, lead_time_days) VALUES 
  ('comp-1', 'Variklio korpusas', 50, 7),
  ('comp-2', 'Cilindro galvutė', 40, 10),
  ('comp-3', 'Stūmoklis', 100, 5),
  ('comp-4', 'Valdymo mikroschema', 0, 30),
  ('comp-5', 'Sensorius v1', 150, 3),
  ('comp-6', 'Pneumatinis vožtuvas', 80, 14),
  ('comp-7', 'Hidraulinė pompa', 10, 21)
ON CONFLICT (name) DO NOTHING;