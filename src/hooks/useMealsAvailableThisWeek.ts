import { useState, useEffect, useCallback } from 'react';
import { supabase, Meal } from '../lib/supabase';
import { getCurrentWeekId } from '../lib/weekUtils';

/**
 * Fetches only meals the vendor has marked available for the current ISO week.
 * Meals with no availability record (or is_available=false) are excluded.
 */
export function useMealsAvailableThisWeek(vendorId: string | null) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const weekId = getCurrentWeekId();

  const fetchMeals = useCallback(async () => {
    if (!vendorId) {
      setMeals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('meals')
      .select('*, meal_availability!inner(is_available, week_id)')
      .eq('vendor_id', vendorId)
      .eq('meal_availability.week_id', weekId)
      .eq('meal_availability.is_available', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError);
      setMeals([]);
    } else {
      setError(null);
      setMeals((data ?? []) as Meal[]);
    }
    setLoading(false);
  }, [vendorId, weekId]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  return { meals, loading, error, refetch: fetchMeals };
}
