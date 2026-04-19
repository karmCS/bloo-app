import { useState, useEffect, useCallback } from 'react';
import { supabase, Meal } from '../lib/supabase';

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMeals = useCallback(async () => {
    const { data, error } = await supabase
      .from('meals')
      .select('*, vendors!inner(is_active)')
      .eq('vendors.is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error);
    } else {
      setMeals(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  return { meals, loading, error, refetch: fetchMeals };
}
