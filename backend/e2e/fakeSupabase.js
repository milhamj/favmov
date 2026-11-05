const http = require('node:http');
const { randomUUID } = require('node:crypto');

/**
 * In-memory stand-in for the Supabase HTTP API, so the e2e suites run the real server and the
 * real supabase-js client with no network or credentials.
 *
 * Models the unique indexes and the collection cascade, which the app relies on.
 * shortcut: Row Level Security and the two RPCs are guesses from how the code uses them, because
 * the live schema isn't in this repo. Replace with `supabase start` once it is checked in.
 */
const createFakeSupabase = () => {
  const tables = {};
  const tokens = new Map();
  const failures = [];
  let clock = Date.parse('2026-01-01T00:00:00Z');

  const rowsOf = (table) => (tables[table] ??= []);
  const nextTime = () => new Date((clock += 1000)).toISOString();
  const addUser = (token, user) => tokens.set(token, { aud: 'authenticated', created_at: '2025-01-15T00:00:00Z', ...user });

  const applyFilters = (rows, params) => rows.filter((row) => [...params].every(([key, value]) =>
    ['select', 'order', 'columns', 'limit'].includes(key) || String(row[key]) === value.replace(/^eq\./, '')));

  const isDuplicate = (table, row) => {
    const taken = (...keys) => rowsOf(table).some((item) => keys.every((key) => item[key] === row[key]));
    if (table.endsWith('movies_collections')) {
      return (row.movie_id != null && taken('collection_id', 'movie_id')) || (row.tv_show_id != null && taken('collection_id', 'tv_show_id'));
    }
    return (table.endsWith('movies') || table.endsWith('tv_shows')) && taken('id');
  };

  const embed = (row, select = '') => {
    const result = { ...row };
    for (const [, table] of select.matchAll(/(\w+)\(/g)) {
      const id = table.endsWith('tv_shows') ? row.tv_show_id : row.movie_id;
      result[table] = rowsOf(table).find((item) => item.id === id) ?? null;
    }
    return result;
  };

  const sortRows = (rows, order) => {
    if (!order) return rows;
    const [column, direction] = order.split('.');
    const sign = direction === 'desc' ? -1 : 1;
    return [...rows].sort((a, b) => sign * String(a[column]).localeCompare(String(b[column])));
  };

  const rpc = (name, { user_id_input: userId }) => {
    const prefix = name.split('_')[0];
    const links = rowsOf(`${prefix}_movies_collections`).filter((link) => link.user_id === userId);
    if (name.endsWith('collections_with_movie_count')) {
      return rowsOf(`${prefix}_collections`).filter((c) => c.user_id === userId).map((collection) => {
        const own = links.filter((link) => link.collection_id === collection.id);
        return { ...collection, movies_count: own.length, last_updated: own.at(-1)?.created_at ?? null };
      });
    }
    return [...links].reverse().map((link) => {
      const media = link.is_tv_show
        ? rowsOf(`${prefix}_tv_shows`).find((item) => item.id === link.tv_show_id)
        : rowsOf(`${prefix}_movies`).find((item) => item.id === link.movie_id);
      return { ...media, movie_id: link.movie_id, tv_show_id: link.tv_show_id, is_tv_show: link.is_tv_show, notes: link.notes, last_added_at: link.created_at };
    });
  };

  const handleAuth = (req, res, path, body, user) => {
    if (path === '/auth/v1/user') {
      return user ? res.json(200, user) : res.json(401, { code: 401, msg: 'invalid JWT' });
    }
    if (path === '/auth/v1/otp') return res.json(200, {});
    if (path === '/auth/v1/verify') {
      if (body.token !== '123456') return res.json(403, { code: 403, error_code: 'otp_expired', msg: 'Token has expired or is invalid' });
      const accessToken = `session-${randomUUID()}`;
      const sessionUser = { id: randomUUID(), email: body.email, aud: 'authenticated', created_at: '2025-01-15T00:00:00Z' };
      tokens.set(accessToken, sessionUser);
      return res.json(200, {
        access_token: accessToken, refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600, user: sessionUser,
      });
    }
    if (path === '/auth/v1/logout') return res.json(204);
    return res.json(404, { msg: `Fake Supabase has no ${path}` });
  };

  const handleRest = (req, res, table, params, body, user) => {
    const wantsObject = req.headers.accept === 'application/vnd.pgrst.object+json';
    const wantsRows = req.headers.prefer?.includes('return=representation');
    const send = (rows, status = 200) => {
      if (!wantsObject) return res.json(status, rows);
      if (rows.length === 1) return res.json(status, rows[0]);
      return res.json(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: null, hint: null });
    };

    if (req.method === 'GET') {
      const rows = sortRows(applyFilters(rowsOf(table), params), params.get('order')).slice(0, params.get('limit') ?? undefined);
      return send(rows.map((row) => embed(row, params.get('select'))));
    }
    if (req.method === 'POST') {
      const inserted = [body].flat().map((values) => {
        // The real tables fill these from column defaults; media tables key on the TMDB id
        const defaults = table.endsWith('movies') || table.endsWith('tv_shows')
          ? { uuid: randomUUID() }
          : { id: randomUUID(), user_id: user?.id, created_at: nextTime() };
        return { ...defaults, ...values };
      });
      if (inserted.some((row) => isDuplicate(table, row))) {
        return res.json(409, { code: '23505', message: 'duplicate key value violates unique constraint', details: null, hint: null });
      }
      rowsOf(table).push(...inserted);
      return wantsRows ? send(inserted, 201) : res.json(201);
    }
    const matched = applyFilters(rowsOf(table), params);
    if (req.method === 'PATCH') {
      matched.forEach((row) => Object.assign(row, body));
      return wantsRows ? send(matched) : res.json(204);
    }
    if (req.method === 'DELETE') {
      tables[table] = rowsOf(table).filter((row) => !matched.includes(row));
      if (/^(dev|prod)_collections$/.test(table)) {
        const links = `${table.split('_')[0]}_movies_collections`;
        tables[links] = rowsOf(links).filter((link) => !matched.some((collection) => collection.id === link.collection_id));
      }
      return res.json(204);
    }
    return res.json(405, { message: 'Method not allowed' });
  };

  const server = http.createServer(async (req, rawRes) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString();
    const body = text ? JSON.parse(text) : {};
    const url = new URL(req.url, 'http://fake');
    const user = tokens.get(req.headers.authorization?.replace('Bearer ', ''));
    const res = {
      json: (status, value) => {
        rawRes.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
        rawRes.end(value === undefined ? undefined : JSON.stringify(value));
      },
    };

    if (req.method === 'OPTIONS') {
      rawRes.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': req.headers['access-control-request-headers'] ?? '*',
        'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      });
      return rawRes.end();
    }
    if (url.pathname.startsWith('/auth/')) return handleAuth(req, res, url.pathname, body, user);

    const failure = failures.findIndex((f) => f.method === req.method && url.pathname.endsWith(f.target));
    if (failure !== -1) {
      failures.splice(failure, 1);
      return res.json(500, { message: 'database exploded', code: 'XX000', details: null, hint: null });
    }
    if (url.pathname.startsWith('/rest/v1/rpc/')) return res.json(200, rpc(url.pathname.split('/').pop(), body));
    return handleRest(req, res, url.pathname.split('/').pop(), url.searchParams, body, user);
  });

  return {
    tables,
    addUser,
    rowsOf,
    failNext: (method, target) => failures.push({ method, target }),
    reset: () => {
      Object.keys(tables).forEach((table) => delete tables[table]);
      failures.length = 0;
    },
    start: (port = 0) => new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`))),
    stop: () => new Promise((resolve) => {
      server.closeAllConnections();
      server.close(resolve);
    }),
  };
};

module.exports = { createFakeSupabase };
