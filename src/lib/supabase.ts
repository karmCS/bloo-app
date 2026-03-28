import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Meal {
  id: string;
  name: string;
  vendor: string;
  image_url: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  week_id: string;
  dietary_tags: string[];
  created_at: string;
  updated_at: string;
}
