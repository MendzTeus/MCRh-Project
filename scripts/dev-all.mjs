// Runs the API (with auto-restart) and the Vite dev server together, so the
// local site behaves like production: pages that read /api/* get real data.
//
// Usage: npm run dev:all
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

// Warn loudly about which database this session will write to. Saving in the
// local admin writes to whatever SUPABASE_URL points at — production included.
function supabaseHost() {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
  if (!existsSync('.env')) return null;
  const line = readFileSync('.env', 'utf8').split('\n').find((l) => l.startsWith('SUPABASE_URL='));
  return line ? line.slice('SUPABASE_URL='.length).replace(/^["']|["']$/g, '') : null;
}

const host = supabaseHost();
if (!host) {
  console.warn('\n[dev] SUPABASE_URL not set — the API will fail to start. Copy .env.example to .env first.\n');
} else {
  console.warn(`\n[dev] Database: ${host}`);
  console.warn('[dev] Admin saves made locally are written to THIS database. Use a test project, not production.\n');
}

const children = [
  spawn('node', ['--watch', 'server/index.js'], { stdio: 'inherit' }),
  spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], { stdio: 'inherit' }),
];

const stop = () => children.forEach((child) => child.kill('SIGTERM'));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
children.forEach((child) => child.on('exit', (code) => {
  if (code) console.error(`[dev] process exited with code ${code}`);
  stop();
}));
