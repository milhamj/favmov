const { createClient } = require('@supabase/supabase-js');

const createAnonSupabaseClient = () =>
  createClient(process.env.FAVMOV_SUPABASE_URL, process.env.FAVMOV_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }, // otherwise each call leaves a timer in the server
  });

const createAuthenticatedSupabaseClient = (token) => {
  if (token) {
    return createClient(process.env.FAVMOV_SUPABASE_URL, process.env.FAVMOV_SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });
  }
  throw new Error('Token is required to create an authenticated Supabase client');
};

module.exports = { createAnonSupabaseClient, createAuthenticatedSupabaseClient };
