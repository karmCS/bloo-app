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

export function getOrCreateCartSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cart_session_id', sessionId);
  }
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
  payment_method: 'zelle' | 'venmo';
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
