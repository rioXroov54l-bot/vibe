/* server/admin-console.mjs
 * Read-only Vibe engineering console backend.
 *
 * Merge order: after server/cloud.mjs and server/spotify.mjs, before server/worker.mjs,
 * inside the same shared scope. Provides adminConsoleRoute(request, env, url) which the
 * worker dispatches for every path under /api/admin-console/*.
 *
 * Assumed in scope (NOT imported):
 *   cloudIdentity(req)                     -> { user: { id, ... }, token } | null
 *   cloudCookies(req)                      -> cookie accessor (never surfaced by this module)
 *   sbFetch(path, token, method, data, extra) -> Supabase REST fetch helper
 *   common                                 -> shared helpers / header bag
 *
 * Guarantees:
 *   - Read-only. No mutating actions. No eval / new Function. No module exports.
 *   - Access gated by VIBE_ADMIN_USER_IDS allowlist (comma-separated UUIDs).
 *   - GET only (405 otherwise). Bounded in-memory rate limit.
 *   - Never returns email / JWT / cookies / row contents / secret values / full user ids.
 *   - Every JSON response carries generated_at + duration_ms.
 */

"use strict";

const AC_BASE = "/api/admin-console";
const AC_RATE_LIMIT = 60;
const AC_RATE_WINDOW_MS = 60 * 1000;
const AC_RATE_MAX_KEYS = 500;
const AC_EVENTS_MAX = 30;

const AC_REPO = "rioXroov54l-bot/vibe";
const AC_BRANCH = "deepseek/system-control-center";
const AC_HOSTING = "OpenAI/ChatGPT Sites";

/* ------------------------------------------------------------------ *
 * Response + runtime primitives
 * ------------------------------------------------------------------ */

function acHeaders(extra) {
  const out = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
  try {
    if (common && common.headers && typeof common.headers === "object") {
      const h = common.headers;
      for (const k of Object.keys(h)) out[k] = h[k];
    }
  } catch (_e) {
    /* header bag optional */
  }
  if (extra && typeof extra === "object") {
    for (const k of Object.keys(extra)) out[k] = extra[k];
  }
  return out;
}

function acJson(body, status, start, extraHeaders) {
  const t0 = typeof start === "number" ? start : Date.now();
  const payload = Object.assign({}, body && typeof body === "object" ? body : {});
  payload.generated_at = new Date().toISOString();
  payload.duration_ms = Math.max(0, Date.now() - t0);
  return new Response(JSON.stringify(payload), {
    status: status || 200,
    headers: acHeaders(extraHeaders),
  });
}

/* Bounded in-memory rate limit keyed by admin id (never logged / never returned). */
const AC_RATE = new Map();

function acRateAllowed(adminId) {
  const now = Date.now();
  if (AC_RATE.size > AC_RATE_MAX_KEYS) AC_RATE.clear();
  const existing = AC_RATE.get(adminId);
  if (!existing || now - existing.windowStart >= AC_RATE_WINDOW_MS) {
    AC_RATE.set(adminId, { windowStart: now, count: 1 });
    return true;
  }
  existing.count += 1;
  return existing.count <= AC_RATE_LIMIT;
}

/* Safe event ring: only {time, endpoint, duration_ms, status}. No identifiers. */
const AC_EVENTS = [];

function acRecordEvent(endpoint, durationMs, status) {
  AC_EVENTS.push({
    time: new Date().toISOString(),
    endpoint: endpoint,
    duration_ms: Math.max(0, durationMs | 0),
    status: status | 0,
  });
  while (AC_EVENTS.length > AC_EVENTS_MAX) AC_EVENTS.shift();
}

const AC_COUNTER = {
  total_requests: 0,
  total_duration_ms: 0,
  endpoint_counts: {},
};

/* ------------------------------------------------------------------ *
 * Access gate
 * ------------------------------------------------------------------ */

function acAdminAllowlist(env) {
  const raw = env && env.VIBE_ADMIN_USER_IDS ? String(env.VIBE_ADMIN_USER_IDS) : "";
  return raw
    .split(",")
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
}

async function acAuthGate(request, env) {
  const allowlist = acAdminAllowlist(env);
  if (allowlist.length === 0) {
    return { ok: false, status: 403, error: "admin_console_disabled" };
  }

  let identity = null;
  try {
    identity = await cloudIdentity(request);
  } catch (_e) {
    identity = null;
  }

  const userId =
    identity && identity.user && identity.user.id ? String(identity.user.id) : null;
  if (!userId) {
    return { ok: false, status: 403, error: "admin_forbidden" };
  }

  let allowed = false;
  for (let i = 0; i < allowlist.length; i++) {
    if (allowlist[i].toLowerCase() === userId.toLowerCase()) { allowed = true; break; }
  }
  if (!allowed) {
    return { ok: false, status: 403, error: "admin_forbidden" };
  }

  return { ok: true, identity: identity, userId: userId };
}

function acEnvFlags(env) {
  const e = env || {};
  return {
    spotify_configured: !!(e.SPOTIFY_CLIENT_ID && e.SPOTIFY_CLIENT_SECRET),
    support_configured: !!(
      e.SUPPORT_EMAIL || e.SUPPORT_TO || e.SUPPORT_CONTACT ||
      e.SUPPORT_WEBHOOK || e.SUPPORT_ENDPOINT
    ),
    admin_console_configured: acAdminAllowlist(e).length > 0,
  };
}

/* ------------------------------------------------------------------ *
 * Real table registry (no pg_catalog)
 * ------------------------------------------------------------------ */

const AC_TABLES = [
  {
    name: "vibe_profiles",
    domain: "core",
    rls: true,
    primary_key: ["id"],
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "display_name", type: "text" },
      { name: "bio", type: "text" },
      { name: "data", type: "jsonb" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "vibe_settings",
    domain: "settings",
    rls: true,
    primary_key: ["user_id"],
    columns: [
      { name: "user_id", type: "uuid", key: "pk", references: "vibe_profiles.id" },
      { name: "data", type: "jsonb" },
      { name: "theme", type: "text" },
      { name: "smart_photos_enabled", type: "boolean" },
      { name: "hide_age", type: "boolean" },
      { name: "hide_distance", type: "boolean" },
    ],
  },
  {
    name: "vibe_blocks",
    domain: "safety",
    rls: true,
    primary_key: ["user_id", "blocked_id"],
    columns: [
      { name: "user_id", type: "uuid", key: "pk", references: "vibe_profiles.id" },
      { name: "blocked_id", type: "uuid", key: "pk", references: "vibe_profiles.id" },
    ],
  },
  {
    name: "vibe_rooms",
    domain: "rooms",
    rls: true,
    primary_key: ["id"],
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "owner_id", type: "uuid", references: "vibe_profiles.id" },
      { name: "title", type: "text" },
      { name: "category", type: "integer" },
      { name: "kind", type: "text" },
      { name: "created_at", type: "timestamptz" },
      { name: "legacy_id", type: "integer" },
      { name: "legacy_snapshot", type: "jsonb" },
    ],
  },
  {
    name: "vibe_members",
    domain: "rooms",
    rls: true,
    primary_key: ["room_id", "user_id"],
    columns: [
      { name: "room_id", type: "uuid", key: "pk", references: "vibe_rooms.id" },
      { name: "user_id", type: "uuid", key: "pk", references: "vibe_profiles.id" },
      { name: "joined_at", type: "timestamptz" },
    ],
  },
  {
    name: "messages",
    domain: "chat",
    rls: true,
    primary_key: ["id"],
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "sender_id", type: "uuid", references: ["vibe_profiles.id", "profiles.id"] },
      { name: "room_id", type: "uuid", nullable: true, references: "vibe_rooms.id" },
      { name: "receiver_id", type: "uuid", nullable: true, references: ["vibe_profiles.id", "profiles.id"] },
      { name: "kind", type: "text" },
      { name: "content", type: "text" },
      { name: "object_path", type: "text" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "vibe_likes",
    domain: "rooms",
    rls: true,
    primary_key: ["user_id", "room_id"],
    columns: [
      { name: "user_id", type: "uuid", key: "pk", references: "vibe_profiles.id" },
      { name: "room_id", type: "uuid", key: "pk", references: "vibe_rooms.id" },
    ],
  },
  {
    name: "vibe_reports",
    domain: "safety",
    rls: true,
    primary_key: ["id"],
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "reporter_id", type: "uuid", references: "vibe_profiles.id" },
      { name: "target_kind", type: "text" },
      { name: "target_id", type: "text" },
      { name: "reason", type: "text" },
      { name: "details", type: "text" },
      { name: "status", type: "text" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "profiles",
    domain: "profile",
    rls: true,
    primary_key: ["id"],
    /* email column is part of the schema but its VALUES are never returned. */
    columns: [
      { name: "id", type: "uuid", key: "pk", references: "auth.users.id" },
      { name: "email", type: "text", pii: true, exposed_values: false },
      { name: "username", type: "text" },
      { name: "full_name", type: "text" },
      { name: "avatar_url", type: "text" },
      { name: "created_at", type: "timestamptz" },
      { name: "onboarding_step", type: "smallint" },
      { name: "onboarding_completed_at", type: "timestamptz" },
    ],
  },
  {
    name: "notifications",
    domain: "notifications",
    rls: true,
    primary_key: ["id"],
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "user_id", type: "uuid", references: "profiles.id" },
      { name: "actor_id", type: "uuid", references: "profiles.id" },
      { name: "message_id", type: "uuid", references: "messages.id" },
      { name: "created_at", type: "timestamptz" },
      { name: "read_at", type: "timestamptz" },
    ],
  },
  {
    name: "user_interests",
    domain: "profile",
    rls: true,
    primary_key: ["user_id", "category", "value"],
    columns: [
      { name: "user_id", type: "uuid", key: "pk", references: "profiles.id" },
      { name: "category", type: "text", key: "pk" },
      { name: "value", type: "smallint", key: "pk" },
    ],
  },
  {
    name: "message_reactions",
    domain: "chat",
    rls: true,
    primary_key: ["message_id", "user_id"],
    columns: [
      { name: "message_id", type: "uuid", key: "pk", references: "messages.id" },
      { name: "user_id", type: "uuid", key: "pk", references: "profiles.id" },
      { name: "emoji", type: "text" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "vibe_profile_details",
    domain: "profile",
    rls: true,
    primary_key: ["user_id"],
    columns: [
      { name: "user_id", type: "uuid", key: "pk", references: "profiles.id" },
      { name: "living_in", type: "text" },
      { name: "height_cm", type: "smallint" },
      { name: "job", type: "text" },
      { name: "education", type: "text" },
      { name: "basics", type: "jsonb" },
      { name: "lifestyle", type: "jsonb" },
    ],
  },
  {
    name: "vibe_profile_photos",
    domain: "profile",
    rls: true,
    primary_key: ["user_id", "slot"],
    columns: [
      { name: "user_id", type: "uuid", key: "pk", references: "profiles.id" },
      { name: "slot", type: "smallint", key: "pk" },
      { name: "object_path", type: "text" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "vibe_profile_prompts",
    domain: "profile",
    rls: true,
    primary_key: ["user_id", "slot"],
    columns: [
      { name: "user_id", type: "uuid", key: "pk", references: "profiles.id" },
      { name: "slot", type: "smallint", key: "pk" },
      { name: "question", type: "text" },
      { name: "answer", type: "text" },
    ],
  },
];

function acRelation(sourceTable, sourceColumn, targetTable, targetColumn) {
  return {
    source_table: sourceTable,
    source_column: sourceColumn,
    target_table: targetTable,
    target_column: targetColumn,
  };
}

const AC_RELATIONS = [
  acRelation("vibe_settings", "user_id", "vibe_profiles", "id"),
  acRelation("vibe_blocks", "user_id", "vibe_profiles", "id"),
  acRelation("vibe_blocks", "blocked_id", "vibe_profiles", "id"),
  acRelation("vibe_rooms", "owner_id", "vibe_profiles", "id"),
  acRelation("vibe_members", "room_id", "vibe_rooms", "id"),
  acRelation("vibe_members", "user_id", "vibe_profiles", "id"),
  acRelation("messages", "sender_id", "vibe_profiles", "id"),
  acRelation("messages", "sender_id", "profiles", "id"),
  acRelation("messages", "room_id", "vibe_rooms", "id"),
  acRelation("messages", "receiver_id", "vibe_profiles", "id"),
  acRelation("messages", "receiver_id", "profiles", "id"),
  acRelation("vibe_likes", "user_id", "vibe_profiles", "id"),
  acRelation("vibe_likes", "room_id", "vibe_rooms", "id"),
  acRelation("vibe_reports", "reporter_id", "vibe_profiles", "id"),
  acRelation("profiles", "id", "auth.users", "id"),
  acRelation("notifications", "user_id", "profiles", "id"),
  acRelation("notifications", "actor_id", "profiles", "id"),
  acRelation("notifications", "message_id", "messages", "id"),
  acRelation("user_interests", "user_id", "profiles", "id"),
  acRelation("message_reactions", "message_id", "messages", "id"),
  acRelation("message_reactions", "user_id", "profiles", "id"),
  acRelation("vibe_profile_details", "user_id", "profiles", "id"),
  acRelation("vibe_profile_photos", "user_id", "profiles", "id"),
  acRelation("vibe_profile_prompts", "user_id", "profiles", "id"),
];

function acTableNames() {
  return AC_TABLES.map(function (t) { return t.name; });
}

function acIsAllowlistedTable(name) {
  for (let i = 0; i < AC_TABLES.length; i++) {
    if (AC_TABLES[i].name === name) return true;
  }
  return false;
}

function acDomains() {
  const map = {};
  for (let i = 0; i < AC_TABLES.length; i++) {
    const t = AC_TABLES[i];
    if (!map[t.domain]) map[t.domain] = { domain: t.domain, tables: [], rls: true };
    map[t.domain].tables.push(t.name);
    if (!t.rls) map[t.domain].rls = false;
  }
  return Object.keys(map).sort().map(function (k) { return map[k]; });
}

/* ------------------------------------------------------------------ *
 * API registry
 * ------------------------------------------------------------------ */

function acApi(method, path, auth, domain, risk, notes) {
  return { method: method, path: path, auth: auth, domain: domain, risk: risk, notes: notes || "" };
}

const AC_APIS = [
  /* Cloud: auth */
  acApi("POST", "/api/cloud/auth/verify", "public", "auth", "write", "verify token and establish session"),
  acApi("POST", "/api/cloud/auth/otp", "public", "auth", "write", "request one-time passcode"),
  acApi("POST", "/api/cloud/auth/resend", "public", "auth", "write", "resend one-time passcode"),
  acApi("POST", "/api/cloud/auth/recover", "public", "auth", "write", "legacy recovery flow"),
  acApi("POST", "/api/cloud/auth/signup", "public", "auth", "write", "create account"),
  acApi("GET", "/api/cloud/auth/callback", "public", "auth", "read", "email/oauth callback"),
  acApi("POST", "/api/cloud/auth/callback", "public", "auth", "write", "email/oauth callback"),
  acApi("GET", "/api/cloud/auth/session", "user", "auth", "read", "current session"),
  acApi("POST", "/api/cloud/auth/logout", "user", "auth", "write", "clear session cookies"),
  acApi("POST", "/api/cloud/auth/password", "user", "auth", "write", "change password"),
  /* Cloud: profile */
  acApi("GET", "/api/cloud/profile", "user", "profile", "read", "own profile"),
  acApi("PATCH", "/api/cloud/profile", "user", "profile", "write", "update own profile"),
  acApi("GET", "/api/cloud/people", "user", "profile", "sensitive-read", "discovery feed, no email exposure"),
  /* Cloud: settings */
  acApi("GET", "/api/cloud/settings", "user", "settings", "read", "own settings"),
  acApi("POST", "/api/cloud/settings", "user", "settings", "write", "update own settings"),
  /* Cloud: onboarding */
  acApi("GET", "/api/cloud/onboarding", "user", "profile", "read", "onboarding state"),
  acApi("POST", "/api/cloud/onboarding", "user", "profile", "write", "advance onboarding"),
  /* Cloud: profile details */
  acApi("GET", "/api/cloud/profile-details", "user", "profile", "read", "profile details"),
  acApi("POST", "/api/cloud/profile-details", "user", "profile", "write", "update profile details"),
  /* Cloud: profile prompts */
  acApi("GET", "/api/cloud/profile-prompts", "user", "profile", "read", "profile prompts"),
  acApi("POST", "/api/cloud/profile-prompts", "user", "profile", "write", "update profile prompts"),
  /* Cloud: profile photo */
  acApi("GET", "/api/cloud/profile-photo", "user", "profile", "read", "list own photo slots"),
  acApi("POST", "/api/cloud/profile-photo", "user", "profile", "write", "upload/replace photo"),
  acApi("DELETE", "/api/cloud/profile-photo", "user", "profile", "write", "remove photo"),
  /* Cloud: rooms */
  acApi("GET", "/api/cloud/rooms", "user", "rooms", "read", "list rooms"),
  acApi("POST", "/api/cloud/rooms", "user", "rooms", "write", "create room"),
  acApi("DELETE", "/api/cloud/rooms", "user", "rooms", "write", "delete own room"),
  /* Cloud: membership */
  acApi("GET", "/api/cloud/membership", "user", "rooms", "read", "room membership"),
  acApi("POST", "/api/cloud/membership", "user", "rooms", "write", "join room"),
  acApi("DELETE", "/api/cloud/membership", "user", "rooms", "write", "leave room"),
  /* Cloud: messages */
  acApi("GET", "/api/cloud/messages", "user", "chat", "sensitive-read", "message history, RLS scoped"),
  acApi("POST", "/api/cloud/messages", "user", "chat", "write", "send message"),
  acApi("GET", "/api/cloud/inbox", "user", "chat", "read", "conversation inbox"),
  /* Cloud: notifications */
  acApi("GET", "/api/cloud/notifications", "user", "notifications", "read", "list notifications"),
  acApi("PATCH", "/api/cloud/notifications", "user", "notifications", "write", "mark read"),
  /* Cloud: reaction */
  acApi("POST", "/api/cloud/reaction", "user", "chat", "write", "add reaction"),
  acApi("DELETE", "/api/cloud/reaction", "user", "chat", "write", "remove reaction"),
  /* Cloud: likes */
  acApi("GET", "/api/cloud/likes", "user", "rooms", "read", "list likes"),
  acApi("POST", "/api/cloud/likes", "user", "rooms", "write", "add like"),
  acApi("DELETE", "/api/cloud/likes", "user", "rooms", "write", "remove like"),
  /* Cloud: blocks */
  acApi("GET", "/api/cloud/blocks", "user", "safety", "read", "list blocks"),
  acApi("POST", "/api/cloud/blocks", "user", "safety", "write", "block user"),
  acApi("DELETE", "/api/cloud/blocks", "user", "safety", "write", "unblock user"),
  /* Cloud: reports */
  acApi("GET", "/api/cloud/reports", "user", "safety", "sensitive-read", "own reports"),
  acApi("POST", "/api/cloud/reports", "user", "safety", "write", "file report"),
  /* Cloud: media */
  acApi("POST", "/api/cloud/upload", "user", "media", "write", "upload object"),
  acApi("GET", "/api/cloud/file", "user", "media", "read", "signed object access"),
  /* Spotify */
  acApi("GET", "/api/cloud/spotify/status", "user", "spotify", "read", "connection status"),
  acApi("GET", "/api/cloud/spotify/connect", "user", "spotify", "write", "start oauth"),
  acApi("GET", "/api/cloud/spotify/callback", "public", "spotify", "write", "oauth callback"),
  acApi("GET", "/api/cloud/spotify/top", "user", "spotify", "sensitive-read", "top tracks/artists"),
  acApi("POST", "/api/cloud/spotify/disconnect", "user", "spotify", "write", "revoke connection"),
  /* Other */
  acApi("GET", "/api/video-preview", "public", "media", "read", "video preview metadata"),
  acApi("GET", "/api/support/status", "public", "support", "read", "support availability"),
  acApi("POST", "/api/support", "user", "support", "write", "submit support request"),
  /* Cinema subsystem */
  acApi("GET", "/api/cloud/cinema", "user", "cinema", "read", "cinema listings"),
  acApi("POST", "/api/cloud/cinema", "user", "cinema", "write", "create cinema entry"),
  acApi("PATCH", "/api/cloud/cinema", "user", "cinema", "write", "update cinema entry"),
  acApi("DELETE", "/api/cloud/cinema", "user", "cinema", "write", "delete cinema entry"),
  /* Admin console (read-only) */
  acApi("GET", "/api/admin-console/*", "admin", "observability", "sensitive-read", "read-only console endpoints"),
];

function acApiGroups() {
  const by_domain = {};
  const by_auth = {};
  const by_method = {};
  for (let i = 0; i < AC_APIS.length; i++) {
    const a = AC_APIS[i];
    by_domain[a.domain] = (by_domain[a.domain] || 0) + 1;
    by_auth[a.auth] = (by_auth[a.auth] || 0) + 1;
    by_method[a.method] = (by_method[a.method] || 0) + 1;
  }
  return { by_domain: by_domain, by_auth: by_auth, by_method: by_method };
}

/* ------------------------------------------------------------------ *
 * Architecture registry
 * ------------------------------------------------------------------ */

function acNode(id, label, group, status, detail) {
  return { id: id, label: label, group: group, status: status, detail: detail };
}

const AC_NODES = [
  acNode("client", "Web Client", "frontend", "active", "browser app talking to the worker"),
  acNode("worker", "Worker (Fetch API)", "edge", "active", "request router and edge entrypoint"),
  acNode("admin_console", "Admin Console", "edge", "active", "read-only engineering console backend"),
  acNode("supabase_auth", "Supabase Auth", "backend", "configured", "identity and session issuance"),
  acNode("postgrest", "PostgREST", "backend", "configured", "SQL data API over Supabase"),
  acNode("realtime", "Realtime", "backend", "unknown", "realtime channel capability"),
  acNode("storage", "Storage", "backend", "configured", "object storage for media"),
  acNode("profiles", "Profile Domain", "domain", "configured", "profile, details, photos, prompts, interests"),
  acNode("chat", "Chat Domain", "domain", "configured", "messages, reactions, notifications"),
  acNode("rooms", "Rooms Domain", "domain", "configured", "rooms, members, likes"),
  acNode("notifications", "Notifications", "domain", "configured", "notification delivery records"),
  acNode("spotify", "Spotify", "external", "configured", "spotify oauth and listening data"),
  acNode("resend", "Resend", "external", "configured", "transactional email automation"),
  acNode("deepseek", "DeepSeek", "external", "unknown", "AI agent integration (external)"),
  acNode("github", "GitHub", "external", "configured", "repository automation target"),
  acNode("cinema", "Cinema", "subsystem", "configured", "cinema media subsystem"),
];

function acEdge(from, to, via) {
  return { from: from, to: to, via: via };
}

const AC_EDGES = [
  acEdge("client", "worker", "https"),
  acEdge("worker", "supabase_auth", "auth"),
  acEdge("worker", "postgrest", "rest"),
  acEdge("worker", "storage", "object access"),
  acEdge("chat", "messages", "chat.sender_id/room_id"),
  acEdge("chat", "message_reactions", "message_reactions.message_id"),
  acEdge("chat", "notifications", "notifications.message_id"),
  acEdge("profiles", "profiles", "profiles.id"),
  acEdge("profiles", "user_interests", "user_interests.user_id"),
  acEdge("profiles", "vibe_profile_details", "vibe_profile_details.user_id"),
  acEdge("profiles", "vibe_profile_photos", "vibe_profile_photos.user_id"),
  acEdge("profiles", "vibe_profile_prompts", "vibe_profile_prompts.user_id"),
  acEdge("rooms", "vibe_rooms", "vibe_rooms.owner_id"),
  acEdge("rooms", "vibe_members", "vibe_members.room_id"),
  acEdge("rooms", "vibe_likes", "vibe_likes.room_id"),
  acEdge("deepseek", "github", "repository automation"),
  acEdge("supabase_auth", "resend", "email delivery"),
  acEdge("worker", "spotify", "spotify routes"),
  acEdge("worker", "cinema", "cinema routes"),
];

const AC_LEGEND = {
  groups: {
    frontend: "browser-facing components",
    edge: "worker / edge runtime components",
    backend: "Supabase platform services",
    domain: "application domain modules",
    subsystem: "feature subsystem",
    external: "third-party integrations",
  },
  status: {
    active: "implemented and running",
    configured: "implemented and configured",
    unknown: "not verifiable from static registry",
  },
  edges: "static implementation relationships only; no live health implied",
};

/* ------------------------------------------------------------------ *
 * Security registry
 * ------------------------------------------------------------------ */

function acSecurity(env) {
  const flags = acEnvFlags(env);
  const allowlistConfigured = acAdminAllowlist(env).length > 0;
  const rlsEnabled = AC_TABLES.filter(function (t) { return t.rls; }).length;

  const items = {
    csp: {
      strict: true,
      evidence: "worker policy blocks inline script/style attributes",
    },
    cookies: {
      http_only: true,
      secure: true,
      same_site: "Lax",
    },
    rls: {
      tables: AC_TABLES.length,
      enabled: rlsEnabled,
      ratio: rlsEnabled + "/" + AC_TABLES.length,
    },
    admin_gate: {
      enabled: allowlistConfigured,
      mode: allowlistConfigured ? "enabled" : "disabled",
    },
    otp_recovery: {
      status: "implemented",
    },
    spotify_token_encryption: {
      algorithm: "AES-GCM",
    },
    resend_automation: {
      present: true,
      source: "repository workflow",
      live_state: "unknown",
    },
    secrets_exposure: {
      status: "blocked_by_design",
    },
    deepseek_live_config: {
      status: "external/unknown",
    },
  };

  const warnings = [];
  if (!allowlistConfigured) {
    warnings.push({
      id: "admin_allowlist_missing",
      severity: "high",
      message: "VIBE_ADMIN_USER_IDS is not configured; admin console returns admin_console_disabled.",
    });
  }
  if (!flags.spotify_configured) {
    warnings.push({
      id: "spotify_config_missing",
      severity: "medium",
      message: "Spotify client configuration booleans are not both present.",
    });
  }
  warnings.push({
    id: "support_config",
    severity: flags.support_configured ? "info" : "low",
    presence_only: true,
    configured: flags.support_configured,
    message: "Support configuration presence reported only; values are never exposed.",
  });
  warnings.push({
    id: "deepseek_live_config",
    severity: "info",
    configured: "unknown",
    message: "DeepSeek live configuration is external/unknown.",
  });

  return { security: items, warnings: warnings };
}

/* ------------------------------------------------------------------ *
 * Endpoint handlers
 * ------------------------------------------------------------------ */

function acModules(flags) {
  return [
    {
      name: "cloud",
      path: "server/cloud.mjs",
      domain: "core",
      responsibility: "cloud API surface (auth, profile, chat, rooms, media)",
      status: "active",
    },
    {
      name: "spotify",
      path: "server/spotify.mjs",
      domain: "spotify",
      responsibility: "spotify oauth and listening data",
      status: flags.spotify_configured ? "configured" : "configured",
    },
    {
      name: "admin_console",
      path: "server/admin-console.mjs",
      domain: "observability",
      responsibility: "read-only engineering console backend",
      status: flags.admin_console_configured ? "active" : "configured",
    },
    {
      name: "worker",
      path: "server/worker.mjs",
      domain: "core",
      responsibility: "request router / fetch entrypoint",
      status: "active",
    },
  ];
}

function acOverview(env) {
  const flags = acEnvFlags(env);
  const rlsEnabled = AC_TABLES.filter(function (t) { return t.rls; }).length;

  const health = {
    api_registry: "configured",
    schema_registry: "configured",
    relations_registry: "configured",
    rls: "enforced",
    admin_gate: flags.admin_console_configured ? "enabled" : "disabled",
    storage: "configured",
    realtime: "unknown",
    spotify: flags.spotify_configured ? "configured" : "unknown",
    support: flags.support_configured ? "configured" : "unknown",
    deepseek: "unknown",
  };

  return {
    ok: true,
    repository: AC_REPO,
    environment: flags,
    modules: acModules(flags),
    counts: {
      tables_count: AC_TABLES.length,
      rls_tables_count: rlsEnabled,
      relations_count: AC_RELATIONS.length,
      api_count: AC_APIS.length,
      architecture_nodes_count: AC_NODES.length,
      architecture_edges_count: AC_EDGES.length,
    },
    room_types: ["voice", "cinema", "game", "flash", "echo"],
    legacy_rooms: 6,
    build: {
      branch: AC_BRANCH,
      hosting: AC_HOSTING,
      deployment_status: "unknown",
    },
    health: health,
    safe_events: AC_EVENTS.slice(),
  };
}

async function acVisibleCount(identity, table) {
  try {
    const token = identity && identity.token ? identity.token : null;
    if (!token || typeof sbFetch !== "function") return null;

    const path = "/rest/v1/" + encodeURIComponent(table) + "?select=id";
    const extra = { headers: { Prefer: "count=exact", Range: "0-0" } };
    const res = await sbFetch(path, token, "GET", null, extra);

    let contentRange = null;
    if (res && res.headers && typeof res.headers.get === "function") {
      contentRange = res.headers.get("content-range") || res.headers.get("Content-Range");
    } else if (res && typeof res === "object") {
      contentRange =
        res["content-range"] ||
        res["Content-Range"] ||
        (res.headers && (res.headers["content-range"] || res.headers["Content-Range"]));
    }
    if (!contentRange) return null;

    const m = String(contentRange).match(/\/(\d+|\*)\s*$/);
    if (!m || m[1] === "*") return null;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) ? n : null;
  } catch (_e) {
    return null;
  }
}

async function acSchema(env, identity, u) {
  const requested = (u.searchParams.get("table") || "").trim();
  const rlsEnabled = AC_TABLES.filter(function (t) { return t.rls; }).length;

  const body = {
    ok: true,
    tables: AC_TABLES,
    relations: AC_RELATIONS,
    domains: acDomains(),
    summary: {
      tables_count: AC_TABLES.length,
      rls_tables_count: rlsEnabled,
      relations_count: AC_RELATIONS.length,
      domains_count: acDomains().length,
    },
  };

  if (requested) {
    if (!acIsAllowlistedTable(requested)) {
      body.visible_count = null;
      body.visible_count_scope = "rls_session";
      body.visible_count_error = "table_not_allowlisted";
    } else {
      body.visible_count = await acVisibleCount(identity, requested);
      body.visible_count_scope = "rls_session";
      body.visible_count_table = requested;
    }
  }

  return body;
}

function acApisPayload() {
  return {
    ok: true,
    count: AC_APIS.length,
    endpoints: AC_APIS,
    groups: acApiGroups(),
  };
}

function acArchitecturePayload() {
  return {
    ok: true,
    repository: AC_REPO,
    nodes: AC_NODES,
    edges: AC_EDGES,
    legend: AC_LEGEND,
    counts: { nodes: AC_NODES.length, edges: AC_EDGES.length },
  };
}

function acMonitoringPayload() {
  const avg =
    AC_COUNTER.total_requests > 0
      ? Math.round((AC_COUNTER.total_duration_ms / AC_COUNTER.total_requests) * 100) / 100
      : 0;

  return {
    ok: true,
    runtime_online: true,
    total_requests: AC_COUNTER.total_requests,
    endpoint_counts: Object.assign({}, AC_COUNTER.endpoint_counts),
    recent_events: AC_EVENTS.slice(),
    rolling_avg_duration_ms: avg,
    notes:
      "Process-local console metrics only. No CPU, memory or network telemetry is reported.",
  };
}

function acAiPayload() {
  return {
    ok: true,
    repository: AC_REPO,
    agent: "deepseek-chat",
    capabilities: [
      "repo_info",
      "list_path",
      "read_file",
      "create_branch",
      "write_file",
      "create_pull_request",
      "merge_pull_request",
      "list_workflows",
      "dispatch_workflow",
      "workflow_runs",
    ],
    status: "external_integration",
    secrets: "not_exposed",
    live_state: "unknown",
  };
}

const AC_LEGACY_ROOMS = [
  { id: 1, kind: "voice", title: "Late-night conversations" },
  { id: 2, kind: "cinema", title: "A slower kind of night" },
  { id: 3, kind: "game", title: "Game night with the crew" },
  { id: 4, kind: "voice", title: "Let's talk English" },
  { id: 5, kind: "flash", title: "A little flash of connection" },
  { id: 6, kind: "echo", title: "Voices worth hearing" },
];

function acRoomsPayload() {
  const kinds = {};
  for (let i = 0; i < AC_LEGACY_ROOMS.length; i++) {
    const k = AC_LEGACY_ROOMS[i].kind;
    kinds[k] = (kinds[k] || 0) + 1;
  }
  return {
    ok: true,
    legacy_room_count: AC_LEGACY_ROOMS.length,
    legacy_rooms: AC_LEGACY_ROOMS,
    kinds: kinds,
    notes: "Static legacy room definitions only. No live member or activity counts.",
  };
}

function acStoragePayload() {
  return {
    ok: true,
    areas: [
      { id: "avatars", usage: "profile photos", domain: "profile", listing: false },
      { id: "profile_photos", usage: "profile photo gallery", domain: "profile", listing: false },
      { id: "chat_images", usage: "chat image attachments", domain: "chat", listing: false },
      { id: "voice_notes", usage: "voice note attachments", domain: "chat", listing: false },
    ],
    status: "implementation_based",
    notes: "Object listing disabled. No bucket keys, object paths or contents are exposed.",
  };
}

/* ------------------------------------------------------------------ *
 * Router
 * ------------------------------------------------------------------ */

async function adminConsoleRoute(request, env, url) {
  const start = Date.now();

  let u;
  try {
    u = url instanceof URL ? url : new URL(String(url || request.url || ""), "https://vibe.local");
  } catch (_e) {
    u = new URL(request.url || "https://vibe.local/");
  }

  const path = u.pathname.replace(/\/+$/, "") || u.pathname || AC_BASE;
  const endpoint = path;

  const method = String(request.method || "GET").toUpperCase();
  if (method !== "GET") {
    acRecordEvent(endpoint, Date.now() - start, 405);
    return acJson({ ok: false, error: "method_not_allowed" }, 405, start, { Allow: "GET" });
  }

  const gate = await acAuthGate(request, env);
  if (!gate.ok) {
    acRecordEvent(endpoint, Date.now() - start, gate.status);
    return acJson({ ok: false, error: gate.error }, gate.status, start);
  }

  if (!acRateAllowed(gate.userId)) {
    acRecordEvent(endpoint, Date.now() - start, 429);
    return acJson(
      { ok: false, error: "rate_limited", limit: AC_RATE_LIMIT, window_ms: AC_RATE_WINDOW_MS },
      429,
      start
    );
  }

  AC_COUNTER.total_requests += 1;
  AC_COUNTER.endpoint_counts[endpoint] = (AC_COUNTER.endpoint_counts[endpoint] || 0) + 1;

  let status = 200;
  let payload;

  try {
    switch (path) {
      case AC_BASE + "/overview":
        payload = acOverview(env);
        break;
      case AC_BASE + "/schema":
        payload = await acSchema(env, gate.identity, u);
        break;
      case AC_BASE + "/apis":
        payload = acApisPayload();
        break;
      case AC_BASE + "/security": {
        const s = acSecurity(env);
        payload = { ok: true, security: s.security, warnings: s.warnings };
        break;
      }
      case AC_BASE + "/architecture":
        payload = acArchitecturePayload();
        break;
      case AC_BASE + "/monitoring":
        payload = acMonitoringPayload();
        break;
      case AC_BASE + "/ai":
        payload = acAiPayload();
        break;
      case AC_BASE + "/rooms":
        payload = acRoomsPayload();
        break;
      case AC_BASE + "/storage":
        payload = acStoragePayload();
        break;
      default:
        status = 404;
        payload = { ok: false, error: "not_found", endpoints: AC_CONSOLE_ENDPOINTS };
        break;
    }
  } catch (_e) {
    status = 500;
    payload = { ok: false, error: "internal_error" };
  }

  const duration = Date.now() - start;
  AC_COUNTER.total_duration_ms += duration;
  acRecordEvent(endpoint, duration, status);

  return acJson(payload, status, start);
}

const AC_CONSOLE_ENDPOINTS = [
  AC_BASE + "/overview",
  AC_BASE + "/schema",
  AC_BASE + "/apis",
  AC_BASE + "/security",
  AC_BASE + "/architecture",
  AC_BASE + "/monitoring",
  AC_BASE + "/ai",
  AC_BASE + "/rooms",
  AC_BASE + "/storage",
];
