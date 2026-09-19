import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const read=p=>fs.readFile(p,'utf8');
const exists=async p=>{try{return (await fs.stat(p)).isFile()}catch{return false}};

const [build,legal,ui,server,cloud,pkg,readiness,nativeGap,privacyLabel,permissions,ageRating,reviewNotes,connectChecklist,retention] = await Promise.all([
  read('scripts/build.mjs'),
  read('public/legal-spec.js'),
  read('public/compliance-ui.js'),
  read('server/compliance.mjs'),
  read('server/cloud.mjs'),
  read('package.json'),
  read('docs/app-store/READINESS_STATUS.md'),
  read('docs/app-store/NATIVE_IOS_GAP.md'),
  read('docs/app-store/APP_PRIVACY_LABEL.md'),
  read('docs/app-store/PERMISSIONS_MATRIX.md'),
  read('docs/app-store/AGE_RATING.md'),
  read('docs/app-store/APP_REVIEW_NOTES.md'),
  read('docs/app-store/APP_STORE_CONNECT_CHECKLIST.md'),
  read('docs/app-store/DATA_RETENTION.md')
]);

for (const marker of ['public/legal-spec.js','public/compliance-ui.js','server/compliance.mjs']) {
  assert.ok(build.includes(marker), 'build missing '+marker);
}

for (const marker of [
  'LEGAL_POLICY_VERSION','legal-terms','legal-privacy','legal-community','legal-safety',
  'legal-deletion','legal-copyright','legal-support','Terms of Use','Privacy Policy'
]) assert.ok(legal.includes(marker), 'legal surface missing '+marker);

assert.ok(!/\sstyle\s*=/i.test(legal), 'legal UI must not use inline style attributes');
assert.ok(!/\sonclick\s*=/i.test(legal), 'legal UI must not use inline onclick');
assert.ok(!/\sonsubmit\s*=/i.test(legal), 'legal UI must not use inline onsubmit');

for (const marker of ['account-delete','data-export','Permanently delete my account','DELETE','legal-deletion']) {
  assert.ok(ui.includes(marker), 'account/data UI missing '+marker);
}
assert.ok(!ui.includes('SUPABASE_SERVICE_ROLE_KEY'), 'client must not know service-role secret name/value');

for (const marker of [
  'SUPABASE_SERVICE_ROLE_KEY','account-delete','data-export','compliance-status',
  'reporter_id=eq.','interaction_blocked','VIBE_MODERATION_BLOCKLIST',
  'invalid_media_signature','content_not_allowed','deleted-account'
]) assert.ok(server.includes(marker), 'compliance backend missing '+marker);

assert.ok(server.includes('id.token') || server.includes('identity.token'), 'user export/report reads must use session JWT');
assert.ok(server.includes("'vibe_rooms'"), 'data export must use vibe_rooms');
assert.ok(!server.includes("select=id&user_id=eq."), 'vibe_blocks must not query nonexistent id column');
assert.ok(!/SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][^'"]+/.test(server), 'service role must never be hard-coded');

for (const marker of ['terms_version','privacy_version','community_guidelines_version','policies_accepted_at']) {
  assert.ok(cloud.includes(marker), 'signup policy-version evidence missing '+marker);
}

const inventory=JSON.parse(await read('docs/app-store/data-inventory.json'));
assert.equal(inventory.native_ios_target_present,false);
assert.ok(Array.isArray(inventory.categories) && inventory.categories.length>=10,'data inventory must cover product data categories');
assert.ok(inventory.categories.every(x=>x && x.tracking===false),'current inventory must not claim tracking for any category');
assert.match(String(inventory.tracking_evidence||''),/none/i);

const requiredDocs=[
  'docs/app-store/data-inventory.json',
  'docs/app-store/APP_PRIVACY_LABEL.md',
  'docs/app-store/PERMISSIONS_MATRIX.md',
  'docs/app-store/NATIVE_IOS_GAP.md',
  'docs/app-store/AGE_RATING.md',
  'docs/app-store/APP_REVIEW_NOTES.md',
  'docs/app-store/APP_STORE_CONNECT_CHECKLIST.md',
  'docs/app-store/DATA_RETENTION.md',
  'docs/app-store/EXPORT_COMPLIANCE.md',
  'docs/app-store/ASSET_REQUIREMENTS.md',
  'docs/app-store/READINESS_STATUS.md',
  'docs/legal/REGIONAL_READINESS.md',
  'docs/legal/LEGAL_OWNER_INPUT.md'
];
for(const p of requiredDocs)assert.ok(await exists(p),'missing readiness artifact '+p);

assert.match(readiness,/BLOCKED/i,'readiness status must disclose blockers');
assert.match(readiness,/native iOS/i,'readiness status must disclose native iOS blocker');
assert.doesNotMatch(readiness,/App Store submission:\s*(READY|PASS)/i,'must not falsely claim App Store submission readiness');
assert.match(nativeGap,/BLOCK/i);
assert.match(privacyLabel,/ATT/i);
assert.match(permissions,/Camera|الكاميرا/i);
assert.match(permissions,/Microphone|الميكروفون/i);
assert.match(ageRating,/UGC|user-generated/i);
assert.match(reviewNotes,/delete/i);
assert.match(connectChecklist,/App Privacy/i);
assert.match(retention,/messages|رسائل/i);

async function walk(dir,out=[]){
  for(const ent of await fs.readdir(dir,{withFileTypes:true})){
    if(['node_modules','.git','dist'].includes(ent.name))continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())await walk(p,out);else out.push(p);
  }
  return out;
}
const repoFiles=await walk('.');
const nativeFiles=repoFiles.filter(p=>/(\.xcodeproj|\.xcworkspace|\.swift$|\.m$|\.mm$|Package\.swift$|Info\.plist$|PrivacyInfo\.xcprivacy$)/i.test(p));
assert.equal(nativeFiles.length,0,'native iOS target appeared; update NATIVE_IOS_GAP and privacy-manifest assessment before submission');

assert.ok(JSON.parse(pkg).scripts['appstore:check'],'package must expose appstore:check');

const {default:worker}=await import('../dist/server/index.js?appstore='+Date.now());
const status=await worker.fetch(new Request('https://vibe.example/api/cloud/compliance-status'),{});
assert.equal(status.status,401,'compliance status must require authentication');
const exp=await worker.fetch(new Request('https://vibe.example/api/cloud/data-export'),{});
assert.equal(exp.status,401,'data export must require authentication');
const del=await worker.fetch(new Request('https://vibe.example/api/cloud/account-delete',{
  method:'POST',
  headers:{Origin:'https://vibe.example','Content-Type':'application/json'},
  body:JSON.stringify({confirm:'DELETE'})
}),{});
assert.equal(del.status,401,'account deletion must require authentication');
const reports=await worker.fetch(new Request('https://vibe.example/api/cloud/reports'),{});
assert.equal(reports.status,401,'reports must require authentication');

console.log('PASS: App Store policy surfaces, privacy inventory, account controls and readiness blockers are enforced.');
