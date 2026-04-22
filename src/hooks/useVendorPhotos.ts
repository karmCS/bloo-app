import { useCallback, useEffect, useState } from 'react';
import { supabase, VendorPhoto } from '../lib/supabase';

export function useVendorPhotos(vendorId: string | null | undefined) {
  const [photos, setPhotos] = useState<VendorPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPhotos = useCallback(async () => {
    if (!vendorId) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('vendor_photos')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('sort_order', { ascending: true });

    if (fetchError) {
      setError(fetchError);
      setPhotos([]);
    } else {
      setError(null);
      setPhotos((data ?? []) as VendorPhoto[]);
    }
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return { photos, loading, error, refetch: fetchPhotos };
}
