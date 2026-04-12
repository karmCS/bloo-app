import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ActiveVendor {
  id: string;
  name: string;
}

export function useActiveVendors() {
  const [vendors, setVendors] = useState<ActiveVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVendors = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('vendors')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (fetchError) {
      setError(fetchError);
      setVendors([]);
    } else {
      setError(null);
      setVendors((data as ActiveVendor[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return { vendors, loading, error, refetch: fetchVendors };
}
