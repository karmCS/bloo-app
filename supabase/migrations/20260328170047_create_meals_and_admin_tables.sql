/*
  # Create bloo meal delivery marketplace schema

  1. New Tables
    - `meals`
      - `id` (uuid, primary key)
      - `name` (text) - Meal name
      - `vendor` (text) - Vendor/restaurant name
      - `image_url` (text) - URL to meal image
      - `calories` (integer) - Calorie count
      - `protein` (integer) - Protein in grams
      - `carbs` (integer) - Carbohydrates in grams
      - `fats` (integer) - Fats in grams
      - `ingredients` (text[]) - Array of ingredients
      - `week_id` (text) - Week identifier (e.g., "2024-W12")
      - `dietary_tags` (text[]) - Array of dietary tags (vegan, keto, etc.)
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `admin_users`
      - `id` (uuid, primary key, foreign key to auth.users)
      - `email` (text) - Admin email
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on both tables
    - Public read access for meals
    - Admin-only write access for meals
    - Admin-only access for admin_users table
*/

CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  vendor text NOT NULL,
  image_url text NOT NULL,
  calories integer NOT NULL DEFAULT 0,
  protein integer NOT NULL DEFAULT 0,
  carbs integer NOT NULL DEFAULT 0,
  fats integer NOT NULL DEFAULT 0,
  ingredients text[] NOT NULL DEFAULT '{}',
  week_id text NOT NULL DEFAULT '',
  dietary_tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view meals"
  ON meals FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete meals"
  ON meals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can view admin_users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS meals_week_id_idx ON meals(week_id);
CREATE INDEX IF NOT EXISTS meals_vendor_idx ON meals(vendor);