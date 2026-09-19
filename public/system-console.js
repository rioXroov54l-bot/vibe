/* ============================================================================
 * Vibe Engineering Console — public/system-console.js
 * Read-only operator console. Injected inside the existing app IIFE closure.
 * Available from closure: render, go, view, app, t(ar,en), esc(), on(cb,event),
 *                         handlerScope, handlerMaps, lang, toast
 * CSP-safe: no inline event attributes, no style=, no element.style, no eval.
 * ==========================================================================*/
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Constants
   * ------------------------------------------------------------------ */
  var SYS_API_BASE  = '/api/admin-console/';
  var SYS_CSS_HREF  = '/system-console.css';
  var SYS_BRAND     = 'Vibe Engineering';
  var SYS_HASH      = '#system-console';
  var SYS_VIEW_ID   = 'system-console';
  var NODE_W        = 164;
  var NODE_H        = 56;

  var SYS_SECTIONS = [
    { id: 'overview',     icon: '\u25A4', ar: 'نظرة عامة',       en: 'Overview',     sar: 'ملخص النظام',         sen: 'System summary' },
    { id: 'architecture', icon: '\u29C9', ar: 'البنية المعمارية', en: 'Architecture', sar: 'خريطة المكونات',      sen: 'Component map' },
    { id: 'database',     icon: '\u25A6', ar: 'قاعدة البيانات',   en: 'Database',     sar: 'الجداول والعلاقات',   sen: 'Tables & relations' },
    { id: 'auth',         icon: '\u26BF', ar: 'المصادقة',         en: 'Auth',         sar: 'الجلسات والتحقق',     sen: 'Sessions & verification' },
    { id: 'rooms',        icon: '\u2302', ar: 'الغرف',            en: 'Rooms',        sar: 'الغرف القديمة',       sen: 'Legacy rooms' },
    { id: 'messaging',    icon: '\u2709', ar: 'الرسائل',          en: 'Messaging',    sar: 'تدفق الرسائل',        sen: 'Message flow' },
    { id: 'realtime',     icon: '\u2248', ar: 'الوقت الحقيقي',    en: 'Realtime',     sar: 'الاتصالات الحية',     sen: 'Live connections' },
    { id: 'storage',      icon: '\u25A3', ar: 'التخزين',          en: 'Storage',      sar: 'الملفات والأصول',     sen: 'Files & assets' },
    { id: 'apis',         icon: '\u21C4', ar: 'واجهات API',       en: 'APIs',         sar: 'نقاط النهاية',        sen: 'Endpoints' },
    { id: 'ai',           icon: '\u2736', ar: 'الذكاء الاصطناعي', en: 'AI',           sar: 'مركز الوكلاء',        sen: 'Agent center' },
    { id: 'workflows',    icon: '\u2699', ar: 'سير العمل',        en: 'Workflows',    sar: 'الأتمتة',             sen: 'Automation' },
    { id: 'security',     icon: '\u26E8', ar: 'الأمان',           en: 'Security',     sar: 'التقوية',             sen: 'Hardening' },
    { id: 'monitoring',   icon: '\u25D4', ar: 'المراقبة',         en: 'Monitoring',   sar: 'القياسات',            sen: 'Metrics' },
    { id: 'deployments',  icon: '\u25B2', ar: 'النشر',            en: 'Deployments',  sar: 'خط الأنابيب',         sen: 'Pipeline' },
    { id: 'logs',         icon: '\u2261', ar: 'السجلات',          en: 'Logs',         sar: 'أحداث الكونسول',      sen: 'Console events' },
    { id: 'settings',     icon: '\u2691', ar: 'الإعدادات',        en: 'Settings',     sar: 'إعدادات للقراءة فقط', sen: 'Read-only settings' }
  ];

  var SYS_SECTION_ENDPOINTS = {
    overview:     ['overview'],
    architecture: ['architecture'],
    database:     ['schema'],
    auth:         ['security', 'apis', 'schema'],
    rooms:        ['rooms'],
    messaging:    ['schema', 'apis'],
    realtime:     ['architecture'],
    storage:      ['storage'],
    apis:         ['apis'],
    ai:           ['ai'],
    workflows:    ['overview', 'ai'],
    security:     ['security'],
    monitoring:   ['monitoring'],
    deployments:  ['overview'],
    logs:         ['monitoring'],
    settings:     ['overview']
  };

  var SYS_NODE_POS = {
    client:        [70, 70],
    worker:        [330, 70],
    admin_console: [590, 40],
    supabase_auth: [330, 250],
    postgrest:     [590, 250],
    realtime:      [850, 250],
    storage:       [850, 70],
    profiles:      [70, 430],
    chat:          [330, 430],
    rooms:         [590, 430],
    notifications: [850, 430],
    spotify:       [70, 610],
    resend:        [330, 610],
    deepseek:      [590, 610],
    github:        [850, 610],
    cinema:        [1010, 250]
  };

  var SYS_NODE_DEFAULT = [
    { id: 'client',        label: 'Client',        group: 'client' },
    { id: 'worker',        label: 'Worker',        group: 'backend' },
    { id: 'admin_console', label: 'Admin Console', group: 'console' },
    { id: 'supabase_auth', label: 'Supabase Auth', group: 'supabase' },
    { id: 'postgrest',     label: 'PostgREST',     group: 'supabase' },
    { id: 'realtime',      label: 'Realtime',      group: 'supabase' },
    { id: 'storage',       label: 'Storage',       group: 'supabase' },
    { id: 'profiles',      label: 'profiles',      group: 'data' },
    { id: 'chat',          label: 'chat',          group: 'data' },
    { id: 'rooms',         label: 'rooms',         group: 'data' },
    { id: 'notifications', label: 'notifications', group: 'data' },
    { id: 'spotify',       label: 'Spotify',       group: 'external' },
    { id: 'resend',        label: 'Resend',        group: 'external' },
    { id: 'deepseek',      label: 'DeepSeek',      group: 'external' },
    { id: 'github',        label: 'GitHub',        group: 'external' },
    { id: 'cinema',        label: 'Cinema',        group: 'media' }
  ];

  var SYS_DEFAULT_EDGES = [
    ['client', 'worker'], ['client', 'supabase_auth'], ['client', 'realtime'], ['client', 'storage'],
    ['worker', 'postgrest'], ['worker', 'realtime'], ['worker', 'storage'],
    ['admin_console', 'worker'], ['admin_console', 'postgrest'], ['admin_console', 'realtime'],
    ['supabase_auth', 'profiles'], ['postgrest', 'profiles'], ['postgrest', 'chat'], ['postgrest', 'rooms'],
    ['realtime', 'chat'], ['realtime', 'rooms'], ['chat', 'notifications'], ['rooms', 'notifications'],
    ['worker', 'spotify'], ['worker', 'resend'], ['worker', 'deepseek'], ['deepseek', 'github'],
    ['postgrest', 'cinema'], ['chat', 'cinema']
  ];

  /* ------------------------------------------------------------------ *
   * Safe helpers
   * ------------------------------------------------------------------ */
  function sysEsc(v) {
    try { return esc(v === null || v === undefined ? '' : String(v)); }
    catch (e) { return ''; }
  }

  function sysGet(obj, path, dflt) {
    if (obj === null || obj === undefined) return dflt;
    var parts = String(path).split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur === null || cur === undefined) return dflt;
      cur = cur[parts[i]];
    }
    return cur === null || cur === undefined ? dflt : cur;
  }

  function sysTr(ar, en) {
    try { return t(ar, en); } catch (e) { return lang === 'ar' ? ar : en; }
  }

  function sysNum(v) {
    if (v === null || v === undefined || v === '') return '\u2014';
    var n = Number(v);
    return isFinite(n) ? String(n) : '\u2014';
  }

  function sysFirstNum() {
    for (var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      if (a === null || a === undefined || a === '') continue;
      var n = Number(a);
      if (isFinite(n)) return n;
    }
    return null;
  }

  function sysFmtDate(v) {
    if (!v) return '\u2014';
    var d;
    try { d = new Date(v); } catch (e) { return '\u2014'; }
    if (!d || isNaN(d.getTime())) return '\u2014';
    try {
      return d.toLocaleString(lang === 'ar' ? 'ar' : 'en-GB', { hour12: false });
    } catch (e) { return d.toISOString(); }
  }

  function sysFmtTime(v) {
    if (!v) return '\u2014';
    var d;
    try { d = new Date(v); } catch (e) { return '\u2014'; }
    if (!d || isNaN(d.getTime())) return '\u2014';
    try { return d.toLocaleTimeString(lang === 'ar' ? 'ar' : 'en-GB', { hour12: false }); }
    catch (e) { return '\u2014'; }
  }

  function sysStatusClass(s) {
    var v = String(s === null || s === undefined ? '' : s).toLowerCase().trim();
    if (v === 'passed' || v === 'pass' || v === 'ok' || v === 'configured' || v === 'enabled' ||
        v === 'known' || v === 'healthy' || v === 'online' || v === 'true' || v === 'active' ||
        v === 'verified' || v === 'protected' || v === 'live') return 'ok';
    if (v === 'warning' || v === 'warn' || v === 'degraded' || v === 'partial' || v === 'review') return 'warn';
    if (v === 'failed' || v === 'fail' || v === 'error' || v === 'offline' || v === 'danger' ||
        v === 'disabled' || v === 'missing') return 'bad';
    return 'unknown';
  }

  function sysRiskClass(r) {
    var v = String(r === null || r === undefined ? '' : r).toLowerCase().trim();
    if (v === 'high' || v === 'critical' || v === 'severe') return 'bad';
    if (v === 'medium' || v === 'moderate' || v === 'elevated') return 'warn';
    if (v === 'low' || v === 'minimal') return 'ok';
    return 'unknown';
  }

  function sysMethodClass(m) {
    var v = String(m === null || m === undefined ? '' : m).toUpperCase().trim();
    if (v === 'GET') return 'get';
    if (v === 'POST') return 'post';
    if (v === 'PUT' || v === 'PATCH') return 'put';
    if (v === 'DELETE') return 'delete';
    return 'other';
  }

  function sysBadge(text, cls) {
    var kind = cls || sysStatusClass(text);
    return '<span class="sys-badge sys-badge-' + kind + '">' + sysEsc(text) + '</span>';
  }

  function sysChip(label, kind) {
    return '<span class="sys-chip sys-chip-' + (kind || 'unknown') + '">' + sysEsc(label) + '</span>';
  }

  function sysKpi(label, value, hint) {
    return '<div class="sys-kpi">' +
      '<div class="sys-kpi-value">' + sysEsc(value) + '</div>' +
      '<div class="sys-kpi-label">' + sysEsc(label) + '</div>' +
      (hint ? '<div class="sys-kpi-hint">' + sysEsc(hint) + '</div>' : '') +
      '</div>';
  }

  function sysCard(title, body, extraClass) {
    return '<section class="sys-card' + (extraClass ? ' ' + extraClass : '') + '">' +
      (title ? '<h3 class="sys-card-title">' + sysEsc(title) + '</h3>' : '') +
      '<div class="sys-card-body">' + body + '</div></section>';
  }

  function sysEmpty(msg) {
    return '<div class="sys-empty">' + sysEsc(msg || sysTr('لا توجد بيانات', 'No data')) + '</div>';
  }

  function sysLoadingHtml() {
    return '<div class="sys-loading" role="status">' + sysEsc(sysTr('جارٍ التحميل…', 'Loading…')) + '</div>';
  }

  function sysErrorHtml(msg) {
    return '<div class="sys-error" role="alert">' + sysEsc(msg || sysTr('حدث خطأ', 'Error')) + '</div>';
  }

  function sysMatch(str) {
    var q = sysState.search.trim().toLowerCase();
    if (!q) return true;
    return String(str === null || str === undefined ? '' : str).toLowerCase().indexOf(q) !== -1;
  }

  function sysAnyMatch() {
    for (var i = 0; i < arguments.length; i++) {
      if (sysMatch(arguments[i])) return true;
    }
    return false;
  }

  function sysReadOnlyNote(text) {
    return '<p class="sys-note">' + sysEsc(text || sysTr('عرض للقراءة فقط — بدون تنفيذ.', 'Read-only view — no execution.')) + '</p>';
  }

  function sysFlow(steps) {
    var parts = [];
    for (var i = 0; i < steps.length; i++) {
      if (i) parts.push('<span class="sys-flow-arrow" aria-hidden="true">\u2192</span>');
      var st = steps[i].status || 'unknown';
      parts.push('<span class="sys-flow-step sys-flow-' + sysStatusClass(st) + '">' +
        '<span class="sys-flow-label">' + sysEsc(steps[i].label) + '</span>' +
        sysBadge(st) + '</span>');
    }
    return '<div class="sys-flow">' + parts.join('') + '</div>';
  }

  function sysList(items) {
    if (!items || !items.length) return sysEmpty();
    return '<ul class="sys-list">' + items.map(function (x) {
      return '<li class="sys-list-item">' + sysEsc(x) + '</li>';
    }).join('') + '</ul>';
  }

  /* ------------------------------------------------------------------ *
   * State
   * ------------------------------------------------------------------ */
  var sysState = {
    authorized: false,
    loading: false,
    error: null,
    section: 'overview',
    search: '',
    searchFocus: false,
    drawer: null,
    cache: {},
    errs: {},
    sectionLoading: {},
    lastRefresh: null,
    lastLatency: null,
    zoom: 100,
    groupFilter: 'all'
  };

  /* ------------------------------------------------------------------ *
   * Stylesheet injection (once, external, no inline style attribute)
   * ------------------------------------------------------------------ */
  function sysInjectStyles() {
    if (document.querySelector('link[data-sys-console]')) return;
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', SYS_CSS_HREF);
    link.setAttribute('data-sys-console', '1');
    document.head.appendChild(link);
  }

  /* ------------------------------------------------------------------ *
   * Fetch layer
   * ------------------------------------------------------------------ */
  function sysFetch(endpoint, force) {
    var key = String(endpoint);
    if (!force && Object.prototype.hasOwnProperty.call(sysState.cache, key)) {
      return Promise.resolve(sysState.cache[key]);
    }
    var started = (window.performance && performance.now) ? performance.now() : Date.now();
    return fetch(SYS_API_BASE + key, {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      var ended = (window.performance && performance.now) ? performance.now() : Date.now();
      sysState.lastLatency = Math.max(0, Math.round(ended - started));
      if (res.status === 403) {
        var fe = new Error('forbidden'); fe.status = 403; fe.safe = sysTr('ممنوع (403)', 'Forbidden (403)'); throw fe;
      }
      if (!res.ok) {
        var he = new Error('http'); he.status = res.status; he.safe = 'HTTP ' + res.status; throw he;
      }
      return res.json().then(function (data) {
        sysState.cache[key] = data;
        delete sysState.errs[key];
        return data;
      }).catch(function () {
        var je = new Error('json'); je.safe = sysTr('استجابة غير صالحة', 'Invalid response'); throw je;
      });
    }, function () {
      var ne = new Error('network'); ne.safe = sysTr('خطأ شبكة', 'Network error'); throw ne;
    });
  }

  /* ------------------------------------------------------------------ *
   * Section loading
   * ------------------------------------------------------------------ */
  function sysLoadSection(section) {
    var eps = SYS_SECTION_ENDPOINTS[section] || [];
    var missing = eps.filter(function (e) { return !Object.prototype.hasOwnProperty.call(sysState.cache, e); });
    if (!missing.length) { if (sysState.section === section) render(); return; }
    sysState.loading = true;
    sysState.sectionLoading[section] = true;
    render();
    Promise.all(missing.map(function (e) {
      return sysFetch(e).then(function () { return true; })
        .catch(function (err) { sysState.errs[e] = (err && err.safe) || 'error'; return false; });
    })).then(function (results) {
      sysState.sectionLoading[section] = false;
      sysState.loading = false;
      if (results.indexOf(true) !== -1) sysState.lastRefresh = Date.now();
      if (sysState.section === section) render();
    });
  }

  function sysRefresh() {
    var eps = SYS_SECTION_ENDPOINTS[sysState.section] || [];
    eps.forEach(function (e) { delete sysState.cache[e]; delete sysState.errs[e]; });
    sysState.search = '';
    sysLoadSection(sysState.section);
  }

  /* ------------------------------------------------------------------ *
   * Access control / entry / exit
   * ------------------------------------------------------------------ */
  function sysClearHash() {
    try { history.replaceState(null, '', location.pathname + location.search); }
    catch (e) { try { location.hash = ''; } catch (e2) {} }
  }

  function systemConsoleEnter() {
    if (sysState.authorized) { view = SYS_VIEW_ID; render(); return; }
    sysState.loading = true;
    sysState.error = null;
    render();
    sysFetch('overview', true).then(function () {
      sysState.authorized = true;
      sysState.loading = false;
      sysState.lastRefresh = Date.now();
      view = SYS_VIEW_ID;
      render();
      sysLoadSection(sysState.section);
    }).catch(function (err) {
      sysState.authorized = false;
      sysState.loading = false;
      sysClearHash();
      if (err && err.status === 403) {
        try { toast(sysTr('تم رفض الوصول إلى وحدة التحكم الهندسية', 'Engineering Console access denied')); } catch (e) {}
      } else {
        try { toast(sysTr('تعذّر الوصول إلى وحدة التحكم الهندسية', 'Engineering Console unavailable')); } catch (e) {}
      }
      if (view === SYS_VIEW_ID) { view = 'home'; }
      render();
    });
  }

  function systemConsoleExit() {
    sysClearHash();
    sysState.authorized = false;
    sysState.drawer = null;
    try { go('home'); } catch (e) { view = 'home'; render(); }
  }

  /* ------------------------------------------------------------------ *
   * Render wrapper (no recursion)
   * ------------------------------------------------------------------ */
  var sysBaseRender = render;
  render = function () {
    if (view === SYS_VIEW_ID) { systemConsoleRender(); return; }
    sysBaseRender();
  };

  function sysClearHandlers() {
    try {
      if (handlerMaps && handlerMaps.app) {
        if (Array.isArray(handlerMaps.app)) { handlerMaps.app.length = 0; }
        else { for (var k in handlerMaps.app) { if (Object.prototype.hasOwnProperty.call(handlerMaps.app, k)) delete handlerMaps.app[k]; } }
      }
    } catch (e) {}
  }

  function systemConsoleRender() {
    sysInjectStyles();
    document.documentElement.lang = (lang === 'ar') ? 'ar' : 'en';
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    sysClearHandlers();

    if (!sysState.authorized) {
      app.innerHTML = '<div class="sys-root sys-gate"><div class="sys-gate-box">' +
        (sysState.loading ? sysLoadingHtml() : sysErrorHtml(sysTr('غير مصرّح', 'Unauthorized'))) +
        '</div></div>';
      return;
    }

    app.innerHTML =
      '<div class="sys-root">' +
        sysSidebarHtml() +
        '<main class="sys-main">' +
          sysTopbarHtml() +
          '<div class="sys-content">' + sysSectionHtml() + '</div>' +
        '</main>' +
        sysDrawerHtml() +
      '</div>';

    sysAfterRender();
  }

  /* ------------------------------------------------------------------ *
   * Sidebar
   * ------------------------------------------------------------------ */
  function sysSidebarHtml() {
    var items = SYS_SECTIONS.map(function (s) {
      var active = (s.id === sysState.section) ? ' sys-nav-active' : '';
      return '<button type="button" class="sys-nav-item' + active + '" ' +
        on(function () { sysGoSection(s.id); }, 'click') + '>' +
        '<span class="sys-nav-ico" aria-hidden="true">' + s.icon + '</span>' +
        '<span class="sys-nav-label">' + sysEsc(sysTr(s.ar, s.en)) + '</span>' +
        '</button>';
    }).join('');

    return '<aside class="sys-sidebar">' +
      '<div class="sys-brand">' +
        '<div class="sys-brand-title">' + sysEsc(SYS_BRAND) + '</div>' +
        '<div class="sys-brand-sub">' + sysEsc(sysTr('مركز التحكم بالنظام', 'System Control Center')) + '</div>' +
      '</div>' +
      '<nav class="sys-nav" aria-label="' + sysEsc(sysTr('أقسام الكونسول', 'Console sections')) + '">' + items + '</nav>' +
      '<div class="sys-sidebar-footer">' + sysBadge(sysTr('للقراءة فقط', 'READ ONLY'), 'ro') + '</div>' +
      '</aside>';
  }

  function sysGoSection(id) {
    if (sysState.section !== id) {
      sysState.section = id;
      sysState.drawer = null;
      sysState.groupFilter = 'all';
      render();
      sysLoadSection(id);
    }
  }

  /* ------------------------------------------------------------------ *
   * Topbar
   * ------------------------------------------------------------------ */
  function sysTopbarHtml() {
    var sec = null;
    for (var i = 0; i < SYS_SECTIONS.length; i++) { if (SYS_SECTIONS[i].id === sysState.section) sec = SYS_SECTIONS[i]; }
    if (!sec) sec = SYS_SECTIONS[0];

    var ov = sysState.cache.overview || {};
    var chips = [sysChip(sysTr('محمي للمشرفين', 'Admin protected'), 'ok')];
    var branch = sysGet(ov, 'build.branch', sysGet(ov, 'branch', null));
    var hosting = sysGet(ov, 'build.hosting', sysGet(ov, 'hosting', null));
    if (branch) chips.push(sysChip(sysTr('فرع: ', 'Branch: ') + branch, 'info'));
    else chips.push(sysChip(sysTr('الفرع: غير معروف', 'Branch: unknown'), 'unknown'));
    if (hosting) chips.push(sysChip(sysTr('استضافة: ', 'Hosting: ') + hosting, 'info'));
    else chips.push(sysChip(sysTr('الاستضافة: غير معروفة', 'Hosting: unknown'), 'unknown'));

    var reachable = !sysState.errs.overview && Object.prototype.hasOwnProperty.call(sysState.cache, 'overview');
    chips.push(sysChip(reachable ? sysTr('الخلفية: موصولة', 'Backend: reachable') : sysTr('الخلفية: غير معروفة', 'Backend: unknown'),
      reachable ? 'ok' : 'unknown'));

    var last = sysState.lastRefresh ? sysFmtTime(sysState.lastRefresh) : '\u2014';

    return '<header class="sys-topbar">' +
      '<div class="sys-topbar-left">' +
        '<h1 class="sys-topbar-title">' + sysEsc(sysTr(sec.ar, sec.en)) + '</h1>' +
        '<p class="sys-topbar-sub">' + sysEsc(sysTr(sec.sar, sec.sen)) + '</p>' +
      '</div>' +
      '<div class="sys-topbar-right">' +
        '<div class="sys-chips">' + chips.join('') + '</div>' +
        '<label class="sys-search-wrap">' +
          '<span class="sys-search-label">' + sysEsc(sysTr('بحث', 'Search')) + '</span>' +
          '<input type="search" class="sys-search" value="' + sysEsc(sysState.search) + '" ' +
            'placeholder="' + sysEsc(sysTr('تصفية البطاقات والجداول والنقاط…', 'Filter cards, tables, endpoints…')) + '" ' +
            on(function (ev) { sysState.search = ev.target.value; sysState.searchFocus = true; render(); }, 'input') + '>' +
        '</label>' +
        '<span class="sys-refresh-time">' + sysEsc(sysTr('آخر تحديث: ', 'Last refresh: ') + last) + '</span>' +
        '<button type="button" class="sys-btn sys-btn-refresh" ' + on(sysRefresh, 'click') + '>' +
          sysEsc(sysTr('تحديث', 'Refresh')) + '</button>' +
        '<button type="button" class="sys-btn sys-btn-exit" ' + on(systemConsoleExit, 'click') + '>' +
          sysEsc(sysTr('خروج', 'Exit')) + '</button>' +
      '</div>' +
      '</header>';
  }

  /* ------------------------------------------------------------------ *
   * Section dispatch
   * ------------------------------------------------------------------ */
  function sysSectionHtml() {
    switch (sysState.section) {
      case 'overview':     return sysOverviewHtml();
      case 'architecture': return sysArchitectureHtml();
      case 'database':     return sysDatabaseHtml();
      case 'auth':         return sysAuthHtml();
      case 'rooms':        return sysRoomsHtml();
      case 'messaging':    return sysMessagingHtml();
      case 'realtime':     return sysRealtimeHtml();
      case 'storage':      return sysStorageHtml();
      case 'apis':         return sysApisHtml();
      case 'ai':           return sysAiHtml();
      case 'workflows':    return sysWorkflowsHtml();
      case 'security':     return sysSecurityHtml();
      case 'monitoring':   return sysMonitoringHtml();
      case 'deployments':  return sysDeploymentsHtml();
      case 'logs':         return sysLogsHtml();
      case 'settings':     return sysSettingsHtml();
      default:             return sysEmpty(sysTr('قسم غير معروف', 'Unknown section'));
    }
  }

  /* ------------------------------------------------------------------ *
   * Data accessors
   * ------------------------------------------------------------------ */
  function sysTables() {
    var sc = sysState.cache.schema;
    if (!sc) return [];
    if (Array.isArray(sc.tables)) return sc.tables;
    if (Array.isArray(sc)) return sc;
    return [];
  }

  function sysApis() {
    var a = sysState.cache.apis;
    if (!a) return [];
    if (Array.isArray(a)) return a;
    if (Array.isArray(a.endpoints)) return a.endpoints;
    if (Array.isArray(a.apis)) return a.apis;
    if (Array.isArray(a.routes)) return a.routes;
    return [];
  }

  function sysApiNorm(e) {
    if (typeof e === 'string') return { method: '', path: e, auth: '', domain: '', risk: '', notes: '' };
    return {
      method: String(sysGet(e, 'method', sysGet(e, 'verb', ''))).toUpperCase(),
      path: String(sysGet(e, 'path', sysGet(e, 'route', sysGet(e, 'url', '')))),
      auth: String(sysGet(e, 'auth', sysGet(e, 'authentication', sysGet(e, 'requiresAuth', sysGet(e, 'requires_auth', ''))))),
      domain: String(sysGet(e, 'domain', sysGet(e, 'group', sysGet(e, 'area', '')))),
      risk: String(sysGet(e, 'risk', sysGet(e, 'risk_level', ''))),
      notes: String(sysGet(e, 'notes', sysGet(e, 'note', sysGet(e, 'description', ''))))
    };
  }

  function sysRooms() {
    var r = sysState.cache.rooms;
    if (!r) return [];
    if (Array.isArray(r)) return r;
    if (Array.isArray(r.rooms)) return r.rooms;
    if (Array.isArray(r.legacy_rooms)) return r.legacy_rooms;
    return [];
  }

  function sysNodes(arch) {
    arch = arch || sysState.cache.architecture || {};
    var raw = Array.isArray(arch.nodes) ? arch.nodes : null;
    if (raw && raw.length) {
      return raw.map(function (n, i) {
        if (typeof n === 'string') return { id: n, label: n, group: 'other', status: 'unknown', detail: '' };
        var id = String(sysGet(n, 'id', sysGet(n, 'key', 'node_' + i)));
        return {
          id: id,
          label: String(sysGet(n, 'label', sysGet(n, 'name', id))),
          group: String(sysGet(n, 'group', sysGet(n, 'type', 'other'))),
          status: String(sysGet(n, 'status', 'unknown')),
          detail: String(sysGet(n, 'detail', sysGet(n, 'description', '')))
        };
      });
    }
    return SYS_NODE_DEFAULT.map(function (n) {
      return { id: n.id, label: n.label, group: n.group, status: 'unknown', detail: '' };
    });
  }

  function sysEdges(arch, nodes) {
    arch = arch || {};
    var ids = {};
    nodes.forEach(function (n) { ids[n.id] = true; });
    var raw = Array.isArray(arch.edges) ? arch.edges : null;
    if (raw && raw.length) {
      return raw.map(function (e) {
        if (Array.isArray(e)) return { from: String(e[0]), to: String(e[1]) };
        return { from: String(sysGet(e, 'from', sysGet(e, 'source', ''))), to: String(sysGet(e, 'to', sysGet(e, 'target', ''))) };
      }).filter(function (e) { return e.from && e.to; });
    }
    return SYS_DEFAULT_EDGES.filter(function (e) { return ids[e[0]] && ids[e[1]]; })
      .map(function (e) { return { from: e[0], to: e[1] }; });
  }

  function sysNodePos(id) {
    if (SYS_NODE_POS[id]) return SYS_NODE_POS[id];
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    var col = h % 6, row = Math.floor(h / 6) % 4;
    return [50 + col * 185, 50 + row * 175];
  }

  function sysNodeCount() { return sysNodes().length; }

  function sysOnline() {
    try { return (typeof navigator !== 'undefined' && navigator.onLine !== false) ? 'online' : 'offline'; }
    catch (e) { return 'unknown'; }
  }

  /* ------------------------------------------------------------------ *
   * Overview
   * ------------------------------------------------------------------ */
  function sysOverviewHtml() {
    if (!Object.prototype.hasOwnProperty.call(sysState.cache, 'overview')) {
      if (sysState.sectionLoading.overview || sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysState.errs.overview || sysTr('لا توجد بيانات', 'No data'));
    }
    var ov = sysState.cache.overview || {};
    var tables = sysTables();
    var apis = sysApis();
    var rooms = sysRooms();
    var rlsCount = tables.filter(function (tb) { return sysGet(tb, 'rls', sysGet(tb, 'rls_enabled', null)) === true; }).length;

    var kpis = '<div class="sys-grid sys-grid-kpi">' +
      sysKpi(sysTr('الجداول', 'Tables'), sysNum(sysFirstNum(sysGet(ov, 'counts.tables', null), tables.length || null)), sysTr('من مخطط البيانات', 'from schema')) +
      sysKpi(sysTr('سياسات RLS', 'RLS enabled'), tables.length ? sysNum(rlsCount) : '\u2014', sysTr('جداول بحماية صفوف', 'row-level protected')) +
      sysKpi(sysTr('نقاط API', 'API endpoints'), sysNum(sysGet(ov, 'counts.apis', null)) !== '\u2014' ? sysNum(sysGet(ov, 'counts.apis', null)) : sysNum(apis.length || null), sysTr('مُعرَّفة فقط', 'declared only')) +
      sysKpi(sysTr('عُقد البنية', 'Architecture nodes'), sysNum(sysNodeCount()), sysTr('من الخريطة', 'from map')) +
      sysKpi(sysTr('غرف قديمة', 'Legacy rooms'), sysNum(rooms.length || null), sysTr('نظام الغرف', 'rooms subsystem')) +
      '</div>';

    var health = sysGet(ov, 'health', ov.health);
    var healthBody;
    if (health && typeof health === 'object') {
      var keys = Object.keys(health);
      healthBody = keys.length ? '<div class="sys-grid">' + keys.map(function (k) {
        var val = health[k];
        var st = (val === true) ? 'known' : (val === false ? 'unknown' : String(val));
        return '<div class="sys-card sys-card-sm"><div class="sys-card-title">' + sysEsc(k) + '</div>' +
          '<div class="sys-card-body">' + sysBadge(st) + '</div></div>';
      }).join('') + '</div>' : sysEmpty();
    } else {
      healthBody = sysEmpty(sysTr('حالة الصحة غير مُبلغة من الخادم', 'Health not reported by server'));
    }

    var envKeys = ['environment', 'supabase', 'resend', 'spotify', 'deepseek', 'github', 'storage'];
    var envBody = '<div class="sys-grid">' + envKeys.map(function (k) {
      var v = sysGet(ov, 'environment.' + k, sysGet(ov, k, null));
      var label = (v === true) ? 'configured' : (v === false ? 'not configured' : 'unknown');
      return '<div class="sys-card sys-card-sm"><div class="sys-card-title">' + sysEsc(k) + '</div>' +
        '<div class="sys-card-body">' + sysBadge(label) + '</div></div>';
    }).join('') + '</div>';

    var modules = sysGet(ov, 'modules', []);
    var moduleBody = Array.isArray(modules) && modules.length
      ? '<div class="sys-grid">' + modules.filter(function (m) {
          var name = typeof m === 'string' ? m : sysGet(m, 'name', sysGet(m, 'id', ''));
          return sysMatch(name);
        }).map(function (m) {
          var name = typeof m === 'string' ? m : sysGet(m, 'name', sysGet(m, 'id', ''));
          var st = typeof m === 'string' ? 'unknown' : sysGet(m, 'status', 'unknown');
          return '<div class="sys-card sys-card-sm"><div class="sys-card-title">' + sysEsc(name) + '</div>' +
            '<div class="sys-card-body">' + sysBadge(st) + '</div></div>';
        }).join('') + '</div>'
      : sysEmpty(sysTr('لا يوجد سجل وحدات', 'No module registry'));

    var pipeline = sysCard(sysTr('خط أنابيب النشر', 'Deployment pipeline'),
      sysFlow([
        { label: sysTr('الكود', 'Code'), status: 'known' },
        { label: sysTr('البناء', 'Build'), status: 'unknown' },
        { label: sysTr('الاختبار', 'Test'), status: 'unknown' },
        { label: sysTr('النشر', 'Deploy'), status: 'unknown' },
        { label: sysTr('المراقبة', 'Monitor'), status: 'unknown' }
      ]) + sysReadOnlyNote(sysTr('الحالات تعكس الأدلة المتاحة فقط ولا تُفترض النجاح.', 'Statuses reflect evidence only; success is never assumed.')));

    var events = sysGet(ov, 'recent_events', sysGet(ov, 'recentEvents', []));
    var eventsBody;
    if (Array.isArray(events) && events.length) {
      eventsBody = '<div class="sys-table-wrap"><table class="sys-table"><thead><tr>' +
        '<th>' + sysEsc(sysTr('الوقت', 'Time')) + '</th>' +
        '<th>' + sysEsc(sysTr('الحدث', 'Event')) + '</th>' +
        '<th>' + sysEsc(sysTr('الحالة', 'Status')) + '</th></tr></thead><tbody>' +
        events.slice(-12).reverse().filter(function (e) {
          return sysAnyMatch(sysGet(e, 'time', sysGet(e, 'timestamp', '')), sysGet(e, 'event', sysGet(e, 'name', '')));
        }).map(function (e) {
          return '<tr><td>' + sysEsc(sysFmtTime(sysGet(e, 'time', sysGet(e, 'timestamp', null)))) + '</td>' +
            '<td>' + sysEsc(sysGet(e, 'event', sysGet(e, 'name', '\u2014'))) + '</td>' +
            '<td>' + sysBadge(sysGet(e, 'status', 'unknown')) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      eventsBody = sysEmpty(sysTr('لا توجد أحداث أمنية مُسجّلة', 'No safe console events'));
    }

    var archMini = sysCard(sysTr('ملخص البنية', 'Architecture summary'),
      '<div class="sys-inline-stats">' +
        '<span>' + sysEsc(sysTr('عُقد: ', 'Nodes: ')) + sysNum(sysNodeCount()) + '</span>' +
        '<span>' + sysEsc(sysTr('حواف: ', 'Edges: ')) + sysNum(sysEdges(null, sysNodes()).length) + '</span>' +
      '</div>' + sysReadOnlyNote());

    return '<div class="sys-section">' +
      sysCard(sysTr('مؤشرات رئيسية', 'Key metrics'), kpis) +
      sysCard(sysTr('صحة النظام', 'System health'), healthBody) +
      sysCard(sysTr('البيئة والإعداد', 'Environment & config'), envBody) +
      sysCard(sysTr('سجل الوحدات', 'Module registry'), moduleBody) +
      pipeline + archMini +
      sysCard(sysTr('أحداث الكونسول الأخيرة', 'Recent console events'), eventsBody) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * Architecture
   * ------------------------------------------------------------------ */
  function sysArchitectureHtml() {
    var ok = Object.prototype.hasOwnProperty.call(sysState.cache, 'architecture');
    if (!ok) {
      if (sysState.sectionLoading.architecture || sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysState.errs.architecture || sysTr('لا توجد بيانات', 'No data'));
    }
    var arch = sysState.cache.architecture || {};
    var nodes = sysNodes(arch);
    var edges = sysEdges(arch, nodes);
    var groups = ['all'];
    nodes.forEach(function (n) { if (groups.indexOf(n.group) === -1) groups.push(n.group); });

    var chips = groups.map(function (g) {
      var active = (sysState.groupFilter === g) ? ' sys-chip-active' : '';
      var label = (g === 'all') ? sysTr('الكل', 'All') : g;
      return '<button type="button" class="sys-chip sys-chip-filter' + active + '" ' +
        on(function () { sysState.groupFilter = g; render(); }, 'click') + '>' + sysEsc(label) + '</button>';
    }).join('');

    var visible = function (n) {
      var grpOk = (sysState.groupFilter === 'all') || (n.group === sysState.groupFilter);
      return grpOk && sysAnyMatch(n.id, n.label, n.group);
    };

    var edgeSvg = edges.map(function (e) {
      var a = sysNodePos(e.from), b = sysNodePos(e.to);
      var x1 = a[0] + NODE_W / 2, y1 = a[1] + NODE_H / 2;
      var x2 = b[0] + NODE_W / 2, y2 = b[1] + NODE_H / 2;
      return '<line class="sys-edge" x1="' + Math.round(x1) + '" y1="' + Math.round(y1) + '" x2="' + Math.round(x2) + '" y2="' + Math.round(y2) + '" marker-end="url(#sys-arrow)"></line>';
    }).join('');

    var nodeSvg = nodes.filter(visible).map(function (n) {
      var p = sysNodePos(n.id);
      var x = p[0], y = p[1];
      var st = sysStatusClass(n.status);
      return '<g class="sys-node sys-node-' + st + '" data-node-id="' + sysEsc(n.id) + '" tabindex="0" role="button" ' +
        'aria-label="' + sysEsc(n.label) + '">' +
        '<rect class="sys-node-rect" x="' + x + '" y="' + y + '" width="' + NODE_W + '" height="' + NODE_H + '" rx="12"></rect>' +
        '<text class="sys-node-label" x="' + (x + NODE_W / 2) + '" y="' + (y + NODE_H / 2 + 5) + '" text-anchor="middle">' + sysEsc(n.label) + '</text>' +
        '</g>';
    }).join('');

    var zoomClass = 'sys-zoom-' + sysState.zoom;

    var toolbar = '<div class="sys-arch-toolbar">' +
      '<div class="sys-chips">' + chips + '</div>' +
      '<div class="sys-zoom-group">' +
        '<button type="button" class="sys-btn sys-btn-sm" ' + on(function () { sysState.zoom = 90; render(); }, 'click') + '>-</button>' +
        '<span class="sys-zoom-label">' + sysEsc(sysState.zoom + '%') + '</span>' +
        '<button type="button" class="sys-btn sys-btn-sm" ' + on(function () { sysState.zoom = 110; render(); }, 'click') + '>+</button>' +
        '<button type="button" class="sys-btn sys-btn-sm" ' + on(function () { sysState.zoom = 100; render(); }, 'click') + '>' +
          sysEsc(sysTr('إعادة', 'Reset')) + '</button>' +
      '</div></div>';

    var stage = '<div class="sys-architecture-stage ' + zoomClass + '">' +
      '<svg class="sys-architecture-svg" viewBox="0 0 1200 720" role="img" aria-label="' + sysEsc(sysTr('خريطة البنية', 'Architecture map')) + '">' +
        '<defs><marker id="sys-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
          '<path class="sys-arrow-head" d="M0,0 L10,5 L0,10 z"></path></marker></defs>' +
        '<g class="sys-edges">' + edgeSvg + '</g>' +
        '<g class="sys-nodes">' + nodeSvg + '</g>' +
      '</svg></div>';

    return '<div class="sys-section">' +
      sysCard(sysTr('خريطة تفاعلية', 'Interactive map'), toolbar + stage +
        sysReadOnlyNote(sysTr('اضغط على عقدة لعرض تفاصيلها. الحالة غير معروفة إلا عند توفر الدليل.', 'Click a node for details. Status is unknown unless evidenced.'))) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * Database
   * ------------------------------------------------------------------ */
  function sysTableRelationCount(tb) {
    var rel = sysGet(tb, 'relations', null);
    if (Array.isArray(rel)) return rel.length;
    var out = sysGet(tb, 'outgoing', null), inc = sysGet(tb, 'incoming', null);
    var n = 0;
    if (Array.isArray(out)) n += out.length;
    if (Array.isArray(inc)) n += inc.length;
    return n;
  }

  function sysDatabaseHtml() {
    var ok = Object.prototype.hasOwnProperty.call(sysState.cache, 'schema');
    if (!ok) {
      if (sysState.sectionLoading.database || sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysState.errs.schema || sysTr('لا توجد بيانات', 'No data'));
    }
    var tables = sysTables();
    var domains = ['all'];
    tables.forEach(function (tb) {
      var d = String(sysGet(tb, 'domain', sysGet(tb, 'schema', '')) || 'core');
      if (domains.indexOf(d) === -1) domains.push(d);
    });

    var chips = domains.map(function (d) {
      var active = (sysState.groupFilter === d) ? ' sys-chip-active' : '';
      var label = (d === 'all') ? sysTr('الكل', 'All') : d;
      return '<button type="button" class="sys-chip sys-chip-filter' + active + '" ' +
        on(function () { sysState.groupFilter = d; render(); }, 'click') + '>' + sysEsc(label) + '</button>';
    }).join('');

    var list = tables.filter(function (tb) {
      var name = String(sysGet(tb, 'name', sysGet(tb, 'table', '')));
      var d = String(sysGet(tb, 'domain', sysGet(tb, 'schema', '')) || 'core');
      var domOk = (sysState.groupFilter === 'all') || (d === sysState.groupFilter);
      return domOk && sysAnyMatch(name, d);
    });

    var cards = list.length ? '<div class="sys-grid">' + list.map(function (tb) {
      var name = String(sysGet(tb, 'name', sysGet(tb, 'table', 'unknown')));
      var d = String(sysGet(tb, 'domain', sysGet(tb, 'schema', 'core')));
      var rls = sysGet(tb, 'rls', sysGet(tb, 'rls_enabled', null));
      var rlsLabel = (rls === true) ? 'RLS' : (rls === false ? 'No RLS' : 'RLS unknown');
      var cols = sysGet(tb, 'columns', []);
      var pk = sysGet(tb, 'primary_key', sysGet(tb, 'pk', []));
      var pkList = Array.isArray(pk) ? pk : (pk ? [pk] : []);
      return '<button type="button" class="sys-card sys-card-click sys-db-card" ' +
        on(function () { sysOpenTable(name); }, 'click') + '>' +
        '<div class="sys-db-head"><span class="sys-db-name">' + sysEsc(name) + '</span>' + sysBadge(rlsLabel) + '</div>' +
        '<div class="sys-db-meta">' + sysEsc(sysTr('النطاق: ', 'Domain: ') + d) + '</div>' +
        '<div class="sys-db-meta">' + sysEsc(sysTr('المفاتيح: ', 'PK: ') + (pkList.length ? pkList.join(', ') : '\u2014')) + '</div>' +
        '<div class="sys-db-meta">' + sysEsc(sysTr('الأعمدة: ', 'Columns: ') + (Array.isArray(cols) ? cols.length : '\u2014')) + '</div>' +
        '<div class="sys-db-meta">' + sysEsc(sysTr('العلاقات: ', 'Relations: ') + sysTableRelationCount(tb)) + '</div>' +
        '</button>';
    }).join('') + '</div>' : sysEmpty(sysTr('لا توجد جداول مطابقة', 'No matching tables'));

    return '<div class="sys-section">' +
      sysCard(sysTr('الجداول', 'Tables'),
        '<div class="sys-chips">' + chips + '</div>' + cards +
        sysReadOnlyNote(sysTr('لا يتم عرض أي صفوف بيانات — فقط المخطط.', 'No row data is rendered — schema only.'))) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * Auth
   * ------------------------------------------------------------------ */
  function sysAuthHtml() {
    if (!Object.prototype.hasOwnProperty.call(sysState.cache, 'security') &&
        !Object.prototype.hasOwnProperty.call(sysState.cache, 'apis')) {
      if (sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysTr('بيانات المصادقة غير متاحة', 'Auth data unavailable'));
    }
    var sec = sysState.cache.security || {};
    var apis = sysApis().map(sysApiNorm).filter(function (a) {
      var blob = (a.domain + ' ' + a.path + ' ' + a.notes).toLowerCase();
      return blob.indexOf('auth') !== -1 || blob.indexOf('otp') !== -1 || blob.indexOf('session') !== -1 ||
        blob.indexOf('login') !== -1 || blob.indexOf('recover') !== -1 || blob.indexOf('signup') !== -1;
    });

    var cards = '<div class="sys-grid">' +
      sysAuthCard(sysTr('تسجيل OTP', 'OTP signup'), sec, ['otp', 'signup']) +
      sysAuthCard(sysTr('التحقق OTP', 'OTP verify'), sec, ['otp', 'verify']) +
      sysAuthCard(sysTr('استعادة الحساب', 'Account recovery'), sec, ['recovery', 'recover']) +
      sysAuthCard('Supabase Auth', sec, ['supabase', 'auth']) +
      sysAuthCard(sysTr('كوكيز الجلسة', 'Session cookies'), sec, ['cookie', 'session']) +
      sysAuthCard(sysTr('جدول onboarding', 'Onboarding profile'), sec, ['profile', 'onboarding']) +
      sysAuthCard('Resend', sec, ['resend', 'email']) +
      '</div>';

    var apiBody = apis.length ? sysApiTable(apis) : sysEmpty(sysTr('لا توجد نقاط مصادقة صريحة', 'No explicit auth endpoints'));

    return '<div class="sys-section">' +
      sysCard(sysTr('تدفق المصادقة', 'Authentication flow'),
        '<div class="sys-chips">' + sysChip('CSP', 'ok') + sysChip('SameSite cookies ' + sysTr('غير معروف', 'unknown'), 'unknown') + '</div>' +
        cards + sysReadOnlyNote(sysTr('لا يتم عرض أي بريد أو معرّف مستخدم.', 'No emails or user IDs are displayed.'))) +
      sysCard(sysTr('نقاط مصادقة', 'Auth endpoints'), apiBody) +
      '</div>';
  }

  function sysAuthCard(title, sec, hints) {
    var found = null, key = null;
    Object.keys(sec || {}).forEach(function (k) {
      if (found !== null) return;
      var blob = k.toLowerCase();
      for (var i = 0; i < hints.length; i++) { if (blob.indexOf(hints[i]) !== -1) { found = sec[k]; key = k; break; } }
    });
    var status = 'unknown';
    if (found === true) status = 'configured';
    else if (found === false) status = 'not configured';
    else if (typeof found === 'string') status = found;
    return '<div class="sys-card sys-card-sm"><div class="sys-card-title">' + sysEsc(title) + '</div>' +
      '<div class="sys-card-body">' + sysBadge(status) +
      (key ? '<div class="sys-db-meta">' + sysEsc(key) + '</div>' : '') + '</div></div>';
  }

  /* ------------------------------------------------------------------ *
   * Rooms
   * ------------------------------------------------------------------ */
  function sysRoomsHtml() {
    var ok = Object.prototype.hasOwnProperty.call(sysState.cache, 'rooms');
    if (!ok) {
      if (sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysState.errs.rooms || sysTr('بيانات الغرف غير متاحة', 'Rooms data unavailable'));
    }
    var rooms = sysRooms().filter(function (r) {
      return sysAnyMatch(sysGet(r, 'id', ''), sysGet(r, 'title', ''), sysGet(r, 'kind', ''));
    });
    var kindCounts = {};
    sysRooms().forEach(function (r) {
      var k = String(sysGet(r, 'kind', sysGet(r, 'type', 'unknown')));
      kindCounts[k] = (kindCounts[k] || 0) + 1;
    });
    var summary = Object.keys(kindCounts).length
      ? '<div class="sys-chips">' + Object.keys(kindCounts).map(function (k) { return sysChip(k + ' \u00D7 ' + kindCounts[k], 'info'); }).join('') + '</div>'
      : sysEmpty();

    var cards = rooms.length ? '<div class="sys-grid">' + rooms.map(function (r) {
      var id = sysGet(r, 'id', sysGet(r, 'legacy_id', '\u2014'));
      var title = sysGet(r, 'title', sysGet(r, 'name', '\u2014'));
      var kind = sysGet(r, 'kind', sysGet(r, 'type', 'unknown'));
      return '<div class="sys-card sys-card-sm"><div class="sys-card-title">' + sysEsc(title) + '</div>' +
        '<div class="sys-card-body">' + sysBadge(kind) +
        '<div class="sys-db-meta">' + sysEsc(sysTr('المعرّف القديم: ', 'Legacy ID: ') + id) + '</div></div></div>';
    }).join('') + '</div>' : sysEmpty(sysTr('لا توجد غرف', 'No rooms'));

    var relBody = '';
    var schemaOk = Object.prototype.hasOwnProperty.call(sysState.cache, 'schema');
    if (schemaOk) {
      var rels = sysTables().filter(function (tb) {
        var n = String(sysGet(tb, 'name', ''));
        return n.indexOf('room') !== -1 || n.indexOf('cinema') !== -1;
      }).map(function (tb) {
        var n = String(sysGet(tb, 'name', ''));
        return '<li class="sys-list-item">' + sysEsc(n) + ' ' + sysBadge(String(sysGet(tb, 'rls', null) === true ? 'RLS' : 'RLS unknown')) + '</li>';
      }).join('');
      relBody = rels ? '<ul class="sys-list">' + rels + '</ul>' : sysEmpty();
    } else {
      relBody = sysEmpty(sysTr('مخطط الغرف غير محمّل', 'Room schema not loaded'));
    }

    return '<div class="sys-section">' +
      sysCard(sysTr('ملخص الأنواع', 'Kind summary'), summary) +
      sysCard(sysTr('الغرف', 'Rooms'), cards + sysReadOnlyNote(sysTr('لا يتم عرض عدد الحاضرين الحقيقي.', 'Live occupant counts are not shown.'))) +
      sysCard(sysTr('علاقات نظام الغرف', 'Room subsystem relations'), relBody) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * Messaging
   * ------------------------------------------------------------------ */
  function sysMessagingHtml() {
    var schemaOk = Object.prototype.hasOwnProperty.call(sysState.cache, 'schema');
    var apisOk = Object.prototype.hasOwnProperty.call(sysState.cache, 'apis');
    if (!schemaOk && !apisOk) {
      if (sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysTr('بيانات الرسائل غير متاحة', 'Messaging data unavailable'));
    }
    var wanted = ['messages', 'message_reactions', 'notifications'];
    var found = sysTables().filter(function (tb) {
      var n = String(sysGet(tb, 'name', '')).toLowerCase();
      return wanted.indexOf(n) !== -1;
    });

    var flow = sysCard(sysTr('تدفق البيانات', 'Data flow'),
      sysFlow([
        { label: sysTr('المُرسل', 'Sender'), status: 'unknown' },
        { label: 'messages', status: 'unknown' },
        { label: sysTr('تفاعلات', 'Reactions'), status: 'unknown' },
        { label: 'notifications', status: 'unknown' },
        { label: sysTr('المستقبل / الغرفة', 'Receiver / Room'), status: 'unknown' }
      ]) + sysReadOnlyNote(sysTr('لا يتم عرض محتوى الرسائل.', 'Message contents are never shown.')));

    var tablesBody = found.length ? '<ul class="sys-list">' + found.map(function (tb) {
      var n = String(sysGet(tb, 'name', ''));
      var cols = sysGet(tb, 'columns', []);
      var sensitive = (n === 'messages') ? ' ' + sysBadge(sysTr('حقل حساس: content', 'sensitive: content'), 'warn') : '';
      return '<li class="sys-list-item">' + sysEsc(n) + sensitive +
        '<div class="sys-db-meta">' + sysEsc(sysTr('أعمدة: ', 'Columns: ') + (Array.isArray(cols) ? cols.length : '\u2014')) + '</div></li>';
    }).join('') + '</ul>' : sysEmpty(sysTr('الجداول غير معروفة', 'Tables unknown'));

    var media = sysCard(sysTr('أنواع الوسائط', 'Media types'),
      '<div class="sys-grid">' +
      sysMiniCard(sysTr('صور', 'Images'), 'unknown') +
      sysMiniCard(sysTr('ملاحظات صوتية', 'Voice notes'), 'unknown') +
      '</div>');

    var apiList = sysApis().map(sysApiNorm).filter(function (a) {
      var blob = (a.path + ' ' + a.domain).toLowerCase();
      return blob.indexOf('message') !== -1 || blob.indexOf('notification') !== -1 || blob.indexOf('chat') !== -1;
    });

    return '<div class="sys-section">' +
      flow +
      sysCard(sysTr('جداول المراسلة', 'Messaging tables'), tablesBody) +
      media +
      sysCard(sysTr('نقاط المراسلة', 'Messaging endpoints'), apiList.length ? sysApiTable(apiList) : sysEmpty()) +
      '</div>';
  }

  function sysMiniCard(title, status) {
    return '<div class="sys-card sys-card-sm"><div class="sys-card-title">' + sysEsc(title) + '</div>' +
      '<div class="sys-card-body">' + sysBadge(status) + '</div></div>';
  }

  /* ------------------------------------------------------------------ *
   * Realtime
   * ------------------------------------------------------------------ */
  function sysRealtimeHtml() {
    var archOk = Object.prototype.hasOwnProperty.call(sysState.cache, 'architecture');
    if (!archOk) {
      if (sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysState.errs.architecture || sysTr('بيانات الوقت الحقيقي غير متاحة', 'Realtime data unavailable'));
    }
    var nodes = sysNodes();
    var real = null;
    for (var i = 0; i < nodes.length; i++) { if (nodes[i].id === 'realtime') real = nodes[i]; }
    var edges = sysEdges(null, nodes).filter(function (e) { return e.from === 'realtime' || e.to === 'realtime'; });

    var featureBody = edges.length ? '<ul class="sys-list">' + edges.map(function (e) {
      var other = (e.from === 'realtime') ? e.to : e.from;
      return '<li class="sys-list-item">' + sysEsc('realtime \u2194 ' + other) + '</li>';
    }).join('') + '</ul>' : sysEmpty();

    return '<div class="sys-section">' +
      sysCard(sysTr('حالة القناة', 'Channel status'),
        '<div class="sys-inline-stats">' +
          '<span>' + sysEsc(sysTr('العقدة: realtime', 'Node: realtime')) + '</span>' +
          sysBadge(real ? (real.status || 'unknown') : 'unknown') +
        '</div>' +
        sysReadOnlyNote(sysTr('الحالة غير معروفة ما لم يتم فحصها من الخادم.', 'Status unknown unless probed server-side.'))) +
      sysCard(sysTr('الرسم البياني للميزات المتصلة', 'Connected feature graph'), featureBody) +
      sysCard(sysTr('مقاييس المتصفح (العميل)', 'Browser client metrics (client only)'),
        '<div class="sys-chips">' + sysChip('navigator.onLine: ' + sysOnline(), sysOnline() === 'online' ? 'ok' : 'warn') + '</div>' +
        sysReadOnlyNote(sysTr('هذا يعكس شبكة المتصفح فقط، وليس صحة الوقت الحقيقي على الخادم.', 'This reflects the browser network only, not backend realtime health.'))) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * Storage
   * ------------------------------------------------------------------ */
  function sysStorageHtml() {
    var ok = Object.prototype.hasOwnProperty.call(sysState.cache, 'storage');
    if (!ok) {
      if (sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysState.errs.storage || sysTr('بيانات التخزين غير متاحة', 'Storage data unavailable'));
    }
    var st = sysState.cache.storage || {};
    var buckets = sysGet(st, 'buckets', Array.isArray(st) ? st : []);
    if (!Array.isArray(buckets)) buckets = [];

    var cards = buckets.filter(function (b) {
      var n = typeof b === 'string' ? b : String(sysGet(b, 'name', ''));
      return sysMatch(n);
    }).map(function (b) {
      var name = typeof b === 'string' ? b : String(sysGet(b, 'name', 'unknown'));
      var pub = typeof b === 'string' ? null : sysGet(b, 'public', sysGet(b, 'is_public', null));
      var priv = (pub === true) ? 'public' : (pub === false ? 'private' : 'privacy unknown');
      var listing = sysGet(b, 'listable', sysGet(b, 'object_listing', null));
      var signed = sysGet(b, 'signed_urls_exposed', sysGet(b, 'signed_urls', null));
      return '<div class="sys-card sys-card-sm"><div class="sys-card-title">' + sysEsc(name) + '</div>' +
        '<div class="sys-card-body">' + sysBadge(priv) +
        '<div class="sys-db-meta">' + sysEsc(sysTr('إدراج الكائنات: ', 'Object listing: ') + (listing === false ? 'false' : (listing === true ? 'true' : 'unknown'))) + '</div>' +
        '<div class="sys-db-meta">' + sysEsc(sysTr('روابط موقّعة مكشوفة: ', 'Signed URLs exposed: ') + (signed === false ? 'false' : (signed === true ? 'true' : 'unknown'))) + '</div>' +
        '</div></div>';
    });

    if (!cards.length) {
      cards = ['avatars', 'profile_photos', 'chat_images', 'voice_notes'].map(function (name) {
        return '<div class="sys-card sys-card-sm"><div class="sys-card-title">' + sysEsc(name) + '</div>' +
          '<div class="sys-card-body">' + sysBadge('unknown') +
          '<div class="sys-db-meta">' + sysEsc(sysTr('إدراج الكائنات: false', 'Object listing: false')) + '</div>' +
          '<div class="sys-db-meta">' + sysEsc(sysTr('روابط موقّعة مكشوفة: false', 'Signed URLs exposed: false')) + '</div></div></div>';
      });
    }

    return '<div class="sys-section">' +
      sysCard(sysTr('حزم التخزين', 'Storage buckets'),
        '<div class="sys-grid">' + cards.join('') + '</div>' +
        sysReadOnlyNote(sysTr('لا يتم عرض مسارات الملفات أو الروابط.', 'No file paths or URLs are shown.'))) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * APIs
   * ------------------------------------------------------------------ */
  function sysApiTable(list) {
    var rows = list.map(function (a) {
      return '<tr>' +
        '<td><span class="sys-method sys-method-' + sysMethodClass(a.method) + '">' + sysEsc(a.method || '\u2014') + '</span></td>' +
        '<td class="sys-mono">' + sysEsc(a.path || '\u2014') + '</td>' +
        '<td>' + sysEsc(a.auth || '\u2014') + '</td>' +
        '<td>' + sysEsc(a.domain || '\u2014') + '</td>' +
        '<td><span class="sys-risk sys-risk-' + sysRiskClass(a.risk) + '">' + sysEsc(a.risk || 'unknown') + '</span></td>' +
        '<td>' + sysEsc(a.notes || '') + '</td>' +
        '</tr>';
    }).join('');
    return '<div class="sys-table-wrap"><table class="sys-table"><thead><tr>' +
      '<th>' + sysEsc(sysTr('الطريقة', 'Method')) + '</th>' +
      '<th>' + sysEsc(sysTr('المسار', 'Path')) + '</th>' +
      '<th>' + sysEsc(sysTr('المصادقة', 'Auth')) + '</th>' +
      '<th>' + sysEsc(sysTr('النطاق', 'Domain')) + '</th>' +
      '<th>' + sysEsc(sysTr('الخطورة', 'Risk')) + '</th>' +
      '<th>' + sysEsc(sysTr('ملاحظات', 'Notes')) + '</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function sysApisHtml() {
    var ok = Object.prototype.hasOwnProperty.call(sysState.cache, 'apis');
    if (!ok) {
      if (sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysState.errs.apis || sysTr('بيانات API غير متاحة', 'API data unavailable'));
    }
    var all = sysApis().map(sysApiNorm);
    var methods = ['all', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    var methodChips = methods.map(function (m) {
      var active = (sysState.groupFilter === 'method:' + m) ? ' sys-chip-active' : '';
      return '<button type="button" class="sys-chip sys-chip-filter' + active + '" ' +
        on(function () { sysState.groupFilter = 'method:' + m; render(); }, 'click') + '>' + sysEsc(m === 'all' ? sysTr('الكل', 'All') : m) + '</button>';
    }).join('');

    var filter = sysState.groupFilter || 'all';
    var filtered = all.filter(function (a) {
      var methodOk = (filter.indexOf('method:') !== 0) || (filter === 'method:all') || (a.method === filter.slice(7));
      return methodOk && sysAnyMatch(a.method, a.path, a.auth, a.domain, a.risk, a.notes);
    });

    return '<div class="sys-section">' +
      sysCard(sysTr('المرشحات', 'Filters'), '<div class="sys-chips">' + methodChips + '</div>') +
      sysCard(sysTr('نقاط النهاية', 'Endpoints'),
        filtered.length ? sysApiTable(filtered) : sysEmpty(sysTr('لا توجد نقاط مطابقة', 'No matching endpoints')) +
        sysReadOnlyNote(sysTr('لا يوجد زر تنفيذ — عرض فقط.', 'No execute button — view only.'))) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * AI
   * ------------------------------------------------------------------ */
  function sysAiHtml() {
    var ok = Object.prototype.hasOwnProperty.call(sysState.cache, 'ai');
    if (!ok) {
      if (sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysState.errs.ai || sysTr('بيانات الذكاء الاصطناعي غير متاحة', 'AI data unavailable'));
    }
    var ai = sysState.cache.ai || {};
    var repo = sysGet(ai, 'repository', sysGet(ai, 'repo', 'unknown'));
    var agent = sysGet(ai, 'agent', sysGet(ai, 'model', 'unknown'));
    var status = sysGet(ai, 'status', 'external integration');
    var caps = sysGet(ai, 'capabilities', []);
    var capsBody = Array.isArray(caps) && caps.length
      ? '<div class="sys-chips">' + caps.map(function (c) {
          return sysChip(typeof c === 'string' ? c : sysGet(c, 'name', 'capability'), 'info');
        }).join('') + '</div>'
      : sysEmpty(sysTr('لا توجد قدرات مُبلغة', 'No capabilities reported'));

    return '<div class="sys-section">' +
      sysCard(sysTr('مركز وكيل DeepSeek', 'DeepSeek Agent Center'),
        '<div class="sys-inline-stats">' +
          '<span>' + sysEsc(sysTr('المستودع: ', 'Repository: ') + repo) + '</span>' +
          '<span>' + sysEsc(sysTr('الوكيل: ', 'Agent: ') + agent) + '</span>' +
          sysBadge(status) +
        '</div>') +
      sysCard(sysTr('القدرات', 'Capabilities'), capsBody) +
      sysCard(sysTr('التدفق', 'Flow'),
        sysFlow([
          { label: sysTr('طلب Vibe', 'Vibe Request'), status: 'unknown' },
          { label: 'DeepSeek', status: 'unknown' },
          { label: 'GitHub', status: 'unknown' },
          { label: sysTr('فرع/PR/Workflow', 'Branch/PR/Workflow'), status: 'unknown' }
        ])) +
      sysCard(sysTr('الضوابط', 'Guardrails'),
        '<div class="sys-chips">' +
          sysChip(sysTr('بدون كشف أسرار', 'No secrets exposed'), 'ok') +
          sysChip(sysTr('بدون إجراءات تدميرية ذاتية', 'No autonomous destructive actions in console'), 'ok') +
        '</div>' + sysReadOnlyNote(sysTr('لا توجد عناصر تحكم بالتنفيذ.', 'No action controls available.'))) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * Workflows
   * ------------------------------------------------------------------ */
  function sysWorkflowsHtml() {
    if (sysState.loading &&
        !Object.prototype.hasOwnProperty.call(sysState.cache, 'overview') &&
        !Object.prototype.hasOwnProperty.call(sysState.cache, 'ai')) {
      return sysLoadingHtml();
    }
    var ov = sysState.cache.overview || {};
    var wf = sysGet(ov, 'workflows', sysGet(sysState.cache.ai || {}, 'workflows', null));
    var items = Array.isArray(wf) ? wf : [
      { name: 'Vibe CI', purpose: sysTr('بناء واختبار ونشر', 'Build, test and deploy') },
      { name: 'Supabase checks', purpose: sysTr('فحوصات المخطط وRLS', 'Schema and RLS checks') },
      { name: 'Configure Supabase Auth Email', purpose: sysTr('إعداد بريد المصادقة', 'Configure auth email') }
    ];

    var cards = items.filter(function (w) {
      var name = typeof w === 'string' ? w : sysGet(w, 'name', sysGet(w, 'id', ''));
      return sysMatch(name);
    }).map(function (w) {
      var name = typeof w === 'string' ? w : sysGet(w, 'name', sysGet(w, 'id', 'unknown'));
      var purpose = typeof w === 'string' ? '' : sysGet(w, 'purpose', sysGet(w, 'description', ''));
      var status = typeof w === 'string' ? 'unknown' : sysGet(w, 'status', 'unknown');
      return '<div class="sys-card sys-card-sm"><div class="sys-card-title">' + sysEsc(name) + '</div>' +
        '<div class="sys-card-body">' + sysBadge(status) +
        (purpose ? '<div class="sys-db-meta">' + sysEsc(purpose) + '</div>' : '') +
        '<div class="sys-db-meta">' + sysEsc(sysTr('للقراءة فقط', 'Read-only')) + '</div></div></div>';
    }).join('');

    return '<div class="sys-section">' +
      sysCard(sysTr('سير العمل', 'Workflows'),
        '<div class="sys-grid">' + (cards || sysEmpty()) + '</div>' +
        sysReadOnlyNote(sysTr('لا يوجد زر تشغيل أو إرسال.', 'No dispatch or trigger button.'))) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * Security
   * ------------------------------------------------------------------ */
  function sysSecurityHtml() {
    var ok = Object.prototype.hasOwnProperty.call(sysState.cache, 'security');
    if (!ok) {
      if (sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysState.errs.security || sysTr('بيانات الأمان غير متاحة', 'Security data unavailable'));
    }
    var sec = sysState.cache.security || {};
    var cats = [
      { key: 'csp', label: 'CSP', hints: ['csp', 'content_security'] },
      { key: 'cookies', label: sysTr('الكوكيز', 'Cookies'), hints: ['cookie'] },
      { key: 'rls', label: 'RLS', hints: ['rls', 'row_level'] },
      { key: 'admin_gate', label: sysTr('بوابة المشرف', 'Admin gate'), hints: ['admin'] },
      { key: 'otp_recovery', label: sysTr('استعادة OTP', 'OTP recovery'), hints: ['otp', 'recovery'] },
      { key: 'spotify', label: 'Spotify AES-GCM', hints: ['spotify', 'aes'] },
      { key: 'resend', label: 'Resend', hints: ['resend', 'email'] },
      { key: 'secrets', label: sysTr('الأسرار', 'Secrets'), hints: ['secret', 'env'] }
    ];

    var cards = '<div class="sys-grid">' + cats.map(function (c) {
      var val = null, matched = null;
      Object.keys(sec).forEach(function (k) {
        if (matched) return;
        var blob = k.toLowerCase();
        for (var i = 0; i < c.hints.length; i++) { if (blob.indexOf(c.hints[i]) !== -1) { val = sec[k]; matched = k; break; } }
      });
      var status = 'unknown';
      if (val === true) status = 'configured';
      else if (val === false) status = 'warning';
      else if (typeof val === 'string') status = val;
      return '<div class="sys-card sys-card-sm"><div class="sys-card-title">' + sysEsc(c.label) + '</div>' +
        '<div class="sys-card-body">' + sysBadge(status) +
        (matched ? '<div class="sys-db-meta">' + sysEsc(matched) + '</div>' : '') + '</div></div>';
    }).join('') + '</div>';

    var warnings = sysGet(sec, 'warnings', []);
    var warnBody = Array.isArray(warnings) && warnings.length
      ? '<ul class="sys-list">' + warnings.filter(function (w) {
          var text = typeof w === 'string' ? w : sysGet(w, 'message', sysGet(w, 'title', ''));
          return sysMatch(text);
        }).map(function (w) {
          var text = typeof w === 'string' ? w : sysGet(w, 'message', sysGet(w, 'title', ''));
          var sev = typeof w === 'string' ? 'warning' : sysGet(w, 'severity', 'warning');
          return '<li class="sys-list-item sys-warn-item">' + sysBadge(sev, sysRiskClass(sev)) + ' ' + sysEsc(text) + '</li>';
        }).join('') + '</ul>'
      : sysEmpty(sysTr('لا توجد تحذيرات مُبلغة', 'No warnings reported'));

    return '<div class="sys-section">' +
      sysCard(sysTr('فئات الأمان', 'Security categories'),
        '<div class="sys-chips">' +
          sysChip('Passed', 'ok') + sysChip('Configured', 'ok') +
          sysChip('Unknown', 'unknown') + sysChip('Warning', 'warn') +
        '</div>' + cards +
        sysReadOnlyNote(sysTr('لا يوجد مؤشر رقمي — فئات فقط.', 'No numeric score — categories only.'))) +
      sysCard(sysTr('التحذيرات', 'Warnings'), warnBody +
        sysReadOnlyNote(sysTr('لا يتم اختلاق أي ثغرات.', 'No invented vulnerability findings.'))) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * Monitoring
   * ------------------------------------------------------------------ */
  function sysChartSvg(events) {
    var pts = events.map(function (e) { return Number(sysGet(e, 'duration_ms', sysGet(e, 'duration', null))); })
      .filter(function (n) { return isFinite(n); });
    if (pts.length < 1) return sysEmpty(sysTr('لا توجد قياسات مدة', 'No duration samples'));
    pts = pts.slice(-40);
    var W = 640, H = 180, PAD = 24;
    var max = Math.max.apply(null, pts.concat([1]));
    var step = pts.length > 1 ? (W - PAD * 2) / (pts.length - 1) : 0;
    var coords = pts.map(function (v, i) {
      var x = PAD + i * step;
      var y = H - PAD - (v / max) * (H - PAD * 2);
      return [Math.round(x), Math.round(y)];
    });
    var poly = coords.map(function (c) { return c[0] + ',' + c[1]; }).join(' ');
    var dots = coords.map(function (c) { return '<circle class="sys-chart-dot" cx="' + c[0] + '" cy="' + c[1] + '" r="2.5"></circle>'; }).join('');
    return '<svg class="sys-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
      sysEsc(sysTr('مدة الطلبات', 'Request durations')) + '">' +
      '<polyline class="sys-chart-line" fill="none" points="' + poly + '"></polyline>' + dots + '</svg>';
  }

  function sysMonitoringHtml() {
    var ok = Object.prototype.hasOwnProperty.call(sysState.cache, 'monitoring');
    if (!ok) {
      if (sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysState.errs.monitoring || sysTr('بيانات المراقبة غير متاحة', 'Monitoring data unavailable'));
    }
    var mon = sysState.cache.monitoring || {};
    var events = sysGet(mon, 'recent_events', sysGet(mon, 'events', []));
    if (!Array.isArray(events)) events = [];
    var durations = events.map(function (e) { return Number(sysGet(e, 'duration_ms', sysGet(e, 'duration', null))); }).filter(function (n) { return isFinite(n); });
    var avg = durations.length ? Math.round(durations.reduce(function (a, b) { return a + b; }, 0) / durations.length) : null;
    var endpoints = sysGet(mon, 'endpoints', sysGet(mon, 'endpoint_counts', null));
    if (!endpoints && sysState.cache.apis) endpoints = sysApis();

    var kpis = '<div class="sys-grid sys-grid-kpi">' +
      sysKpi(sysTr('وقت التشغيل', 'Runtime online'), sysGet(mon, 'runtime_online', 'unknown') === true ? sysTr('متصل', 'online') : (sysGet(mon, 'runtime_online', null) === false ? sysTr('غير متصل', 'offline') : 'unknown')) +
      sysKpi(sysTr('إجمالي طلبات الكونسول', 'Total console requests'), sysNum(sysGet(mon, 'total_requests', sysFirstNum(sysGet(mon, 'total', null), durations.length || null)))) +
      sysKpi(sysTr('متوسط المدة (مللي ثانية)', 'Avg duration (ms)'), sysNum(avg)) +
      sysKpi(sysTr('عدد النقاط', 'Endpoint count'), sysNum(Array.isArray(endpoints) ? endpoints.length : null)) +
      '</div>';

    var navDur = null;
    try {
      if (window.performance && performance.getEntriesByType) {
        var nav = performance.getEntriesByType('navigation')[0];
        if (nav && isFinite(nav.duration)) navDur = Math.round(nav.duration);
      }
    } catch (e) {}

    var clientBody = '<div class="sys-chips">' +
      sysChip('navigator.onLine: ' + sysOnline(), sysOnline() === 'online' ? 'ok' : 'warn') +
      sysChip(sysTr('مدة تحميل الصفحة: ', 'Page load: ') + (navDur === null ? 'unknown' : navDur + ' ms'), 'unknown') +
      sysChip(sysTr('آخر زمن استجابة: ', 'Last console latency: ') + (sysState.lastLatency === null ? 'unknown' : sysState.lastLatency + ' ms'), 'unknown') +
      '</div>' + sysReadOnlyNote(sysTr('هذه قياسات العميل فقط.', 'These are client-side metrics only.'));

    return '<div class="sys-section">' +
      sysCard(sysTr('مؤشرات التشغيل', 'Runtime KPIs'), kpis) +
      sysCard(sysTr('مدة الأحداث الأخيرة', 'Recent event durations'), sysChartSvg(events)) +
      sysCard(sysTr('مقاييس العميل', 'Browser client metrics'), clientBody) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * Deployments
   * ------------------------------------------------------------------ */
  function sysDeploymentsHtml() {
    var ok = Object.prototype.hasOwnProperty.call(sysState.cache, 'overview');
    if (!ok) {
      if (sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysState.errs.overview || sysTr('بيانات النشر غير متاحة', 'Deployment data unavailable'));
    }
    var ov = sysState.cache.overview || {};
    var build = sysGet(ov, 'build', {});
    var branch = sysGet(build, 'branch', sysGet(ov, 'branch', null));
    var hosting = sysGet(build, 'hosting', sysGet(ov, 'hosting', null));
    var repo = sysGet(ov, 'repository', sysGet(build, 'repository', null));
    var depStatus = sysGet(build, 'deployment_status', sysGet(ov, 'deployment_status', 'unknown'));

    return '<div class="sys-section">' +
      sysCard(sysTr('البناء', 'Build'),
        '<div class="sys-grid">' +
          sysMiniCard(sysTr('الفرع', 'Branch'), branch || 'unknown') +
          sysMiniCard(sysTr('الاستضافة', 'Hosting'), hosting || 'unknown') +
          sysMiniCard(sysTr('المستودع', 'Repository'), repo || 'unknown') +
          sysMiniCard(sysTr('حالة النشر', 'Deployment status'), depStatus) +
        '</div>') +
      sysCard(sysTr('خط الأنابيب', 'Pipeline'),
        sysFlow([
          { label: sysTr('الكود', 'Code'), status: 'known' },
          { label: sysTr('البناء', 'Build'), status: 'unknown' },
          { label: sysTr('الاختبار', 'Test'), status: 'unknown' },
          { label: sysTr('النشر', 'Deploy'), status: 'unknown' },
          { label: sysTr('المراقبة', 'Monitor'), status: 'unknown' }
        ])) +
      sysCard(sysTr('ملاحظة', 'Note'),
        sysReadOnlyNote(sysTr('إجراءات النشر غير متاحة في نسخة الكونسول v1.', 'Deployment actions are unavailable in console v1.'))) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * Logs
   * ------------------------------------------------------------------ */
  function sysLogsHtml() {
    var ok = Object.prototype.hasOwnProperty.call(sysState.cache, 'monitoring');
    if (!ok) {
      if (sysState.loading) return sysLoadingHtml();
      return sysErrorHtml(sysState.errs.monitoring || sysTr('السجلات غير متاحة', 'Logs unavailable'));
    }
    var mon = sysState.cache.monitoring || {};
    var events = sysGet(mon, 'recent_events', sysGet(mon, 'events', []));
    if (!Array.isArray(events)) events = [];
    var filtered = events.filter(function (e) {
      return sysAnyMatch(sysGet(e, 'endpoint', sysGet(e, 'path', '')) , sysGet(e, 'status', ''));
    }).slice(-200).reverse();

    var body = filtered.length ? '<div class="sys-table-wrap"><table class="sys-table"><thead><tr>' +
      '<th>' + sysEsc(sysTr('الوقت', 'Time')) + '</th>' +
      '<th>' + sysEsc(sysTr('النقطة', 'Endpoint')) + '</th>' +
      '<th>' + sysEsc(sysTr('الحالة', 'Status')) + '</th>' +
      '<th>' + sysEsc(sysTr('المدة (مللي ثانية)', 'Duration (ms)')) + '</th>' +
      '</tr></thead><tbody>' + filtered.map(function (e) {
        return '<tr>' +
          '<td>' + sysEsc(sysFmtTime(sysGet(e, 'time', sysGet(e, 'timestamp', null)))) + '</td>' +
          '<td class="sys-mono">' + sysEsc(sysGet(e, 'endpoint', sysGet(e, 'path', '\u2014'))) + '</td>' +
          '<td>' + sysBadge(sysGet(e, 'status', 'unknown')) + '</td>' +
          '<td>' + sysEsc(sysNum(sysGet(e, 'duration_ms', sysGet(e, 'duration', null)))) + '</td>' +
          '</tr>';
      }).join('') + '</tbody></table></div>' : sysEmpty(sysTr('لا توجد أحداث', 'No events'));

    return '<div class="sys-section">' +
      sysCard(sysTr('أحداث وصول الكونسول', 'Console access events'), body +
        sysReadOnlyNote(sysTr('سجلات الكونسول فقط — لا محتوى رسائل ولا بيانات شخصية.', 'Console events only — no message content and no PII.'))) +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * Settings
   * ------------------------------------------------------------------ */
  function sysSettingsHtml() {
    var ov = sysState.cache.overview || {};
    var cacheCount = Object.keys(sysState.cache).length;
    var branch = sysGet(ov, 'build.branch', sysGet(ov, 'branch', 'unknown')) || 'unknown';

    var rows = [
      [sysTr('اللغة', 'Language'), (lang === 'ar') ? 'العربية' : 'English'],
      [sysTr('نمط الكونسول', 'Console mode'), sysTr('للقراءة فقط', 'Read-only')],
      [sysTr('بوابة المشرف', 'Admin gate'), sysTr('من جهة الخادم', 'Server-side')],
      [sysTr('حالة الذاكرة المؤقتة', 'Cache state'), String(cacheCount) + ' ' + sysTr('مُدخلات', 'entries')],
      [sysTr('الفرع', 'Branch'), String(branch)]
    ];

    var table = '<div class="sys-table-wrap"><table class="sys-table"><tbody>' +
      rows.map(function (r) {
        return '<tr><td>' + sysEsc(r[0]) + '</td><td class="sys-mono">' + sysEsc(r[1]) + '</td></tr>';
      }).join('') + '</tbody></table></div>';

    return '<div class="sys-section">' +
      sysCard(sysTr('ملخص الإعدادات', 'Settings summary'), table +
        sysReadOnlyNote(sysTr('لا تعديل على إعدادات الإنتاج.', 'No production setting mutations.'))) +
      sysCard(sysTr('إجراءات محلية', 'Local actions'),
        '<button type="button" class="sys-btn sys-btn-refresh" ' + on(sysClearCache, 'click') + '>' +
          sysEsc(sysTr('مسح ذاكرة الكونسول المؤقتة وتحديث', 'Clear console cache and refresh')) + '</button>') +
      '</div>';
  }

  function sysClearCache() {
    try { sysState.cache = {}; } catch (e) {}
    sysState.errs = {};
    sysState.lastRefresh = null;
    sysLoadSection(sysState.section);
  }

  /* ------------------------------------------------------------------ *
   * Drawer
   * ------------------------------------------------------------------ */
  function sysOpenTable(name) {
    sysState.drawer = { type: 'table', name: String(name) };
    render();
  }

  function sysOpenNode(id) {
    sysState.drawer = { type: 'node', id: String(id) };
    render();
  }

  function sysCloseDrawer() {
    sysState.drawer = null;
    render();
  }

  function sysTableByName(name) {
    var tables = sysTables();
    for (var i = 0; i < tables.length; i++) {
      if (String(sysGet(tables[i], 'name', sysGet(tables[i], 'table', ''))) === name) return tables[i];
    }
    return null;
  }

  function sysSensitiveCol(name) {
    var n = String(name || '').toLowerCase();
    return n === 'email' || n === 'content' || n === 'details' || n === 'metadata' || n === 'report_details';
  }

  function sysTableDrawerBody(name) {
    var tb = sysTableByName(name);
    var html = '';
    var rls = tb ? sysGet(tb, 'rls', sysGet(tb, 'rls_enabled', null)) : null;
    html += '<div class="sys-inline-stats">' + sysBadge(rls === true ? 'RLS' : (rls === false ? 'No RLS' : 'RLS unknown')) +
      (tb ? '<button type="button" class="sys-btn sys-btn-sm" ' + on(function () { sysCheckRows(name); }, 'click') + '>' +
        sysEsc(sysTr('فحص الصفوف المرئية', 'Check visible rows')) + '</button>' : '') + '</div>';

    var check = sysState.cache['schema?table=' + encodeURIComponent(name)];
    if (check) {
      html += '<div class="sys-card sys-card-sm"><div class="sys-card-body">' +
        '<div>' + sysEsc(sysTr('الصفوف المرئية: ', 'Visible rows: ') + sysNum(sysGet(check, 'visible_count', sysGet(check, 'count', null)))) + '</div>' +
        '<div class="sys-db-meta">' + sysEsc(sysTr('النطاق: ', 'Scope: ') + String(sysGet(check, 'scope', 'rls_session'))) + '</div>' +
        sysReadOnlyNote(sysTr('هذه الصفوف المرئية فقط من خلال جلسة RLS الحالية، وليست إجمالي قاعدة البيانات.',
          'These are only rows visible through the current RLS session, not the total DB.')) +
        '</div></div>';
    }

    var cols = tb ? sysGet(tb, 'columns', []) : [];
    if (Array.isArray(cols) && cols.length) {
      html += '<div class="sys-table-wrap"><table class="sys-table"><thead><tr>' +
        '<th>' + sysEsc(sysTr('العمود', 'Column')) + '</th>' +
        '<th>' + sysEsc(sysTr('النوع', 'Type')) + '</th>' +
        '<th>' + sysEsc(sysTr('NULL', 'Nullable')) + '</th>' +
        '<th>' + sysEsc(sysTr('مفتاح', 'Key')) + '</th>' +
        '</tr></thead><tbody>' + cols.map(function (c) {
          var cn = typeof c === 'string' ? c : String(sysGet(c, 'name', sysGet(c, 'column', 'unknown')));
          var ct = typeof c === 'string' ? '' : String(sysGet(c, 'type', sysGet(c, 'data_type', '')));
          var nn = typeof c === 'string' ? 'unknown' : String(sysGet(c, 'nullable', sysGet(c, 'is_nullable', 'unknown')));
          var key = typeof c === 'string' ? '' : String(sysGet(c, 'key', sysGet(c, 'is_primary', '')));
          var sens = sysSensitiveCol(cn) ? ' ' + sysBadge(sysTr('حساس', 'sensitive'), 'warn') : '';
          return '<tr><td class="sys-mono">' + sysEsc(cn) + sens + '</td><td>' + sysEsc(ct) + '</td><td>' +
            sysEsc(nn) + '</td><td>' + sysEsc(key) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    var out = tb ? sysGet(tb, 'outgoing', sysGet(tb, 'relations', null)) : null;
    var inc = tb ? sysGet(tb, 'incoming', null) : null;
    if (Array.isArray(out) || Array.isArray(inc)) {
      html += '<h4 class="sys-drawer-sub">' + sysEsc(sysTr('العلاقات', 'Relations')) + '</h4>';
      if (Array.isArray(out) && out.length) html += '<div class="sys-db-meta">' + sysEsc(sysTr('صادرة: ', 'Outgoing: ') + out.map(sysRelLabel).join(', ')) + '</div>';
      if (Array.isArray(inc) && inc.length) html += '<div class="sys-db-meta">' + sysEsc(sysTr('واردة: ', 'Incoming: ') + inc.map(sysRelLabel).join(', ')) + '</div>';
    }

    if (!html) html = sysEmpty(sysTr('لا توجد تفاصيل', 'No details'));
    return html;
  }

  function sysRelLabel(r) {
    if (typeof r === 'string') return r;
    return String(sysGet(r, 'table', sysGet(r, 'to', sysGet(r, 'from', sysGet(r, 'name', '')))));
  }

  function sysCheckRows(name) {
    sysFetch('schema?table=' + encodeURIComponent(name), true).catch(function (err) {
      sysState.errs['schema?table=' + name] = (err && err.safe) || 'error';
    }).then(function () { render(); });
  }

  function sysNodeDrawerBody(node, id) {
    if (!node) return sysEmpty(sysTr('عقدة غير معروفة', 'Unknown node'));
    var nodes = sysNodes();
    var edges = sysEdges(null, nodes);
    var related = edges.filter(function (e) { return e.from === id || e.to === id; })
      .map(function (e) { return (e.from === id) ? e.to : e.from; });
    var uniq = [];
    related.forEach(function (r) { if (uniq.indexOf(r) === -1) uniq.push(r); });

    var html = '<div class="sys-inline-stats">' +
      '<span>' + sysEsc(sysTr('المجموعة: ', 'Group: ') + node.group) + '</span>' + sysBadge(node.status || 'unknown') + '</div>';
    if (node.detail) html += '<p class="sys-note">' + sysEsc(node.detail) + '</p>';
    html += '<h4 class="sys-drawer-sub">' + sysEsc(sysTr('الحواف المرتبطة', 'Related edges')) + '</h4>';
    html += uniq.length ? sysList(uniq) : sysEmpty(sysTr('لا توجد حواف', 'No edges'));
    html += sysReadOnlyNote();
    return html;
  }

  function sysDrawerHtml() {
    var d = sysState.drawer;
    if (!d) return '';
    var title = '', body = '';
    if (d.type === 'table') {
      title = d.name;
      body = sysTableDrawerBody(d.name);
    } else if (d.type === 'node') {
      var nodes = sysNodes();
      var node = null;
      for (var i = 0; i < nodes.length; i++) { if (nodes[i].id === d.id) node = nodes[i]; }
      title = node ? node.label : d.id;
      body = sysNodeDrawerBody(node, d.id);
    } else {
      return '';
    }
    return '<div class="sys-drawer-overlay" ' + on(sysCloseDrawer, 'click') + '></div>' +
      '<aside class="sys-drawer" role="dialog" aria-modal="true" aria-label="' + sysEsc(title) + '">' +
        '<div class="sys-drawer-head">' +
          '<h2 class="sys-drawer-title">' + sysEsc(title) + '</h2>' +
          '<button type="button" class="sys-drawer-close" aria-label="' + sysEsc(sysTr('إغلاق', 'Close')) + '" ' +
            on(sysCloseDrawer, 'click') + '>\u2715</button>' +
        '</div>' +
        '<div class="sys-drawer-body">' + body + '</div>' +
      '</aside>';
  }

  /* ------------------------------------------------------------------ *
   * Post-render binding (event delegation for the SVG stage)
   * ------------------------------------------------------------------ */
  function sysAfterRender() {
    var stage = app.querySelector('.sys-architecture-stage');
    if (stage) {
      stage.addEventListener('click', function (ev) {
        var g = ev.target && ev.target.closest ? ev.target.closest('[data-node-id]') : null;
        if (!g) return;
        sysOpenNode(g.getAttribute('data-node-id'));
      });
      stage.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Enter' && ev.key !== ' ' && ev.key !== 'Spacebar') return;
        var g = ev.target && ev.target.closest ? ev.target.closest('[data-node-id]') : null;
        if (!g) return;
        ev.preventDefault();
        sysOpenNode(g.getAttribute('data-node-id'));
      });
    }

    if (sysState.searchFocus) {
      sysState.searchFocus = false;
      var input = app.querySelector('.sys-search');
      if (input) {
        try {
          input.focus();
          var val = input.value;
          input.value = '';
          input.value = val;
        } catch (e) {}
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * Install global listeners once
   * ------------------------------------------------------------------ */
  function sysInstall() {
    sysInjectStyles();

    window.addEventListener('hashchange', function () {
      if (location.hash === SYS_HASH) {
        if (!sysState.authorized) systemConsoleEnter();
        else { view = SYS_VIEW_ID; render(); }
      } else if (view === SYS_VIEW_ID) {
        sysState.authorized = false;
        sysState.drawer = null;
        view = 'home';
        render();
      }
    });

    window.addEventListener('keydown', function (ev) {
      if (ev.altKey && ev.shiftKey && (ev.key === 'V' || ev.key === 'v')) {
        ev.preventDefault();
        if (!sysState.authorized) systemConsoleEnter();
        else { view = SYS_VIEW_ID; render(); }
        return;
      }
      if (ev.key === 'Escape' && sysState.drawer) {
        ev.preventDefault();
        sysCloseDrawer();
      }
    });

    if (location.hash === SYS_HASH) {
      setTimeout(function () { systemConsoleEnter(); }, 0);
    }
  }

  sysInstall();
})();
