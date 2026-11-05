const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

const freePort = () => new Promise((resolve) => {
  const probe = net.createServer().listen(0, '127.0.0.1', () => {
    const { port } = probe.address();
    probe.close(() => resolve(port));
  });
});

// Runs the real server.js in its own process, exactly as `pnpm start` does
const startServer = async ({ supabaseUrl, nodeEnv = 'development', port }) => {
  port ??= await freePort();
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'ignore', 'pipe'],
    env: {
      ...process.env,
      FAVMOV_PORT: String(port),
      FAVMOV_NODE_ENV: nodeEnv,
      FAVMOV_SUPABASE_URL: supabaseUrl,
      FAVMOV_SUPABASE_ANON_KEY: 'anon-key',
      // Empty rather than unset, so a developer's backend/.env can't switch these on
      FAVMOV_SUPABASE_S_KEY: '',
      FAVMOV_TMDB_API_KEY: '',
    },
  });

  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });

  const url = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Server exited early: ${stderr}`);
    try {
      if ((await fetch(`${url}/api/health`)).ok) {
        return { url, stop: () => new Promise((resolve) => { child.once('exit', resolve); child.kill(); }) };
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  child.kill();
  throw new Error(`Server did not start: ${stderr}`);
};

module.exports = { startServer };
