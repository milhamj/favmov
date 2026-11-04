const test = require('node:test');
const assert = require('node:assert');
const { getChanges, syncTable } = require('./mediaSync');

const row = { id: 1, uuid: 'a', title: 'Up', poster_path: '/up.jpg', rating: 8, rating_count: 10, release_date: '2009-05-28' };
const tmdbMovie = { title: 'Up', poster_path: '/up.jpg', vote_average: 8, vote_count: 10, release_date: '2009-05-28' };

test('returns null when nothing changed', () => {
  assert.strictEqual(getChanges(row, tmdbMovie, false), null);
});

test('returns the TMDB values when a field changed', () => {
  assert.deepStrictEqual(getChanges(row, { ...tmdbMovie, vote_average: 8.5 }, false), {
    title: 'Up', poster_path: '/up.jpg', rating: 8.5, rating_count: 10, release_date: '2009-05-28',
  });
});

test('reads name and first_air_date for TV shows', () => {
  const tmdbShow = { ...tmdbMovie, title: undefined, release_date: undefined, name: 'Up', first_air_date: '2009-05-28' };
  assert.strictEqual(getChanges(row, tmdbShow, true), null);
});

test('updates stale rows only and carries on past a title TMDB no longer has', async (t) => {
  const rows = [
    { ...row, id: 1, uuid: 'fresh' },
    { ...row, id: 2, uuid: 'gone' },
    { ...row, id: 3, uuid: 'stale' },
  ];
  t.mock.method(global, 'fetch', async (url) => {
    if (url.endsWith('/2')) return { ok: false, status: 404 };
    const body = url.endsWith('/3') ? { ...tmdbMovie, vote_count: 11 } : tmdbMovie;
    return { ok: true, json: async () => body };
  });
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'log', () => {});

  const updates = [];
  const supabase = {
    from: () => ({
      select: async () => ({ data: rows, error: null }),
      update: (values) => ({
        eq: async (_, uuid) => {
          updates.push({ uuid, values });
          return { error: null };
        },
      }),
    }),
  };

  await syncTable(supabase, 'dev_movies', false);

  assert.deepStrictEqual(updates.map((update) => update.uuid), ['stale']);
  assert.strictEqual(updates[0].values.rating_count, 11);
  assert.ok(updates[0].values.updated_at);
});

test('rejects when the table cannot be read, instead of exiting the server', async () => {
  const supabase = { from: () => ({ select: async () => ({ data: null, error: { message: 'boom' } }) }) };
  await assert.rejects(syncTable(supabase, 'dev_movies', false), /boom/);
});
