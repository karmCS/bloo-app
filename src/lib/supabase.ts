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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  week_id: string;
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
