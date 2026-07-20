import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isCloudConfigured = Boolean(supabaseUrl && supabaseKey);

function getRuntimeSupabaseUrl() {
  if (!isCloudConfigured || typeof window === 'undefined') return supabaseUrl;
  const host = window.location.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  const isSupabaseCloud = supabaseUrl.includes('.supabase.co');

  if (!isLocalhost && isSupabaseCloud) {
    return `${window.location.origin}/supabase`;
  }

  return supabaseUrl;
}

export const supabase = isCloudConfigured
  ? createClient(getRuntimeSupabaseUrl(), supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
