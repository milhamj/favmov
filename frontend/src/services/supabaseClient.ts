import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { isDevelopment } from '../utils/util';

if (isDevelopment()) {
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Supabase Anon Key:', SUPABASE_ANON_KEY ? 'Loaded' : 'Not Loaded');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);