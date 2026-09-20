import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const origin = process.env.VIBE_ORIGIN || 'https://vibe-social-nights.bb0949.chatgpt.site';
const supabaseUrl = process.env.SUPABASE_URL || 'https://hsvcdyxelshvgofjvlim.supabase.co';
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRole) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

const { default: worker } = await import('../dist/server/index.js');
const runId = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const password = 'LiveTest123!';
const created = [];

async function adminJson(path, init = {}) {
  const res = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`admin ${path} failed: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function createUser(displayName) {
  const email = `vibe-live-${runId}-${displayName.toLowerCase().replace(/[^a-z]+/g, '')}@example.invalid`;
  const user = await adminJson('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { display_name: displayName } })
  });
  created.push(user.id);
  const login = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: serviceRole, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const session = await login.json();
  if (!login.ok || !session.access_token) throw new Error('test login failed');
  return { id: user.id, token: session.access_token, email };
}

async function workerJson(path, token, init = {}) {
  const res = await worker.fetch(new Request(origin + path, {
    ...init,
    headers: {
      Origin: origin,
      Cookie: `__Host-vibe-access=${token}`,
      ...(init.headers || {})
    }
  }), { SUPABASE_SERVICE_ROLE_KEY: serviceRole });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`worker ${path} failed: ${res.status} ${text}`);
  return body;
}

async function completeOnboarding(token) {
  await workerJson('/api/cloud/onboarding', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step: 1, values: [1] })
  });
  await workerJson('/api/cloud/onboarding', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step: 2, values: [2], types: [1] })
  });
  await workerJson('/api/cloud/onboarding', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step: 3 })
  });
  const status = await workerJson('/api/cloud/onboarding', token);
  assert.equal(status.status.complete, true);
}

async function cleanup() {
  for (const id of [...new Set(created)]) {
    try {
      await adminJson(`/auth/v1/admin/users/${id}`, { method: 'DELETE' });
    } catch {}
  }
}

try {
  const a = await createUser('Alpha');
  const b = await createUser('Beta');

  const profile = await workerJson('/api/cloud/profile', a.token);
  assert.equal(profile.profile.id, a.id);
  const patched = await workerJson('/api/cloud/profile', a.token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ display_name: 'Alpha Updated', bio: 'Live profile', data: { nature: [1], interests: [2], types: [1] } })
  });
  assert.equal(patched.profile.display_name, 'Alpha Updated');
  await completeOnboarding(a.token);
  await completeOnboarding(b.token);

  const settings = await workerJson('/api/cloud/settings', a.token);
  assert.equal(typeof settings.settings, 'object');
  await workerJson('/api/cloud/settings', a.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appearance: 'dark', smartPhotos: true, hideAge: false, hideDistance: false })
  });

  await workerJson('/api/cloud/profile-details', a.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ living_in: 'Riyadh', height_cm: 175, job: 'Engineer', education: 'BSc', basics: { zodiac: 'Leo' }, lifestyle: { pets: 'cats' } })
  });
  await workerJson('/api/cloud/profile-prompts', a.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompts: [{ question: 'What matters to me?', answer: 'Kindness' }] })
  });

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
  );
  const uploaded = await workerJson(`/api/cloud/upload?scope=profile&target=${a.id}`, a.token, {
    method: 'POST',
    headers: { 'Content-Type': 'image/png' },
    body: png
  });
  assert.equal(typeof uploaded.path, 'string');
  await workerJson('/api/cloud/profile-photo', a.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot: 0, object_path: uploaded.path })
  });

  const room = await workerJson('/api/cloud/rooms', a.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Live test room', category: 1, kind: 'voice' })
  });
  await workerJson(`/api/cloud/membership?room=${room.room.id}`, b.token, { method: 'POST' });
  const members = await workerJson(`/api/cloud/membership?room=${room.room.id}`, b.token);
  assert.equal(members.members.length, 2);

  await workerJson(`/api/cloud/likes?id=${room.room.id}`, a.token, { method: 'POST' });
  const likes = await workerJson('/api/cloud/likes', a.token);
  assert.ok(likes.items.some((item) => item.room_id === room.room.id));

  const message = await workerJson('/api/cloud/messages', a.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: room.room.id, body: 'Hello live room' })
  });
  await workerJson(`/api/cloud/reaction?message=${message.message.id}`, b.token, { method: 'POST' });
  const roomMessages = await workerJson(`/api/cloud/messages?room=${room.room.id}`, b.token);
  assert.equal(roomMessages.messages[0].body, 'Hello live room');

  const dm = await workerJson('/api/cloud/messages', a.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient_id: b.id, body: 'Hello direct' })
  });
  const inbox = await workerJson('/api/cloud/inbox', b.token);
  assert.ok(inbox.messages.some((m) => m.id === dm.message.id));

  const notifications = await workerJson('/api/cloud/notifications', b.token);
  assert.ok(Array.isArray(notifications.items));

  await workerJson(`/api/cloud/blocks?id=${b.id}`, a.token, { method: 'POST' });
  const blocks = await workerJson('/api/cloud/blocks', a.token);
  assert.ok(blocks.items.some((item) => item.blocked_id === b.id));
  await workerJson(`/api/cloud/blocks?id=${b.id}`, a.token, { method: 'DELETE' });

  const report = await workerJson('/api/cloud/reports', b.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_kind: 'user', target_id: a.id, reason: 'Live test report', details: 'Disposable integration check' })
  });
  const reports = await workerJson('/api/cloud/reports', b.token);
  assert.ok(reports.reports.some((r) => r.id === report.report.id));

  console.log('PASS: live Supabase auth/profile/media/rooms/messages/reactions/inbox flows.');
} finally {
  await cleanup();
}
