const { getTableName } = require('./tableNames');

const REQUIRED_ENV = ['FAVMOV_NODE_ENV', 'FAVMOV_SUPABASE_URL', 'FAVMOV_SUPABASE_ANON_KEY'];
const OPTIONAL_ENV = ['FAVMOV_SUPABASE_S_KEY', 'FAVMOV_TMDB_API_KEY'];

const checkEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length)
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  if (getTableName('').error) throw new Error('FAVMOV_NODE_ENV must be development or production');
  const optional = OPTIONAL_ENV.filter((key) => !process.env[key]);
  if (optional.length)
    console.warn(`Missing optional environment variables: ${optional.join(', ')}`);
};

module.exports = { checkEnv };
