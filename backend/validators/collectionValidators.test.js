const test = require('node:test');
const assert = require('node:assert/strict');
const { validationResult } = require('express-validator');
const { validateMovieToCollection } = require('./collectionValidators');
for (const isTv of [false, true]) {
  for (const poster of [null, undefined, '', '   ', '/poster.jpg']) {
    test(`accepts valid ${isTv ? 'TV' : 'movie'} with poster ${JSON.stringify(poster)}`, async () => {
      const req = {
        body: { title: 'Title', is_tv_show: isTv, movie_id: 1, tv_show_id: 1, poster_path: poster },
      };
      for (const rule of validateMovieToCollection) await rule.run(req);
      assert.equal(validationResult(req).isEmpty(), true);
      assert.equal(
        req.body.poster_path,
        typeof poster === 'string' && poster.trim() ? poster : null,
      );
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

const { validateMovieCollectionNotes } = require('./collectionValidators');
for (const rules of [validateMovieToCollection, validateMovieCollectionNotes]) {
  for (const value of ['false', 'true', 0, 1, null, undefined]) {
    test(`rejects non-boolean ${JSON.stringify(value)} with ${rules.length} rules`, async () => {
      const req = { body: { title: 'Title', is_tv_show: value } };
      for (const rule of rules) await rule.run(req);
      assert.equal(
        validationResult(req).array()[0].msg,
        'is_tv_show is required and must be boolean.',
      );
    });
  }
}

for (const rules of [validateMovieToCollection, validateMovieCollectionNotes]) {
  for (const notes of [123, {}, []]) {
    test(`rejects non-string notes ${JSON.stringify(notes)} with ${rules.length} rules`, async () => {
      const req = {
        params: { movie_id: '1' },
        body: { title: 'Title', is_tv_show: false, movie_id: 1, notes },
      };
      for (const rule of rules) await rule.run(req);
      assert.equal(validationResult(req).array()[0].msg, 'notes must be a string.');
    });
  }
  for (const notes of [null, undefined, '', 'Great']) {
    test(`accepts notes ${JSON.stringify(notes)} with ${rules.length} rules`, async () => {
      const req = {
        params: { movie_id: '1' },
        body: { title: 'Title', is_tv_show: false, movie_id: 1, notes },
      };
      for (const rule of rules) await rule.run(req);
      assert.equal(validationResult(req).isEmpty(), true);
    });
  }
}

const { validateCheckExist, validateRemoveMovie } = require('./collectionValidators');
for (const [rules, name] of [
  [validateCheckExist, 'movie_or_tv_show_id'],
  [validateRemoveMovie, 'movie_id'],
  [validateMovieCollectionNotes, 'movie_id'],
]) {
  for (const id of ['abc', 'NaN', '0', '-1', '1.5', '007', '+1', '2147483648']) {
    test(`rejects title id ${JSON.stringify(id)} for ${name}`, async () => {
      const req = { params: { [name]: id }, body: { is_tv_show: false } };
      for (const rule of rules) await rule.run(req);
      assert.equal(validationResult(req).array()[0].msg, 'Title id must be a positive integer.');
    });
  }
}

test('trims notes', async () => {
  const req = { params: { movie_id: '1' }, body: { is_tv_show: false, notes: '  hi  ' } };
  for (const rule of validateMovieCollectionNotes) await rule.run(req);
  assert.equal(req.body.notes, 'hi');
});

for (const [isTv, field] of [
  [false, 'movie_id'],
  [true, 'tv_show_id'],
]) {
  for (const id of [-5, 1.5, 'abc', 2147483648, '007', '+5']) {
    test(`rejects body ${field} ${JSON.stringify(id)}`, async () => {
      const req = { body: { title: 'Title', is_tv_show: isTv, [field]: id } };
      for (const rule of validateMovieToCollection) await rule.run(req);
      assert.equal(validationResult(req).array()[0].msg, `${field} must be a positive integer.`);
    });
  }
}

for (const [field, value, msg] of [
  ['rating', 'abc', 'rating must be a number from 0 to 10.'],
  ['rating', '', 'rating must be a number from 0 to 10.'],
  ['rating', {}, 'rating must be a number from 0 to 10.'],
  ['rating', '0x10', 'rating must be a number from 0 to 10.'],
  ['rating', 11, 'rating must be a number from 0 to 10.'],
  ['rating_count', 3000000000, 'rating_count must be a non-negative integer.'],
  ['release_date', '2024-13-45', 'release_date must be a YYYY-MM-DD date.'],
  ['release_date', '2023-02-29', 'release_date must be a YYYY-MM-DD date.'],
  ['rating_count', -1, 'rating_count must be a non-negative integer.'],
  ['rating_count', 1.5, 'rating_count must be a non-negative integer.'],
  ['rating_count', '3', 'rating_count must be a non-negative integer.'],
  ['release_date', 'yesterday', 'release_date must be a YYYY-MM-DD date.'],
  ['release_date', 20240101, 'release_date must be a YYYY-MM-DD date.'],
]) {
  test(`rejects ${field} ${JSON.stringify(value)}`, async () => {
    const req = { body: { title: 'Title', is_tv_show: false, movie_id: 1, [field]: value } };
    for (const rule of validateMovieToCollection) await rule.run(req);
    assert.equal(validationResult(req).array()[0].msg, msg);
  });
}

test('accepts the metadata the app sends', async () => {
  for (const extra of [
    { rating: '7.12', rating_count: 100, release_date: '2009-05-28' },
    { rating: 8, rating_count: 0, release_date: null },
    { rating: null, rating_count: null },
  ]) {
    const req = { body: { title: 'Title', is_tv_show: false, movie_id: 1, ...extra } };
    for (const rule of validateMovieToCollection) await rule.run(req);
    assert.equal(validationResult(req).isEmpty(), true);
  }
});
