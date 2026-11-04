const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { createFakeSupabase } = require('./fakeSupabase');
const { startServer } = require('./startServer');

const ALICE = 'alice-token';
const BOB = 'bob-token';
const movie = (id, extra = {}) => ({ is_tv_show: false, movie_id: id, title: `Movie ${id}`, poster_path: `/${id}.jpg`, rating: 7.5, rating_count: 10, release_date: '2020-01-02', ...extra });
const show = (id, extra = {}) => ({ is_tv_show: true, tv_show_id: id, title: `Show ${id}`, poster_path: `/${id}.jpg`, ...extra });

const supabase = createFakeSupabase();
let server;

const call = async (method, path, { token = ALICE, body, baseUrl = server.url } = {}) => {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: typeof body === 'string' ? body : body && JSON.stringify(body),
  });
  return { ...(await response.json()), status: response.status };
};

const createCollection = async (name, token = ALICE) => (await call('POST', '/collections', { token, body: { name } })).data;

before(async () => {
  const supabaseUrl = await supabase.start();
  supabase.addUser(ALICE, { id: 'alice', email: 'alice@example.com' });
  supabase.addUser(BOB, { id: 'bob', email: 'bob@example.com' });
  server = await startServer({ supabaseUrl });
  server.supabaseUrl = supabaseUrl;
});

after(async () => {
  await server.stop();
  await supabase.stop();
});

beforeEach(() => supabase.reset());

describe('server', () => {
  test('reports health without authentication', async () => {
    assert.strictEqual((await call('GET', '/health', { token: null })).status, 200);
  });

  test('answers unknown API paths with the JSON error envelope', async () => {
    const response = await call('GET', '/nope', { token: null });
    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.success, false);
    assert.strictEqual(response.message, 'Not Found');
    assert.strictEqual(response.debugMessage, 'Unknown API endpoint: /api/nope');
  });

  test('turns a malformed JSON body into a 400 envelope', async () => {
    const response = await call('POST', '/collections', { body: '{broken' });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.success, false);
  });
});

describe('authentication', () => {
  for (const [name, token, message] of [
    ['no token', null, 'Authentication required'],
    ['an unknown token', 'stolen', 'Invalid or expired token'],
  ]) {
    test(`rejects ${name}`, async () => {
      const response = await call('GET', '/collections', { token });
      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.message, message);
    });
  }

  test('rejects a header that is not a bearer token', async () => {
    const response = await fetch(`${server.url}/api/collections`, { headers: { Authorization: `Basic ${ALICE}` } });
    assert.strictEqual(response.status, 401);
  });
});

describe('creating collections', () => {
  test('creates a collection owned by the caller', async () => {
    const response = await call('POST', '/collections', { body: { name: '  Sci-Fi  ' } });
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.data.name, 'Sci-Fi');
    assert.strictEqual(response.data.user_id, 'alice');
  });

  test('requires a name', async () => {
    const response = await call('POST', '/collections', { body: { name: '   ' } });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.message, 'Collection name is required.');
  });

  test('rejects a name the user already has, ignoring case', async () => {
    await createCollection('Sci-Fi');
    const response = await call('POST', '/collections', { body: { name: 'SCI-FI' } });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.message, 'You already have a collection with the same name.');
  });

  test('lets two users use the same name', async () => {
    await createCollection('Sci-Fi', ALICE);
    assert.strictEqual((await call('POST', '/collections', { token: BOB, body: { name: 'Sci-Fi' } })).status, 201);
  });
});

describe('listing collections', () => {
  test('sorts by movie count, then most recently updated', async () => {
    const empty = await createCollection('Empty');
    const older = await createCollection('Older');
    const newer = await createCollection('Newer');
    const big = await createCollection('Big');
    await call('POST', `/collections/${older.id}/movies`, { body: movie(1) });
    await call('POST', `/collections/${newer.id}/movies`, { body: movie(2) });
    await call('POST', `/collections/${big.id}/movies`, { body: movie(3) });
    await call('POST', `/collections/${big.id}/movies`, { body: movie(4) });

    const { data } = await call('GET', '/collections');
    assert.deepStrictEqual(data.map((c) => c.name), ['Big', 'Newer', 'Older', 'Empty']);
    assert.strictEqual(data.at(-1).last_updated, empty.created_at, 'an empty collection falls back to created_at');
  });

  test('only returns the caller\'s collections', async () => {
    await createCollection('Alice only', ALICE);
    assert.deepStrictEqual((await call('GET', '/collections', { token: BOB })).data, []);
  });
});

describe('adding to a collection', () => {
  test('stores the movie once and links it to each collection', async () => {
    const first = await createCollection('First');
    const second = await createCollection('Second');

    const response = await call('POST', `/collections/${first.id}/movies`, { body: movie(1) });
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.data.movie_id, 1);
    assert.strictEqual(response.data.tv_show_id, null);
    await call('POST', `/collections/${second.id}/movies`, { body: movie(1) });

    assert.strictEqual(supabase.rowsOf('dev_movies').length, 1);
    assert.strictEqual(supabase.rowsOf('dev_movies_collections').length, 2);
  });

  test('keeps TV shows apart from a movie with the same id', async () => {
    const collection = await createCollection('Mixed');
    await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });
    const response = await call('POST', `/collections/${collection.id}/movies`, { body: show(1) });

    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.data.tv_show_id, 1);
    assert.strictEqual(response.data.movie_id, null);
    assert.strictEqual(supabase.rowsOf('dev_tv_shows').length, 1);
  });

  for (const [name, body, message] of [
    ['a movie twice', movie(1), 'Movie already exists in this collection'],
    ['a TV show twice', show(2), 'TV Show already exists in this collection'],
  ]) {
    test(`rejects ${name}`, async () => {
      const collection = await createCollection('Twice');
      await call('POST', `/collections/${collection.id}/movies`, { body });
      const response = await call('POST', `/collections/${collection.id}/movies`, { body });
      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.message, message);
    });
  }

  for (const [name, body, message] of [
    ['is_tv_show', { ...movie(1), is_tv_show: undefined }, 'is_tv_show is requires and must be boolean.'],
    ['title', movie(1, { title: ' ' }), 'title is required.'],
    ['movie_id', movie(undefined), 'movie_id is required when is_tv_show is false'],
    ['tv_show_id', show(undefined), 'tv_show_id is required when is_tv_show is true'],
  ]) {
    test(`requires ${name}`, async () => {
      const collection = await createCollection('Invalid');
      const response = await call('POST', `/collections/${collection.id}/movies`, { body });
      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.message, message);
    });
  }

  test('refuses another user\'s collection', async () => {
    const collection = await createCollection('Private', ALICE);
    const response = await call('POST', `/collections/${collection.id}/movies`, { token: BOB, body: movie(1) });
    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.message, 'Collection not found or access denied');
    assert.deepStrictEqual(supabase.rowsOf('dev_movies_collections'), []);
  });
});

describe('reading a collection', () => {
  test('returns its titles flattened, newest first', async () => {
    const collection = await createCollection('Detail');
    await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });
    await call('POST', `/collections/${collection.id}/movies`, { body: show(2) });
    await call('POST', `/collections/${collection.id}/movies/1/notes`, { body: { is_tv_show: false, notes: 'Great' } });

    const { status, data } = await call('GET', `/collections/${collection.id}/movies`);
    assert.strictEqual(status, 200);
    assert.strictEqual(data.name, 'Detail');
    assert.deepStrictEqual(data.movies.map((m) => [m.id, m.title, m.is_tv_show]), [[2, 'Show 2', true], [1, 'Movie 1', false]]);
    assert.strictEqual(data.movies[1].notes, 'Great');
    assert.strictEqual(data.movies[1].rating, 7.5);
  });

  test('hides another user\'s collection', async () => {
    const collection = await createCollection('Private', ALICE);
    assert.strictEqual((await call('GET', `/collections/${collection.id}/movies`, { token: BOB })).status, 404);
  });

  test('latest_movies reports one id field for movies and TV shows', async () => {
    const collection = await createCollection('Latest');
    await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });
    await call('POST', `/collections/${collection.id}/movies`, { body: show(2) });

    const { data } = await call('GET', '/collections/latest_movies');
    assert.deepStrictEqual(data.map((m) => [m.id, m.is_tv_show]), [[2, true], [1, false]]);
    assert.ok(data.every((m) => !('movie_id' in m) && !('tv_show_id' in m)));
  });
});

describe('checking where a title is saved', () => {
  test('lists the caller\'s collections holding the title, with notes', async () => {
    const holds = await createCollection('Holds it');
    await createCollection('Does not');
    await call('POST', `/collections/${holds.id}/movies`, { body: movie(1) });
    await call('POST', `/collections/${holds.id}/movies/1/notes`, { body: { is_tv_show: false, notes: 'Hi' } });

    const { data } = await call('GET', '/collections/check_exist/1?is_tv_show=false');
    assert.deepStrictEqual(data, [{ collection_id: holds.id, collection_name: 'Holds it', notes: 'Hi' }]);
  });

  test('does not confuse a TV show with a movie of the same id', async () => {
    const collection = await createCollection('Movies');
    await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });
    assert.deepStrictEqual((await call('GET', '/collections/check_exist/1?is_tv_show=true')).data, []);
  });

  test('never reveals another user\'s collections', async () => {
    const collection = await createCollection('Alice');
    await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });
    assert.deepStrictEqual((await call('GET', '/collections/check_exist/1', { token: BOB })).data, []);
  });
});

describe('updating notes', () => {
  test('trims notes and clears them when none are sent', async () => {
    const collection = await createCollection('Notes');
    await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });

    const saved = await call('POST', `/collections/${collection.id}/movies/1/notes`, { body: { is_tv_show: false, notes: '  Watch again  ' } });
    assert.strictEqual(saved.data.notes, 'Watch again');
    const cleared = await call('POST', `/collections/${collection.id}/movies/1/notes`, { body: { is_tv_show: false } });
    assert.strictEqual(cleared.data.notes, '');
  });

  test('updates the TV show, not a movie with the same id', async () => {
    const collection = await createCollection('Notes');
    await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });
    await call('POST', `/collections/${collection.id}/movies`, { body: show(1) });

    await call('POST', `/collections/${collection.id}/movies/1/notes`, { body: { is_tv_show: true, notes: 'The show' } });
    const notes = supabase.rowsOf('dev_movies_collections').map((row) => [row.is_tv_show, row.notes]);
    assert.deepStrictEqual(notes, [[false, undefined], [true, 'The show']]);
  });

  test('reports a title that is not in the collection', async () => {
    const collection = await createCollection('Notes');
    const response = await call('POST', `/collections/${collection.id}/movies/9/notes`, { body: { is_tv_show: true } });
    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.message, 'TV Show not found in collection.');
  });

  test('requires is_tv_show', async () => {
    const collection = await createCollection('Notes');
    assert.strictEqual((await call('POST', `/collections/${collection.id}/movies/1/notes`, { body: {} })).status, 400);
  });
});

describe('removing', () => {
  test('removes a title from one collection and leaves the others', async () => {
    const first = await createCollection('First');
    const second = await createCollection('Second');
    await call('POST', `/collections/${first.id}/movies`, { body: movie(1) });
    await call('POST', `/collections/${second.id}/movies`, { body: movie(1) });

    const response = await call('DELETE', `/collections/${first.id}/movies/1`);
    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, { is_success: true });
    assert.deepStrictEqual(supabase.rowsOf('dev_movies_collections').map((row) => row.collection_id), [second.id]);
    assert.strictEqual(supabase.rowsOf('dev_movies').length, 1, 'the shared movie row stays');
  });

  test('removes the TV show when asked, not a movie with the same id', async () => {
    const collection = await createCollection('Mixed');
    await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });
    await call('POST', `/collections/${collection.id}/movies`, { body: show(1) });

    await call('DELETE', `/collections/${collection.id}/movies/1?is_tv_show=true`);
    assert.deepStrictEqual(supabase.rowsOf('dev_movies_collections').map((row) => row.is_tv_show), [false]);
  });

  test('reports a movie that is not in the collection', async () => {
    const collection = await createCollection('Empty');
    const response = await call('DELETE', `/collections/${collection.id}/movies/1`);
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.message, 'Movie not found in collection.');
  });

  test('deleting a collection deletes its links too', async () => {
    const collection = await createCollection('Doomed');
    await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });

    assert.strictEqual((await call('DELETE', `/collections/${collection.id}`)).status, 200);
    assert.deepStrictEqual(supabase.rowsOf('dev_collections'), []);
    assert.deepStrictEqual(supabase.rowsOf('dev_movies_collections'), []);
  });

  test('refuses to touch another user\'s collection', async () => {
    const collection = await createCollection('Private', ALICE);
    await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });

    assert.strictEqual((await call('DELETE', `/collections/${collection.id}/movies/1`, { token: BOB })).status, 404);
    assert.strictEqual((await call('DELETE', `/collections/${collection.id}`, { token: BOB })).status, 404);
    assert.strictEqual(supabase.rowsOf('dev_movies_collections').length, 1);
  });
});

describe('database failures', () => {
  test('shows a generic message and the cause only in development', async () => {
    supabase.failNext('GET', 'dev_collections');
    const response = await call('POST', '/collections', { body: { name: 'New' } });
    assert.strictEqual(response.status, 500);
    assert.strictEqual(response.message, 'Failed to fetch collections');
    assert.strictEqual(response.debugMessage, 'database exploded');
  });

  test('stops before linking when saving the movie fails', async () => {
    const collection = await createCollection('Broken');
    supabase.failNext('POST', 'dev_movies');
    const response = await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });
    assert.strictEqual(response.status, 500);
    assert.strictEqual(response.message, 'Error adding movie to collection.');
    assert.deepStrictEqual(supabase.rowsOf('dev_movies_collections'), []);
  });

  test('keeps the collection when deleting its links fails', async () => {
    const collection = await createCollection('Kept');
    supabase.failNext('DELETE', 'dev_movies_collections');
    assert.strictEqual((await call('DELETE', `/collections/${collection.id}`)).status, 500);
    assert.strictEqual(supabase.rowsOf('dev_collections').length, 1);
  });
});

describe('environments', () => {
  test('production uses prod_ tables and hides debug messages', async (t) => {
    const production = await startServer({ supabaseUrl: server.supabaseUrl, nodeEnv: 'production' });
    t.after(production.stop);

    await call('POST', '/collections', { baseUrl: production.url, body: { name: 'Prod' } });
    assert.strictEqual(supabase.rowsOf('prod_collections').length, 1);
    assert.deepStrictEqual(supabase.rowsOf('dev_collections'), []);

    supabase.failNext('GET', 'prod_collections');
    const response = await call('POST', '/collections', { baseUrl: production.url, body: { name: 'Next' } });
    assert.strictEqual(response.status, 500);
    assert.strictEqual(response.debugMessage, undefined);
  });

  test('refuses data requests under an unknown environment', async (t) => {
    const staging = await startServer({ supabaseUrl: server.supabaseUrl, nodeEnv: 'staging' });
    t.after(staging.stop);

    const response = await call('GET', '/collections', { baseUrl: staging.url });
    assert.strictEqual(response.status, 500);
    assert.match(response.message, /Invalid environment: staging/);
  });
});

// Each of these pins behaviour that looks wrong, so a fix is a conscious change. See docs/flows.md.
describe('known issues', () => {
  test('KNOWN ISSUE: removing a missing TV show answers just "TV Show"', async () => {
    const collection = await createCollection('Empty');
    const response = await call('DELETE', `/collections/${collection.id}/movies/1?is_tv_show=true`);
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.message, 'TV Show');
  });

  test('KNOWN ISSUE: a title without a poster cannot be saved', async () => {
    const collection = await createCollection('No art');
    const response = await call('POST', `/collections/${collection.id}/movies`, { body: movie(1, { poster_path: '' }) });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.message, 'poster path is required.');
  });

  test('KNOWN ISSUE: the string "false" for is_tv_show is treated as true', async () => {
    const collection = await createCollection('Strings');
    const response = await call('POST', `/collections/${collection.id}/movies`, { body: movie(1, { is_tv_show: 'false' }) });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.message, 'tv_show_id is required when is_tv_show is true');
  });

  test('KNOWN ISSUE: saving notes answers 201 although nothing is created', async () => {
    const collection = await createCollection('Status');
    await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });
    const response = await call('POST', `/collections/${collection.id}/movies/1/notes`, { body: { is_tv_show: false, notes: 'x' } });
    assert.strictEqual(response.status, 201);
  });

  test('KNOWN ISSUE: a failed link leaves the movie row behind', async () => {
    const collection = await createCollection('Orphan');
    supabase.failNext('POST', 'dev_movies_collections');
    const response = await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });
    assert.strictEqual(response.status, 500);
    assert.strictEqual(supabase.rowsOf('dev_movies').length, 1);
  });

  test('KNOWN ISSUE: a failed collection delete still loses its links', async () => {
    const collection = await createCollection('Half deleted');
    await call('POST', `/collections/${collection.id}/movies`, { body: movie(1) });
    supabase.failNext('DELETE', 'dev_collections');

    assert.strictEqual((await call('DELETE', `/collections/${collection.id}`)).status, 500);
    assert.strictEqual(supabase.rowsOf('dev_collections').length, 1);
    assert.deepStrictEqual(supabase.rowsOf('dev_movies_collections'), []);
  });
});
