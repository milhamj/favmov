const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const createPageRoutes = require('./pageRoutes');

const exportedFiles = [
  'index.html', 'login.html', 'search.html', 'explore.html', 'profile.html', 'collection.html', '+not-found.html',
  'collection/add.html', 'collection/[id].html', 'movie/[id].html', 'people/[id].html',
];

const cases = [
  ['/', 200, 'index.html'],
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
];

test('serves each URL its own prerendered page', async (t) => {
  const tmdbKey = process.env.FAVMOV_TMDB_API_KEY;
  delete process.env.FAVMOV_TMDB_API_KEY;
  const publicDir = await fs.mkdtemp(path.join(os.tmpdir(), 'favmov-pages-'));
  await Promise.all(['collection', 'movie', 'people'].map((dir) => fs.mkdir(path.join(publicDir, dir))));
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
