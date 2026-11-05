const test = require('node:test');
const assert = require('node:assert');
const { successResponse, errorResponse } = require('./responses');
const { getTableName, MOVIES } = require('./tableNames');
const asyncHandler = require('./asyncHandler');

const fakeRes = () => ({
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const withEnv = (t, value) => {
  const previous = process.env.FAVMOV_NODE_ENV;
  process.env.FAVMOV_NODE_ENV = value;
  t.after(() => { process.env.FAVMOV_NODE_ENV = previous; });
};

test('success responses wrap the data', () => {
  const res = successResponse(fakeRes(), { id: 1 }, 'Done', 201);
  assert.strictEqual(res.statusCode, 201);
  assert.deepStrictEqual(res.body, { success: true, message: 'Done', debugMessage: undefined, data: { id: 1 } });
});

test('error responses default to a 500', () => {
  const res = errorResponse(fakeRes());
  assert.strictEqual(res.statusCode, 500);
  assert.strictEqual(res.body.message, 'Server Error');
});

test('debug messages only reach clients in development', (t) => {
  withEnv(t, 'development');
  assert.strictEqual(errorResponse(fakeRes(), 'x', 500, 'cause').body.debugMessage, 'cause');
  process.env.FAVMOV_NODE_ENV = 'production';
  assert.strictEqual(errorResponse(fakeRes(), 'x', 500, 'cause').body.debugMessage, undefined);
});

test('table names follow the environment', (t) => {
  withEnv(t, 'development');
  assert.deepStrictEqual(getTableName(MOVIES), { tableName: 'dev_movies', error: null });
  process.env.FAVMOV_NODE_ENV = 'production';
  assert.deepStrictEqual(getTableName(MOVIES), { tableName: 'prod_movies', error: null });
  process.env.FAVMOV_NODE_ENV = 'staging';
  assert.strictEqual(getTableName(MOVIES).tableName, null);
  assert.match(getTableName(MOVIES).error, /Invalid environment: staging/);
});

test('asyncHandler passes rejections to next', async () => {
  const failure = new Error('boom');
  const received = await new Promise((resolve) => asyncHandler(async () => { throw failure; })({}, {}, resolve));
  assert.strictEqual(received, failure);
});
