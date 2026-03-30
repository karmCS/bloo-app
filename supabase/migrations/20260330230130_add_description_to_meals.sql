/*
  # Add description field to meals table

  1. Changes
    - Add `description` column to `meals` table
      - Type: text (allows up to 500 characters)
      - Optional field (nullable)
      - Default: null
  
  2. Notes
    - Vendors can use this to highlight what makes their meal special
    - Character limit enforced at the application level
    - No data migration needed as this is a new optional field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meals' AND column_name = 'description'
  ) THEN
    ALTER TABLE meals ADD COLUMN description text;
  END IF;
END $$;
