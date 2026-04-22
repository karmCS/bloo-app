/*
  # Add social handles to vendors

  1. New columns on vendors
    - `instagram_handle` text — username without @
    - `tiktok_handle`    text — username without @

  2. New RLS policy
    - Vendor users can update their own vendor's profile row
      (allows them to set social handles and contact_email via the vendor panel)
*/

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS tiktok_handle    text;

-- Vendor users can update their own vendor row (social handles, contact email, etc.)
CREATE POLICY "Vendors update own profile"
  ON vendors FOR UPDATE
  TO authenticated
  USING (id = current_vendor_id())
  WITH CHECK (id = current_vendor_id());
