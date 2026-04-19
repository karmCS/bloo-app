import { useState, useEffect, useCallback } from 'react';
import { supabase, Meal } from '../lib/supabase';

export function useMealsByVendor(vendorId: string | null) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMeals = useCallback(async () => {
    if (!vendorId) {
      setMeals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('meals')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError);
      setMeals([]);
    } else {
      setError(null);
      setMeals(data || []);
    }
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  return { meals, loading, error, refetch: fetchMeals };
}
