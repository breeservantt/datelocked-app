import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sojegdlihahzofwdrnza.supabase.co';
const supabaseAnonKey = 'sb_publishable_Vv8yhA_TbOuEBmM8udY6Kw_uYV2NY_h';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});