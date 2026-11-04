const test = require('node:test');
const assert = require('node:assert');
const { applyMovieSeo, fetchMovie, requestMovie } = require('./movieSeo');

const template = '<title data-rh="true">Default</title>'
  + '<meta data-rh="true" name="description" content="Default"/>'
  + '<meta data-rh="true" property="og:title" content="Default"/>'
  + '<meta data-rh="true" property="og:description" content="Default"/>'
  + '<meta data-rh="true" property="og:url" content="Default"/>'
  + '<meta data-rh="true" property="og:image" content="DefaultImage"/>'
  + '<meta data-rh="true" property="twitter:title" content="Default"/>';

test('fills the head from movie data', () => {
  const html = applyMovieSeo(template, { title: 'Up', overview: 'Balloons', poster_path: '/up.jpg' }, '/movie/1');
  assert.match(html, /<title data-rh="true">Up \| FavMov<\/title>/);
  assert.match(html, /name="description" content="Balloons"/);
  assert.match(html, /property="og:url" content="https:\/\/favmov.milhamj.com\/movie\/1"/);
  assert.match(html, /property="og:image" content="https:\/\/image.tmdb.org\/t\/p\/w500\/up.jpg"/);
  assert.match(html, /property="twitter:title" content="Up \| FavMov"/);
});

test('uses the TV show name and keeps defaults for missing fields', () => {
  const html = applyMovieSeo(template, { name: 'Dark', overview: '', poster_path: null }, '/movie/2');
  assert.match(html, /<title data-rh="true">Dark \| FavMov/);
  assert.match(html, /name="description" content="Default"/);
  assert.match(html, /property="og:image" content="DefaultImage"/);
});

test('escapes TMDB text so it cannot break out of the head', () => {
  const html = applyMovieSeo(template, { title: '</title><script>x</script>', overview: '"><script>$&' }, '/movie/3');
  assert.doesNotMatch(html, /<script/);
  assert.match(html, /name="description" content="&#34;&#62;&#60;script&#62;\$&#38;"/);
});

// The cache lives for the whole process, so each test uses its own ids
const mockTmdb = (t) => t.mock.method(global, 'fetch', async (url) => Response.json({ url }));

test('reuses a cached movie instead of calling TMDB again', async (t) => {
  const fetchMock = mockTmdb(t);
  const first = await fetchMovie('100', false);
  const second = await fetchMovie('100', false);
  assert.deepStrictEqual(second, first);
  assert.strictEqual(fetchMock.mock.callCount(), 1);
});

test('caches a movie and a TV show with the same id separately', async (t) => {
  const fetchMock = mockTmdb(t);
  const movie = await fetchMovie('200', false);
  const show = await fetchMovie('200', true);
  assert.match(movie.url, /\/movie\/200$/);
  assert.match(show.url, /\/tv\/200$/);
  assert.strictEqual(fetchMock.mock.callCount(), 2);
});

test('calls TMDB again once an entry expires', async (t) => {
  const fetchMock = mockTmdb(t);
  const now = Date.now();
  await fetchMovie('300', false);
  t.mock.method(Date, 'now', () => now + 60 * 60 * 1000 + 1000);
  await fetchMovie('300', false);
  assert.strictEqual(fetchMock.mock.callCount(), 2);
});

test('remembers a 404 for a short time', async (t) => {
  const fetchMock = t.mock.method(global, 'fetch', async () => new Response('{}', { status: 404 }));
  const now = Date.now();
  assert.strictEqual(await fetchMovie('410', false), null);
  assert.strictEqual(await fetchMovie('410', false), null);
  assert.strictEqual(fetchMock.mock.callCount(), 1);
  t.mock.method(Date, 'now', () => now + 5 * 60 * 1000 + 1000);
  await fetchMovie('410', false);
  assert.strictEqual(fetchMock.mock.callCount(), 2);
});

test('shares one TMDB call between simultaneous requests', async (t) => {
  const fetchMock = mockTmdb(t);
  const movies = await Promise.all([fetchMovie('420', false), fetchMovie('420', false), fetchMovie('420', false)]);
  assert.deepStrictEqual(movies[1], movies[0]);
  assert.strictEqual(fetchMock.mock.callCount(), 1);
});

test('pauses all lookups after a failure, then recovers', async (t) => {
  // Clock starts at 0 so the pause is over for the tests that run after this one
  const clock = t.mock.method(Date, 'now', () => 0);
  const failing = t.mock.method(global, 'fetch', async () => new Response('{}', { status: 500 }));
  await assert.rejects(fetchMovie('430', false), /TMDB responded with 500/);
  await assert.rejects(fetchMovie('431', false), /Skipping TMDB/);
  assert.strictEqual(failing.mock.callCount(), 1);

  failing.mock.restore();
  const fetchMock = mockTmdb(t);
  clock.mock.mockImplementation(() => 31 * 1000);
  await fetchMovie('430', false);
  assert.strictEqual(fetchMock.mock.callCount(), 1);
});

test('evicts the oldest entry when full', async (t) => {
  const fetchMock = mockTmdb(t);
  await fetchMovie('500', false);
  for (let id = 1000; id < 2000; id++) await fetchMovie(String(id), false);
  const calls = fetchMock.mock.callCount();
  await fetchMovie('1999', false);
  assert.strictEqual(fetchMock.mock.callCount(), calls);
  await fetchMovie('500', false);
  assert.strictEqual(fetchMock.mock.callCount(), calls + 1);
});

test('batch requests bypass the SEO cache and cooldown without changing page protection', async (t) => {
  t.mock.method(Date, 'now', () => 60000);
  const lookup = t.mock.method(global, 'fetch', async (url) => {
    if (url.endsWith('/movie/601')) return Response.json({}, { status: 500 });
    return Response.json({ url });
  });
  await fetchMovie('600', false);
  await assert.rejects(fetchMovie('601', false), /TMDB responded with 500/);

  const movie = await requestMovie('600', false);
  const show = await requestMovie('600', true);
  await assert.rejects(requestMovie('601', false), /TMDB responded with 500/);
  await requestMovie('602', false);
  await assert.rejects(fetchMovie('603', false), /Skipping TMDB/);

  assert.match(movie.url, /\/movie\/600$/);
  assert.match(show.url, /\/tv\/600$/);
  assert.strictEqual(lookup.mock.callCount(), 6);
});
