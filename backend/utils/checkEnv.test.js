const test = require('node:test');
const assert = require('node:assert');
const { checkEnv } = require('./checkEnv');

test('logs the name of every missing or empty key, and never a value', (t) => {
  const error = t.mock.method(console, 'error', () => {});
  process.env.FAVMOV_NODE_ENV = 'test';
  process.env.FAVMOV_SUPABASE_URL = 'secret-url';
  process.env.FAVMOV_SUPABASE_ANON_KEY = 'secret-anon';
  process.env.FAVMOV_SUPABASE_S_KEY = '';
  delete process.env.FAVMOV_TMDB_API_KEY;

  checkEnv();

  assert.strictEqual(error.mock.callCount(), 1);
  assert.strictEqual(
    error.mock.calls[0].arguments[0],
    'Missing environment variables: FAVMOV_SUPABASE_S_KEY, FAVMOV_TMDB_API_KEY'
  );
});

test('stays quiet when every key is set', (t) => {
  const error = t.mock.method(console, 'error', () => {});
  process.env.FAVMOV_SUPABASE_S_KEY = 'set';
  process.env.FAVMOV_TMDB_API_KEY = 'set';

  checkEnv();

  assert.strictEqual(error.mock.callCount(), 0);
});
