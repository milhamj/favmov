// Serves the whole app for the browser tests: the real web export, page routes and API server,
// with Supabase faked over HTTP. TMDB is faked in the browser, see tests/tmdb.js.
const { execFileSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');
const backend = path.join(__dirname, '..', 'backend');
const express = require(path.join(backend, 'node_modules', 'express'));
const createPageRoutes = require(path.join(backend, 'routes', 'pageRoutes'));
const { createFakeSupabase } = require(path.join(backend, 'e2e', 'fakeSupabase'));
const { startServer } = require(path.join(backend, 'e2e', 'startServer'));

const SITE_PORT = 3190;
const API_PORT = 3191;
const SUPABASE_PORT = 3192;
// Outside the repo because res.sendFile refuses any path with a dot-directory, like ~/.t3 worktrees
const buildDir = path.join(os.tmpdir(), 'favmov-e2e-build');
const charCodes = (text) => JSON.stringify([...text].map((char) => char.charCodeAt(0)));

const main = async () => {
  const supabaseUrl = `http://127.0.0.1:${SUPABASE_PORT}`;

  // The app reads these at build time. process.env beats frontend/.env, so a real .env is left alone.
  execFileSync('npx', ['pnpm', 'exec', 'expo', 'export', '-p', 'web', '--clear', '--output-dir', buildDir], {
    cwd: path.join(__dirname, '..', 'frontend'),
    stdio: 'inherit',
    env: {
      ...process.env,
      FAVMOV_SUPABASE_URL: charCodes(supabaseUrl),
      FAVMOV_SUPABASE_ANON_KEY: charCodes('anon-key'),
      FAVMOV_TMDB_API_KEY: charCodes('tmdb-key'),
      FAVMOV_API_BASE_URL_PROD: `http://127.0.0.1:${API_PORT}/api`,
    },
  });

  await createFakeSupabase().start(SUPABASE_PORT);
  await startServer({ supabaseUrl, port: API_PORT });

  delete process.env.FAVMOV_TMDB_API_KEY; // no per-movie SEO lookups, those would reach the real TMDB
  const site = express();
  site.use(createPageRoutes(buildDir));
  site.listen(SITE_PORT, '127.0.0.1', () => console.log(`Site ready on ${SITE_PORT}`));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
