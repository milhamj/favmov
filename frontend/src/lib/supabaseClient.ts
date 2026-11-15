import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from './env';

const isBrowser = typeof window !== 'undefined';

const storage = isBrowser ? AsyncStorage : undefined;

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: isBrowser, // only refresh in browser/mobile
    persistSession: isBrowser, // skip during SSR/export
    detectSessionInUrl: isBrowser,
  },
});
