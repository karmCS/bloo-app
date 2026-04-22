import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, X, ArrowUp, ArrowDown, Loader2, Image as ImageIcon } from 'lucide-react';
import { getSupabaseWithAuth } from '../lib/supabaseWithAuth';
import { assertValidImage, extFor, errorMessage } from '../lib/uploads';
import { VendorPhoto } from '../lib/supabase';

type ClerkSession = {
  getToken: (options?: { template?: string }) => Promise<string | null>;
} | null | undefined;

interface GalleryManagerProps {
  vendorId: string;
  session: ClerkSession;
  maxPhotos?: number;
}

const DEFAULT_MAX = 12;

export default function GalleryManager({
  vendorId,
  session,
  maxPhotos = DEFAULT_MAX,
}: GalleryManagerProps) {
  const [photos, setPhotos] = useState<VendorPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savingCaptionId, setSavingCaptionId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const captionTimer = useRef<number | null>(null);

  const atCap = photos.length >= maxPhotos;

  const fetchPhotos = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const client = await getSupabaseWithAuth(session);
    const { data, error: fetchError } = await client
      .from('vendor_photos')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('sort_order', { ascending: true });
    if (fetchError) {
      setError(errorMessage(fetchError));
      setPhotos([]);
    } else {
      setError(null);
      setPhotos((data ?? []) as VendorPhoto[]);
    }
    setLoading(false);
  }, [session, vendorId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const uploadOne = async (file: File, nextSortOrder: number) => {
    if (!session) throw new Error('Not signed in');
    const mime = assertValidImage(file);
    const client = await getSupabaseWithAuth(session);
    const path = `${vendorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extFor(mime)}`;
    const { error: uploadError } = await client.storage
      .from('vendor-gallery')
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: mime });
    if (uploadError) throw uploadError;
    const publicUrl = client.storage.from('vendor-gallery').getPublicUrl(path).data.publicUrl;
    const { error: insertError } = await client.from('vendor_photos').insert({
      vendor_id: vendorId,
      image_url: publicUrl,
      sort_order: nextSortOrder,
    });
    if (insertError) throw insertError;
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!session) return;
      setError(null);
      const arr = Array.from(files);
      const available = Math.max(0, maxPhotos - photos.length);
      const batch = arr.slice(0, available);
      if (arr.length > available) {
        setError(`Only ${available} more photo${available === 1 ? '' : 's'} allowed (max ${maxPhotos}).`);
        if (batch.length === 0) return;
      }
      setUploadingCount(batch.length);
      try {
        const startOrder = photos.length
          ? Math.max(...photos.map(p => p.sort_order)) + 1
          : 0;
        for (let i = 0; i < batch.length; i++) {
          await uploadOne(batch[i], startOrder + i);
        }
        await fetchPhotos();
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setUploadingCount(0);
      }
    },
    [session, photos, maxPhotos, fetchPhotos]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (atCap) return;
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (photo: VendorPhoto) => {
    if (!session || busyId) return;
    if (!window.confirm('Remove this photo?')) return;
    setBusyId(photo.id);
    try {
      const client = await getSupabaseWithAuth(session);
      const { error: delError } = await client
        .from('vendor_photos')
        .delete()
        .eq('id', photo.id);
      if (delError) throw delError;
      // Best-effort storage cleanup — parse path from URL
      const marker = '/vendor-gallery/';
      const idx = photo.image_url.indexOf(marker);
      if (idx !== -1) {
        const path = photo.image_url.slice(idx + marker.length);
        await client.storage.from('vendor-gallery').remove([path]);
      }
      await fetchPhotos();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (photo: VendorPhoto, dir: -1 | 1) => {
    if (!session || busyId) return;
    const index = photos.findIndex(p => p.id === photo.id);
    const swapWith = photos[index + dir];
    if (!swapWith) return;
    setBusyId(photo.id);
    try {
      const client = await getSupabaseWithAuth(session);
      // Swap sort_order values
      const { error: e1 } = await client
        .from('vendor_photos')
        .update({ sort_order: swapWith.sort_order, updated_at: new Date().toISOString() })
        .eq('id', photo.id);
      if (e1) throw e1;
      const { error: e2 } = await client
        .from('vendor_photos')
        .update({ sort_order: photo.sort_order, updated_at: new Date().toISOString() })
        .eq('id', swapWith.id);
      if (e2) throw e2;
      await fetchPhotos();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleCaptionChange = (id: string, value: string) => {
    setPhotos(prev => prev.map(p => (p.id === id ? { ...p, caption: value } : p)));
    if (captionTimer.current) window.clearTimeout(captionTimer.current);
    captionTimer.current = window.setTimeout(async () => {
      if (!session) return;
      setSavingCaptionId(id);
      try {
        const client = await getSupabaseWithAuth(session);
        const { error: e } = await client
          .from('vendor_photos')
          .update({ caption: value || null, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (e) throw e;
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setSavingCaptionId(null);
      }
    }, 600);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!atCap) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
          isDragging ? 'border-primary bg-primary/8 scale-[1.005]' : 'border-line bg-surface'
        } ${atCap ? 'opacity-60' : 'hover:border-primary hover:bg-primary/5'}`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={atCap || uploadingCount > 0}
          onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Upload gallery photos"
        />
        <div className="px-5 py-7 text-center">
          {uploadingCount > 0 ? (
            <Loader2 className="mx-auto mb-2 text-primary animate-spin" size={28} />
          ) : (
            <Upload
              className={`mx-auto mb-2 transition-colors ${isDragging ? 'text-primary' : 'text-ink-faint'}`}
              size={28}
            />
          )}
          <p className="text-sm font-medium text-ink mb-0.5">
            {uploadingCount > 0
              ? `Uploading ${uploadingCount} photo${uploadingCount === 1 ? '' : 's'}…`
              : atCap
                ? `Max ${maxPhotos} photos — remove one to add more`
                : isDragging
                  ? 'Drop photos here'
                  : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-ink-muted">
            JPEG, PNG, WebP · max 5MB · {photos.length}/{maxPhotos} used
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}

      {/* Current photos list */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skel rounded-xl" style={{ aspectRatio: '4/3' }} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <p className="text-sm text-ink-muted text-center py-4 italic">
          No photos yet. Upload your first one above.
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {photos.map((photo, i) => {
            const isBusy = busyId === photo.id;
            return (
              <li
                key={photo.id}
                className="bg-card border border-line rounded-xl overflow-hidden"
              >
                <div className="relative">
                  <div style={{ aspectRatio: '4/3' }} className="bg-surface">
                    <img
                      src={photo.image_url}
                      alt={photo.caption ?? `Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-ink/80 text-white text-[10px] font-bold tracking-wide backdrop-blur">
                    {i + 1}
                  </span>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      type="button"
                      disabled={isBusy || i === 0}
                      onClick={() => handleMove(photo, -1)}
                      className="w-8 h-8 rounded-full bg-card/90 backdrop-blur flex items-center justify-center border border-line text-ink-muted hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      aria-label="Move earlier"
                      title="Move earlier"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={isBusy || i === photos.length - 1}
                      onClick={() => handleMove(photo, 1)}
                      className="w-8 h-8 rounded-full bg-card/90 backdrop-blur flex items-center justify-center border border-line text-ink-muted hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      aria-label="Move later"
                      title="Move later"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(photo)}
                      className="w-8 h-8 rounded-full bg-card/90 backdrop-blur flex items-center justify-center border border-line text-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      aria-label="Delete photo"
                      title="Delete photo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                    <ImageIcon size={11} /> Caption
                    {savingCaptionId === photo.id && (
                      <span className="italic font-normal text-ink-faint normal-case tracking-normal">saving…</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={photo.caption ?? ''}
                    onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                    placeholder="Optional caption…"
                    className="w-full text-sm px-2 py-1.5 rounded-md border border-line bg-card focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-ink-faint"
                    maxLength={140}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
