-- meal_availability: tracks which meals a vendor marks as available for a given ISO week
CREATE TABLE meal_availability (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id    uuid        NOT NULL REFERENCES meals(id)   ON DELETE CASCADE,
  vendor_id  uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  week_id    text        NOT NULL,  -- ISO week string, e.g. "2026-W17"
  is_available boolean   NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT meal_availability_meal_week_unique UNIQUE (meal_id, week_id)
);

CREATE INDEX idx_meal_availability_vendor_week ON meal_availability (vendor_id, week_id);

ALTER TABLE meal_availability ENABLE ROW LEVEL SECURITY;

-- Customers can read availability to filter restaurant menus
CREATE POLICY "Public can read meal availability"
  ON meal_availability
  FOR SELECT
  TO public
  USING (true);

-- Vendors manage availability for their own meals only
CREATE POLICY "Vendors manage own meal availability"
  ON meal_availability
  FOR ALL
  TO authenticated
  USING  (is_superadmin() OR vendor_id = current_vendor_id())
  WITH CHECK (is_superadmin() OR vendor_id = current_vendor_id());
