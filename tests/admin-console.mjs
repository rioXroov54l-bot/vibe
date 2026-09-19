import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const read = path => fs.readFile(path, 'utf8');

const [build, workerSource, backend, core, sectionsA, sectionsB, observability, css] = await Promise.all([
  read('scripts/build.mjs'),
  read('server/worker.mjs'),
  read('server/admin-console.mjs'),
  read('public/system-console-core.js'),
  read('public/system-console-sections-a.js'),
  read('public/system-console-sections-b.js'),
  read('public/system-console-observability.js'),
  read('public/system-console.css')
]);

for (const marker of [
  'public/system-console-core.js',
  'public/system-console-sections-a.js',
  'public/system-console-sections-b.js',
  'public/system-console-observability.js',
  'system-console.css',
  'server/admin-console.mjs'
]) assert.ok(build.includes(marker), `build missing ${marker}`);

assert.ok(!build.includes("fs.readFile('public/system-console.js'"), 'monolithic console must stay unused');
assert.ok(workerSource.includes('/api/admin-console'));
assert.ok(workerSource.indexOf('/api/admin-console') < workerSource.indexOf('/api/cloud/'));

for (const marker of [
  'VIBE_ADMIN_USER_IDS',
  'cloudIdentity',
  'admin_console_disabled',
  'admin_forbidden',
  'overview',
  'schema',
  'apis',
  'security',
  'architecture',
  'monitoring',
  'ai',
  'rooms',
  'storage'
]) assert.ok(backend.includes(marker), `backend missing ${marker}`);

assert.ok(/rate/i.test(backend), 'admin console must include rate limiting');
assert.ok(!backend.includes('SUPABASE_SERVICE_ROLE_KEY'));
assert.ok(!/\beval\s*\(/.test(backend));
assert.ok(!/\bnew\s+Function\s*\(/.test(backend));

const client = [core, sectionsA, sectionsB, observability].join('\n');
for (const marker of [
  '#system-console',
  'Overview',
  'Architecture',
  'Database',
  'Security',
  'Monitoring',
  'Logs',
  'AI',
  'System Control Center'
]) assert.ok(client.includes(marker), `console client missing ${marker}`);

assert.ok(client.includes('altKey') && client.includes('shiftKey'), 'hidden Alt+Shift entry missing');
assert.ok(!/\sstyle\s*=/i.test(client), 'console client must not use inline style attributes');
assert.ok(!/\sonclick\s*=/i.test(client), 'console client must not use inline onclick');
assert.ok(!/\sonsubmit\s*=/i.test(client), 'console client must not use inline onsubmit');
assert.ok(css.includes('.sys-shell') && css.includes('.sys-architecture'));

execFileSync(process.execPath, ['scripts/build.mjs'], { stdio: 'pipe' });
const { default: worker } = await import('../dist/server/index.js?admin-console-test=' + Date.now());

const disabled = await worker.fetch(
  new Request('https://vibe.example/api/admin-console/overview'),
  {}
);
assert.equal(disabled.status, 403);
const disabledBody = await disabled.json();
assert.equal(disabledBody.error, 'admin_console_disabled');

const post = await worker.fetch(
  new Request('https://vibe.example/api/admin-console/overview', { method: 'POST' }),
  {}
);
assert.notEqual(post.status, 200);

console.log('PASS: Vibe Engineering Console is bundled, CSP-safe, admin-gated, read-only, and protected by default.');
