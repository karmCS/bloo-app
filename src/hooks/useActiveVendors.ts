import { useCallback, useEffect, useState } from 'react';
import { supabase, Vendor } from '../lib/supabase';

export function useActiveVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVendors = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('vendors')
      .select('id, name, logo_url, description')
      .eq('is_active', true)
      .order('name');

    if (fetchError) {
      setError(fetchError);
      setVendors([]);
    } else {
      setError(null);
      setVendors((data as Vendor[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return { vendors, loading, error, refetch: fetchVendors };
}
