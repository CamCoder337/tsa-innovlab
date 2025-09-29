import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with your project's URL and public anon key
// These values should be stored in your environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl && !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to handle errors
export const handleSupabaseError = (error: Error) => {
  console.error('Supabase error:', error);
  throw error;
};
