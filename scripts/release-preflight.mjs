#!/usr/bin/env node
/*
 * scripts/release-preflight.mjs
 *
 * Dependency-free release preflight for the Vibe repository (Node ESM).
 *
 * What it validates (repository files only, never a live environment):
 *   1. .openai/hosting.json exists, is valid JSON and has a project_id that
 *      starts with "appgprj_" (OpenAI/ChatGPT Sites hosting manifest).
 *   2. dist/server/index.js and dist/.openai/hosting.json exist after build.
 *   3. The build output is not empty.
 *   4. package.json still exposes the build / test / test:cinema scripts.
 *   5. Runtime metadata in public/system-console-core.js and
 *      server/admin-console.mjs no longer contains "deepseek/system-control-center".
 *   6. No obvious literal secret values exist in public/, server/, scripts/.
 *   7. .github/workflows/release-bundle.yml keeps uploading dist/ with
 *      actions/upload-artifact@v4 AND sets include-hidden-files: true, because
 *      dist/.openai is a hidden directory that would otherwise be excluded
 *      from the release artifact.
 *
 * Guarantees:
 *   - Read-only. Never requests, reads, prints or stores a secret value.
 *   - No network access. No new dependencies.
 *   - Prints a per-check PASS/FAIL summary and exits 1 on any failure.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const checks = [];

function record(ok, label, detail) {
  checks.push({ ok: !!ok, label, detail: detail ? String(detail) : '' });
  return !!ok;
}

function rel(p) {
  return path.relative(ROOT, p) || p;
}

async function readText(p) {
  return fs.readFile(p, 'utf8');
}

async function statOf(p) {
  try {
    return await fs.stat(p);
  } catch (_e) {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * 1. OpenAI/ChatGPT Sites hosting manifest
 * ------------------------------------------------------------------ */

const HOSTING_MANIFEST = path.join(ROOT, '.openai', 'hosting.json');

async function checkHostingManifest() {
  const st = await statOf(HOSTING_MANIFEST);
  if (!st || !st.isFile()) {
    record(false, 'hosting manifest exists (.openai/hosting.json)', 'file not found');
    return;
  }
  record(true, 'hosting manifest exists (.openai/hosting.json)', rel(HOSTING_MANIFEST));

  let parsed = null;
  try {
    parsed = JSON.parse(await readText(HOSTING_MANIFEST));
  } catch (e) {
    record(false, 'hosting manifest is valid JSON', e && e.message ? e.message : 'parse error');
    return;
  }
  record(true, 'hosting manifest is valid JSON', 'parsed');

  const projectId = parsed && typeof parsed.project_id === 'string' ? parsed.project_id : '';
  if (!projectId) {
    record(false, 'hosting manifest carries a project_id', 'missing project_id');
    return;
  }
  record(
    projectId.startsWith('appgprj_'),
    'hosting project_id has the appgprj_ prefix',
    `prefix=${projectId.slice(0, 8)}… length=${projectId.length}`
  );
}

/* ------------------------------------------------------------------ *
 * 2 + 3. Build output
 * ------------------------------------------------------------------ */

const BUILT_WORKER = path.join(ROOT, 'dist', 'server', 'index.js');
const BUILT_MANIFEST = path.join(ROOT, 'dist', '.openai', 'hosting.json');
const MIN_BUILD_BYTES = 1024;

async function checkBuildOutput() {
  const worker = await statOf(BUILT_WORKER);
  if (!worker || !worker.isFile()) {
    record(false, 'built worker exists (dist/server/index.js)', 'run "npm run build" first');
  } else {
    record(true, 'built worker exists (dist/server/index.js)', `${worker.size} bytes`);
  }

  const manifest = await statOf(BUILT_MANIFEST);
  if (!manifest || !manifest.isFile()) {
    record(false, 'built hosting manifest exists (dist/.openai/hosting.json)', 'run "npm run build" first');
  } else {
    record(true, 'built hosting manifest exists (dist/.openai/hosting.json)', `${manifest.size} bytes`);
  }

  if (!worker || !worker.isFile()) {
    record(false, 'build output is not empty', 'no built worker to measure');
    return;
  }

  let source = '';
  try {
    source = await readText(BUILT_WORKER);
  } catch (e) {
    record(false, 'build output is readable text', e && e.message ? e.message : 'read error');
    return;
  }

  const nonWhitespace = source.replace(/\s+/g, '').length;
  record(
    worker.size >= MIN_BUILD_BYTES && nonWhitespace > 0,
    'build output is not empty',
    `${worker.size} bytes, ${nonWhitespace} non-whitespace chars`
  );
}

/* ------------------------------------------------------------------ *
 * 4. package.json scripts
 * ------------------------------------------------------------------ */

const REQUIRED_SCRIPTS = ['build', 'test', 'test:cinema'];

async function checkPackageScripts() {
  const pkgPath = path.join(ROOT, 'package.json');
  let pkg = null;
  try {
    pkg = JSON.parse(await readText(pkgPath));
  } catch (e) {
    record(false, 'package.json is valid JSON', e && e.message ? e.message : 'parse error');
    return;
  }
  record(true, 'package.json is valid JSON', 'parsed');

  const scripts = pkg && pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts : {};
  for (const name of REQUIRED_SCRIPTS) {
    record(typeof scripts[name] === 'string' && scripts[name].length > 0, `package.json script "${name}" present`, scripts[name] || 'missing');
  }
}

/* ------------------------------------------------------------------ *
 * 5. Runtime metadata points at the release branch (main)
 * ------------------------------------------------------------------ */

const FORBIDDEN_METADATA_BRANCH = 'deepseek/system-control-center';
const METADATA_FILES = [
  {
    path: 'public/system-console-core.js',
    declaration: /var\s+SYS_BRANCH\s*=\s*'([^']*)'/,
  },
  {
    path: 'server/admin-console.mjs',
    declaration: /const\s+AC_BRANCH\s*=\s*"([^"]*)"/,
  },
];

async function checkRuntimeMetadata() {
  for (const entry of METADATA_FILES) {
    const full = path.join(ROOT, entry.path);
    let source = '';
    try {
      source = await readText(full);
    } catch (_e) {
      record(false, `metadata file readable (${entry.path})`, 'file not found');
      continue;
    }

    record(
      !source.includes(FORBIDDEN_METADATA_BRANCH),
      `no merged-branch metadata string in ${entry.path}`,
      source.includes(FORBIDDEN_METADATA_BRANCH) ? `contains ${FORBIDDEN_METADATA_BRANCH}` : 'clean'
    );

    const match = source.match(entry.declaration);
    const value = match ? match[1] : '';
    record(value === 'main', `metadata branch is "main" in ${entry.path}`, value ? `value=${value}` : 'declaration not found');
  }
}

/* ------------------------------------------------------------------ *
 * 6. Obvious literal secret values (names are fine, values are not)
 * ------------------------------------------------------------------ */

const SCAN_ROOTS = ['public', 'server', 'scripts'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage']);
const SKIP_FILE_RE = /(^|[\\/])(fixtures?|__fixtures__|samples?|examples?|dummy|placeholder)([\\/]|\.)/i;
const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.avif', '.bmp', '.svgz',
  '.woff', '.woff2', '.ttf', '.otf', '.eot', '.pdf', '.zip', '.gz', '.mp3',
  '.mp4', '.webm', '.mov', '.wav', '.ogg', '.sqlite', '.wasm',
]);
const MAX_SCAN_BYTES = 2 * 1024 * 1024;

/*
 * Value-shaped patterns only. The variable/identifier names themselves are
 * allowed; a match requires a literal credential body after the prefix.
 */
const SECRET_PATTERNS = [
  {
    id: 'openai_style_key',
    re: /(?<![A-Za-z0-9_-])sk-(?!test|fake|dummy|example|placeholder|redacted)[A-Za-z0-9_-]{20,}/,
  },
  { id: 'supabase_secret_key', re: /(?<![A-Za-z0-9_-])sb_secret_[A-Za-z0-9_-]{16,}/ },
  { id: 'github_pat_classic', re: /(?<![A-Za-z0-9_-])ghp_[A-Za-z0-9]{30,}/ },
  { id: 'github_pat_fine_grained', re: /(?<![A-Za-z0-9_-])github_pat_[A-Za-z0-9_]{30,}/ },
];

async function listScannableFiles(dir) {
  const out = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (_e) {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...(await listScannableFiles(full)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (SKIP_FILE_RE.test(full)) continue;
    if (BINARY_EXT.has(path.extname(entry.name).toLowerCase())) continue;
    out.push(full);
  }
  return out;
}

async function checkLiteralSecrets() {
  const hits = [];
  let scanned = 0;

  for (const rootName of SCAN_ROOTS) {
    const files = await listScannableFiles(path.join(ROOT, rootName));
    for (const file of files) {
      const st = await statOf(file);
      if (!st || st.size === 0 || st.size > MAX_SCAN_BYTES) continue;
      let source = '';
      try {
        source = await readText(file);
      } catch (_e) {
        continue;
      }
      if (source.includes('\u0000')) continue;
      scanned += 1;
      for (const pattern of SECRET_PATTERNS) {
        const match = source.match(pattern.re);
        if (match) hits.push(`${rel(file)} :: ${pattern.id}`);
      }
    }
  }

  record(
    hits.length === 0,
    'no literal secret values in public/, server/, scripts/',
    hits.length ? `suspicious values (pattern id only): ${hits.join('; ')}` : `${scanned} files scanned, no value-shaped secrets found`
  );
}

/* ------------------------------------------------------------------ *
 * 7. Release bundle workflow must archive hidden files
 * ------------------------------------------------------------------ */

const RELEASE_WORKFLOW = path.join(ROOT, '.github', 'workflows', 'release-bundle.yml');

async function checkReleaseBundleWorkflow() {
  let source = '';
  try {
    source = await readText(RELEASE_WORKFLOW);
  } catch (_e) {
    record(false, 'release bundle workflow readable (.github/workflows/release-bundle.yml)', 'file not found');
    return;
  }
  record(true, 'release bundle workflow readable (.github/workflows/release-bundle.yml)', rel(RELEASE_WORKFLOW));

  const usesUploadArtifact = /uses:\s*actions\/upload-artifact@v4\b/.test(source);
  record(
    usesUploadArtifact,
    'release bundle uses actions/upload-artifact@v4',
    usesUploadArtifact ? 'found' : 'step not found'
  );
  if (!usesUploadArtifact) return;

  const uploadsDist = /^[ \t]*path:[ \t]*dist\/?[ \t]*$/m.test(source);
  record(uploadsDist, 'release bundle uploads path: dist/', uploadsDist ? 'path=dist/' : 'path: dist/ not found');

  /*
   * dist/.openai is a hidden directory. actions/upload-artifact@v4 excludes
   * hidden files unless include-hidden-files: true is set, which would drop
   * dist/.openai/hosting.json and dist/.openai/drizzle from the artifact.
   */
  const hiddenEnabled = /^[ \t]*include-hidden-files:[ \t]*true[ \t]*$/m.test(source);
  record(
    hiddenEnabled,
    'release bundle artifacts include hidden files (include-hidden-files: true)',
    hiddenEnabled ? 'dist/.openai is archived' : 'missing include-hidden-files: true — dist/.openai would be dropped from the artifact'
  );
}

/* ------------------------------------------------------------------ *
 * Runner
 * ------------------------------------------------------------------ */

async function main() {
  console.log('Vibe release preflight (read-only, no secrets requested)');
  console.log('');

  await checkHostingManifest();
  await checkBuildOutput();
  await checkPackageScripts();
  await checkRuntimeMetadata();
  await checkLiteralSecrets();
  await checkReleaseBundleWorkflow();

  let failed = 0;
  for (const check of checks) {
    if (!check.ok) failed += 1;
    console.log(`[${check.ok ? 'PASS' : 'FAIL'}] ${check.label}${check.detail ? ' — ' + check.detail : ''}`);
  }

  console.log('');
  console.log(`Summary: ${checks.length - failed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('RESULT: FAIL — release preflight blocked. Fix the FAIL items above and re-run "npm run preflight".');
    process.exit(1);
  }

  console.log('RESULT: PASS — release bundle may be produced and published manually through ChatGPT Sites/Work.');
}

await main();
