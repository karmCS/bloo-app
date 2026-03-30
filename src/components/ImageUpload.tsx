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
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [error, setError] = useState<string>('');

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or WebP image';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      setError('');

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setFileName(file.name);
      setFileSize(formatFileSize(file.size));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      onImageSelect(file);
    },
    [onImageSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    setFileName('');
    setFileSize('');
    setError('');
    if (onImageRemove) {
      onImageRemove();
    }
  }, [onImageRemove]);

  return (
    <div className="w-full">
      {preview ? (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
            <img
              src={preview}
              alt="Upload preview"
              className="w-full h-64 object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
              >
                <X size={20} className="text-gray-700" />
              </button>
            )}
          </div>
          {fileName && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <ImageIcon className="text-primary" size={24} />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{fileName}</p>
                  <p className="text-xs text-gray-600">{fileSize}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative rounded-xl border-2 border-dashed transition-all duration-300
            ${
              isDragging
                ? 'border-primary bg-blue-50 scale-[1.02]'
                : 'border-gray-300 bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:bg-blue-50'}
          `}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileInput}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              {disabled ? (
                <Loader2 className="text-primary animate-spin" size={48} />
              ) : (
                <Upload
                  className={`transition-colors ${
                    isDragging ? 'text-primary' : 'text-gray-400'
                  }`}
                  size={48}
                />
              )}
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-2">
              {isDragging ? 'Drop image here' : 'Drag & drop an image'}
            </p>
            <p className="text-sm text-gray-500 mb-4">or click to browse</p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
              <span className="px-3 py-1 bg-white rounded-full border border-gray-200">
                JPEG
              </span>
              <span className="px-3 py-1 bg-white rounded-full border border-gray-200">
                PNG
              </span>
              <span className="px-3 py-1 bg-white rounded-full border border-gray-200">
                WebP
              </span>
              <span className="px-3 py-1 bg-white rounded-full border border-gray-200">
                Max 5MB
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
