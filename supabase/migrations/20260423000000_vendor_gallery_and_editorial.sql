/*
  # Vendor gallery, editorial body, website URL

  Adds the storage + schema needed for the vendor-first user flow:

  1. New columns on `vendors`
     - `editorial_body` text — long-form profile copy shown on the vendor page
     - `website_url`    text — optional external site link

  2. New table `vendor_photos`
     - Ordered gallery of hero/lifestyle shots per vendor
     - `sort_order` maintains slideshow order
     - `caption` optional

  3. New storage bucket `vendor-gallery`
     - Public read (slideshow is public-facing)
     - Writes restricted to the owning vendor's users or superadmins
     - Same MIME whitelist + 5MB cap as meal-images
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. VENDORS: editorial_body, website_url
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS editorial_body text,
  ADD COLUMN IF NOT EXISTS website_url    text;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. VENDOR_PHOTOS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_photos (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id  uuid        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  image_url  text        NOT NULL,
  caption    text,
  sort_order integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_photos_vendor_sort
  ON vendor_photos (vendor_id, sort_order);

ALTER TABLE vendor_photos ENABLE ROW LEVEL SECURITY;

-- Public read (gallery shown on public vendor profile pages)
DROP POLICY IF EXISTS "vendor_photos_public_read"        ON vendor_photos;
DROP POLICY IF EXISTS "vendor_photos_owner_insert"       ON vendor_photos;
DROP POLICY IF EXISTS "vendor_photos_owner_update"       ON vendor_photos;
DROP POLICY IF EXISTS "vendor_photos_owner_delete"       ON vendor_photos;

CREATE POLICY "vendor_photos_public_read"
  ON vendor_photos FOR SELECT
  TO public
  USING (true);

-- Owning vendor users or superadmins can write
CREATE POLICY "vendor_photos_owner_insert"
  ON vendor_photos FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin() OR vendor_id = current_vendor_id());

CREATE POLICY "vendor_photos_owner_update"
  ON vendor_photos FOR UPDATE
  TO authenticated
  USING  (is_superadmin() OR vendor_id = current_vendor_id())
  WITH CHECK (is_superadmin() OR vendor_id = current_vendor_id());

CREATE POLICY "vendor_photos_owner_delete"
  ON vendor_photos FOR DELETE
  TO authenticated
  USING (is_superadmin() OR vendor_id = current_vendor_id());


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. STORAGE BUCKET: vendor-gallery
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-gallery', 'vendor-gallery', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "vendor_gallery_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "vendor_gallery_vendor_insert" ON storage.objects;
DROP POLICY IF EXISTS "vendor_gallery_vendor_update" ON storage.objects;
DROP POLICY IF EXISTS "vendor_gallery_vendor_delete" ON storage.objects;

CREATE POLICY "vendor_gallery_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'vendor-gallery');

CREATE POLICY "vendor_gallery_vendor_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vendor-gallery'
    AND is_vendor_user()
    AND (metadata->>'mimetype') IN ('image/jpeg', 'image/png', 'image/webp')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
  );

CREATE POLICY "vendor_gallery_vendor_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'vendor-gallery' AND is_vendor_user())
  WITH CHECK (
    bucket_id = 'vendor-gallery'
    AND is_vendor_user()
    AND (metadata->>'mimetype') IN ('image/jpeg', 'image/png', 'image/webp')
    AND COALESCE((metadata->>'size')::bigint, 0) <= 5242880
  );

CREATE POLICY "vendor_gallery_vendor_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'vendor-gallery' AND is_vendor_user());
