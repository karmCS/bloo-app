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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Vendor {
  id: string;
  name: string;
  logo_url?: string | null;
  description?: string | null;
  contact_email?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
}

export interface MealAvailability {
  id: string;
  meal_id: string;
  vendor_id: string;
  week_id: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

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
  is_meal_of_week?: boolean;
  created_at: string;
  updated_at: string;
}
