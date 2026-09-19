// server/admin-console.mjs
// -----------------------------------------------------------------------------
// Read-only Vibe engineering console backend.
//
// Scope:
//   - Concatenated into the shared worker scope (after server/cloud.mjs and
//     server/spotify.mjs, before server/worker.mjs).
//   - Provides: adminConsoleRoute(request, env, url) for /api/admin-console/*.
//   - Available in scope: cloudIdentity(req), cloudCookies(req),
//     sbFetch(path, token, method, data, extra), common.
//   - No module exports. No side effects beyond a bounded in-memory ring buffer.
//
// Safety:
//   - GET only, allowlisted admins only, per-admin rate limited.
//   - Never returns email, JWT, cookies, secrets, or row contents.
//   - Counts only (opt-in, single allowlisted table) via RLS session.
//   - No eval / new Function / destructive actions. No console logging of IDs.
//   - No live health probing and no synthetic CPU/memory/network numbers.
// -----------------------------------------------------------------------------

const ADMIN_CONSOLE_REPO = 'rioXroov54l-bot/vibe';
const ADMIN_CONSOLE_BRANCH = 'deepseek/system-control-center';
const ADMIN_CONSOLE_HOSTING = 'OpenAI/ChatGPT Sites';
const ADMIN_CONSOLE_PREFIX = '/api/admin-console';

const ADMIN_CONSOLE_RATE_LIMIT = 60; // requests per admin per window
const ADMIN_CONSOLE_RATE_WINDOW_MS = 60000;
const ADMIN_CONSOLE_MAX_EVENTS = 30;

// --- In-memory, bounded state (no IDs, no secrets) ---------------------------
const ADMIN_CONSOLE_STATE = {
  events: [], // ring: { time, endpoint, duration_ms, status }
  totalRequests: 0,
  totalDurationMs: 0,
  endpointCounts: Object.create(null),
};

const ADMIN_CONSOLE_RATE_STATE = new Map(); // key: admin id -> { count, resetAt }

// --- Table registry (real tables only; no pg_catalog) ------------------------
const ADMIN_CONSOLE_TABLES = [
  {
    name: 'vibe_profiles',
    domain: 'core',
    rls: true,
    values_exposed: false,
    primary_key: ['id'],
    columns: [
      { name: 'id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'display_name', type: 'text', nullable: true },
      { name: 'bio', type: 'text', nullable: true },
      { name: 'data', type: 'jsonb', nullable: true },
      { name: 'created_at', type: 'timestamptz', nullable: true },
    ],
    foreign_keys: [],
  },
  {
    name: 'vibe_settings',
    domain: 'settings',
    rls: true,
    values_exposed: false,
    primary_key: ['user_id'],
    columns: [
      { name: 'user_id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'data', type: 'jsonb', nullable: true },
      { name: 'theme', type: 'text', nullable: true },
      { name: 'smart_photos_enabled', type: 'boolean', nullable: true },
      { name: 'hide_age', type: 'boolean', nullable: true },
      { name: 'hide_distance', type: 'boolean', nullable: true },
    ],
    foreign_keys: [{ column: 'user_id', references: [{ table: 'vibe_profiles', column: 'id' }] }],
  },
  {
    name: 'vibe_blocks',
    domain: 'safety',
    rls: true,
    values_exposed: false,
    primary_key: ['user_id', 'blocked_id'],
    columns: [
      { name: 'user_id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'blocked_id', type: 'uuid', nullable: false, key: 'pk' },
    ],
    foreign_keys: [
      { column: 'user_id', references: [{ table: 'vibe_profiles', column: 'id' }] },
      { column: 'blocked_id', references: [{ table: 'vibe_profiles', column: 'id' }] },
    ],
  },
  {
    name: 'vibe_rooms',
    domain: 'rooms',
    rls: true,
    values_exposed: false,
    primary_key: ['id'],
    columns: [
      { name: 'id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'owner_id', type: 'uuid', nullable: true, key: 'fk' },
      { name: 'title', type: 'text', nullable: true },
      { name: 'category', type: 'integer', nullable: true },
      { name: 'kind', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamptz', nullable: true },
      { name: 'legacy_id', type: 'integer', nullable: true },
      { name: 'legacy_snapshot', type: 'jsonb', nullable: true },
    ],
    foreign_keys: [{ column: 'owner_id', references: [{ table: 'vibe_profiles', column: 'id' }] }],
  },
  {
    name: 'vibe_members',
    domain: 'rooms',
    rls: true,
    values_exposed: false,
    primary_key: ['room_id', 'user_id'],
    columns: [
      { name: 'room_id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'user_id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'joined_at', type: 'timestamptz', nullable: true },
    ],
    foreign_keys: [
      { column: 'room_id', references: [{ table: 'vibe_rooms', column: 'id' }] },
      { column: 'user_id', references: [{ table: 'vibe_profiles', column: 'id' }] },
    ],
  },
  {
    name: 'messages',
    domain: 'chat',
    rls: true,
    values_exposed: false,
    primary_key: ['id'],
    columns: [
      { name: 'id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'sender_id', type: 'uuid', nullable: true, key: 'fk' },
      { name: 'room_id', type: 'uuid', nullable: true, key: 'fk' },
      { name: 'receiver_id', type: 'uuid', nullable: true, key: 'fk' },
      { name: 'kind', type: 'text', nullable: true },
      { name: 'content', type: 'text', nullable: true, sensitive: true },
      { name: 'object_path', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamptz', nullable: true },
    ],
    foreign_keys: [
      {
        column: 'sender_id',
        references: [
          { table: 'vibe_profiles', column: 'id' },
          { table: 'profiles', column: 'id' },
        ],
      },
      { column: 'room_id', references: [{ table: 'vibe_rooms', column: 'id' }] },
      {
        column: 'receiver_id',
        references: [
          { table: 'vibe_profiles', column: 'id' },
          { table: 'profiles', column: 'id' },
        ],
      },
    ],
  },
  {
    name: 'vibe_likes',
    domain: 'rooms',
    rls: true,
    values_exposed: false,
    primary_key: ['user_id', 'room_id'],
    columns: [
      { name: 'user_id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'room_id', type: 'uuid', nullable: false, key: 'pk' },
    ],
    foreign_keys: [
      { column: 'user_id', references: [{ table: 'vibe_profiles', column: 'id' }] },
      { column: 'room_id', references: [{ table: 'vibe_rooms', column: 'id' }] },
    ],
  },
  {
    name: 'vibe_reports',
    domain: 'safety',
    rls: true,
    values_exposed: false,
    primary_key: ['id'],
    columns: [
      { name: 'id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'reporter_id', type: 'uuid', nullable: true, key: 'fk' },
      { name: 'target_kind', type: 'text', nullable: true },
      { name: 'target_id', type: 'text', nullable: true },
      { name: 'reason', type: 'text', nullable: true },
      { name: 'details', type: 'text', nullable: true, sensitive: true },
      { name: 'status', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamptz', nullable: true },
    ],
    foreign_keys: [{ column: 'reporter_id', references: [{ table: 'vibe_profiles', column: 'id' }] }],
  },
  {
    name: 'profiles',
    domain: 'profile',
    rls: true,
    values_exposed: false,
    primary_key: ['id'],
    columns: [
      { name: 'id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'email', type: 'text', nullable: true, sensitive: true, values_exposed: false },
      { name: 'username', type: 'text', nullable: true },
      { name: 'full_name', type: 'text', nullable: true },
      { name: 'avatar_url', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamptz', nullable: true },
      { name: 'onboarding_step', type: 'smallint', nullable: true },
      { name: 'onboarding_completed_at', type: 'timestamptz', nullable: true },
    ],
    foreign_keys: [{ column: 'id', references: [{ table: 'auth.users', column: 'id' }], external: true }],
  },
  {
    name: 'notifications',
    domain: 'notifications',
    rls: true,
    values_exposed: false,
    primary_key: ['id'],
    columns: [
      { name: 'id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'user_id', type: 'uuid', nullable: true, key: 'fk' },
      { name: 'actor_id', type: 'uuid', nullable: true, key: 'fk' },
      { name: 'message_id', type: 'uuid', nullable: true, key: 'fk' },
      { name: 'created_at', type: 'timestamptz', nullable: true },
      { name: 'read_at', type: 'timestamptz', nullable: true },
    ],
    foreign_keys: [
      { column: 'user_id', references: [{ table: 'profiles', column: 'id' }] },
      { column: 'actor_id', references: [{ table: 'profiles', column: 'id' }] },
      { column: 'message_id', references: [{ table: 'messages', column: 'id' }] },
    ],
  },
  {
    name: 'user_interests',
    domain: 'profile',
    rls: true,
    values_exposed: false,
    primary_key: ['user_id', 'category', 'value'],
    columns: [
      { name: 'user_id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'category', type: 'text', nullable: false, key: 'pk' },
      { name: 'value', type: 'smallint', nullable: false, key: 'pk' },
    ],
    foreign_keys: [{ column: 'user_id', references: [{ table: 'profiles', column: 'id' }] }],
  },
  {
    name: 'message_reactions',
    domain: 'chat',
    rls: true,
    values_exposed: false,
    primary_key: ['message_id', 'user_id'],
    columns: [
      { name: 'message_id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'user_id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'emoji', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamptz', nullable: true },
    ],
    foreign_keys: [
      { column: 'message_id', references: [{ table: 'messages', column: 'id' }] },
      { column: 'user_id', references: [{ table: 'profiles', column: 'id' }] },
    ],
  },
  {
    name: 'vibe_profile_details',
    domain: 'profile',
    rls: true,
    values_exposed: false,
    primary_key: ['user_id'],
    columns: [
      { name: 'user_id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'living_in', type: 'text', nullable: true },
      { name: 'height_cm', type: 'smallint', nullable: true },
      { name: 'job', type: 'text', nullable: true },
      { name: 'education', type: 'text', nullable: true },
      { name: 'basics', type: 'jsonb', nullable: true },
      { name: 'lifestyle', type: 'jsonb', nullable: true },
    ],
    foreign_keys: [{ column: 'user_id', references: [{ table: 'profiles', column: 'id' }] }],
  },
  {
    name: 'vibe_profile_photos',
    domain: 'profile',
    rls: true,
    values_exposed: false,
    primary_key: ['user_id', 'slot'],
    columns: [
      { name: 'user_id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'slot', type: 'smallint', nullable: false, key: 'pk' },
      { name: 'object_path', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamptz', nullable: true },
    ],
    foreign_keys: [{ column: 'user_id', references: [{ table: 'profiles', column: 'id' }] }],
  },
  {
    name: 'vibe_profile_prompts',
    domain: 'profile',
    rls: true,
    values_exposed: false,
    primary_key: ['user_id', 'slot'],
    columns: [
      { name: 'user_id', type: 'uuid', nullable: false, key: 'pk' },
      { name: 'slot', type: 'smallint', nullable: false, key: 'pk' },
      { name: 'question', type: 'text', nullable: true },
      { name: 'answer', type: 'text', nullable: true },
    ],
    foreign_keys: [{ column: 'user_id', references: [{ table: 'profiles', column: 'id' }] }],
  },
];

const ADMIN_CONSOLE_TABLE_BY_NAME = (() => {
  const map = Object.create(null);
  for (const t of ADMIN_CONSOLE_TABLES) map[t.name] = t;
  return map;
})();

const ADMIN_CONSOLE_TABLE_PK = (() => {
  const map = Object.create(null);
  for (const t of ADMIN_CONSOLE_TABLES) map[t.name] = (t.primary_key && t.primary_key[0]) || 'id';
  return map;
})();

// --- Relations graph ---------------------------------------------------------
const ADMIN_CONSOLE_RELATIONS = [
  { source_table: 'vibe_settings', source_column: 'user_id', target_table: 'vibe_profiles', target_column: 'id' },
  { source_table: 'vibe_blocks', source_column: 'user_id', target_table: 'vibe_profiles', target_column: 'id' },
  { source_table: 'vibe_blocks', source_column: 'blocked_id', target_table: 'vibe_profiles', target_column: 'id' },
  { source_table: 'vibe_rooms', source_column: 'owner_id', target_table: 'vibe_profiles', target_column: 'id' },
  { source_table: 'vibe_members', source_column: 'room_id', target_table: 'vibe_rooms', target_column: 'id' },
  { source_table: 'vibe_members', source_column: 'user_id', target_table: 'vibe_profiles', target_column: 'id' },
  { source_table: 'messages', source_column: 'sender_id', target_table: 'vibe_profiles', target_column: 'id', note: 'dual FK target: vibe_profiles.id / profiles.id' },
  { source_table: 'messages', source_column: 'room_id', target_table: 'vibe_rooms', target_column: 'id' },
  { source_table: 'messages', source_column: 'receiver_id', target_table: 'vibe_profiles', target_column: 'id', note: 'dual FK target: vibe_profiles.id / profiles.id' },
  { source_table: 'vibe_likes', source_column: 'user_id', target_table: 'vibe_profiles', target_column: 'id' },
  { source_table: 'vibe_likes', source_column: 'room_id', target_table: 'vibe_rooms', target_column: 'id' },
  { source_table: 'vibe_reports', source_column: 'reporter_id', target_table: 'vibe_profiles', target_column: 'id' },
  { source_table: 'profiles', source_column: 'id', target_table: 'auth.users', target_column: 'id', external: true },
  { source_table: 'notifications', source_column: 'user_id', target_table: 'profiles', target_column: 'id' },
  { source_table: 'notifications', source_column: 'actor_id', target_table: 'profiles', target_column: 'id' },
  { source_table: 'notifications', source_column: 'message_id', target_table: 'messages', target_column: 'id' },
  { source_table: 'user_interests', source_column: 'user_id', target_table: 'profiles', target_column: 'id' },
  { source_table: 'message_reactions', source_column: 'message_id', target_table: 'messages', target_column: 'id' },
  { source_table: 'message_reactions', source_column: 'user_id', target_table: 'profiles', target_column: 'id' },
  { source_table: 'vibe_profile_details', source_column: 'user_id', target_table: 'profiles', target_column: 'id' },
  { source_table: 'vibe_profile_photos', source_column: 'user_id', target_table: 'profiles', target_column: 'id' },
  { source_table: 'vibe_profile_prompts', source_column: 'user_id', target_table: 'profiles', target_column: 'id' },
];

// --- Domain rollup -----------------------------------------------------------
const ADMIN_CONSOLE_DOMAINS = (() => {
  const map = Object.create(null);
  for (const t of ADMIN_CONSOLE_TABLES) {
    if (!map[t.domain]) map[t.domain] = { name: t.domain, tables: [], rls: true };
    map[t.domain].tables.push(t.name);
    if (t.rls !== true) map[t.domain].rls = false;
  }
  return map;
})();

// --- API registry ------------------------------------------------------------
// auth: public | user | admin ; risk: read | write | sensitive-read
const ADMIN_CONSOLE_APIS = [
  { method: 'POST', path: '/api/cloud/auth/verify', auth: 'public', domain: 'auth', risk: 'write', notes: 'Verify OTP / magic token.' },
  { method: 'POST', path: '/api/cloud/auth/otp', auth: 'public', domain: 'auth', risk: 'write', notes: 'Send one-time passcode.' },
  { method: 'POST', path: '/api/cloud/auth/resend', auth: 'public', domain: 'auth', risk: 'write', notes: 'Resend OTP.' },
  { method: 'POST', path: '/api/cloud/auth/recover', auth: 'public', domain: 'auth', risk: 'write', notes: 'Legacy recovery flow.' },
  { method: 'POST', path: '/api/cloud/auth/signup', auth: 'public', domain: 'auth', risk: 'write', notes: 'Account signup.' },
  { method: 'GET', path: '/api/cloud/auth/callback', auth: 'public', domain: 'auth', risk: 'write', notes: 'OAuth callback; issues session cookies.' },
  { method: 'POST', path: '/api/cloud/auth/callback', auth: 'public', domain: 'auth', risk: 'write', notes: 'OAuth callback (POST).' },
  { method: 'GET', path: '/api/cloud/auth/session', auth: 'user', domain: 'auth', risk: 'sensitive-read', notes: 'Current session summary; no token values returned.' },
  { method: 'POST', path: '/api/cloud/auth/logout', auth: 'user', domain: 'auth', risk: 'write', notes: 'Clear session cookies.' },
  { method: 'POST', path: '/api/cloud/auth/password', auth: 'user', domain: 'auth', risk: 'write', notes: 'Password set/change.' },
  { method: 'GET', path: '/api/cloud/profile', auth: 'user', domain: 'profile', risk: 'sensitive-read', notes: 'Own profile read.' },
  { method: 'PATCH', path: '/api/cloud/profile', auth: 'user', domain: 'profile', risk: 'write', notes: 'Own profile update.' },
  { method: 'GET', path: '/api/cloud/people', auth: 'user', domain: 'profile', risk: 'sensitive-read', notes: 'Discoverable people list.' },
  { method: 'GET', path: '/api/cloud/settings', auth: 'user', domain: 'settings', risk: 'read', notes: 'Own settings.' },
  { method: 'POST', path: '/api/cloud/settings', auth: 'user', domain: 'settings', risk: 'write', notes: 'Update settings.' },
  { method: 'GET', path: '/api/cloud/onboarding', auth: 'user', domain: 'profile', risk: 'read', notes: 'Onboarding state.' },
  { method: 'POST', path: '/api/cloud/onboarding', auth: 'user', domain: 'profile', risk: 'write', notes: 'Advance onboarding.' },
  { method: 'GET', path: '/api/cloud/profile-details', auth: 'user', domain: 'profile', risk: 'read', notes: 'Profile details.' },
  { method: 'POST', path: '/api/cloud/profile-details', auth: 'user', domain: 'profile', risk: 'write', notes: 'Update profile details.' },
  { method: 'GET', path: '/api/cloud/profile-prompts', auth: 'user', domain: 'profile', risk: 'read', notes: 'Profile prompts.' },
  { method: 'POST', path: '/api/cloud/profile-prompts', auth: 'user', domain: 'profile', risk: 'write', notes: 'Update profile prompts.' },
  { method: 'GET', path: '/api/cloud/profile-photo', auth: 'user', domain: 'profile', risk: 'sensitive-read', notes: 'Profile photo slots (metadata only).' },
  { method: 'POST', path: '/api/cloud/profile-photo', auth: 'user', domain: 'profile', risk: 'write', notes: 'Add/replace profile photo.' },
  { method: 'DELETE', path: '/api/cloud/profile-photo', auth: 'user', domain: 'profile', risk: 'write', notes: 'Remove profile photo.' },
  { method: 'GET', path: '/api/cloud/rooms', auth: 'user', domain: 'rooms', risk: 'read', notes: 'List/create rooms read.' },
  { method: 'POST', path: '/api/cloud/rooms', auth: 'user', domain: 'rooms', risk: 'write', notes: 'Create room.' },
  { method: 'DELETE', path: '/api/cloud/rooms', auth: 'user', domain: 'rooms', risk: 'write', notes: 'Delete own room.' },
  { method: 'GET', path: '/api/cloud/membership', auth: 'user', domain: 'rooms', risk: 'read', notes: 'Room membership read.' },
  { method: 'POST', path: '/api/cloud/membership', auth: 'user', domain: 'rooms', risk: 'write', notes: 'Join room.' },
  { method: 'DELETE', path: '/api/cloud/membership', auth: 'user', domain: 'rooms', risk: 'write', notes: 'Leave room.' },
  { method: 'GET', path: '/api/cloud/messages', auth: 'user', domain: 'chat', risk: 'sensitive-read', notes: 'Message history (RLS scoped).' },
  { method: 'POST', path: '/api/cloud/messages', auth: 'user', domain: 'chat', risk: 'write', notes: 'Send message.' },
  { method: 'GET', path: '/api/cloud/inbox', auth: 'user', domain: 'chat', risk: 'sensitive-read', notes: 'Inbox summary.' },
  { method: 'GET', path: '/api/cloud/notifications', auth: 'user', domain: 'notifications', risk: 'read', notes: 'Notifications list.' },
  { method: 'PATCH', path: '/api/cloud/notifications', auth: 'user', domain: 'notifications', risk: 'write', notes: 'Mark read.' },
  { method: 'POST', path: '/api/cloud/reaction', auth: 'user', domain: 'chat', risk: 'write', notes: 'Add message reaction.' },
  { method: 'DELETE', path: '/api/cloud/reaction', auth: 'user', domain: 'chat', risk: 'write', notes: 'Remove message reaction.' },
  { method: 'GET', path: '/api/cloud/likes', auth: 'user', domain: 'rooms', risk: 'read', notes: 'Likes read.' },
  { method: 'POST', path: '/api/cloud/likes', auth: 'user', domain: 'rooms', risk: 'write', notes: 'Add like.' },
  { method: 'DELETE', path: '/api/cloud/likes', auth: 'user', domain: 'rooms', risk: 'write', notes: 'Remove like.' },
  { method: 'GET', path: '/api/cloud/blocks', auth: 'user', domain: 'safety', risk: 'read', notes: 'Block list read.' },
  { method: 'POST', path: '/api/cloud/blocks', auth: 'user', domain: 'safety', risk: 'write', notes: 'Block user.' },
  { method: 'DELETE', path: '/api/cloud/blocks', auth: 'user', domain: 'safety', risk: 'write', notes: 'Unblock user.' },
  { method: 'GET', path: '/api/cloud/reports', auth: 'user', domain: 'safety', risk: 'read', notes: 'Own reports read.' },
  { method: 'POST', path: '/api/cloud/reports', auth: 'user', domain: 'safety', risk: 'write', notes: 'Submit report.' },
  { method: 'POST', path: '/api/cloud/upload', auth: 'user', domain: 'storage', risk: 'write', notes: 'Upload attachment to storage.' },
  { method: 'GET', path: '/api/cloud/file', auth: 'user', domain: 'storage', risk: 'sensitive-read', notes: 'Signed file access proxy.' },
  { method: 'GET', path: '/api/cloud/spotify/status', auth: 'user', domain: 'spotify', risk: 'read', notes: 'Spotify connection status.' },
  { method: 'GET', path: '/api/cloud/spotify/connect', auth: 'user', domain: 'spotify', risk: 'write', notes: 'Start Spotify OAuth.' },
  { method: 'GET', path: '/api/cloud/spotify/callback', auth: 'public', domain: 'spotify', risk: 'write', notes: 'Spotify OAuth callback.' },
  { method: 'GET', path: '/api/cloud/spotify/top', auth: 'user', domain: 'spotify', risk: 'sensitive-read', notes: 'Top items for connect UI.' },
  { method: 'POST', path: '/api/cloud/spotify/disconnect', auth: 'user', domain: 'spotify', risk: 'write', notes: 'Disconnect Spotify; clears stored token.' },
  { method: 'GET', path: '/api/video-preview', auth: 'public', domain: 'storage', risk: 'read', notes: 'Video preview metadata.' },
  { method: 'GET', path: '/api/support/status', auth: 'public', domain: 'support', risk: 'read', notes: 'Support channel availability.' },
  { method: 'POST', path: '/api/support', auth: 'public', domain: 'support', risk: 'write', notes: 'Submit support request.' },
  { method: 'GET', path: '/api/cinema', auth: 'user', domain: 'cinema', risk: 'read', notes: 'Cinema list.' },
  { method: 'POST', path: '/api/cinema', auth: 'user', domain: 'cinema', risk: 'write', notes: 'Cinema create.' },
  { method: 'PATCH', path: '/api/cinema', auth: 'user', domain: 'cinema', risk: 'write', notes: 'Cinema update.' },
  { method: 'DELETE', path: '/api/cinema', auth: 'user', domain: 'cinema', risk: 'write', notes: 'Cinema delete.' },
  { method: 'GET', path: '/api/admin-console/overview', auth: 'admin', domain: 'console', risk: 'sensitive-read', notes: 'Console overview (read-only).' },
  { method: 'GET', path: '/api/admin-console/schema', auth: 'admin', domain: 'console', risk: 'sensitive-read', notes: 'Schema registry; optional visible count.' },
  { method: 'GET', path: '/api/admin-console/apis', auth: 'admin', domain: 'console', risk: 'sensitive-read', notes: 'API registry.' },
  { method: 'GET', path: '/api/admin-console/security', auth: 'admin', domain: 'console', risk: 'sensitive-read', notes: 'Security posture registry.' },
  { method: 'GET', path: '/api/admin-console/architecture', auth: 'admin', domain: 'console', risk: 'sensitive-read', notes: 'Architecture nodes and edges.' },
  { method: 'GET', path: '/api/admin-console/monitoring', auth: 'admin', domain: 'console', risk: 'sensitive-read', notes: 'Console in-memory metrics.' },
  { method: 'GET', path: '/api/admin-console/ai', auth: 'admin', domain: 'console', risk: 'sensitive-read', notes: 'AI agent capabilities registry.' },
  { method: 'GET', path: '/api/admin-console/rooms', auth: 'admin', domain: 'console', risk: 'sensitive-read', notes: 'Legacy room definitions.' },
  { method: 'GET', path: '/api/admin-console/storage', auth: 'admin', domain: 'console', risk: 'sensitive-read', notes: 'Storage bucket registry.' },
];

// --- Architecture registry ---------------------------------------------------
const ADMIN_CONSOLE_NODES = [
  { id: 'client', label: 'Client App', group: 'frontend', status: 'active', detail: 'Web client calling the worker API.' },
  { id: 'worker', label: 'Worker', group: 'edge', status: 'active', detail: 'Fetch API router dispatching /api/* routes.' },
  { id: 'admin_console', label: 'Admin Console', group: 'edge', status: 'active', detail: 'Read-only console backend routed via worker at /api/admin-console/*.' },
  { id: 'supabase_auth', label: 'Supabase Auth', group: 'supabase', status: 'configured', detail: 'OTP, session and password flows via cloudIdentity.' },
  { id: 'postgrest', label: 'PostgREST', group: 'supabase', status: 'configured', detail: 'REST data access through sbFetch.' },
  { id: 'realtime', label: 'Realtime', group: 'supabase', status: 'unknown', detail: 'No live probe; usage not verified in this scope.' },
  { id: 'storage', label: 'Storage', group: 'supabase', status: 'configured', detail: 'Object storage for avatars, profile photos and attachments.' },
  { id: 'profiles', label: 'Profiles Domain', group: 'domain', status: 'active', detail: 'Profile, details, photos, prompts and interests.' },
  { id: 'chat', label: 'Chat Domain', group: 'domain', status: 'active', detail: 'Direct and room messages, reactions and inbox.' },
  { id: 'rooms', label: 'Rooms Domain', group: 'domain', status: 'active', detail: 'Rooms, membership and likes.' },
  { id: 'notifications', label: 'Notifications Domain', group: 'domain', status: 'active', detail: 'Notification records and read state.' },
  { id: 'spotify', label: 'Spotify', group: 'integration', status: 'configured', detail: 'OAuth connect/callback, status and top items; token encryption AES-GCM.' },
  { id: 'resend', label: 'Resend', group: 'integration', status: 'configured', detail: 'Transactional email automation via repository workflow.' },
  { id: 'deepseek', label: 'DeepSeek', group: 'automation', status: 'configured', detail: 'External coding agent integration.' },
  { id: 'github', label: 'GitHub', group: 'automation', status: 'configured', detail: 'Repository automation target (branches, files, pull requests, workflows).' },
  { id: 'cinema', label: 'Cinema', group: 'domain', status: 'active', detail: 'Cinema subsystem with GET/POST/PATCH/DELETE routes.' },
];

const ADMIN_CONSOLE_EDGES = [
  { from: 'client', to: 'worker', kind: 'node' },
  { from: 'worker', to: 'supabase_auth', kind: 'node' },
  { from: 'worker', to: 'postgrest', kind: 'node' },
  { from: 'worker', to: 'storage', kind: 'node' },
  { from: 'worker', to: 'admin_console', kind: 'node' },
  { from: 'chat', to: 'messages', kind: 'table' },
  { from: 'chat', to: 'message_reactions', kind: 'table' },
  { from: 'chat', to: 'notifications', kind: 'node' },
  { from: 'profiles', to: 'profiles', kind: 'table' },
  { from: 'profiles', to: 'vibe_profiles', kind: 'table' },
  { from: 'profiles', to: 'vibe_profile_details', kind: 'table' },
  { from: 'profiles', to: 'vibe_profile_photos', kind: 'table' },
  { from: 'profiles', to: 'vibe_profile_prompts', kind: 'table' },
  { from: 'profiles', to: 'user_interests', kind: 'table' },
  { from: 'rooms', to: 'vibe_rooms', kind: 'table' },
  { from: 'rooms', to: 'vibe_members', kind: 'table' },
  { from: 'rooms', to: 'vibe_likes', kind: 'table' },
  { from: 'deepseek', to: 'github', kind: 'node' },
  { from: 'supabase_auth', to: 'resend', kind: 'node' },
  { from: 'worker', to: 'spotify', kind: 'node' },
  { from: 'worker', to: 'cinema', kind: 'node' },
];

const ADMIN_CONSOLE_LEGEND = {
  groups: ['frontend', 'edge', 'supabase', 'domain', 'integration', 'automation'],
  statuses: [
    { id: 'active', detail: 'Implemented and dispatched in this worker scope.' },
    { id: 'configured', detail: 'External/managed dependency referenced by configuration.' },
    { id: 'unknown', detail: 'No live probe available; not verified.' },
  ],
  edge_kinds: {
    node: 'Runtime/service dependency.',
    table: 'Domain data ownership (node -> table).',
  },
  note: 'Statuses reflect implementation presence only; no live health probing and no synthetic metrics.',
};

// --- Module registry ---------------------------------------------------------
const ADMIN_CONSOLE_MODULES = [
  { name: 'server/cloud.mjs', role: 'Cloud API, identity, cookies and data access (cloudIdentity, cloudCookies, sbFetch)', status: 'active' },
  { name: 'server/spotify.mjs', role: 'Spotify integration routes', status: 'configured' },
  { name: 'server/admin-console.mjs', role: 'Read-only engineering console backend', status: 'active' },
  { name: 'server/worker.mjs', role: 'Fetch router dispatching /api/* including /api/admin-console/*', status: 'active' },
];

// --- Legacy rooms ------------------------------------------------------------
const ADMIN_CONSOLE_LEGACY_ROOMS = [
  { legacy_id: 1, kind: 'voice', title: 'Late-night conversations' },
  { legacy_id: 2, kind: 'cinema', title: 'A slower kind of night' },
  { legacy_id: 3, kind: 'game', title: 'Game night with the crew' },
  { legacy_id: 4, kind: 'voice', title: "Let's talk English" },
  { legacy_id: 5, kind: 'flash', title: 'A little flash of connection' },
  { legacy_id: 6, kind: 'echo', title: 'Voices worth hearing' },
];

// --- Storage registry (no object listing) ------------------------------------
const ADMIN_CONSOLE_STORAGE = [
  { id: 'avatars', usage: 'account avatars', access: 'signed', status: 'configured' },
  { id: 'profile-photos', usage: 'vibe profile photos', access: 'signed', status: 'configured' },
  { id: 'chat-images', usage: 'chat image attachments', access: 'signed', status: 'configured' },
  { id: 'voice-notes', usage: 'voice note attachments', access: 'signed', status: 'configured' },
];

// --- Helpers -----------------------------------------------------------------

function adminConsoleHeaders(extra) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  };
  try {
    if (typeof common !== 'undefined' && common && typeof common === 'object') {
      const source = common.headers && typeof common.headers === 'object' ? common.headers : common;
      for (const key of Object.keys(source)) {
        const value = source[key];
        if (typeof value === 'string') headers[key] = value;
      }
    }
  } catch (_) {
    // Ignore; fall back to safe defaults.
  }
  if (extra && typeof extra === 'object') {
    for (const key of Object.keys(extra)) {
      if (typeof extra[key] === 'string') headers[key] = extra[key];
    }
  }
  return headers;
}

function adminConsoleRecord(endpoint, status, durationMs) {
  ADMIN_CONSOLE_STATE.totalRequests += 1;
  ADMIN_CONSOLE_STATE.totalDurationMs += durationMs;
  const key = endpoint || '(unknown)';
  ADMIN_CONSOLE_STATE.endpointCounts[key] = (ADMIN_CONSOLE_STATE.endpointCounts[key] || 0) + 1;
  ADMIN_CONSOLE_STATE.events.push({
    time: new Date().toISOString(),
    endpoint: key,
    duration_ms: durationMs,
    status: status,
  });
  if (ADMIN_CONSOLE_STATE.events.length > ADMIN_CONSOLE_MAX_EVENTS) {
    ADMIN_CONSOLE_STATE.events.splice(0, ADMIN_CONSOLE_STATE.events.length - ADMIN_CONSOLE_MAX_EVENTS);
  }
}

function adminConsoleSend(routeLabel, status, startedAt, payload, extraHeaders) {
  const now = Date.now();
  const duration = Math.max(0, now - startedAt);
  adminConsoleRecord(routeLabel, status, duration);
  const body = Object.assign({}, payload && typeof payload === 'object' ? payload : {});
  if (!('ok' in body)) body.ok = status < 400;
  body.generated_at = new Date(now).toISOString();
  body.duration_ms = duration;
  return new Response(JSON.stringify(body), {
    status: status,
    headers: adminConsoleHeaders(extraHeaders),
  });
}

function adminConsoleAllowlist(env) {
  const raw = env && typeof env.VIBE_ADMIN_USER_IDS === 'string' ? env.VIBE_ADMIN_USER_IDS : '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function adminConsoleRateLimit(adminId) {
  const now = Date.now();
  let entry = ADMIN_CONSOLE_RATE_STATE.get(adminId);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + ADMIN_CONSOLE_RATE_WINDOW_MS };
    ADMIN_CONSOLE_RATE_STATE.set(adminId, entry);
  }
  entry.count += 1;
  if (ADMIN_CONSOLE_RATE_STATE.size > 1000) {
    for (const [k, v] of ADMIN_CONSOLE_RATE_STATE) {
      if (now >= v.resetAt) ADMIN_CONSOLE_RATE_STATE.delete(k);
    }
  }
  const allowed = entry.count <= ADMIN_CONSOLE_RATE_LIMIT;
  return {
    allowed: allowed,
    remaining: Math.max(0, ADMIN_CONSOLE_RATE_LIMIT - entry.count),
    retryAfterMs: Math.max(0, entry.resetAt - now),
  };
}

// Presence-only env detection. Never returns or reveals values.
function adminConsoleEnvPresence(env, pattern) {
  if (!env || typeof env !== 'object') return false;
  for (const key of Object.keys(env)) {
    if (pattern.test(key)) {
      const value = env[key];
      if (typeof value === 'string' && value.trim()) return true;
    }
  }
  return false;
}

// --- Endpoint builders -------------------------------------------------------

function adminConsoleHealth(environment) {
  return [
    { name: 'admin_console', status: 'active', detail: 'Read-only console backend mounted in worker scope.' },
    { name: 'worker_router', status: 'active', detail: 'Dispatches /api/admin-console/* to adminConsoleRoute.' },
    { name: 'postgrest', status: 'configured', detail: 'Data access via sbFetch; per-request RLS session.' },
    { name: 'spotify', status: environment.spotify_configured ? 'configured' : 'unknown', detail: 'Configuration presence only.' },
    { name: 'support', status: environment.support_configured ? 'configured' : 'unknown', detail: 'Configuration presence only.' },
    { name: 'realtime', status: 'unknown', detail: 'No live probe; usage not verified.' },
    { name: 'deployment', status: 'unknown', detail: 'Hosting target declared; live status unknown.' },
  ];
}

function adminConsoleOverview(environment) {
  return {
    repository: ADMIN_CONSOLE_REPO,
    environment: environment,
    modules: ADMIN_CONSOLE_MODULES,
    tables_count: ADMIN_CONSOLE_TABLES.length,
    rls_tables_count: ADMIN_CONSOLE_TABLES.filter((t) => t.rls === true).length,
    api_count: ADMIN_CONSOLE_APIS.length,
    architecture_nodes_count: ADMIN_CONSOLE_NODES.length,
    room_types: ['voice', 'cinema', 'game', 'flash', 'echo'],
    legacy_rooms: ADMIN_CONSOLE_LEGACY_ROOMS.length,
    build: {
      branch: ADMIN_CONSOLE_BRANCH,
      hosting: ADMIN_CONSOLE_HOSTING,
      deployment_status: 'unknown',
    },
    safe_events: ADMIN_CONSOLE_STATE.events.slice(-ADMIN_CONSOLE_MAX_EVENTS),
    health: adminConsoleHealth(environment),
  };
}

// Count-only probe for a single allowlisted table, scoped by the caller's RLS
// session. Never returns row values; on any uncertainty returns null.
async function adminConsoleVisibleCount(table, identity) {
  const result = { table: table, scope: 'rls_session', visible_count: null, error: null };
  try {
    if (typeof sbFetch !== 'function') {
      result.error = 'count_unavailable';
      return result;
    }
    let token = null;
    if (identity && typeof identity.token === 'string' && identity.token) {
      token = identity.token;
    } else if (identity && identity.session && typeof identity.session.access_token === 'string') {
      token = identity.session.access_token;
    }
    if (!token) {
      result.error = 'no_session';
      return result;
    }
    const pk = ADMIN_CONSOLE_TABLE_PK[table] || 'id';
    const path = '/' + table + '?select=' + encodeURIComponent(pk) + '&limit=1';
    const extra = { headers: { Prefer: 'count=exact', Range: '0-0' } };
    const res = await sbFetch(path, token, 'GET', null, extra);

    let contentRange = null;
    if (res && res.headers && typeof res.headers.get === 'function') {
      contentRange = res.headers.get('content-range') || res.headers.get('Content-Range');
    }
    if (!contentRange && res && typeof res === 'object' && typeof res.contentRange === 'string') {
      contentRange = res.contentRange;
    }
    if (typeof contentRange !== 'string') {
      result.error = 'count_unavailable';
      return result;
    }
    const slash = contentRange.indexOf('/');
    const total = slash >= 0 ? contentRange.slice(slash + 1) : '';
    if (!total || total === '*') {
      result.error = 'count_unavailable';
      return result;
    }
    const parsed = Number.parseInt(total, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      result.visible_count = parsed;
    } else {
      result.error = 'count_unavailable';
    }
  } catch (_) {
    result.error = 'count_unavailable';
  }
  return result;
}

async function adminConsoleSchema(parsedUrl, identity) {
  const requested = parsedUrl && parsedUrl.searchParams ? parsedUrl.searchParams.get('table') : null;
  let visible = null;
  if (requested) {
    if (ADMIN_CONSOLE_TABLE_BY_NAME[requested]) {
      visible = await adminConsoleVisibleCount(requested, identity);
    } else {
      visible = { table: requested, scope: 'rls_session', visible_count: null, error: 'table_not_allowlisted' };
    }
  }
  return {
    tables: ADMIN_CONSOLE_TABLES,
    relations: ADMIN_CONSOLE_RELATIONS,
    domains: ADMIN_CONSOLE_DOMAINS,
    summary: {
      tables_count: ADMIN_CONSOLE_TABLES.length,
      rls_tables_count: ADMIN_CONSOLE_TABLES.filter((t) => t.rls === true).length,
      relations_count: ADMIN_CONSOLE_RELATIONS.length,
      domains_count: Object.keys(ADMIN_CONSOLE_DOMAINS).length,
    },
    visible: visible,
  };
}

function adminConsoleApis() {
  const by_domain = Object.create(null);
  const by_auth = Object.create(null);
  const by_risk = Object.create(null);
  for (const a of ADMIN_CONSOLE_APIS) {
    by_domain[a.domain] = (by_domain[a.domain] || 0) + 1;
    by_auth[a.auth] = (by_auth[a.auth] || 0) + 1;
    by_risk[a.risk] = (by_risk[a.risk] || 0) + 1;
  }
  return {
    endpoints: ADMIN_CONSOLE_APIS,
    counts: {
      total: ADMIN_CONSOLE_APIS.length,
      by_domain: by_domain,
      by_auth: by_auth,
      by_risk: by_risk,
    },
  };
}

function adminConsoleSecurity(environment) {
  const rlsTables = ADMIN_CONSOLE_TABLES.filter((t) => t.rls === true).length;
  const total = ADMIN_CONSOLE_TABLES.length;
  const security = {
    csp: { strict: true, evidence: 'Worker response policy blocks inline script/style attributes.' },
    cookies: { http_only: true, secure: true, same_site: 'Lax' },
    rls: { enabled_tables: rlsTables, total_tables: total, all_enforced: rlsTables === total },
    admin_gate: {
      enabled: environment.admin_console_configured === true,
      status: environment.admin_console_configured ? 'enabled' : 'disabled',
    },
    otp_recovery: { implemented: true },
    spotify_token_encryption: { algorithm: 'AES-GCM' },
    resend_automation: { repository_workflow_present: true, live_state: 'unknown' },
    secrets_exposure: { status: 'blocked_by_design' },
    deepseek_live_config: { status: 'external/unknown' },
  };
  const warnings = [];
  if (!environment.admin_console_configured) {
    warnings.push({
      id: 'admin_allowlist_missing',
      severity: 'high',
      detail: 'VIBE_ADMIN_USER_IDS is not configured; the admin console is disabled.',
    });
  }
  if (!environment.spotify_configured) {
    warnings.push({
      id: 'spotify_config_missing',
      severity: 'medium',
      detail: 'No Spotify configuration detected; Spotify endpoints report as not configured.',
    });
  }
  if (!environment.support_configured) {
    warnings.push({
      id: 'support_config_missing',
      severity: 'low',
      detail: 'No support configuration detected (presence check only).',
    });
  }
  return { security: security, warnings: warnings };
}

function adminConsoleArchitecture() {
  return {
    nodes: ADMIN_CONSOLE_NODES,
    edges: ADMIN_CONSOLE_EDGES,
    legend: ADMIN_CONSOLE_LEGEND,
  };
}

function adminConsoleMonitoring() {
  const total = ADMIN_CONSOLE_STATE.totalRequests;
  const avg = total > 0 ? ADMIN_CONSOLE_STATE.totalDurationMs / total : 0;
  return {
    runtime_online: true,
    total_requests: total,
    endpoint_counts: Object.assign({}, ADMIN_CONSOLE_STATE.endpointCounts),
    recent_events: ADMIN_CONSOLE_STATE.events.slice(-ADMIN_CONSOLE_MAX_EVENTS),
    rolling_avg_duration_ms: Math.round(avg * 1000) / 1000,
    metrics_scope: 'in-memory since isolate start',
    system_metrics: { cpu: 'not_collected', memory: 'not_collected', network: 'not_collected' },
  };
}

function adminConsoleAi() {
  return {
    repository: ADMIN_CONSOLE_REPO,
    agent: 'deepseek-chat',
    capabilities: [
      'repo_info',
      'list_path',
      'read_file',
      'create_branch',
      'write_file',
      'create_pull_request',
      'merge_pull_request',
      'list_workflows',
      'dispatch_workflow',
      'workflow_runs',
    ],
    status: 'external_integration',
    secrets: 'not_exposed',
  };
}

function adminConsoleRooms() {
  const kindsSummary = Object.create(null);
  for (const room of ADMIN_CONSOLE_LEGACY_ROOMS) {
    kindsSummary[room.kind] = (kindsSummary[room.kind] || 0) + 1;
  }
  return {
    legacy_room_count: ADMIN_CONSOLE_LEGACY_ROOMS.length,
    rooms: ADMIN_CONSOLE_LEGACY_ROOMS,
    kinds_summary: kindsSummary,
    live_room_counts: 'not_collected',
  };
}

function adminConsoleStorage() {
  return {
    buckets: ADMIN_CONSOLE_STORAGE,
    objects_listed: false,
    signed_urls_exposed: false,
    note: 'Registry only; object listing and signed URLs are never exposed.',
  };
}

// --- Route handler (shared scope; no exports) --------------------------------
async function adminConsoleRoute(request, env, url) {
  const startedAt = Date.now();

  let parsedUrl = url && url.pathname ? url : null;
  if (!parsedUrl) {
    try {
      parsedUrl = new URL(request.url);
    } catch (_) {
      parsedUrl = null;
    }
  }
  const pathname = parsedUrl && parsedUrl.pathname ? parsedUrl.pathname : '';
  const method = request && request.method ? String(request.method).toUpperCase() : 'GET';

  let route = pathname.startsWith(ADMIN_CONSOLE_PREFIX) ? pathname.slice(ADMIN_CONSOLE_PREFIX.length) : '';
  route = route.replace(/^\/+/, '').replace(/\/+$/, '');
  const label = route || '(root)';

  // GET only.
  if (method !== 'GET') {
    return adminConsoleSend(label, 405, startedAt, { error: 'method_not_allowed' }, { Allow: 'GET' });
  }

  // Access gate: configured allowlist.
  const allowlist = adminConsoleAllowlist(env);
  const allowlistConfigured = allowlist.length > 0;
  if (!allowlistConfigured) {
    return adminConsoleSend(label, 403, startedAt, { error: 'admin_console_disabled' });
  }

  // Access gate: signed identity.
  let identity = null;
  try {
    identity = typeof cloudIdentity === 'function' ? await cloudIdentity(request) : null;
  } catch (_) {
    identity = null;
  }
  const userId = identity && identity.user && identity.user.id ? String(identity.user.id).toLowerCase() : '';
  if (!userId) {
    return adminConsoleSend(label, 403, startedAt, { error: 'admin_forbidden' });
  }
  if (!allowlist.includes(userId)) {
    return adminConsoleSend(label, 403, startedAt, { error: 'admin_forbidden' });
  }

  // Per-admin rate limit.
  const limit = adminConsoleRateLimit(userId);
  if (!limit.allowed) {
    return adminConsoleSend(
      label,
      429,
      startedAt,
      { error: 'rate_limited', retry_after_ms: limit.retryAfterMs },
      { 'Retry-After': String(Math.max(1, Math.ceil(limit.retryAfterMs / 1000))) }
    );
  }

  // Booleans only; never values.
  const environment = {
    spotify_configured: adminConsoleEnvPresence(env, /spotify/i),
    support_configured: adminConsoleEnvPresence(env, /support/i),
    admin_console_configured: allowlistConfigured,
  };

  switch (route) {
    case '':
    case 'overview':
      return adminConsoleSend(label, 200, startedAt, adminConsoleOverview(environment));
    case 'schema':
      return adminConsoleSend(label, 200, startedAt, await adminConsoleSchema(parsedUrl, identity));
    case 'apis':
      return adminConsoleSend(label, 200, startedAt, adminConsoleApis());
    case 'security':
      return adminConsoleSend(label, 200, startedAt, adminConsoleSecurity(environment));
    case 'architecture':
      return adminConsoleSend(label, 200, startedAt, adminConsoleArchitecture());
    case 'monitoring':
      return adminConsoleSend(label, 200, startedAt, adminConsoleMonitoring());
    case 'ai':
      return adminConsoleSend(label, 200, startedAt, adminConsoleAi());
    case 'rooms':
      return adminConsoleSend(label, 200, startedAt, adminConsoleRooms());
    case 'storage':
      return adminConsoleSend(label, 200, startedAt, adminConsoleStorage());
    default:
      return adminConsoleSend(label, 404, startedAt, { error: 'not_found' });
  }
}
