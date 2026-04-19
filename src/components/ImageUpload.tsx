import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  currentImageUrl?: string;
  onImageRemove?: () => void;
  disabled?: boolean;
}

export default function ImageUpload({
  onImageSelect,
  currentImageUrl,
  onImageRemove,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [error, setError] = useState('');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${['Bytes', 'KB', 'MB'][i]}`;
  };

  const validateFile = (file: File): string | null => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      return 'Please upload a JPEG, PNG, or WebP image';
    if (file.size > 5 * 1024 * 1024)
      return 'File size must be less than 5MB';
    return null;
  };

  const handleFile = useCallback((file: File) => {
    setError('');
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    onImageSelect(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  }, [disabled, handleFile]);

  const handleRemove = useCallback(() => {
    setPreview(null); setFileName(''); setFileSize(''); setError('');
    onImageRemove?.();
  }, [onImageRemove]);

  return (
    <div className="w-full">
      {preview ? (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-line bg-surface">
            <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 bg-card/90 backdrop-blur-sm rounded-full hover:bg-card transition-colors shadow-sm"
              >
                <X size={16} className="text-ink" />
              </button>
            )}
          </div>
          {fileName && (
            <div className="flex items-center gap-3 p-3 bg-primary/8 rounded-lg border border-primary/20">
              <ImageIcon className="text-primary shrink-0" size={18} />
              <div>
                <p className="text-sm font-medium text-ink">{fileName}</p>
                <p className="text-xs text-ink-muted">{fileSize}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed transition-all duration-200
            ${isDragging ? 'border-primary bg-primary/8 scale-[1.01]' : 'border-line bg-surface'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:bg-primary/5'}`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="p-10 text-center">
            {disabled
              ? <Loader2 className="mx-auto mb-3 text-primary animate-spin" size={36} />
              : <Upload className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-primary' : 'text-ink-faint'}`} size={36} />
            }
            <p className="text-sm font-medium text-ink mb-1">
              {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-ink-muted">JPEG, PNG, WebP · max 5MB</p>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
