const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const createPageRoutes = require('./pageRoutes');

const exportedFiles = [
  'image.html', 'index.html', 'login.html', 'search.html', 'explore.html', 'profile.html', 'collection.html', '+not-found.html',
  'collection/add.html', 'collection/[id].html', 'movie/[id].html', 'people/[id].html',
  'assets/node_modules/.pnpm/expo-router/unmatched.png', '.env',
];

const cases = [
  ['/', 200, 'index.html'],
  ['/image', 200, 'image.html'],
  ['/image/?url=x', 200, 'image.html'],
  ['/login', 200, 'login.html'],
  ['/login/', 200, 'login.html'],
  ['/search/', 200, 'search.html'],
  ['/explore/', 200, 'explore.html'],
  ['/explore/?section_type=Popular', 200, 'explore.html'],
  ['/profile/', 200, 'profile.html'],
  ['/collection', 200, 'collection.html'],
  ['/collection/', 200, 'collection.html'],
  ['/collection/add', 200, 'collection/add.html'],
  ['/collection/add/', 200, 'collection/add.html'],
  ['/collection/add/?movie_id=5', 200, 'collection/add.html'],
  ['/collection/abc', 200, 'collection/[id].html'],
  ['/collection/abc/', 200, 'collection/[id].html'],
  ['/people/5', 200, 'people/[id].html'],
  ['/people/5/', 200, 'people/[id].html'],
  ['/movie/5', 200, 'movie/[id].html'],
  ['/movie/5/', 200, 'movie/[id].html'],
  ['/movie/5/?is_tv_show=true', 200, 'movie/[id].html'],
  ['/movie/abc', 404, 'movie/[id].html'],
  ['/nope', 404, '+not-found.html'],
  ['/nope/', 404, '+not-found.html'],
  ['/movie/5/extra', 404, '+not-found.html'],
  ['/assets/node_modules/.pnpm/expo-router/unmatched.png', 200, 'assets/node_modules/.pnpm/expo-router/unmatched.png'],
  ['/.env', 404, '+not-found.html'],
];

test('serves each URL its own prerendered page', async (t) => {
  const tmdbKey = process.env.FAVMOV_TMDB_API_KEY;
  delete process.env.FAVMOV_TMDB_API_KEY;
  const publicDir = await fs.mkdtemp(path.join(os.tmpdir(), 'favmov-pages-'));
  await Promise.all(['collection', 'movie', 'people', 'assets/node_modules/.pnpm/expo-router'].map((dir) => fs.mkdir(path.join(publicDir, dir), { recursive: true })));
  await Promise.all(exportedFiles.map((file) => fs.writeFile(path.join(publicDir, file), file)));

  const app = express();
  app.use(createPageRoutes(publicDir));
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  t.after(async () => {
    if (tmdbKey) process.env.FAVMOV_TMDB_API_KEY = tmdbKey;
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(publicDir, { recursive: true });
  });

  for (const [url, status, file] of cases) {
    const response = await fetch(`http://localhost:${server.address().port}${url}`);
    assert.deepStrictEqual([url, response.status, await response.text()], [url, status, file]);
  }
});

const movieHtml = '<title>Default</title><meta name="description" content="Default"><meta property="og:title" content="Default"><meta property="og:url" content="Default">';

const startMoviePages = async (t) => {
  const tmdbKey = process.env.FAVMOV_TMDB_API_KEY;
  process.env.FAVMOV_TMDB_API_KEY = 'test-key';
  const publicDir = await fs.mkdtemp(path.join(os.tmpdir(), 'favmov-seo-'));
  await fs.mkdir(path.join(publicDir, 'movie'));
  await fs.writeFile(path.join(publicDir, 'movie', '[id].html'), movieHtml);

  const app = express();
  app.use(createPageRoutes(publicDir));
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  t.after(async () => {
    if (tmdbKey) process.env.FAVMOV_TMDB_API_KEY = tmdbKey;
    else delete process.env.FAVMOV_TMDB_API_KEY;
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(publicDir, { recursive: true });
  });

  // Page requests below go through the real fetch; only TMDB calls are answered here
  const realFetch = global.fetch;
  return (tmdb) => {
    t.mock.method(global, 'fetch', async (url, options) => (String(url).includes('themoviedb') ? tmdb(url) : realFetch(url, options)));
    return (pagePath) => realFetch(`http://localhost:${server.address().port}${pagePath}`);
  };
};

// Ids differ per test because movieSeo caches lookups for the life of the process
test('fills a movie page from TMDB, and a TV show from the tv endpoint', async (t) => {
  const urls = [];
  const get = (await startMoviePages(t))(async (url) => {
    urls.push(url);
    return { ok: true, status: 200, json: async () => ({ name: 'A Show', overview: 'About it' }) };
  });

  const response = await get('/movie/9001?is_tv_show=true');
  const html = await response.text();
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(urls, ['https://api.themoviedb.org/3/tv/9001']);
  assert.match(html, /<title>A Show \| FavMov<\/title>/);
  assert.match(html, /name="description" content="About it"/);
  assert.match(html, /og:url" content="https:\/\/favmov\.milhamj\.com\/movie\/9001\?is_tv_show=true"/);
});

test('answers 404 with the default head for a title TMDB does not have', async (t) => {
  const get = (await startMoviePages(t))(async () => ({ ok: false, status: 404 }));
  const response = await get('/movie/9002');
  assert.strictEqual(response.status, 404);
  assert.strictEqual(await response.text(), movieHtml);
});

test('keeps serving the page with the default head when TMDB is down', async (t) => {
  t.mock.method(console, 'error', () => {});
  const get = (await startMoviePages(t))(async () => ({ ok: false, status: 503 }));
  const response = await get('/movie/9003');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(await response.text(), movieHtml);
});
