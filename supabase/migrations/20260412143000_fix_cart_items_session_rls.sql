/*
  # Fix cart_items RLS (session scoping)

  Replaces permissive policies that allowed any client to read/update/delete all rows.

  SELECT / UPDATE / DELETE are limited to rows whose `session_id` matches the caller's
  cart session. PostgREST exposes HTTP headers to Postgres via `current_setting(
  'request.headers', true)`; clients must send `x-cart-session-id` with the same value
  they store in `session_id` (see app Supabase client `global.fetch`).

  INSERT stays open for anonymous carts (WITH CHECK (true)).

  Note: RLS cannot read PostgREST query filters (e.g. `.eq('session_id', ...)`); the
  header is what the database sees per request.
*/

DROP POLICY IF EXISTS "Anyone can view cart items by session_id" ON cart_items;
DROP POLICY IF EXISTS "Anyone can insert cart items" ON cart_items;
DROP POLICY IF EXISTS "Anyone can update their cart items" ON cart_items;
DROP POLICY IF EXISTS "Anyone can delete their cart items" ON cart_items;

-- One evaluation per statement (same idea as wrapping auth.uid() in SELECT)
CREATE POLICY "cart_items_select_own_session"
  ON cart_items FOR SELECT
  TO public
  USING (
    session_id = (
      SELECT NULLIF(TRIM(current_setting('request.headers', true)::json->>'x-cart-session-id'), '')
    )
  );

CREATE POLICY "cart_items_insert_anonymous"
  ON cart_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "cart_items_update_own_session"
  ON cart_items FOR UPDATE
  TO public
  USING (
    session_id = (
      SELECT NULLIF(TRIM(current_setting('request.headers', true)::json->>'x-cart-session-id'), '')
    )
  )
  WITH CHECK (
    session_id = (
      SELECT NULLIF(TRIM(current_setting('request.headers', true)::json->>'x-cart-session-id'), '')
    )
  );

CREATE POLICY "cart_items_delete_own_session"
  ON cart_items FOR DELETE
  TO public
  USING (
    session_id = (
      SELECT NULLIF(TRIM(current_setting('request.headers', true)::json->>'x-cart-session-id'), '')
    )
  );
