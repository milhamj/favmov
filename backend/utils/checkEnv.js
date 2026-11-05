const REQUIRED_ENV = [
  'FAVMOV_NODE_ENV',
  'FAVMOV_SUPABASE_URL',
  'FAVMOV_SUPABASE_ANON_KEY',
  'FAVMOV_SUPABASE_S_KEY',
  'FAVMOV_TMDB_API_KEY',
];

// Logs names only, never values. Doesn't exit: the site still works without the optional features
const checkEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) console.error(`Missing environment variables: ${missing.join(', ')}`);
};

module.exports = { checkEnv };
