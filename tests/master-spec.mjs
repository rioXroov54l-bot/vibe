import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = path => fs.readFile(path, 'utf8');

const [app, cloudUi, master, authSpec, authUi, spotifyUi, spotifyServer, build, smtp, workflow] = await Promise.all([
  read('public/app.js'),
  read('public/cloud-ui.js'),
  read('public/master-spec.js'),
  read('public/auth-spec.js'),
  read('public/auth-ui-secure.js'),
  read('public/spotify-spec.js'),
  read('server/spotify.mjs'),
  read('scripts/build.mjs'),
  read('scripts/configure-supabase-auth.mjs'),
  read('.github/workflows/configure-supabase-auth.yml')
]);

// Existing room types and connected chat features remain present.
for (const marker of ["voice:['", "flash:['", "cinema:['", "game:['", "echo:['"]) assert(app.includes(marker));
for (const marker of ['chat-header', 'unread-badge', 'message_reactions', 'Double tap', 'Sent']) assert(cloudUi.includes(marker));

// Composer ordering: camera -> text input -> media group, while gallery precedes microphone inside media tools.
const sendStart = app.indexOf('function sendForm(handler)');
assert(sendStart >= 0);
const sendEnd = app.indexOf('function chats()', sendStart);
const sendSource = app.slice(sendStart, sendEnd);
assert(sendSource.indexOf('camera-button') < sendSource.indexOf('name="message"'));
assert(sendSource.indexOf('name="message"') < sendSource.indexOf('chatAttachments(handler)'));
const attachmentsStart = app.indexOf('function chatAttachments(handler)');
assert(attachmentsStart >= 0);
const attachmentsEnd = app.indexOf('let noteError', attachmentsStart);
const attachmentsSource = app.slice(attachmentsStart, attachmentsEnd);
assert(attachmentsSource.indexOf("uiIcon('image')") < attachmentsSource.indexOf("uiIcon(noteRecording?'stop':'mic')"));

// Master spec extensions.
assert(master.includes('master-spec-match-notice'));
for (const key of ['zodiac','communication_style','relationship_goal','languages','smoking','drinking','exercise','sleep','pets']) assert(master.includes(key));
assert(master.includes('top-artists-card'));
assert(master.includes("cloudAPI('profile-details'"));

// OTP recovery is additive and the final rendered recovery view is CSP-safe.
assert(authSpec.includes("cloudAuthDirect('otp'"));
assert(authSpec.includes("kind !== 'recovery'"));
assert(authSpec.includes("cloudAuthDirect('verify'"));
assert(!/\son(?:submit|click)\s*=/.test(authUi));
assert(authUi.includes("on(cloudRecover,'submit')"));
assert(authUi.includes("t('إرسال الرمز','Send code')"));

// Spotify integration uses server-side runtime credentials, encrypted refresh cookies, and no fake artist data.
for (const marker of ['SPOTIFY_CLIENT_ID','SPOTIFY_CLIENT_SECRET','AES-GCM','__Host-vibe-spotify-refresh','user-top-read','/v1/me/top/artists']) assert(spotifyServer.includes(marker));
assert(spotifyServer.includes('spotifyConfig(env)'));
assert(spotifyServer.includes("url.pathname.slice('/api/cloud/'.length)"));
assert(!spotifyServer.includes('access_token:'));
assert(spotifyUi.includes('/api/cloud/spotify/status'));
assert(spotifyUi.includes('/api/cloud/spotify/top'));
assert(spotifyUi.includes('/api/cloud/spotify/connect'));
assert(spotifyUi.includes('/api/cloud/spotify/disconnect'));
assert(spotifyUi.includes('textContent'));

// Build keeps the original self-contained Worker architecture and injects additive extensions in order.
for (const marker of ['public/master-spec.js','public/auth-spec.js','public/auth-ui-secure.js','public/spotify-spec.js','server/spotify.mjs',"dist/server/index.js"]) assert(build.includes(marker));
assert(build.includes("await fs.readFile('server/cinema.mjs','utf8')"));
assert(build.includes("await fs.readFile('server/cloud.mjs','utf8')"));
assert(build.includes("await fs.readFile('server/spotify.mjs','utf8')"));

// Resend/Supabase Auth configuration is secret-driven and uses branded OTP token templates.
for (const marker of ['smtp.resend.com',"'smtp_port: 587'".replace(/'/g,''),'noreply@vibe-groups.com',"'smtp_user: 'resend''".replace(/^'|'$/g,''),'{{ .Token }}','RESEND_API_KEY']) assert(smtp.includes(marker));
assert(smtp.includes("smtp_sender_name: 'Vibe'"));
assert(smtp.includes('mailer_templates_confirmation_content'));
assert(smtp.includes('mailer_templates_magic_link_content'));
assert(workflow.includes('workflow_dispatch'));
assert(workflow.includes('secrets.RESEND_API_KEY'));
assert(workflow.includes('secrets.SUPABASE_ACCESS_TOKEN'));
assert(workflow.includes('vars.SUPABASE_PROJECT_ID'));

// The built worker must load, and Spotify endpoints require a signed-in Vibe session.
const {default: worker} = await import('../dist/server/index.js');
const unauth = await worker.fetch(new Request('https://vibe.example/api/cloud/spotify/status'), {
  SPOTIFY_CLIENT_ID: 'test-client',
  SPOTIFY_CLIENT_SECRET: 'test-secret'
});
assert.equal(unauth.status, 401);
assert.deepEqual(await unauth.json(), {error:'sign_in_required'});

console.log('PASS: Vibe master spec extensions, OTP recovery, Spotify integration and Resend configuration.');
