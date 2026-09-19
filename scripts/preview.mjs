// Local preview harness for the built Vibe Worker. Preview only: it never
// deploys, never edits the hosting project, and by default never calls the
// production Supabase project, so the published site is untouched.
//
// It executes the real server code (server/cinema.mjs, server/cloud.mjs,
// server/worker.mjs) through dist/server/index.js, exactly like the hosting
// platform does, and serves it on a local http port.
//
// Backends:
//   /api/cloud/*   offline by default (503 preview_offline, production Supabase
//                  is never contacted). PREVIEW_LIVE_BACKEND=1 forwards to the
//                  real Supabase project: that reads and writes real data.
//   /api/cinema    real routes against local in-memory SQLite (node:sqlite)
//                  created from drizzle/0000_blushing_lake.sql. Production D1
//                  is never contacted.
//   /api/support   disabled unless the documented OPENAI_*/SUPPORT_* variables
//                  are set, matching the production default.
//
// The Worker sends http->https redirects and enforces same-origin POSTs against
// its own origin. The harness presents every request to the Worker as
// https://<host>/... and rewrites the Origin header the same way, so those
// checks run exactly as in production while the browser still talks to
// http://127.0.0.1 (or the forwarded port) as usual.

import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';

const PORT = Number(process.env.PREVIEW_PORT || process.env.PORT || 8787);
const HOST = process.env.PREVIEW_HOST || '127.0.0.1';
const LIVE = process.env.PREVIEW_LIVE_BACKEND === '1';

const entry = new URL('../dist/server/index.js', import.meta.url);
if (!existsSync(entry)) {
  console.error('dist/server/index.js is missing. Run `npm run build` first, or use `npm run preview`.');
  process.exit(1);
}

const { default: worker } = await import(entry);

// Local D1 stand-in: same interface the Worker expects (prepare/bind/run/first)
// backed by an in-memory SQLite database seeded with the committed migration.
let DB = null;
try {
  const { DatabaseSync } = await import('node:sqlite');
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../drizzle/0000_blushing_lake.sql', import.meta.url), 'utf8'));
  DB = {
    prepare(sql) {
      const statement = () => sqlite.prepare(sql);
      return {
        async run(...args) {
          const result = statement().run(...args);
          return { meta: { changes: result.changes } };
        },
        async first(...args) {
          return statement().get(...args);
        },
        bind(...args) {
          return {
            async run() {
              const result = statement().run(...args);
              return { meta: { changes: result.changes } };
            },
            async first() {
              return statement().get(...args);
            },
          };
        },
      };
    },
  };
} catch (error) {
  console.warn(`! cinema routes disabled locally: node:sqlite unavailable (${error?.message}). Node 24 is required.`);
}

const env = { ...process.env, ...(DB ? { DB } : {}) };

const PREVIEW_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

function offlineCloudResponse(url, method) {
  if (url.pathname === '/api/cloud/auth/session' && method === 'GET') {
    return new Response(JSON.stringify({ user: null }), { status: 200, headers: PREVIEW_HEADERS });
  }
  return new Response(JSON.stringify({ error: 'preview_offline' }), { status: 503, headers: PREVIEW_HEADERS });
}

const server = http.createServer(async (request, response) => {
  try {
    const host = request.headers.host || `${HOST}:${PORT}`;
    const origin = `https://${host}`;
    const url = new URL(request.url || '/', origin);
    const method = request.method || 'GET';

    if (!LIVE && url.pathname.startsWith('/api/cloud/')) {
      const offline = offlineCloudResponse(url, method);
      response.writeHead(offline.status, PREVIEW_HEADERS);
      response.end(await offline.text());
      return;
    }

    let body;
    if (method !== 'GET' && method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      body = chunks.length ? Buffer.concat(chunks) : undefined;
    }

    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
      if (value === undefined) continue;
      if (['host', 'connection', 'content-length', 'origin', 'referer'].includes(name)) continue;
      headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
    // Same-origin POSTs carry an Origin header; the Worker compares it to its own
    // origin, which is https in production, so mirror that here.
    if (request.headers.origin) headers.set('Origin', origin);
    if (body) headers.set('Content-Length', String(body.length));

    const result = await worker.fetch(new Request(url, { method, headers, body }), env);

    response.statusCode = result.status;
    for (const [name, value] of result.headers) {
      if (name === 'set-cookie') continue;
      // The local preview is served over plain http, so skip the upgrade
      // directive that production sends over https. No other header changes.
      response.setHeader(name, name === 'content-security-policy' ? value.replace(' upgrade-insecure-requests;', '') : value);
    }
    const cookies = typeof result.headers.getSetCookie === 'function' ? result.headers.getSetCookie() : [];
    if (cookies.length) response.setHeader('set-cookie', cookies);

    const payload = Buffer.from(await result.arrayBuffer());
    response.end(method === 'HEAD' ? undefined : payload);
  } catch (error) {
    console.error('preview request failed', error?.message);
    if (!response.headersSent) response.writeHead(500, PREVIEW_HEADERS);
    response.end(JSON.stringify({ error: 'preview_harness_error' }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Vibe local preview      http://${HOST}:${PORT}/`);
  console.log(`cinema (/api/cinema)    ${DB ? 'local in-memory SQLite, real routes' : 'disabled on this Node version'}`);
  console.log(`accounts (/api/cloud)   ${LIVE ? 'LIVE production Supabase (real accounts and data)' : 'offline, production Supabase is not called'}`);
  console.log('Press Ctrl+C to stop. Nothing is deployed by this script.');
});
