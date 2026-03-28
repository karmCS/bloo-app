/*
  # Optimize RLS policies for performance

  1. Changes
    - Drop existing RLS policies with performance issues
    - Recreate policies using (select auth.uid()) pattern for better performance
    - This prevents re-evaluation of auth functions for each row

  2. Security
    - Maintains same security model
    - Admin-only write access for meals
    - Public read access for meals
    - Admin-only access for admin_users table
*/

DROP POLICY IF EXISTS "Admins can insert meals" ON meals;
DROP POLICY IF EXISTS "Admins can update meals" ON meals;
DROP POLICY IF EXISTS "Admins can delete meals" ON meals;
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;

CREATE POLICY "Admins can insert meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can update meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can delete meals"
  ON meals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can view admin_users"
  ON admin_users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);