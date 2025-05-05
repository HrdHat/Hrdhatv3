const ENABLE_LOGS = true; // Set to false to disable logs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (ENABLE_LOGS) {
  console.log('Supabase initialized');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce', // Enables cookie-based auth for OAuth flows
  },
}); 