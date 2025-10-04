import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { FAVMOV_SUPABASE_URL, FAVMOV_SUPABASE_ANON_KEY } from '@env';

export const supabase = createClient(FAVMOV_SUPABASE_URL, FAVMOV_SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
});