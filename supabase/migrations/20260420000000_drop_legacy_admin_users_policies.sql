/*
  # Drop legacy admin_users-based RLS policies

  The original meals/orders RLS policies referenced auth.uid() and joined against
  admin_users. The platform has since migrated to Clerk auth (see
  20260418000000_vendors_and_vendor_users.sql), where the JWT `sub` claim is a
  Clerk user id (e.g. "user_2abc...") — not a UUID.

  Supabase's auth.uid() casts the sub claim to uuid. With Clerk JWTs that cast
  raises `invalid input syntax for type uuid`, which aborts the entire query
  during RLS evaluation — even when the newer permissive Clerk-aware policy
  would have allowed the row.

  Effect: every authenticated INSERT/UPDATE/DELETE on meals (and similar on
  orders) blew up with an RLS error in the vendor and admin panels.

  Fix: drop the legacy auth.uid()-based policies. The Clerk-aware policies from
  20260418000000_vendors_and_vendor_users.sql remain in place and now evaluate
  cleanly.
*/

-- meals: legacy admin_users-based policies
DROP POLICY IF EXISTS "Admins can insert meals" ON meals;
DROP POLICY IF EXISTS "Admins can update meals" ON meals;
DROP POLICY IF EXISTS "Admins can delete meals" ON meals;

-- orders: legacy admin_users-based policies
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

-- admin_users: legacy self-read policy (table is deprecated; no readers remain)
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
