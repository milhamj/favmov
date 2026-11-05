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
const runMembership = (handler, row, params, body, query) => new Promise((resolve, reject) => {
 const writes = [];
 const req = { params, body, query, user: { id: 'owner' }, supabase: {
  from() {
   const result = { data: row ? [row] : [], error: null };
   const chain = {
    select() { return chain; }, eq() { return chain; },
    insert() { writes.push('insert'); return chain; }, delete() { writes.push('delete'); return chain; },
    single: async () => ({ data: { id: 'collection', ...row }, error: null }),
    then(done, fail) { return Promise.resolve(result).then(done, fail); }
   };
   return chain;
  }
 } };
 const res = { status(code) { this.code = code; return this; }, json(payload) { resolve({ code: this.code, payload, writes }); } };
 handler(req, res, reject);
});
test('adding a title already in the collection succeeds with the existing row', async t => {
 process.env.FAVMOV_NODE_ENV ??= 'development';
 const { code, payload, writes } = await runMembership(addMovieToCollection, { notes: 'kept' }, { collection_id: 'collection' }, { is_tv_show: false, movie_id: 7, title: 'Title', poster_path: null });
 assert.equal(code, 200);
 assert.equal(payload.data.notes, 'kept');
 assert.deepEqual(writes, []);
});
test('removing a title already gone succeeds without a write', async t => {
 process.env.FAVMOV_NODE_ENV ??= 'development';
 const { code, payload, writes } = await runMembership(removeMovieFromCollection, null, { collection_id: 'collection', movie_id: '7' }, {}, { is_tv_show: 'false' });
 assert.equal(code, 200);
 assert.equal(payload.success, true);
 assert.deepEqual(writes, []);
});
