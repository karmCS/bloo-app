// Environment variable validation
if (!import.meta.env.VITE_SUPABASE_URL) {
    throw new Error('Missing VITE_SUPABASE_URL - check your .env file');
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY - check your .env file');
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('[Bloo] Missing environment variable: VITE_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('[Bloo] Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

/** Must match cart_items RLS (`request.headers` → `x-cart-session-id`). */
const CART_SESSION_HEADER = 'x-cart-session-id';

const CART_SESSION_STORAGE_KEY = 'cart_session_id';

/** UUID v4 — matches output of `crypto.randomUUID()` (cart session ids). */
const CART_SESSION_UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidCartSessionId(value: string): boolean {
  return CART_SESSION_UUID_V4_REGEX.test(value);
}

/**
 * Returns the anonymous cart session id from localStorage, creating one if needed.
 *
 * Uses `crypto.randomUUID()` (V4 UUID from the platform CSPRNG) so identifiers are
 * not guessable or enumerable. An attacker who could predict another shopper’s
 * session id could pair it with a forged `x-cart-session-id` header and bypass
 * cart row-level security. Do not use `Math.random()`, `Date.now()`, or similar
 * for this value.
 *
 * Persists in **localStorage** (not sessionStorage) so the cart survives tab close
 * and browser restart. If a stored value is missing or not a valid UUID v4
 * (tampering or legacy `session_*` ids), a new id is generated and stored.
 */
export function getOrCreateCartSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  const existing = localStorage.getItem(CART_SESSION_STORAGE_KEY);
  if (existing && isValidCartSessionId(existing)) {
    return existing;
  }
  const sessionId = crypto.randomUUID();
  localStorage.setItem(CART_SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

/**
 * Per-request global headers. supabase-js only reads `global.headers` once at
 * `createClient` time, so this factory is invoked from `global.fetch` on every
 * request (you cannot pass a function as `global.headers` safely).
 */
function globalHeaders(): Record<string, string> {
  const sid = getOrCreateCartSessionId();
  return sid ? { [CART_SESSION_HEADER]: sid } : {};
}

const supabaseFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  for (const [key, value] of Object.entries(globalHeaders())) {
    headers.set(key, value);
  }
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {},
    fetch: supabaseFetch,
  },
});

export interface Meal {
  id: string;
  name: string;
  vendor: string;
  description?: string | null;
  image_url: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  dietary_tags: string[];
  vendor_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  session_id: string;
  meal_id: string;
  quantity: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_email: string;
  items: OrderItem[];
  total_price: number;
  payment_method: 'zelle' | 'venmo' | 'card';
  status: 'pending' | 'confirmed';
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  meal_id: string;
  meal_name: string;
  price: number;
  quantity: number;
}
