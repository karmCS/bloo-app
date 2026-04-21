const ALLOWED_IMAGE_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

type AllowedMime = keyof typeof ALLOWED_IMAGE_MIME;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function assertValidImage(file: File): AllowedMime {
  if (!(file.type in ALLOWED_IMAGE_MIME)) {
    throw new Error('Only JPEG, PNG, or WebP images are allowed.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be 5MB or smaller.');
  }
  return file.type as AllowedMime;
}

export function extFor(mime: AllowedMime): string {
  return ALLOWED_IMAGE_MIME[mime];
}

export function errorMessage(err: unknown, fallback = 'Please try again.'): string {
  if (err instanceof Error) return err.message;
  return fallback;
}
