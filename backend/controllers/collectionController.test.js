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

const { deleteCollection } = require('./collectionController');
for (const environment of ['development', 'production']) {
 for (const outcome of ['success', 'delete failure', 'missing']) {
  test(`collection deletion uses one owned parent write: ${environment}, ${outcome}`, async t => {
   const previous = process.env.FAVMOV_NODE_ENV;
   process.env.FAVMOV_NODE_ENV = environment;
   t.after(() => { if (previous === undefined) delete process.env.FAVMOV_NODE_ENV; else process.env.FAVMOV_NODE_ENV = previous; });
   t.mock.method(console, 'error', () => {});
   const writes = [];
   const prefix = environment === 'development' ? 'dev' : 'prod';
   const response = await new Promise((resolve, reject) => {
    const req = { params: { collection_id: 'collection' }, user: { id: 'owner' }, supabase: {
     from(table) {
      let write;
      const query = {
       select() { return query; },
       eq(column, value) { if (write) write.filters.push([column, value]); return query; },
       single: async () => ({ data: outcome === 'missing' ? null : { id: 'collection' }, error: null }),
       delete() { write = { table, filters: [] }; writes.push(write); return query; },
       then(done, fail) { return Promise.resolve({ error: table === `${prefix}_collections` && outcome === 'delete failure' ? { message: 'injected parent failure' } : null }).then(done, fail); }
      };
      return query;
     }
    } };
    const res = { status(code) { this.code = code; return this; }, json(body) { resolve({ code: this.code, body }); } };
    deleteCollection(req, res, reject);
   });
   assert.equal(response.code, outcome === 'success' ? 200 : outcome === 'missing' ? 404 : 500);
   assert.deepEqual(writes, outcome === 'missing' ? [] : [{ table: `${prefix}_collections`, filters: [['id', 'collection'], ['user_id', 'owner']] }]);
   if (outcome === 'success') assert.deepEqual(response.body.data, { is_success: true });
  });
 }
}

const { addMovieToCollection, removeMovieFromCollection } = require('./collectionController');
const addBody = { is_tv_show: false, movie_id: 7, title: 'Title', poster_path: null };
const runMembership = (handler, options) => new Promise((resolve, reject) => {
 process.env.FAVMOV_NODE_ENV ??= 'development';
 const { entry = null, entryAfterConflict = null, mediaExists = true, checkError = null, mediaInsertError = null, entryInsertError = null } = options;
 const writes = [];
 const req = { params: { collection_id: 'collection', movie_id: '7' }, body: addBody, query: { is_tv_show: 'false' }, user: { id: 'owner' }, supabase: {
  from(table) {
   const isEntry = table.endsWith('_movies_collections');
   const isCollection = table.endsWith('_collections') && !isEntry;
   let inserted = false;
   const chain = {
    select() { return chain; }, eq() { return chain; }, order() { return chain; },
    insert() { inserted = true; writes.push(isEntry ? 'entry' : 'media'); return chain; },
    delete() { writes.push('delete'); return chain; },
    single: async () => ({ data: isCollection || mediaExists ? { id: 'row' } : null, error: null }),
    limit: async () => { const row = writes.includes('entry') ? entryAfterConflict : entry; return { data: checkError ? null : row ? [row] : [], error: checkError }; },
    then(done, fail) {
     const error = !inserted ? null : isEntry ? entryInsertError : mediaInsertError;
     return Promise.resolve({ data: error ? null : [{ id: 1 }], error }).then(done, fail);
    }
   };
   return chain;
  }
 } };
 const res = { status(code) { this.code = code; return this; }, json(payload) { resolve({ code: this.code, payload, writes }); } };
 handler(req, res, reject);
});
test('adding a title already in the collection succeeds with the existing row', async () => {
 const { code, payload, writes } = await runMembership(addMovieToCollection, { entry: { notes: 'kept' } });
 assert.equal(code, 200);
 assert.equal(payload.data.notes, 'kept');
 assert.deepEqual(writes, []);
});
test('removing a title already gone succeeds', async () => {
 const { code, payload, writes } = await runMembership(removeMovieFromCollection, {});
 assert.equal(code, 200);
 assert.equal(payload.success, true);
 assert.deepEqual(writes, ['delete']);
});
test('a failed existence check never inserts a possible duplicate', async t => {
 t.mock.method(console, 'error', () => {});
 const { code, writes } = await runMembership(addMovieToCollection, { checkError: { message: 'connection reset' } });
 assert.equal(code, 500);
 assert.deepEqual(writes, []);
});
test('losing the entry race returns the winning row', async () => {
 const { code, payload } = await runMembership(addMovieToCollection, { entryInsertError: { code: '23505' }, entryAfterConflict: { notes: 'winner' } });
 assert.equal(code, 200);
 assert.equal(payload.data.notes, 'winner');
});
test('losing the media row race still adds the entry', async () => {
 const { code, writes } = await runMembership(addMovieToCollection, { mediaExists: false, mediaInsertError: { code: '23505' } });
 assert.equal(code, 201);
 assert.deepEqual(writes, ['media', 'entry']);
});
test('other insert failures stay errors', async t => {
 t.mock.method(console, 'error', () => {});
 const { code } = await runMembership(addMovieToCollection, { entryInsertError: { code: '500', message: 'boom' } });
 assert.equal(code, 500);
});
test('older duplicate entries still count as already added', async () => {
 const { code, writes } = await runMembership(addMovieToCollection, { entry: { notes: 'first of two' } });
 assert.equal(code, 200);
 assert.deepEqual(writes, []);
});

const { updateMovieCollectionNotes } = require('./collectionController');
for (const [rows, status] of [[[{ notes: 'new' }], 201], [[], 404]]) {
 test(`updating notes matching ${rows.length} rows returns ${status} in one query`, async () => {
  process.env.FAVMOV_NODE_ENV ??= 'development';
  let queries = 0;
  const response = await new Promise((resolve, reject) => {
   const chain = { update() { return chain; }, eq() { return chain; }, select: async () => ({ data: rows, error: null }) };
   const req = { body: { is_tv_show: false, notes: 'new' }, params: { collection_id: 'collection', movie_id: '7' }, user: { id: 'owner' }, supabase: { from() { queries++; return chain; } } };
   const res = { status(code) { this.code = code; return this; }, json() { resolve(this.code); } };
   updateMovieCollectionNotes(req, res, reject);
  });
  assert.equal(response, status);
  assert.equal(queries, 1);
 });
}
