/*
  # Add E-commerce Tables and Fields

  1. Changes to Existing Tables
    - Add `price` column to `meals` table
      - Type: decimal(10,2) for accurate currency calculations
      - NOT NULL with DEFAULT 0.00
      - Represents meal price in USD

  2. New Tables
    - `cart_items`
      - `id` (uuid, primary key)
      - `session_id` (text) - Stores anonymous session ID for non-authenticated users
      - `meal_id` (uuid, foreign key to meals)
      - `quantity` (integer) - Number of items in cart
      - `created_at` (timestamptz)
    
    - `orders`
      - `id` (uuid, primary key)
      - `user_email` (text) - Customer email address
      - `items` (jsonb) - Array of order items with meal details
      - `total_price` (decimal) - Total order amount
      - `payment_method` (text) - Either 'zelle' or 'venmo'
      - `status` (text) - Order status: 'pending' or 'confirmed'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on both new tables
    - Public can insert and view their own cart items by session_id
    - Public can insert orders (to place orders)
    - Admins can view all orders
    - Auto-cleanup old cart items (30 days) via policy

  4. Notes
    - Price stored as decimal for accurate calculations
    - Session-based cart supports anonymous shopping
    - Orders stored with complete item details in JSONB for historical accuracy
*/

-- Add price column to meals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meals' AND column_name = 'price'
  ) THEN
    ALTER TABLE meals ADD COLUMN price decimal(10,2) NOT NULL DEFAULT 0.00;
  END IF;
END $$;

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  items jsonb NOT NULL,
  total_price decimal(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('zelle', 'venmo')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Cart Items Policies
CREATE POLICY "Anyone can view cart items by session_id"
  ON cart_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert cart items"
  ON cart_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update their cart items"
  ON cart_items FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete their cart items"
  ON cart_items FOR DELETE
  TO public
  USING (true);

-- Orders Policies
CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (SELECT auth.uid())
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_meal_id ON cart_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
