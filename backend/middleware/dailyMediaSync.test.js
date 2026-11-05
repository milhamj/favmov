const test = require('node:test');
const assert = require('node:assert');
const mediaSync = require('../utils/mediaSync');
const { dailyMediaSync, RETRY_DELAY_MS } = require('./dailyMediaSync');

const DAY = 24 * 60 * 60 * 1000;

const visit = () => {
  let nextCalls = 0;
  dailyMediaSync({}, {}, () => nextCalls++);
  assert.strictEqual(nextCalls, 1);
};
const settle = () => new Promise(setImmediate);

test('stays off until both keys are set', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 10, 1, 12) });
  const sync = t.mock.method(mediaSync, 'syncMedia', async () => {});

  delete process.env.FAVMOV_SUPABASE_S_KEY;
  process.env.FAVMOV_TMDB_API_KEY = 'test';
  visit();
  assert.strictEqual(sync.mock.callCount(), 0, 'stays off without the service key');

  process.env.FAVMOV_SUPABASE_S_KEY = 'test';
  delete process.env.FAVMOV_TMDB_API_KEY;
  visit();
  assert.strictEqual(sync.mock.callCount(), 0, 'stays off without the TMDB key');

  process.env.FAVMOV_TMDB_API_KEY = 'test';
});

test('runs once per day after a clean run', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 10, 2, 12) });
  const sync = t.mock.method(mediaSync, 'syncMedia', async () => {});

  visit();
  await settle();
  visit();
  assert.strictEqual(sync.mock.callCount(), 1, 'second visit on the same day');

  t.mock.timers.tick(DAY);
  visit();
  await settle();
  assert.strictEqual(sync.mock.callCount(), 2, 'first visit of the next day');
});

test('retries a failed run only after the delay, then stops once it is clean', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 10, 5, 1) });
  const error = t.mock.method(console, 'error', () => {});
  let fail = true;
  const sync = t.mock.method(mediaSync, 'syncMedia', async () => {
    if (fail) throw new Error('boom');
  });

  visit();
  await settle();
  assert.strictEqual(error.mock.callCount(), 1, 'failure is logged');

  visit();
  t.mock.timers.tick(RETRY_DELAY_MS - 1);
  visit();
  assert.strictEqual(sync.mock.callCount(), 1, 'no retry before the delay ends');

  t.mock.timers.tick(1);
  visit();
  await settle();
  assert.strictEqual(sync.mock.callCount(), 2, 'retries once the delay ends');

  fail = false;
  t.mock.timers.tick(RETRY_DELAY_MS);
  visit();
  await settle();
  assert.strictEqual(sync.mock.callCount(), 3, 'retry that succeeds');

  t.mock.timers.tick(RETRY_DELAY_MS);
  visit();
  assert.strictEqual(sync.mock.callCount(), 3, 'done for the day after a clean retry');
});

test('never starts a second run while one is going, even past midnight', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 10, 7, 23) });
  let finish;
  const sync = t.mock.method(mediaSync, 'syncMedia', () => new Promise((resolve) => { finish = resolve; }));

  visit();
  visit();
  t.mock.timers.tick(DAY);
  visit();
  assert.strictEqual(sync.mock.callCount(), 1);

  finish();
  await settle();
  visit();
  assert.strictEqual(sync.mock.callCount(), 2, 'the new day still gets its run');
  finish();
  await settle();
});
