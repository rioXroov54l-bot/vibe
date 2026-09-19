/* Vibe Engineering Console — core (shared closure scope, no isolated IIFE) */

/* ---------- 1. external stylesheet ---------- */
try {
  if (!document.getElementById('vibe-system-console-css')) {
    var sysCssLink = document.createElement('link');
    sysCssLink.id = 'vibe-system-console-css';
    sysCssLink.rel = 'stylesheet';
    sysCssLink.href = '/system-console.css';
    (document.head || document.documentElement).appendChild(sysCssLink);
  }
} catch (sysCssErr) { /* stylesheet is optional at runtime */ }

/* ---------- 2. labels & metadata ---------- */
var SYS_BRANCH = 'deepseek/system-control-center';
var SYS_REPO = 'rioXroov54l-bot/vibe';

var SYS_SECTIONS = [
  { id: 'overview', icon: '▣', ar: 'نظرة عامة', en: 'Overview' },
  { id: 'architecture', icon: '⌗', ar: 'الهندسة المعمارية', en: 'Architecture' },
  { id: 'database', icon: '⛁', ar: 'قاعدة البيانات', en: 'Database' },
  { id: 'auth', icon: '⚿', ar: 'المصادقة والصلاحيات', en: 'Auth & Identity' },
  { id: 'rooms', icon: '⌂', ar: 'الغرف', en: 'Rooms' },
  { id: 'messaging', icon: '✉', ar: 'الرسائل', en: 'Messaging' },
  { id: 'realtime', icon: '⚡', ar: 'الزمن الحقيقي', en: 'Realtime' },
  { id: 'storage', icon: '▤', ar: 'التخزين', en: 'Storage' },
  { id: 'apis', icon: '⇄', ar: 'واجهات API', en: 'APIs' },
  { id: 'ai', icon: '✦', ar: 'الذكاء الاصطناعي', en: 'AI' },
  { id: 'workflows', icon: '⇉', ar: 'سير العمل', en: 'Workflows' },
  { id: 'security', icon: '⛨', ar: 'الأمان', en: 'Security' },
  { id: 'monitoring', icon: '◔', ar: 'المراقبة', en: 'Monitoring' },
  { id: 'deployments', icon: '▷', ar: 'النشر', en: 'Deployments' },
  { id: 'logs', icon: '≡', ar: 'السجلات', en: 'Logs' },
  { id: 'settings', icon: '⚙', ar: 'الإعدادات', en: 'Settings' }
];

var SYS_SECTION_ENDPOINTS = {
  overview: ['overview'], architecture: ['architecture'], database: ['schema'],
  auth: ['security', 'apis'], rooms: ['rooms'], messaging: ['schema', 'apis'],
  realtime: ['architecture'], storage: ['storage'], apis: ['apis'], ai: ['ai'],
  workflows: ['overview', 'ai'], security: ['security'], monitoring: ['monitoring'],
  deployments: ['overview'], logs: ['monitoring'], settings: ['overview', 'security']
};

var SYS_SECTION_SUBS = {
  overview: { ar: 'ملخص حالة المنصة والمكونات الأساسية.', en: 'Platform health and core components at a glance.' },
  architecture: { ar: 'الطبقات والخدمات وحدود المسؤولية.', en: 'Layers, services and responsibility boundaries.' },
  database: { ar: 'الجداول والعلاقات والمخطط.', en: 'Tables, relations and schema.' },
  auth: { ar: 'المصادقة والصلاحيات والجلسات.', en: 'Authentication, permissions and sessions.' },
  rooms: { ar: 'الغرف والعضويات وحالات الانضمام.', en: 'Rooms, memberships and join states.' },
  messaging: { ar: 'تسليم الرسائل والطوابير والبث.', en: 'Message delivery, queues and broadcasting.' },
  realtime: { ar: 'القنوات والاتصالات الحية.', en: 'Channels and live connections.' },
  storage: { ar: 'الملفات والحصص ودورة الحياة.', en: 'Files, quotas and lifecycle.' },
  apis: { ar: 'نقاط النهاية والعقود والمعدلات.', en: 'Endpoints, contracts and rate limits.' },
  ai: { ar: 'النماذج والمطالبات والاستخدام.', en: 'Models, prompts and usage.' },
  workflows: { ar: 'المهام الآلية وحالات التنفيذ.', en: 'Automation jobs and execution states.' },
  security: { ar: 'المخاطر والسياسات والحماية.', en: 'Risks, policies and protections.' },
  monitoring: { ar: 'المقاييس والسجلات والتنبيهات.', en: 'Metrics, logs and alerts.' },
  deployments: { ar: 'الإصدارات والبيئات والنشر.', en: 'Releases, environments and rollouts.' },
  logs: { ar: 'أحداث النظام الأخيرة.', en: 'Recent system events.' },
  settings: { ar: 'إعدادات وحدة التحكم.', en: 'Control center settings.' }
};

/* ---------- 3. shared state ---------- */
var sysState = {
  authorized: false, loading: false, entering: false, error: '',
  section: 'overview', search: '', drawer: null, cache: Object.create(null),
  lastRefresh: null, lastLatencyMs: null, zoom: 100, tableCount: Object.create(null),
  filters: { domain: 'all', method: 'all', auth: 'all', risk: 'all' }
};
var sysInFlight = null;
var sysRefocusSearch = false;
var sysEntryBound = false;

/* ---------- 4. helpers ---------- */
function sysE(v) {
  if (v === null || v === undefined) return '';
  var s = (typeof v === 'string') ? v : String(v);
  try { if (typeof esc === 'function') return esc(s); } catch (e) { /* fallthrough */ }
  return s.replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}
function sysEClass(v) { return String(v === null || v === undefined ? '' : v).replace(/[^a-zA-Z0-9_\- ]/g, '').trim(); }
function sysOn(cb, ev) { try { var a = on(cb, ev); return a === null || a === undefined ? '' : String(a); } catch (e) { return ''; } }
function sysL(pair) { return (lang === 'en') ? pair.en : pair.ar; }
function sysTstring(ar, en) { try { return t(ar, en); } catch (e) { return lang === 'en' ? en : ar; } }
function sysSafeArray(v) { return Array.isArray(v) ? v : []; }
function sysIsSection(id) { for (var i = 0; i < SYS_SECTIONS.length; i++) { if (SYS_SECTIONS[i].id === id) return true; } return false; }
function sysSectionDef(id) { for (var i = 0; i < SYS_SECTIONS.length; i++) { if (SYS_SECTIONS[i].id === id) return SYS_SECTIONS[i]; } return SYS_SECTIONS[0]; }
function sysEndpointList(id) {
  var v = SYS_SECTION_ENDPOINTS[id];
  if (!v) return [id];
  return Array.isArray(v) ? v.slice() : [v];
}
function sysSectionMeta(id) {
  var d = sysSectionDef(id), sub = SYS_SECTION_SUBS[id] || { ar: '', en: '' };
  return { title: sysL(d), sub: sysL(sub), icon: d.icon };
}
function sysToDate(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') { var n = v < 1e12 ? v * 1000 : v; var d = new Date(n); return isNaN(d.getTime()) ? null : d; }
  if (typeof v === 'string') { var p = new Date(v); return isNaN(p.getTime()) ? null : p; }
  return null;
}
function sysFmtDate(v) { var d = sysToDate(v); if (!d) return '—'; try { return d.toISOString().slice(0, 10); } catch (e) { return '—'; } }
function sysFmtTime(v) { var d = sysToDate(v); if (!d) return '—'; try { return d.toLocaleTimeString([], { hour12: false }); } catch (e) { return d.toISOString().slice(11, 19); } }
function sysNumber(v) { var n = Number(v); if (!isFinite(n)) return '0'; try { return n.toLocaleString(); } catch (e) { return String(n); } }

function sysTextSearch(obj, query) {
  var q = String(query === null || query === undefined ? '' : query).trim().toLowerCase();
  if (!q) return true;
  var seen = [], parts = [], budget = 12000;
  function walk(v, depth) {
    if (budget <= 0 || v === null || v === undefined || depth > 6) return;
    var tv = typeof v;
    if (tv === 'string') { var s = v.slice(0, 1200); budget -= s.length; parts.push(s); return; }
    if (tv === 'number' || tv === 'boolean') { var n = String(v); budget -= n.length; parts.push(n); return; }
    if (tv !== 'object') return;
    for (var i = 0; i < seen.length; i++) { if (seen[i] === v) return; }
    seen.push(v);
    if (Array.isArray(v)) { for (var j = 0; j < v.length && j < 150; j++) walk(v[j], depth + 1); return; }
    var keys = Object.keys(v);
    for (var k = 0; k < keys.length && k < 150; k++) { parts.push(keys[k]); walk(v[keys[k]], depth + 1); }
  }
  walk(obj, 0);
  return parts.join(' ').toLowerCase().indexOf(q) !== -1;
}

function sysStatusClass(status) {
  var s = String(status === null || status === undefined ? '' : status).toLowerCase();
  if (s === 'active' || s === 'ok' || s === 'passed' || s === 'healthy' || s === 'connected' || s === 'live' || s === 'up' || s === 'enabled') return 'is-green';
  if (s === 'warning' || s === 'degraded' || s === 'pending' || s === 'partial' || s === 'configured' || s === 'limited') return 'is-amber';
  if (s === 'error' || s === 'failed' || s === 'down' || s === 'offline' || s === 'denied' || s === 'critical') return 'is-red';
  return 'is-ghost';
}
function sysBadge(text, cls) { return '<span class="sys-badge ' + sysEClass(cls || 'is-ghost') + '">' + sysE(text) + '</span>'; }
function sysMethodBadge(method) {
  var raw = String(method === null || method === undefined ? '' : method).toUpperCase();
  var slug = raw.toLowerCase().replace(/[^a-z]/g, '') || 'any';
  return '<span class="sys-method is-' + sysE(slug) + '">' + sysE(raw || 'ANY') + '</span>';
}
function sysRiskBadge(risk) {
  var r = String(risk === null || risk === undefined ? '' : risk).toLowerCase();
  var cls = 'is-ghost';
  if (r === 'high' || r === 'critical' || r === 'severe') cls = 'is-red';
  else if (r === 'medium' || r === 'moderate' || r === 'warning') cls = 'is-amber';
  else if (r === 'low' || r === 'safe' || r === 'none') cls = 'is-green';
  return '<span class="sys-risk ' + cls + '">' + sysE(r || 'unknown') + '</span>';
}
function sysCard(title, body, extraClass) {
  return '<section class="sys-card' + (extraClass ? ' ' + sysEClass(extraClass) : '') + '">' +
    (title ? '<header class="sys-card-head"><h3 class="sys-card-title">' + sysE(title) + '</h3></header>' : '') +
    '<div class="sys-card-body">' + (body || '') + '</div></section>';
}
function sysSectionHeader(title, sub, actions) {
  return '<div class="sys-section-head"><div class="sys-section-head-text">' +
    '<h2 class="sys-section-title">' + sysE(title) + '</h2>' +
    (sub ? '<p class="sys-section-sub">' + sysE(sub) + '</p>' : '') +
    '</div>' + (actions ? '<div class="sys-section-actions">' + actions + '</div>' : '') + '</div>';
}
function sysEmpty(title, text) {
  return '<div class="sys-empty"><div class="sys-empty-title">' + sysE(title) + '</div>' +
    '<div class="sys-empty-text">' + sysE(text || '') + '</div></div>';
}
function sysLoading() {
  var lines = '';
  for (var i = 0; i < 4; i++) lines += '<div class="sys-skel-line"></div>';
  return '<div class="sys-skeleton" role="status" aria-live="polite">' +
    '<div class="sys-skel-head"></div>' + lines + '</div>';
}
function sysWarning(text, severity) {
  var cls = 'is-amber';
  if (severity === 'error' || severity === 'red') cls = 'is-red';
  else if (severity === 'info' || severity === 'ghost') cls = 'is-ghost';
  return '<div class="sys-warning ' + cls + '" role="alert">' +
    '<span class="sys-warning-icon" aria-hidden="true">!</span>' +
    '<span class="sys-warning-text">' + sysE(text) + '</span></div>';
}
function sysFilterButton(label, value, current, onClick) {
  var active = String(current) === String(value);
  return '<button type="button" class="sys-chip' + (active ? ' is-active' : '') + '" aria-pressed="' + (active ? 'true' : 'false') + '"' +
    sysOn(onClick, 'click') + '>' + sysE(label) + '</button>';
}
function sysGet(endpoint) {
  var key = String(endpoint || '');
  if (!key) return null;
  return Object.prototype.hasOwnProperty.call(sysState.cache, key) ? sysState.cache[key] : null;
}
function sysErrorKey(err) {
  var code = err && (err.code || err.status);
  if (code === 403 || code === 'admin_forbidden') return 'denied';
  if (code === 'admin_console_disabled') return 'disabled';
  if (code === 404) return 'not_found';
  if (code === 'network' || code === 'fetch_failed') return 'network';
  return 'generic';
}
function sysErrorLabel(key) {
  switch (key) {
    case 'denied': return sysTstring('لا تملك صلاحية الوصول إلى وحدة التحكم.', 'You do not have access to the control center.');
    case 'disabled': return sysTstring('وحدة تحكم المسؤول غير مُفعّلة على هذا الخادم.', 'Admin console is disabled on this server.');
    case 'network': return sysTstring('تعذّر الاتصال بالخادم.', 'Could not reach the server.');
    case 'not_found': return sysTstring('نقطة النهاية غير متوفرة.', 'Endpoint not available.');
    case 'section_failed': return sysTstring('تعذّر عرض هذا القسم.', 'Could not render this section.');
    default: return sysTstring('حدث خطأ أثناء تحميل البيانات.', 'An error occurred while loading data.');
  }
}

/* ---------- 5. fetch + cache ---------- */
function sysFetch(endpoint, force) {
  var key = String(endpoint || '');
  if (!key) return Promise.reject(new Error('bad_endpoint'));
  if (!force && Object.prototype.hasOwnProperty.call(sysState.cache, key)) return Promise.resolve(sysState.cache[key]);
  var t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  return fetch('/api/admin-console/' + key, {
    credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }
  }).then(function (res) {
    var t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    sysState.lastLatencyMs = Math.max(0, Math.round(t1 - t0));
    return res.json().catch(function () { return null; }).then(function (data) {
      if (res.status === 403) {
        var denied = new Error('admin_forbidden');
        denied.status = 403;
        denied.code = (data && data.code) || 'admin_forbidden';
        throw denied;
      }
      if (!res.ok) {
        var failed = new Error('request_failed');
        failed.status = res.status;
        failed.code = (data && data.code) || ('http_' + res.status);
        throw failed;
      }
      sysState.cache[key] = data;
      sysState.lastRefresh = new Date();
      return data;
    });
  }, function () {
    var netErr = new Error('network');
    netErr.status = 0;
    netErr.code = 'network';
    throw netErr;
  });
}

/* ---------- 6. section loading ---------- */
function sysPaint() { if (view === 'system-console') { try { render(); } catch (e) { /* ignore paint errors */ } } }
function sysSetHash() { try { if (location.hash !== '#system-console') history.replaceState(null, '', '#system-console'); } catch (e) { /* ignore */ } }
function sysClearHash() { try { if (location.hash === '#system-console') history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ } }

function sysLoadSection(section, force) {
  if (!sysIsSection(section)) return Promise.resolve();
  if (sysInFlight === section && !force) return Promise.resolve();
  sysState.section = section;
  sysState.loading = true;
  sysState.error = '';
  sysInFlight = section;
  sysSetHash();
  sysPaint();
  var jobs = sysEndpointList(section).map(function (ep) {
    return sysFetch(ep, force).then(function (data) { return { ok: true, data: data }; },
      function (error) { return { ok: false, error: error }; });
  });
  return Promise.all(jobs).then(function (results) {
    var err = null;
    for (var i = 0; i < results.length; i++) { if (!results[i].ok) { err = results[i].error; break; } }
    if (err) {
      var key = sysErrorKey(err);
      if (key === 'denied' || key === 'disabled') sysDenied();
      else sysState.error = key;
    }
  }, function (err) {
    var key = sysErrorKey(err);
    if (key === 'denied' || key === 'disabled') sysDenied();
    else sysState.error = key;
  }).then(function () {
    if (sysInFlight === section) sysInFlight = null;
    sysState.loading = false;
    sysPaint();
  });
}

/* ---------- 7. access ---------- */
function sysLeaveToHome() {
  sysState.authorized = false;
  sysState.drawer = null;
  sysState.error = '';
  if (view === 'system-console') { view = 'home'; }
  try { render(); } catch (e) { /* ignore */ }
}
function sysDenied() {
  sysState.authorized = false;
  sysState.drawer = null;
  sysState.error = '';
  sysState.loading = false;
  sysState.entering = false;
  sysClearHash();
  try { toast(sysTstring('تم رفض الوصول إلى وحدة التحكم.', 'Control center access denied.')); } catch (e) { /* toast optional */ }
  if (view === 'system-console') { view = 'home'; }
  try { go('home'); } catch (e) { sysLeaveToHome(); }
}
function sysEnter() {
  if (sysState.entering) return Promise.resolve();
  if (sysState.authorized && view === 'system-console') return Promise.resolve();
  sysState.entering = true;
  sysState.error = '';
  return sysFetch('overview', true).then(function () {
    sysState.authorized = true;
    sysState.section = 'overview';
    sysState.lastRefresh = new Date();
    view = 'system-console';
    handlerScope = 'app';
    sysSetHash();
    sysPaint();
  }, function (err) {
    var key = sysErrorKey(err);
    if (key === 'denied' || key === 'disabled') { sysDenied(); return; }
    sysState.authorized = false;
    sysState.error = key;
    sysClearHash();
    if (view === 'system-console') sysLeaveToHome();
    try { toast(sysErrorLabel(key)); } catch (e) { /* toast optional */ }
  }).then(function () { sysState.entering = false; });
}
function sysExit() {
  sysState.authorized = false;
  sysState.drawer = null;
  sysState.error = '';
  sysState.loading = false;
  sysState.entering = false;
  sysClearHash();
  if (view === 'system-console') { view = 'home'; }
  try { go('home'); } catch (e) { sysLeaveToHome(); }
}

/* ---------- 8. render wrapping ---------- */
var sysBaseRender = null;
try { sysBaseRender = render; } catch (e) { sysBaseRender = null; }
try {
  render = function () {
    if (view === 'system-console') { sysRender(); return; }
    if (typeof sysBaseRender === 'function') sysBaseRender();
  };
} catch (e) { /* render must stay writable; console cannot wrap it */ }

function sysRender() {
  if (!sysState.authorized) {
    if (!sysState.entering) { sysEnter(); }
    try { app.innerHTML = sysGateShell(); } catch (e) { /* ignore */ }
    return;
  }
  try {
    handlerScope = 'app';
    if (handlerMaps && handlerMaps.app && typeof handlerMaps.app.clear === 'function') handlerMaps.app.clear();
  } catch (e) { /* handler map optional */ }
  try {
    var root = document.documentElement;
    root.lang = (lang === 'en') ? 'en' : 'ar';
    root.dir = (lang === 'en') ? 'ltr' : 'rtl';
  } catch (e) { /* ignore */ }
  try { app.innerHTML = sysShell() + sysDrawer(); } catch (e) { /* ignore */ }
  sysPostRender();
  sysRestoreFocus();
}
function sysRestoreFocus() {
  if (!sysRefocusSearch) return;
  sysRefocusSearch = false;
  try {
    var input = app.querySelector('.sys-search-input');
    if (input) { input.focus(); var n = input.value.length; input.setSelectionRange(n, n); }
  } catch (e) { /* ignore */ }
}
function sysPostRender() { try { if (typeof sysSectionPostRender === 'function') sysSectionPostRender(); } catch (e) { /* ignore */ } }

/* ---------- 9. shell ---------- */
function sysGateShell() {
  var text = sysState.error ? sysErrorLabel(sysState.error) : sysTstring('جارٍ التحقق من الصلاحية…', 'Verifying access…');
  return '<div class="sys-gate"><div class="sys-gate-card">' +
    '<div class="sys-gate-mark" aria-hidden="true">⌘</div>' +
    '<h2 class="sys-gate-title">' + sysE(sysTstring('وحدة تحكم هندسة Vibe', 'Vibe Engineering Console')) + '</h2>' +
    '<p class="sys-gate-text">' + sysE(text) + '</p></div></div>';
}
function sysSidebar() {
  var nav = SYS_SECTIONS.map(function (s) {
    var active = (s.id === sysState.section);
    return '<button type="button" class="sys-nav-btn' + (active ? ' is-active' : '') + '"' + (active ? ' aria-current="page"' : '') +
      sysOn(function () { sysLoadSection(s.id); }, 'click') +
      '><span class="sys-nav-icon" aria-hidden="true">' + sysE(s.icon) + '</span>' +
      '<span class="sys-nav-text">' + sysE(sysL(s)) + '</span></button>';
  }).join('');
  return '<aside class="sys-sidebar" aria-label="' + sysE(sysTstring('أقسام وحدة التحكم', 'Console sections')) + '">' +
    '<div class="sys-brand"><span class="sys-brand-mark" aria-hidden="true">⌘</span>' +
    '<span class="sys-brand-text"><strong>Vibe Engineering</strong><small>System Control Center</small></span></div>' +
    '<nav class="sys-nav">' + nav + '</nav>' +
    '<div class="sys-sidebar-foot">' + sysE(sysTstring('قراءة فقط', 'READ ONLY')) + '</div></aside>';
}
function sysTopbar(meta) {
  var last = sysState.lastRefresh ? sysFmtTime(sysState.lastRefresh) : '—';
  return '<header class="sys-topbar">' +
    '<div class="sys-topbar-heading"><span class="sys-topbar-title">' + sysE(meta.title) + '</span>' +
    '<span class="sys-topbar-path">#system-console</span></div>' +
    '<div class="sys-topbar-tools">' +
      '<label class="sys-field"><span class="sys-field-label">' + sysE(sysTstring('بحث', 'Search')) + '</span>' +
      '<input class="sys-input sys-search-input" type="search" autocomplete="off" spellcheck="false" value="' + sysE(sysState.search) + '"' +
      ' placeholder="' + sysE(sysTstring('ابحث في القسم الحالي', 'Search current section')) + '"' + sysOn(sysOnSearchInput, 'input') + '></label>' +
      '<button type="button" class="sys-btn"' + sysOn(function () { sysLoadSection(sysState.section, true); }, 'click') + '>' +
      sysE(sysTstring('تحديث', 'Refresh')) + '</button>' +
      '<button type="button" class="sys-btn sys-btn-ghost"' + sysOn(function () { sysExit(); }, 'click') + '>' +
      sysE(sysTstring('خروج', 'Exit')) + '</button>' +
    '</div>' +
    '<div class="sys-topbar-meta">' + sysBadge(sysTstring('محمي للمسؤول', 'Admin protected'), 'is-amber') +
      sysBadge(SYS_BRANCH, 'is-ghost') + sysBadge('ChatGPT Sites', 'is-ghost') +
      sysBadge(sysTstring('آخر تحديث', 'Last refresh') + ': ' + last, 'is-ghost') +
      (sysState.lastLatencyMs === null ? '' : sysBadge(sysNumber(sysState.lastLatencyMs) + ' ms', 'is-ghost')) +
    '</div></header>';
}
function sysOnSearchInput(e) {
  try { sysState.search = (e && e.target) ? String(e.target.value) : ''; } catch (err) { sysState.search = ''; }
  sysRefocusSearch = true;
  sysPaint();
}
function sysShell() {
  var meta = sysSectionMeta(sysState.section);
  var body;
  if (sysState.loading) { body = sysLoading(); }
  else {
    body = (sysState.error ? sysWarning(sysErrorLabel(sysState.error), 'error') : '') + sysRenderSection();
  }
  return '<div class="sys-shell" data-section="' + sysE(sysState.section) + '">' +
    sysSidebar() +
    '<div class="sys-content">' + sysTopbar(meta) +
      '<main class="sys-main" role="main">' +
        '<header class="sys-page-head">' +
          '<h1 class="sys-page-title">' + sysE(meta.title) + '</h1>' +
          '<p class="sys-page-sub">' + sysE(meta.sub) + '</p>' +
          '<div class="sys-page-status">' +
            sysBadge(sysState.authorized ? sysTstring('مصرّح', 'Authorized') : sysTstring('غير مصرّح', 'Not authorized'), sysState.authorized ? 'is-green' : 'is-red') +
            sysBadge(sysTstring('قراءة فقط', 'Read only'), 'is-ghost') +
            sysBadge(SYS_BRANCH, 'is-ghost') +
          '</div>' +
        '</header>' +
        '<div class="sys-body">' + body + '</div>' +
      '</main>' +
      '<footer class="sys-footer">' +
        '<span class="sys-footer-item">' + sysE(SYS_REPO) + '</span>' +
        '<span class="sys-footer-item">' + sysE(SYS_BRANCH) + '</span>' +
        '<span class="sys-footer-item">' + sysE(sysTstring('قراءة فقط — بدون أسرار أو بيانات شخصية', 'Read only — no secrets, no personal data')) + '</span>' +
      '</footer>' +
    '</div></div>';
}

/* ---------- 10. section dispatch ---------- */
function sysRenderSection() {
  var out = '';
  try {
    switch (sysState.section) {
      case 'overview': if (typeof sysSectionOverview === 'function') out = sysSectionOverview(); break;
      case 'architecture': if (typeof sysSectionArchitecture === 'function') out = sysSectionArchitecture(); break;
      case 'database': if (typeof sysSectionDatabase === 'function') out = sysSectionDatabase(); break;
      case 'auth': if (typeof sysSectionAuth === 'function') out = sysSectionAuth(); break;
      case 'rooms': if (typeof sysSectionRooms === 'function') out = sysSectionRooms(); break;
      case 'messaging': if (typeof sysSectionMessaging === 'function') out = sysSectionMessaging(); break;
      case 'realtime': if (typeof sysSectionRealtime === 'function') out = sysSectionRealtime(); break;
      case 'storage': if (typeof sysSectionStorage === 'function') out = sysSectionStorage(); break;
      case 'apis': if (typeof sysSectionApis === 'function') out = sysSectionApis(); break;
      case 'ai': if (typeof sysSectionAi === 'function') out = sysSectionAi(); break;
      case 'workflows': if (typeof sysSectionWorkflows === 'function') out = sysSectionWorkflows(); break;
      case 'security': if (typeof sysSectionSecurity === 'function') out = sysSectionSecurity(); break;
      case 'monitoring': if (typeof sysSectionMonitoring === 'function') out = sysSectionMonitoring(); break;
      case 'deployments': if (typeof sysSectionDeployments === 'function') out = sysSectionDeployments(); break;
      case 'logs': if (typeof sysSectionLogs === 'function') out = sysSectionLogs(); break;
      case 'settings': if (typeof sysSectionSettings === 'function') out = sysSectionSettings(); break;
      default: out = '';
    }
  } catch (e) { out = sysWarning(sysErrorLabel('section_failed'), 'error'); }
  if (!out) out = sysEmpty(sysTstring('قريباً', 'Coming soon'), sysTstring('هذا القسم غير متاح بعد.', 'This section is not available yet.'));
  return out;
}

/* ---------- 11. drawer ---------- */
function sysOpenDrawer(type, payload) { sysState.drawer = { type: String(type || ''), payload: payload || null }; sysPaint(); }
function sysCloseDrawer() { sysState.drawer = null; sysPaint(); }
function sysDrawerOverlayClick(e) {
  try { if (e && e.target && e.target.className && String(e.target.className).indexOf('sys-drawer-overlay') !== -1) sysCloseDrawer(); } catch (err) { /* ignore */ }
}
function sysDrawerTitle(d) {
  var type = String((d && d.type) || '').toLowerCase();
  var map = {
    table: ['تفاصيل الجدول', 'Table details'], record: ['تفاصيل السجل', 'Record details'],
    endpoint: ['تفاصيل النقطة', 'Endpoint details'], room: ['تفاصيل الغرفة', 'Room details'],
    message: ['تفاصيل الرسالة', 'Message details'], log: ['تفاصيل السجل', 'Log entry'],
    workflow: ['تفاصيل المهمة', 'Workflow details'], risk: ['تفاصيل المخاطرة', 'Risk details'],
    file: ['تفاصيل الملف', 'File details'], channel: ['تفاصيل القناة', 'Channel details'],
    setting: ['تفاصيل الإعداد', 'Setting details'], job: ['تفاصيل التنفيذ', 'Job details']
  };
  return map[type] ? sysTstring(map[type][0], map[type][1]) : sysTstring('التفاصيل', 'Details');
}
function sysDrawerFallback(d) {
  var payload = d && d.payload;
  if (!payload || typeof payload !== 'object') {
    return sysEmpty(sysTstring('لا تفاصيل', 'No details'), sysTstring('لا توجد بيانات إضافية.', 'No additional data.'));
  }
  var skip = /(pass|secret|token|api_?key|authorization|cookie|email|phone|user_?id|owner_?id)/i;
  var keys = Object.keys(payload), rows = '';
  for (var i = 0; i < keys.length && i < 80; i++) {
    var k = keys[i];
    if (skip.test(k)) continue;
    var v = payload[k], tv = typeof v, txt;
    if (v === null || v === undefined) txt = '—';
    else if (tv === 'string') txt = v.slice(0, 400);
    else if (tv === 'number' || tv === 'boolean') txt = String(v);
    else if (Array.isArray(v)) txt = sysTstring('عناصر', 'items') + ' (' + v.length + ')';
    else txt = '{…}';
    rows += '<div class="sys-kv"><span class="sys-k">' + sysE(k) + '</span><span class="sys-v">' + sysE(txt) + '</span></div>';
  }
  if (!rows) return sysEmpty(sysTstring('لا تفاصيل', 'No details'), sysTstring('لا توجد بيانات إضافية.', 'No additional data.'));
  return '<div class="sys-kv-list">' + rows + '</div>';
}
function sysDrawer() {
  var d = sysState.drawer;
  if (!d) return '';
  var body = '';
  if (typeof sysDrawerContent === 'function') {
    try { body = sysDrawerContent(d) || ''; } catch (e) { body = sysDrawerFallback(d); }
  } else { body = sysDrawerFallback(d); }
  var title = sysDrawerTitle(d);
  return '<div class="sys-drawer-layer"><div class="sys-drawer-overlay"' + sysOn(sysDrawerOverlayClick, 'click') + '></div>' +
    '<aside class="sys-drawer" role="dialog" aria-modal="true" aria-label="' + sysE(title) + '">' +
      '<header class="sys-drawer-head"><h3 class="sys-drawer-title">' + sysE(title) + '</h3>' +
      '<button type="button" class="sys-icon-btn"' + sysOn(function () { sysCloseDrawer(); }, 'click') +
      ' aria-label="' + sysE(sysTstring('إغلاق', 'Close')) + '">×</button></header>' +
      '<div class="sys-drawer-body">' + body + '</div></aside></div>';
}

/* ---------- 12. hidden entry ---------- */
function sysOnHashChange() {
  if (location.hash === '#system-console') { if (view !== 'system-console') sysEnter(); }
  else if (view === 'system-console') sysLeaveToHome();
}
function sysOnKeydown(e) {
  try {
    if (e.key === 'Escape' && sysState.drawer) { sysCloseDrawer(); return; }
    if (e.altKey && e.shiftKey && (e.code === 'KeyV' || e.key === 'V' || e.key === 'v' || e.key === 'ض')) {
      if (e.preventDefault) e.preventDefault();
      if (view === 'system-console') sysExit(); else sysEnter();
    }
  } catch (err) { /* ignore */ }
}
function sysBindEntry() {
  if (sysEntryBound) return;
  sysEntryBound = true;
  try {
    window.addEventListener('hashchange', sysOnHashChange, false);
    window.addEventListener('keydown', sysOnKeydown, false);
  } catch (e) { /* ignore */ }
}
function sysBootEntry() {
  sysBindEntry();
  if (location.hash === '#system-console') sysEnter();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', sysBootEntry, { once: true });
} else if (typeof queueMicrotask === 'function') {
  queueMicrotask(sysBootEntry);
} else {
  setTimeout(sysBootEntry, 0);
}
