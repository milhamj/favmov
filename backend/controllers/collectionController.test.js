const test = require('node:test');
const assert = require('node:assert/strict');
const { validationResult } = require('express-validator');
const { validateMovieToCollection } = require('./collectionController');
for (const isTv of [false, true]) {
 for (const poster of [null, undefined, '', '   ', '/poster.jpg']) {
  test(`accepts valid ${isTv ? 'TV' : 'movie'} with poster ${JSON.stringify(poster)}`, async () => {
   const req = { body: { title: 'Title', is_tv_show: isTv, poster_path: poster } };
   for (const rule of validateMovieToCollection) await rule.run(req);
   assert.equal(validationResult(req).isEmpty(), true);
   assert.equal(req.body.poster_path, typeof poster === 'string' && poster.trim() ? poster : null);
  });
 }
}
for (const poster of [42, {}, []]) {
 test(`rejects malformed poster ${JSON.stringify(poster)}`, async () => {
  const req = { body: { title: 'Title', is_tv_show: false, poster_path: poster } };
  for (const rule of validateMovieToCollection) await rule.run(req);
  assert.equal(validationResult(req).isEmpty(), false);
 });
}
