const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const { getChanges, syncTable, syncMedia } = require('./mediaSync');

const row = { id: 1, uuid: 'a', title: 'Up', poster_path: '/up.jpg', rating: 8, rating_count: 10, release_date: '2009-05-28' };
const tmdbMovie = { title: 'Up', poster_path: '/up.jpg', vote_average: 8, vote_count: 10, release_date: '2009-05-28' };

test('returns null when nothing changed', () => {
  assert.strictEqual(getChanges(row, tmdbMovie, false), null);
});

test('keeps the stored poster when TMDB has none', () => {
  assert.strictEqual(getChanges(row, { ...tmdbMovie, poster_path: null }, false), null);
  assert.strictEqual(getChanges(row, { ...tmdbMovie, poster_path: null, vote_average: 9 }, false).poster_path, '/up.jpg');
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

  const result = await syncTable(supabase, 'dev_movies', false);

  assert.deepStrictEqual(result, { checked: 3, updated: 1, failed: 1 });
  assert.deepStrictEqual(updates.map((update) => update.uuid), ['stale']);
  assert.strictEqual(updates[0].values.rating_count, 11);
  assert.ok(updates[0].values.updated_at);
});

test('rejects when the table cannot be read, instead of exiting the server', async () => {
  const supabase = { from: () => ({ select: async () => ({ data: null, error: { message: 'boom' } }) }) };
  await assert.rejects(syncTable(supabase, 'dev_movies', false), /boom/);
});

test('continues requesting later movies and TV shows after a transient TMDB failure', async (t) => {
  t.mock.method(Date, 'now', () => 0);
  const lookup = t.mock.method(global, 'fetch', async (url) => {
    if (url.endsWith('/movie/501')) return Response.json({}, { status: 500 });
    return Response.json({ ...tmdbMovie, name: 'Up', first_air_date: '2009-05-28', vote_count: 11 });
  });
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'log', () => {});
  const updates = [];
  const supabase = {
    from: (table) => ({
      select: async () => ({ data: [501, 502, 503].map((id) => ({ ...row, id, uuid: String(id) })), error: null }),
      update: () => ({
        eq: async (_, uuid) => {
          updates.push({ table, uuid });
          return { error: null };
        },
      }),
    }),
  };

  await syncTable(supabase, 'dev_movies', false);
  await syncTable(supabase, 'dev_tv_shows', true);

  assert.strictEqual(lookup.mock.callCount(), 6);
  assert.deepStrictEqual(updates, [
    { table: 'dev_movies', uuid: '502' },
    { table: 'dev_movies', uuid: '503' },
    { table: 'dev_tv_shows', uuid: '501' },
    { table: 'dev_tv_shows', uuid: '502' },
    { table: 'dev_tv_shows', uuid: '503' },
  ]);
});

const syncEnv = {
  FAVMOV_NODE_ENV: 'development',
  FAVMOV_SUPABASE_URL: 'https://supabase.example',
  FAVMOV_SUPABASE_S_KEY: 'test-service-key',
  FAVMOV_TMDB_API_KEY: 'test-tmdb-key',
};

const createSyncFetch = ({ failTmdb = false, failWrites = false } = {}) => {
  const requests = [];
  const fetch = async (input, options = {}) => {
    const url = new URL(input);
    const method = options.method || 'GET';
    requests.push({ url: url.href, method });
    if (url.hostname === 'api.themoviedb.org') {
      return Response.json({ title: 'Updated', name: 'Updated', vote_count: 11 }, { status: failTmdb ? 500 : 200 });
    }
    if (url.hostname !== 'supabase.example') throw new Error(`Unexpected request: ${url.href}`);
    if (method === 'PATCH') {
      return failWrites
        ? Response.json({ message: 'write rejected' }, { status: 403 })
        : new Response(null, { status: 204 });
    }
    return Response.json([{ id: 701, uuid: 'stored-media', title: 'Stale' }]);
  };
  return { fetch, requests };
};

const prepareSync = (t, options) => {
  for (const [key, value] of Object.entries(syncEnv)) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
  }
  const mock = createSyncFetch(options);
  t.mock.method(global, 'fetch', mock.fetch);
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'log', () => {});
  return mock.requests;
};

test('reports write failures only after attempting both tables', async (t) => {
  const requests = prepareSync(t, { failWrites: true });

  await assert.rejects(syncMedia(), /2.*failed/);

  assert.strictEqual(requests.filter(({ method }) => method === 'PATCH').length, 2);
  assert.ok(requests.some(({ url, method }) => method === 'PATCH' && url.includes('/dev_movies?')));
  assert.ok(requests.some(({ url, method }) => method === 'PATCH' && url.includes('/dev_tv_shows?')));
});

test('reports TMDB failures after attempting both tables', async (t) => {
  const requests = prepareSync(t, { failTmdb: true });

  await assert.rejects(syncMedia(), /2.*failed/);

  assert.strictEqual(requests.filter(({ url }) => url.includes('api.themoviedb.org')).length, 2);
  assert.strictEqual(requests.filter(({ method }) => method === 'PATCH').length, 0);
});

test('succeeds when both tables refresh without row failures', async (t) => {
  const requests = prepareSync(t);

  await syncMedia();

  assert.strictEqual(requests.filter(({ method }) => method === 'PATCH').length, 2);
});

test('manual sync exits nonzero when database writes fail', () => {
  const preload = `globalThis.fetch = (${createSyncFetch.toString()})({ failWrites: true }).fetch;`;
  const result = spawnSync(process.execPath, [
    '--import', `data:text/javascript,${encodeURIComponent(preload)}`,
    require.resolve('./mediaSync'),
  ], { env: { ...process.env, ...syncEnv }, encoding: 'utf8', timeout: 10000 });

  assert.ifError(result.error);
  assert.strictEqual(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /2.*failed/);
  assert.match(result.stdout, /dev_movies: checked 1, updated 0, failed 1/);
  assert.match(result.stdout, /dev_tv_shows: checked 1, updated 0, failed 1/);
});
