import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { FAVMOV_SUPABASE_URL, FAVMOV_SUPABASE_ANON_KEY } from '@env';

const supabaseUrlStr = String.fromCharCode.apply(null, JSON.parse(FAVMOV_SUPABASE_URL));
const supabaseAnonKeyStr = String.fromCharCode.apply(null, JSON.parse(FAVMOV_SUPABASE_ANON_KEY));
export const supabase = createClient(supabaseUrlStr, supabaseAnonKeyStr, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
});