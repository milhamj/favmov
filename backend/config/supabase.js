require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.FAVMOV_SUPABASE_URL;
const supabaseKey = process.env.FAVMOV_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const createAuthenticatedSupabaseClient = (token) => {
  if (token) {
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });
  }
  throw new Error('Token is required to create an authenticated Supabase client');
}

module.exports = createAuthenticatedSupabaseClient;