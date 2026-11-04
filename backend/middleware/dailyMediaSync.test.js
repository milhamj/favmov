const test = require('node:test');
const assert = require('node:assert');
const mediaSync = require('../utils/mediaSync');
const { dailyMediaSync } = require('./dailyMediaSync');

const DAY = 24 * 60 * 60 * 1000;

const visit = () => {
  let nextCalls = 0;
  dailyMediaSync({}, {}, () => nextCalls++);
  assert.strictEqual(nextCalls, 1);
};

test('runs once per day, never blocks the request, and survives a failed run', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 10, 4, 23) });
  t.mock.method(console, 'error', () => {});
  const sync = t.mock.method(mediaSync, 'syncMedia', async () => { throw new Error('boom'); });

  delete process.env.FAVMOV_SUPABASE_S_KEY;
  process.env.FAVMOV_TMDB_API_KEY = 'test';
  visit();
  assert.strictEqual(sync.mock.callCount(), 0, 'stays off without the service key');

  process.env.FAVMOV_SUPABASE_S_KEY = 'test';
  delete process.env.FAVMOV_TMDB_API_KEY;
  visit();
  assert.strictEqual(sync.mock.callCount(), 0, 'stays off without the TMDB key');

  process.env.FAVMOV_TMDB_API_KEY = 'test';
  visit();
  visit();
  assert.strictEqual(sync.mock.callCount(), 1, 'second visit on the same day');

  t.mock.timers.tick(DAY);
  visit();
  assert.strictEqual(sync.mock.callCount(), 2, 'first visit of the next day');
});
