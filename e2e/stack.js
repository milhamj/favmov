// Serves the whole app for the browser tests: the real web export, page routes and API server,
// with Supabase faked over HTTP. TMDB is faked in the browser, see tests/tmdb.js.
const { execFileSync } = require('node:child_process');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const backend = path.join(__dirname, '..', 'backend');
const frontend = path.join(__dirname, '..', 'frontend');
const express = require(path.join(backend, 'node_modules', 'express'));
const createPageRoutes = require(path.join(backend, 'routes', 'pageRoutes'));
const { createFakeSupabase } = require(path.join(backend, 'e2e', 'fakeSupabase'));
const { startServer } = require(path.join(backend, 'e2e', 'startServer'));

const SITE_PORT = 3190;
const API_PORT = 3191;
const SUPABASE_PORT = 3192;
// Outside the repo because res.sendFile refuses paths containing dot-directories.
const buildDir = path.join(os.tmpdir(), 'favmov-e2e-build');

const main = async () => {
  const supabaseUrl = `http://127.0.0.1:${SUPABASE_PORT}`;

  // Run the installed Expo CLI directly: `npx pnpm` downloaded whatever pnpm was latest on every run.
  const expoCli = require.resolve('expo/bin/cli', { paths: [frontend] });
  // The app reads these at build time. process.env beats frontend/.env, so a real .env is left alone.
  execFileSync(
    process.execPath,
    [expoCli, 'export', '-p', 'web', '--clear', '--output-dir', 'dist'],
    {
      cwd: frontend,
      stdio: 'inherit',
      env: {
        ...process.env,
        EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
        EXPO_PUBLIC_TMDB_TOKEN: 'tmdb-key',
        EXPO_PUBLIC_API_URL: `http://127.0.0.1:${API_PORT}/api`,
      },
    },
  );

  fs.rmSync(buildDir, { recursive: true, force: true });
  fs.cpSync(path.join(frontend, 'dist'), buildDir, { recursive: true });

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
