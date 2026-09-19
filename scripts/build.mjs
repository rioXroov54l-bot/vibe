#!/usr/bin/env node
/**
 * scripts/build.mjs
 *
 * Bundles the Vibe single-page app into dist/index.html.
 *
 * Every source fragment is embedded inside ONE shared IIFE closure, so the
 * fragments can reference each other's bindings directly. Fragment order
 * matters:
 *
 *   app -> auth-spec -> auth-ui-secure -> render
 *
 * `public/auth-ui-secure.js` is injected immediately AFTER `auth-spec.js`
 * (so it can override `cloudRecoveryView`) and BEFORE the final render pass.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC = resolve(ROOT, 'public');
const DIST = resolve(ROOT, 'dist');

function read(name) {
  return readFileSync(resolve(PUBLIC, name), 'utf8');
}

function readOptional(name, fallback = '') {
  try {
    return read(name);
  } catch {
    return fallback;
  }
}

// --- Source fragments -------------------------------------------------
const styles = readOptional('styles.css');
const app = read('app.js');
const authSpec = read('auth-spec.js');
const authUiSecure = read('auth-ui-secure.js'); // secure auth UI overlay
const render = readOptional('render.js');

// --- Assemble the shared runtime closure ------------------------------
const script = [
  '(function () {',
  "'use strict';",
  '',
  app,
  '',
  authSpec,
  '',
  // Injected after auth-spec, before the final render pass.
  authUiSecure,
  '',
  render,
  '',
  '})();',
].join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Vibe</title>
<style>
${styles}
</style>
</head>
<body>
<div id="app"></div>
<script>
${script}
</script>
</body>
</html>
`;

mkdirSync(DIST, { recursive: true });
writeFileSync(resolve(DIST, 'index.html'), html, 'utf8');

console.log('build: wrote dist/index.html');
