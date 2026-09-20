/*
 * compliance.mjs — additive wrapper around cloudRoute.
 * Account deletion, self data export, reports privacy, DM blocking,
 * deterministic text filtering and upload signature validation.
 * Never returns or logs secrets, tokens or provider response bodies.
 */
const complianceBaseCloudRoute = cloudRoute;

const COMPLIANCE_EXPORT_LIMIT = 1000;
const COMPLIANCE_UPLOAD_MAX = 8 * 1024 * 1024;
const COMPLIANCE_JSON_MAX = 1024 * 1024;
const COMPLIANCE_TIMEOUT_MS = 15000;
const COMPLIANCE_DELETED_MARKER = 'deleted-account';

function complianceBase() {
  return String(SB_URL || '').replace(/\/+$/, '');
}

function complianceHeader(req, name) {
  try {
    if (req && req.headers) {
      if (typeof req.headers.get === 'function') return req.headers.get(name);
      const v = req.headers[name.toLowerCase()];
      if (v !== undefined) return v;
    }
  } catch (e) {}
  return null;
}

function complianceIsUuid(v) {
  if (typeof v !== 'string' || !v) return false;
  try { uuidPattern.lastIndex = 0; return uuidPattern.test(v); } catch (e) { return false; }
}

function complianceSameOrigin(req, url) {
  const o = complianceHeader(req, 'origin');
  try { return !!o && !!url && String(o) === String(url.origin); } catch (e) { return false; }
}

function complianceAction(url) {
  try {
    const p = String(url.pathname || '').replace(/\/+$/, '');
    const m = /\/api\/cloud\/([A-Za-z0-9_-]+)$/.exec(p);
    if (m) return m[1].toLowerCase();
    const q = url.searchParams ? url.searchParams.get('action') : null;
    if (q) return String(q).toLowerCase();
  } catch (e) {}
  return '';
}

/* ---------- identity ---------- */

async function complianceIdentity(req, env) {
  try {
    if (typeof cloudIdentity !== 'function') return null;
    const id = await cloudIdentity(req, env);
    return id || null;
  } catch (e) { return null; }
}

function complianceUid(identity) {
  if (!identity) return null;
  if (identity.user && identity.user.id) return String(identity.user.id);
  if (identity.id) return String(identity.id);
  if (identity.sub) return String(identity.sub);
  return null;
}

function complianceEmail(identity) {
  if (!identity) return null;
  if (identity.user && typeof identity.user.email === 'string') return identity.user.email;
  if (typeof identity.email === 'string') return identity.email;
  return null;
}

/* ---------- rate ---------- */

async function complianceGate(req, name, max) {
  let r;
  try { r = await cloudRate(req, name, max); } catch (e) { r = true; }
  if (r && typeof r === 'object' && typeof r.status === 'number') return r;
  if (r === false || r === null) return cloudResponse({ error: 'rate_limited' }, 429);
  return null;
}

/* ---------- safe fetches ---------- */

function complianceSvcHeaders(env, extra) {
  const key = (env && env.SUPABASE_SERVICE_ROLE_KEY) || '';
  return Object.assign({ apikey: key, Authorization: 'Bearer ' + key }, extra || {});
}

async function complianceServiceFetch(env, path, init) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => { try { ctrl.abort(); } catch (e) {} }, COMPLIANCE_TIMEOUT_MS);
  try {
    return await fetch(complianceBase() + path, Object.assign({}, init || {}, { signal: ctrl.signal }));
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function complianceUserFetch(token, path, init) {
  const headers = Object.assign({
    apikey: SB_KEY,
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
  }, (init && init.headers) || {});
  const ctrl = new AbortController();
  const timer = setTimeout(() => { try { ctrl.abort(); } catch (e) {} }, COMPLIANCE_TIMEOUT_MS);
  try {
    return await fetch(complianceBase() + path, Object.assign({}, init || {}, { headers, signal: ctrl.signal }));
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function complianceRows(res) {
  if (!res || !res.ok) return [];
  try { const j = await res.json(); return Array.isArray(j) ? j : []; } catch (e) { return []; }
}

async function complianceHasRow(env, token, path, service) {
  const res = service
    ? await complianceServiceFetch(env, path, { headers: complianceSvcHeaders(env) })
    : await complianceUserFetch(token, path);
  const rows = await complianceRows(res);
  return rows.length > 0;
}

async function complianceReadBody(req) {
  try {
    if (typeof readBody === 'function') {
      const b = await readBody(req);
      if (b && typeof b === 'object' && typeof b.status !== 'number') return b;
      if (b === null || b === undefined) return null;
    }
  } catch (e) {}
  try {
    const t = await req.text();
    return t ? JSON.parse(t) : null;
  } catch (e) { return null; }
}

/* ---------- A) compliance-status ---------- */

async function complianceStatus(req, env) {
  const id = await complianceIdentity(req, env);
  if (!complianceUid(id)) return cloudResponse({ error: 'unauthorized' }, 401);
  const configured = !!(env && env.SUPABASE_SERVICE_ROLE_KEY);
  const blocklist = !!(env && env.VIBE_MODERATION_BLOCKLIST && String(env.VIBE_MODERATION_BLOCKLIST).trim());
  return cloudResponse({
    account_deletion_configured: configured,
    reciprocal_block_enforcement_configured: configured,
    moderation_blocklist_configured: blocklist,
  }, 200);
}

/* ---------- B) data-export ---------- */

const complianceExportPlan = [
  ['vibe_profiles', 'id=eq.{uid}'],
  ['profiles', 'id=eq.{uid}&select=id,email,username,full_name,avatar_url,created_at,onboarding_step,onboarding_completed_at'],
  ['vibe_settings', 'user_id=eq.{uid}'],
  ['vibe_profile_details', 'user_id=eq.{uid}'],
  ['vibe_profile_photos', 'user_id=eq.{uid}'],
  ['vibe_profile_prompts', 'user_id=eq.{uid}'],
  ['user_interests', 'user_id=eq.{uid}'],
  ['message_reactions', 'user_id=eq.{uid}'],
  ['notifications', 'user_id=eq.{uid}&order=created_at.desc'],
  ['vibe_likes', 'user_id=eq.{uid}'],
  ['vibe_blocks', 'user_id=eq.{uid}'],
  ['vibe_members', 'user_id=eq.{uid}'],
  ['vibe_reports', 'reporter_id=eq.{uid}&order=created_at.desc'],
  ['messages', 'or=(sender_id.eq.{uid},receiver_id.eq.{uid})&order=created_at.desc'],
  ['vibe_rooms', 'owner_id=eq.{uid}'],
];

async function complianceExportOne(token, table, query) {
  const res = await complianceUserFetch(token, '/rest/v1/' + table + '?' + query + '&limit=' + COMPLIANCE_EXPORT_LIMIT);
  const rows = await complianceRows(res);
  return rows.slice(0, COMPLIANCE_EXPORT_LIMIT);
}

async function complianceDataExport(req, env) {
  const id = await complianceIdentity(req, env);
  const uid = complianceUid(id);
  if (!uid) return cloudResponse({ error: 'unauthorized' }, 401);
  const gate = await complianceGate(req, 'data-export', 3);
  if (gate) return gate;

  const token = id.token || null;
  if (!token) return cloudResponse({ error: 'unauthorized' }, 401);
  const out = {
    exported_at: new Date().toISOString(),
    format_version: '1',
    user: { id: uid, email: complianceEmail(id) },
  };
  for (const [table, template] of complianceExportPlan) {
    const query = template.replace(/\{uid\}/g, encodeURIComponent(uid));
    out[table] = await complianceExportOne(token, table, query);
  }
  return cloudResponse(out, 200);
}

/* ---------- C) account-delete ---------- */

function complianceStepOk(res) {
  if (!res) return false;
  if (res.ok) return true;
  if (res.status === 404 || res.status === 409) return true;
  return false;
}

async function complianceSvcDelete(env, table, query) {
  const res = await complianceServiceFetch(env, '/rest/v1/' + table + '?' + query, {
    method: 'DELETE',
    headers: complianceSvcHeaders(env, { Prefer: 'return=minimal' }),
  });
  return complianceStepOk(res);
}

async function complianceSvcPatch(env, table, query, payload) {
  const res = await complianceServiceFetch(env, '/rest/v1/' + table + '?' + query, {
    method: 'PATCH',
    headers: complianceSvcHeaders(env, { 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
    body: JSON.stringify(payload),
  });
  return complianceStepOk(res);
}

async function compliancePurgeStorage(env, uid) {
  const bucket = 'vibe-media';
  const prefix = String(uid).replace(/\/+$/, '');
  const rootDepth = prefix.split('/').length;
  const dirs = [prefix];
  const files = new Set();
  let guard = 0;
  while (dirs.length && guard < 10000) {
    guard += 1;
    const dir = dirs.shift();
    let offset = 0;
    while (true) {
      const res = await complianceServiceFetch(env, '/storage/v1/object/list/' + bucket, {
        method: 'POST',
        headers: complianceSvcHeaders(env, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ prefix: dir, limit: 100, offset, sortBy: { column: 'name', order: 'asc' } }),
      });
      if (!res || !res.ok) return false;
      let entries;
      try { entries = await res.json(); } catch (e) { return false; }
      if (!Array.isArray(entries) || entries.length === 0) break;
      for (const e of entries) {
        if (!e || typeof e.name !== 'string') continue;
        const full = dir + '/' + e.name;
        if (full !== prefix && full.indexOf(prefix + '/') !== 0) continue;
        if (e.id || e.metadata) {
          files.add(full);
        } else if (full.split('/').length <= rootDepth + 8) {
          dirs.push(full);
        }
      }
      if (entries.length < 100) break;
      offset += entries.length;
    }
  }
  const allFiles = [...files];
  for (let i = 0; i < allFiles.length; i += 100) {
    const batch = allFiles.slice(i, i + 100);
    const res = await complianceServiceFetch(env, '/storage/v1/object/' + bucket, {
      method: 'DELETE',
      headers: complianceSvcHeaders(env, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ prefixes: batch }),
    });
    if (!res || !res.ok) return false;
  }
  return true;
}

async function compliancePurgeRows(env, uid) {
  const u = encodeURIComponent(uid);
  const steps = [
    ['DELETE', 'notifications', 'or=(user_id.eq.' + u + ',actor_id.eq.' + u + ')'],
    ['DELETE', 'message_reactions', 'user_id=eq.' + u],
    ['DELETE', 'user_interests', 'user_id=eq.' + u],
    ['DELETE', 'vibe_profile_prompts', 'user_id=eq.' + u],
    ['DELETE', 'vibe_profile_photos', 'user_id=eq.' + u],
    ['DELETE', 'vibe_profile_details', 'user_id=eq.' + u],
    ['DELETE', 'vibe_settings', 'user_id=eq.' + u],
    ['DELETE', 'vibe_blocks', 'or=(user_id.eq.' + u + ',blocked_id.eq.' + u + ')'],
    ['DELETE', 'vibe_likes', 'user_id=eq.' + u],
    ['DELETE', 'vibe_members', 'user_id=eq.' + u],
    ['DELETE', 'vibe_reports', 'reporter_id=eq.' + u],
  ];
  for (const step of steps) {
    if (!(await complianceSvcDelete(env, step[1], step[2]))) return false;
  }
  const patched = await complianceSvcPatch(env, 'vibe_reports', 'target_id=eq.' + u, {
    target_id: COMPLIANCE_DELETED_MARKER,
    details: 'Retained safety record; identifying details removed.',
  });
  if (!patched) return false;
  const tail = [
    ['messages', 'or=(sender_id.eq.' + u + ',receiver_id.eq.' + u + ')'],
    ['vibe_rooms', 'owner_id=eq.' + u],
    ['vibe_profiles', 'id=eq.' + u],
    ['profiles', 'id=eq.' + u],
  ];
  for (const step of tail) {
    if (!(await complianceSvcDelete(env, step[0], step[1]))) return false;
  }
  return true;
}

async function complianceAccountDelete(req, env, url) {
  const id = await complianceIdentity(req, env);
  const uid = complianceUid(id);
  if (!uid) return cloudResponse({ error: 'unauthorized' }, 401);
  if (!complianceSameOrigin(req, url)) return cloudResponse({ error: 'forbidden' }, 403);
  const gate = await complianceGate(req, 'account-delete', 2);
  if (gate) return gate;

  const body = await complianceReadBody(req);
  const keys = body && typeof body === 'object' ? Object.keys(body) : [];
  if (!body || keys.length !== 1 || body.confirm !== 'DELETE') {
    return cloudResponse({ error: 'invalid_confirmation' }, 400);
  }
  if (!(env && env.SUPABASE_SERVICE_ROLE_KEY)) {
    return cloudResponse({ error: 'account_deletion_not_configured' }, 503);
  }

  try {
    if (!(await compliancePurgeRows(env, uid))) {
      return cloudResponse({ error: 'account_deletion_failed' }, 503);
    }
    if (!(await compliancePurgeStorage(env, uid))) {
      return cloudResponse({ error: 'account_deletion_failed' }, 503);
    }
    const res = await complianceServiceFetch(env, '/auth/v1/admin/users/' + encodeURIComponent(uid), {
      method: 'DELETE',
      headers: complianceSvcHeaders(env, { 'Content-Type': 'application/json' }),
    });
    if (!res || !res.ok) {
      return cloudResponse({ error: 'account_deletion_failed' }, 503);
    }
  } catch (e) {
    return cloudResponse({ error: 'account_deletion_failed' }, 503);
  }
  return cloudResponse({ ok: true, deleted: true }, 200, null, true);
}

/* ---------- D) reports ---------- */

const COMPLIANCE_TARGET_KINDS = ['user', 'message', 'room', 'content', 'support', 'appeal', 'copyright', 'privacy'];

function complianceStr(v, min, max) {
  if (typeof v !== 'string') return null;
  if (v.length < min || v.length > max) return null;
  return v;
}

async function complianceReports(req, env, url, method) {
  if (method !== 'GET' && method !== 'POST') return cloudResponse({ error: 'method_not_allowed' }, 405);
  const id = await complianceIdentity(req, env);
  const uid = complianceUid(id);
  if (!uid) return cloudResponse({ error: 'unauthorized' }, 401);
  const u = encodeURIComponent(uid);

  if (method === 'GET') {
    const token = id.token || null;
    if (!token) return cloudResponse({ error: 'unauthorized' }, 401);
    const rows = await complianceRows(await complianceUserFetch(
      token, '/rest/v1/vibe_reports?select=*&reporter_id=eq.' + u + '&order=created_at.desc&limit=100'
    ));
    return cloudResponse({ reports: rows.slice(0, 100) }, 200);
  }

  const gate = await complianceGate(req, 'reports', 15);
  if (gate) return gate;
  if (!complianceSameOrigin(req, url)) return cloudResponse({ error: 'forbidden' }, 403);

  const body = await complianceReadBody(req);
  if (!body || typeof body !== 'object') return cloudResponse({ error: 'invalid_body' }, 400);
  if (COMPLIANCE_TARGET_KINDS.indexOf(body.target_kind) === -1) return cloudResponse({ error: 'invalid_target_kind' }, 400);
  const reason = complianceStr(body.reason, 1, 120);
  if (!reason) return cloudResponse({ error: 'invalid_reason' }, 400);
  const selfKinds = ['support', 'appeal', 'copyright', 'privacy'];
  let targetId = complianceStr(body.target_id, 1, 128);
  if (selfKinds.indexOf(body.target_kind) !== -1) {
    targetId = 'self';
  } else if (!targetId) {
    return cloudResponse({ error: 'invalid_target_id' }, 400);
  }
  let details = null;
  if (body.details !== undefined && body.details !== null) {
    details = complianceStr(body.details, 0, 2000);
    if (details === null) return cloudResponse({ error: 'invalid_details' }, 400);
  }

  const token = id.token || null;
  if (!token) return cloudResponse({ error: 'unauthorized' }, 401);
  const res = await complianceUserFetch(token, '/rest/v1/vibe_reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({
      reporter_id: uid,
      target_kind: body.target_kind,
      target_id: targetId,
      reason: reason,
      details: details,
      status: 'received',
    }),
  });
  if (!res || !res.ok) return cloudResponse({ error: 'report_failed' }, 400);
  let created = null;
  try { const j = await res.json(); created = Array.isArray(j) ? (j[0] || null) : j; } catch (e) { created = null; }
  return cloudResponse({ report: created }, 201);
}

/* ---------- F) deterministic text filter ---------- */

function complianceBlocklist(env) {
  const raw = env && typeof env.VIBE_MODERATION_BLOCKLIST === 'string' ? env.VIBE_MODERATION_BLOCKLIST : '';
  if (!raw || !raw.trim()) return [];
  return raw.split(/[,\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => { try { return s.normalize('NFKC').toLowerCase(); } catch (e) { return s.toLowerCase(); } })
    .filter(Boolean);
}

function complianceNormalize(text) {
  try { return text.normalize('NFKC').toLowerCase(); } catch (e) { return text.toLowerCase(); }
}

function complianceFilterText(body, env) {
  const text = body && (typeof body.body === 'string' ? body.body : (typeof body.text === 'string' ? body.text : (typeof body.content === 'string' ? body.content : null)));
  if (typeof text !== 'string') return null;
  if (text.length > 2000) return cloudResponse({ error: 'invalid_content' }, 422);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) return cloudResponse({ error: 'invalid_content' }, 422);
  if ((text.match(/https?:\/\/[^\s<>"']+/gi) || []).length > 5) return cloudResponse({ error: 'invalid_content' }, 422);
  if (/([\s\S])\1{40,}/.test(text)) return cloudResponse({ error: 'invalid_content' }, 422);
  const terms = complianceBlocklist(env);
  if (terms.length) {
    const norm = complianceNormalize(text);
    for (const term of terms) {
      if (term && norm.indexOf(term) !== -1) return cloudResponse({ error: 'content_not_allowed' }, 422);
    }
  }
  return null;
}

/* ---------- E) direct-message blocking + filter ---------- */

async function complianceCloneJson(req, maxBytes) {
  let clone;
  try { clone = req.clone(); } catch (e) { return { ok: false }; }
  let text;
  try { text = await clone.text(); } catch (e) { return { ok: false }; }
  if (typeof text !== 'string' || !text) return { ok: false };
  if (maxBytes && text.length > maxBytes) return { ok: false, tooLarge: true };
  try { return { ok: true, body: JSON.parse(text) }; } catch (e) { return { ok: false }; }
}

async function complianceMessages(req, env, url) {
  const parsed = await complianceCloneJson(req, COMPLIANCE_JSON_MAX);
  if (!parsed.ok) return parsed.tooLarge ? cloudResponse({ error: 'invalid_content' }, 422) : undefined;
  const body = parsed.body;
  if (!body || typeof body !== 'object' || body.recipient_id === undefined || body.recipient_id === null) return undefined;

  const id = await complianceIdentity(req, env);
  const uid = complianceUid(id);
  if (!uid) return cloudResponse({ error: 'unauthorized' }, 401);

  const recipient = String(body.recipient_id);
  if (!complianceIsUuid(recipient) || recipient === uid) return cloudResponse({ error: 'invalid_recipient' }, 400);

  const u = encodeURIComponent(uid);
  const r = encodeURIComponent(recipient);
  const blocked = await complianceHasRow(
    env, id.token || null, '/rest/v1/vibe_blocks?select=user_id,blocked_id&user_id=eq.' + u + '&blocked_id=eq.' + r + '&limit=1', false
  );
  if (blocked) return cloudResponse({ error: 'interaction_blocked' }, 403);

  if (env && env.SUPABASE_SERVICE_ROLE_KEY) {
    const reciprocal = await complianceHasRow(
      env, null, '/rest/v1/vibe_blocks?select=user_id,blocked_id&user_id=eq.' + r + '&blocked_id=eq.' + u + '&limit=1', true
    );
    if (reciprocal) return cloudResponse({ error: 'interaction_blocked' }, 403);
  }

  const filterReject = complianceFilterText(body, env);
  if (filterReject) return filterReject;

  return complianceBaseCloudRoute(req, env, url);
}

/* ---------- G) upload signature validation ---------- */

const COMPLIANCE_MEDIA_TYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'video/webm', 'audio/webm',
  'audio/ogg', 'video/ogg', 'application/ogg',
  'audio/mpeg', 'audio/mp3',
  'video/mp4', 'audio/mp4',
];

function complianceSignatureOk(ct, b) {
  const at = (i) => (b.length > i ? b[i] : -1);
  if (ct === 'image/jpeg') return at(0) === 0xFF && at(1) === 0xD8 && at(2) === 0xFF;
  if (ct === 'image/png') return at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4E && at(3) === 0x47 && at(4) === 0x0D && at(5) === 0x0A && at(6) === 0x1A && at(7) === 0x0A;
  if (ct === 'image/webp') return at(0) === 0x52 && at(1) === 0x49 && at(2) === 0x46 && at(3) === 0x46 && at(8) === 0x57 && at(9) === 0x45 && at(10) === 0x42 && at(11) === 0x50;
  if (ct === 'video/webm' || ct === 'audio/webm') return at(0) === 0x1A && at(1) === 0x45 && at(2) === 0xDF && at(3) === 0xA3;
  if (ct === 'audio/ogg' || ct === 'video/ogg' || ct === 'application/ogg') return at(0) === 0x4F && at(1) === 0x67 && at(2) === 0x67 && at(3) === 0x53;
  if (ct === 'audio/mpeg' || ct === 'audio/mp3') {
    const id3 = at(0) === 0x49 && at(1) === 0x44 && at(2) === 0x33;
    const sync = at(0) === 0xFF && (at(1) === 0xFB || at(1) === 0xF3 || at(1) === 0xF2);
    return id3 || sync;
  }
  if (ct === 'video/mp4' || ct === 'audio/mp4') {
    return at(4) === 0x66 && at(5) === 0x74 && at(6) === 0x79 && at(7) === 0x70;
  }
  return false;
}

function complianceScope(req, url, bytes, ct) {
  let scope = null;
  try { scope = url && url.searchParams ? url.searchParams.get('scope') : null; } catch (e) { scope = null; }
  if (!scope && bytes.length <= 2 * 1024 * 1024 && (ct.indexOf('json') !== -1 || ct.indexOf('multipart') !== -1)) {
    let text = null;
    try { text = new TextDecoder('utf-8', { fatal: false }).decode(bytes); } catch (e) { text = null; }
    if (text) {
      const m1 = /name="scope"\s*\r?\n\r?\n\s*([A-Za-z]+)/.exec(text);
      const m2 = /"scope"\s*:\s*"([A-Za-z]+)"/.exec(text);
      scope = (m1 && m1[1]) || (m2 && m2[1]) || null;
    }
  }
  return scope ? String(scope).toLowerCase() : null;
}

async function complianceUpload(req, env, url) {
  let clone;
  try { clone = req.clone(); } catch (e) { return cloudResponse({ error: 'invalid_request' }, 400); }
  let buf;
  try { buf = await clone.arrayBuffer(); } catch (e) { return cloudResponse({ error: 'invalid_request' }, 400); }
  if (buf.byteLength > COMPLIANCE_UPLOAD_MAX) return cloudResponse({ error: 'payload_too_large' }, 413);

  const ct = String(complianceHeader(req, 'content-type') || '').split(';')[0].trim().toLowerCase();
  if (COMPLIANCE_MEDIA_TYPES.indexOf(ct) === -1) return cloudResponse({ error: 'invalid_media_signature' }, 415);

  const bytes = new Uint8Array(buf);
  const scope = complianceScope(req, url, bytes, ct);
  if (scope === 'profile' && ct.indexOf('image/') !== 0) return cloudResponse({ error: 'invalid_media_signature' }, 415);
  if (!complianceSignatureOk(ct, bytes)) return cloudResponse({ error: 'invalid_media_signature' }, 415);

  return complianceBaseCloudRoute(req, env, url);
}

/* ---------- dispatcher ---------- */

async function complianceIntercept(req, env, url) {
  const method = String((req && req.method) || 'GET').toUpperCase();
  const action = complianceAction(url);
  if (action === 'compliance-status' && method === 'GET') return complianceStatus(req, env);
  if (action === 'data-export' && method === 'GET') return complianceDataExport(req, env);
  if (action === 'account-delete' && method === 'POST') return complianceAccountDelete(req, env, url);
  if (action === 'reports') return complianceReports(req, env, url, method);
  if (action === 'messages' && method === 'POST') return complianceMessages(req, env, url);
  if (action === 'upload' && method === 'POST') return complianceUpload(req, env, url);
  return undefined;
}

cloudRoute = async function (req, env, url) {
  let out;
  try {
    out = await complianceIntercept(req, env, url);
  } catch (e) {
    return cloudResponse({ error: 'server_error' }, 500);
  }
  if (out !== undefined) return out;
  return complianceBaseCloudRoute(req, env, url);
};
