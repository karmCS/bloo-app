-- Add meal_of_the_week flag to meals
ALTER TABLE meals ADD COLUMN IF NOT EXISTS is_meal_of_week boolean NOT NULL DEFAULT false;

-- Only one meal should be meal of the week at a time.
-- Enforce with a partial unique index: at most one row where is_meal_of_week = true.
CREATE UNIQUE INDEX IF NOT EXISTS meals_one_meal_of_week
  ON meals (is_meal_of_week)
  WHERE is_meal_of_week = true;
