/**
 * Shared checkout validation rules (mirrors server expectations for UX).
 * Keep email regex aligned with `api/send-order-email.ts` where practical.
 */
export const CHECKOUT_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_ITEM_QTY = 1;
export const MAX_ITEM_QTY = 99;

export function validateCheckoutEmail(email: string): string | null {
  const t = email.trim();
  if (!t) return 'Please enter your email address.';
  if (t.length > 320 || !CHECKOUT_EMAIL_REGEX.test(t)) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export function validateCartQuantities(
  quantities: number[]
): string | null {
  for (const q of quantities) {
    if (!Number.isInteger(q) || q < MIN_ITEM_QTY || q > MAX_ITEM_QTY) {
      return `Each item quantity must be between ${MIN_ITEM_QTY} and ${MAX_ITEM_QTY}.`;
    }
  }
  return null;
}
