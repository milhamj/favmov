const test = require('node:test');
const assert = require('node:assert');
const { checkEnv } = require('./checkEnv');

test('logs the name of every missing or empty key, and never a value', (t) => {
  const error = t.mock.method(console, 'warn', () => {});
  process.env.FAVMOV_NODE_ENV = 'development';
  process.env.FAVMOV_SUPABASE_URL = 'secret-url';
  process.env.FAVMOV_SUPABASE_ANON_KEY = 'secret-anon';
  process.env.FAVMOV_SUPABASE_S_KEY = '';
  delete process.env.FAVMOV_TMDB_API_KEY;

  checkEnv();

  assert.strictEqual(error.mock.callCount(), 1);
  assert.strictEqual(
    error.mock.calls[0].arguments[0],
    'Missing optional environment variables: FAVMOV_SUPABASE_S_KEY, FAVMOV_TMDB_API_KEY',
  );
});

test('stays quiet when every key is set', (t) => {
  const error = t.mock.method(console, 'warn', () => {});
  process.env.FAVMOV_SUPABASE_S_KEY = 'set';
  process.env.FAVMOV_TMDB_API_KEY = 'set';

  checkEnv();

  assert.strictEqual(error.mock.callCount(), 0);
});

test('rejects missing required keys by name without exposing values', (t) => {
  for (const key of ['FAVMOV_NODE_ENV', 'FAVMOV_SUPABASE_URL', 'FAVMOV_SUPABASE_ANON_KEY']) {
    const previous = process.env[key];
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
    delete process.env[key];
  }
  assert.throws(checkEnv, {
    message:
      'Missing required environment variables: FAVMOV_NODE_ENV, FAVMOV_SUPABASE_URL, FAVMOV_SUPABASE_ANON_KEY',
  });
});

test('rejects an unsupported FAVMOV_NODE_ENV', (t) => {
  const previous = process.env.FAVMOV_NODE_ENV;
  t.after(() => {
    if (previous === undefined) delete process.env.FAVMOV_NODE_ENV;
    else process.env.FAVMOV_NODE_ENV = previous;
  });
  process.env.FAVMOV_NODE_ENV = 'prod';
  assert.throws(checkEnv, { message: 'FAVMOV_NODE_ENV must be development or production' });
});
