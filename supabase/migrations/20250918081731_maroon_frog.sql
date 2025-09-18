/*
  # Add color column to categories table

  1. Changes
    - Add `color` column to `categories` table with default values
    - Update existing categories with default colors

  2. Security
    - No changes to RLS policies needed
*/

-- Add color column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color text DEFAULT '#3b82f6';

-- Update existing categories with default colors if they don't have colors
UPDATE categories SET color = '#3b82f6' WHERE color IS NULL OR color = '';

-- You can also set specific colors for existing categories:
-- UPDATE categories SET color = '#ef4444' WHERE name = 'Electronics';
-- UPDATE categories SET color = '#22c55e' WHERE name = 'Mechanical';
-- UPDATE categories SET color = '#f59e0b' WHERE name = 'Software';