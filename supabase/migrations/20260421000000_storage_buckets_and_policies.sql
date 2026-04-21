/*
  # Storage buckets and RLS policies

  Why: The `meal-images` bucket had no server-side RLS policies. Any authenticated
  user could upload arbitrary content (HTML/JS, large files) because client-side
  MIME/size validation in ImageUpload.tsx can be bypassed.

  This migration:
  1. Ensures the `meal-images` bucket exists (public read, private write)
  2. Creates a separate `vendor-logos` bucket so logo policies can be scoped
     independently from meal policies
  3. Adds RLS policies on storage.objects for both buckets enforcing:
     - MIME whitelist: jpeg/png/webp only
     - Size limit: 5MB
     - Writes restricted to rows in vendor_users (authenticated clerk users)
     - vendor-logos writes restricted to superadmins only

  Reads remain public because meal/vendor logo images are rendered on the public
  homepage.
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. BUCKETS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-images', 'meal-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-logos', 'vendor-logos', true)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. HELPER: is the caller a known vendor_user?
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_vendor_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM vendor_users
    WHERE clerk_user_id = (auth.jwt() ->> 'sub')
  );
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. POLICIES — meal-images
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "meal_images_public_read"    ON storage.objects;
DROP POLICY IF EXISTS "meal_images_vendor_insert"  ON storage.objects;
DROP POLICY IF EXISTS "meal_images_vendor_update"  ON storage.objects;
DROP POLICY IF EXISTS "meal_images_vendor_delete"  ON storage.objects;

CREATE POLICY "meal_images_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'meal-images');

CREATE POLICY "meal_images_vendor_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'meal-images'
    AND is_vendor_user()
    AND (metadata->>'mimetype') IN ('image/jpeg', 'image/png', 'image/webp')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
  );

CREATE POLICY "meal_images_vendor_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'meal-images' AND is_vendor_user())
  WITH CHECK (
    bucket_id = 'meal-images'
    AND is_vendor_user()
    AND (metadata->>'mimetype') IN ('image/jpeg', 'image/png', 'image/webp')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
  );

CREATE POLICY "meal_images_vendor_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'meal-images' AND is_vendor_user());


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. POLICIES — vendor-logos (superadmin-only writes)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "vendor_logos_public_read"    ON storage.objects;
DROP POLICY IF EXISTS "vendor_logos_admin_insert"   ON storage.objects;
DROP POLICY IF EXISTS "vendor_logos_admin_update"   ON storage.objects;
DROP POLICY IF EXISTS "vendor_logos_admin_delete"   ON storage.objects;

CREATE POLICY "vendor_logos_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'vendor-logos');

CREATE POLICY "vendor_logos_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vendor-logos'
    AND is_superadmin()
    AND (metadata->>'mimetype') IN ('image/jpeg', 'image/png', 'image/webp')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
  );

CREATE POLICY "vendor_logos_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'vendor-logos' AND is_superadmin())
  WITH CHECK (
    bucket_id = 'vendor-logos'
    AND is_superadmin()
    AND (metadata->>'mimetype') IN ('image/jpeg', 'image/png', 'image/webp')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
  );

CREATE POLICY "vendor_logos_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'vendor-logos' AND is_superadmin());
