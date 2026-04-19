/*
  # Vendors, vendor_users, and order updates

  1. New tables
    - `vendors`        — partner businesses on the platform
    - `vendor_users`   — people who can log into a vendor or admin panel (Clerk auth)

  2. Alter existing tables
    - `meals`     — add vendor_id FK (may already exist as unlinked text; migrate it)
    - `orders`    — add vendor_id, order_status (kanban), stripe_session_id, payment_status

  3. Helper functions
    - `is_superadmin()`     — true if JWT sub is a superadmin
    - `current_vendor_id()` — returns vendor_id for the current vendor user

  4. RLS updates
    - vendors, vendor_users: new policies
    - meals: extend write access to vendor's own meals
    - orders: vendor can read/update their own orders
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. VENDORS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  contact_email text NOT NULL,
  venmo_handle  text,
  zelle_contact text,
  cuisine_tags  text[]   DEFAULT '{}',
  logo_url      text,
  is_active     boolean  NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_vendors_slug      ON vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. VENDOR_USERS  (Clerk-based auth — no FK to auth.users)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id  text NOT NULL UNIQUE,
  display_name   text NOT NULL,
  role           text NOT NULL CHECK (role IN ('superadmin', 'vendor')),
  vendor_id      uuid REFERENCES vendors(id) ON DELETE SET NULL,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE vendor_users ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_vendor_users_clerk_id  ON vendor_users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_users_vendor_id ON vendor_users(vendor_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. HELPER FUNCTIONS  (SECURITY DEFINER so RLS policies stay fast)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM vendor_users
    WHERE clerk_user_id = (auth.jwt() ->> 'sub')
      AND role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION current_vendor_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT vendor_id FROM vendor_users
  WHERE clerk_user_id = (auth.jwt() ->> 'sub')
    AND role = 'vendor'
  LIMIT 1;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS POLICIES — vendors
-- ─────────────────────────────────────────────────────────────────────────────

-- Public can read active vendors (needed for homepage vendor filter)
CREATE POLICY "Public read active vendors"
  ON vendors FOR SELECT
  TO public
  USING (is_active = true);

-- Authenticated (Clerk) users can read all vendors (needed by admin panel)
CREATE POLICY "Authenticated read all vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

-- Only superadmins can create/update/delete vendors
CREATE POLICY "Superadmins insert vendors"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin());

CREATE POLICY "Superadmins update vendors"
  ON vendors FOR UPDATE
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Superadmins delete vendors"
  ON vendors FOR DELETE
  TO authenticated
  USING (is_superadmin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RLS POLICIES — vendor_users
-- ─────────────────────────────────────────────────────────────────────────────

-- Users can read their own row (needed for auth checks on login)
CREATE POLICY "Users read own row"
  ON vendor_users FOR SELECT
  TO authenticated
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- Superadmins can read all rows
CREATE POLICY "Superadmins read all vendor_users"
  ON vendor_users FOR SELECT
  TO authenticated
  USING (is_superadmin());

-- Only superadmins can create / update / delete user records
CREATE POLICY "Superadmins insert vendor_users"
  ON vendor_users FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin());

CREATE POLICY "Superadmins update vendor_users"
  ON vendor_users FOR UPDATE
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Superadmins delete vendor_users"
  ON vendor_users FOR DELETE
  TO authenticated
  USING (is_superadmin());


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ALTER meals — add vendor_id FK if it doesn't exist yet
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meals' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE meals ADD COLUMN vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL;
  ELSE
    -- Column exists as text — convert it if needed (no-op if already uuid)
    -- If it was added as text manually, you may need to handle migration separately.
    NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_meals_vendor_id ON meals(vendor_id);

-- Update meals RLS: vendor users can write their own vendor's meals
CREATE POLICY "Vendors can insert their own meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (
    is_superadmin()
    OR vendor_id = current_vendor_id()
  );

CREATE POLICY "Vendors can update their own meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (
    is_superadmin()
    OR vendor_id = current_vendor_id()
  )
  WITH CHECK (
    is_superadmin()
    OR vendor_id = current_vendor_id()
  );

CREATE POLICY "Vendors can delete their own meals"
  ON meals FOR DELETE
  TO authenticated
  USING (
    is_superadmin()
    OR vendor_id = current_vendor_id()
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. ALTER orders — add vendor_id, order_status, stripe columns
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_status text NOT NULL DEFAULT 'new'
      CHECK (order_status IN ('new', 'prep', 'ready', 'picked-up'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_session_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid'
      CHECK (payment_status IN ('unpaid', 'paid', 'refunded'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_vendor_id     ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status  ON orders(order_status);

-- Vendor users can read and update orders for their vendor
CREATE POLICY "Vendors read their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    is_superadmin()
    OR vendor_id = current_vendor_id()
  );

CREATE POLICY "Vendors update order_status"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    is_superadmin()
    OR vendor_id = current_vendor_id()
  )
  WITH CHECK (
    is_superadmin()
    OR vendor_id = current_vendor_id()
  );
