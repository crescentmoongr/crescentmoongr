import { writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const required = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'DISCORD_WEBHOOK_URL',
  'TELEGRAM_BOT_TOKEN',
];

const missing = required.filter((name) => !String(process.env[name] || '').trim());
if (missing.length) {
  console.error(`[deploy] Missing Cloudflare Build secret(s): ${missing.join(', ')}`);
  console.error('[deploy] Add them under Worker > Settings > Build > Variables and Secrets, then redeploy.');
  process.exit(1);
}

const secrets = Object.fromEntries(required.map((name) => [name, String(process.env[name]).trim()]));
const tempFile = '.wrangler-runtime-secrets.json';

try {
  writeFileSync(tempFile, JSON.stringify(secrets), { mode: 0o600 });
  console.log('[deploy] Uploading Worker with runtime notification secrets...');
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['wrangler', 'deploy', '--secrets-file', tempFile],
    { stdio: 'inherit', env: process.env }
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  try { rmSync(tempFile, { force: true }); } catch {}
}
