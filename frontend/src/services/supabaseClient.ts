import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { FAVMOV_SUPABASE_URL, FAVMOV_SUPABASE_ANON_KEY } from '@env'

const supabaseUrlStr = String.fromCharCode.apply(null, JSON.parse(FAVMOV_SUPABASE_URL))
const supabaseAnonKeyStr = String.fromCharCode.apply(null, JSON.parse(FAVMOV_SUPABASE_ANON_KEY))

// Detect environment (browser or Node)
const isBrowser = typeof window !== 'undefined'

// Choose appropriate storage backend
const storage = isBrowser ? AsyncStorage : undefined

// Create Supabase client
export const supabase = createClient(supabaseUrlStr, supabaseAnonKeyStr, {
  auth: {
    storage,
    autoRefreshToken: isBrowser, // only refresh in browser/mobile
    persistSession: isBrowser,   // skip during SSR/export
    detectSessionInUrl: isBrowser,
  },
})
