/* =============================================================================
 * public/system-console-sections-b.js
 * Vibe Engineering Console — Sections B (Operations & Security)
 * -----------------------------------------------------------------------------
 * Injected in the SAME SHARED SCOPE, after:
 *   - system-console-core.js
 *   - system-console-sections-a.js
 *
 * Contract:
 *   - Read-only UI. No destructive controls, no execute/dispatch buttons.
 *   - No inline style attributes, no inline event handler attributes, no eval.
 *   - No external dependencies. No fabricated or sample data.
 * ========================================================================== */

'use strict';

/* ----------------------------------------------------------------------------
 * Static registry: repository-known workflows ONLY (no live workflow endpoint).
 * Purposes are derived from the workflow file names, not from file contents.
 * -------------------------------------------------------------------------- */
var SYS_WORKFLOW_REGISTRY = [
  { name: 'Vibe CI', path: '.github/workflows/ci.yml',
    purpose: 'Continuous integration pipeline for the Vibe repository.' },
  { name: 'Supabase Connection Check', path: '.github/workflows/supabase-check.yml',
    purpose: 'Checks the Supabase connection for the repository.' },
  { name: 'Supabase DB Link Check', path: '.github/workflows/supabase-db-check.yml',
    purpose: 'Checks the Supabase database link.' },
  { name: 'Configure Supabase Auth Email', path: '.github/workflows/configure-supabase-auth.yml',
    purpose: 'Configures the Supabase Auth email settings.' }
];

/* Security categories rendered by the console. Never a numeric score. */
var SYS_SECURITY_DEFS = [
  { id: 'csp', label: 'Content Security Policy', aliases: ['csp', 'content_security_policy'] },
  { id: 'cookies', label: 'Cookie flags', aliases: ['cookies', 'cookie_flags', 'cookie'] },
  { id: 'rls', label: 'Row Level Security', aliases: ['rls', 'row_level_security'] },
  { id: 'admin_gate', label: 'Server admin gate', aliases: ['admin_gate', 'adminGate', 'admin_gate_enabled'] },
  { id: 'otp_recovery', label: 'OTP recovery', aliases: ['otp_recovery', 'otpRecovery', 'otp'] },
  { id: 'spotify_token_encryption', label: 'Spotify token encryption', aliases: ['spotify_token_encryption', 'spotify_token', 'spotifyTokenEncryption'] },
  { id: 'resend_automation', label: 'Resend automation', aliases: ['resend_automation', 'resend', 'resendAutomation'] },
  { id: 'secrets_exposure', label: 'Secrets exposure', aliases: ['secrets_exposure', 'secretsExposure', 'secrets'] },
  { id: 'deepseek_live_config', label: 'DeepSeek live config', aliases: ['deepseek_live_config', 'deepseekLiveConfig', 'deepseek'] }
];

/* ----------------------------------------------------------------------------
 * Defensive adapters around core helpers (referenced by identifier, guarded
 * with typeof so this file degrades gracefully if a helper is unavailable).
 * -------------------------------------------------------------------------- */
function bHas(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

function bDom(tag, attrs, children) {
  var el = document.createElement(tag); var a = attrs || {}; var key;
  for (key in a) {
    if (!bHas(a, key)) continue;
    if (key === 'text' || key === 'children' || key === 'style') continue;
    if (key.length > 2 && key.slice(0, 2).toLowerCase() === 'on') continue;
    var val = a[key];
    if (val === null || val === undefined) continue;
    if (key === 'class') { el.className = String(val); continue; }
    if (key.indexOf('aria-') === 0) {
      el.setAttribute(key, val === true ? 'true' : (val === false ? 'false' : String(val))); continue;
    }
    if (val === false) continue;
    if (val === true) { el.setAttribute(key, ''); continue; }
    el.setAttribute(key, String(val));
  }
  if (a.text !== undefined && a.text !== null) el.textContent = String(a.text);
  var kids = children || a.children;
  if (kids) {
    var arr = Array.isArray(kids) ? kids : [kids];
    for (var i = 0; i < arr.length; i++) {
      var kid = arr[i];
      if (kid === null || kid === undefined || kid === false) continue;
      el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
  }
  return el;
}

function bCreate(tag, attrs, children) {
  if (typeof sysE === 'function') {
    try {
      var r = sysE(tag, attrs || {}, children || []);
      if (r && r.nodeType) {
        var arr = children || (attrs && attrs.children) || [];
        if (arr.length && r.childNodes && r.childNodes.length === 0) {
          for (var i = 0; i < arr.length; i++) {
            var k = arr[i];
            if (k === null || k === undefined || k === false) continue;
            r.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
          }
        }
        return r;
      }
    } catch (e) { /* fall through to local builder */ }
  }
  return bDom(tag, attrs, children);
}

function bOn(el, evt, handler) {
  if (!el || typeof handler !== 'function') return el;
  if (typeof on === 'function') {
    try { on(el, evt, handler); return el; } catch (e) { /* fall through */ }
  }
  if (el.addEventListener) el.addEventListener(evt, handler);
  return el;
}

function bState() {
  if (typeof sysState !== 'undefined' && sysState) return sysState;
  return null;
}

function bGet(key) {
  if (typeof sysGet === 'function') {
    try { var v = sysGet(key); if (v !== undefined) return v; } catch (e) { /* ignore */ }
  }
  var st = bState();
  if (st && st.data && typeof st.data === 'object') return st.data[key];
  return null;
}

function bT(key, fallback) {
  if (typeof t === 'function') {
    try { var s = t(key); if (s) return s; } catch (e) { /* ignore */ }
  }
  return fallback === undefined ? key : fallback;
}

function bEsc(value) {
  var s = (value === null || value === undefined) ? '' : String(value);
  if (typeof esc === 'function') {
    try { return esc(s); } catch (e) { /* ignore */ }
  }
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function bSafeArr(v) {
  if (typeof sysSafeArray === 'function') {
    try { var r = sysSafeArray(v); if (Array.isArray(r)) return r; } catch (e) { /* ignore */ }
  }
  return Array.isArray(v) ? v : [];
}

function bArr(v) {
  if (v === null || v === undefined || v === false) return [];
  if (Array.isArray(v)) {
    var out = [];
    for (var i = 0; i < v.length; i++) if (v[i] !== null && v[i] !== undefined && v[i] !== false) out.push(v[i]);
    return out;
  }
  return [v];
}

function bPick(obj, keys, dflt) {
  if (obj && typeof obj === 'object') {
    for (var i = 0; i < keys.length; i++) {
      if (bHas(obj, keys[i])) {
        var v = obj[keys[i]];
        if (v !== null && v !== undefined && v !== '') return v;
      }
    }
  }
  return dflt;
}

function bText(v, dflt) {
  if (v === null || v === undefined || v === '') return dflt === undefined ? '—' : dflt;
  return String(v);
}

function bDate(v) {
  if (v === null || v === undefined || v === '') return null;
  var d = (v instanceof Date) ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function bFmtDate(v) {
  if (typeof sysFmtDate === 'function') {
    try { var s = sysFmtDate(v); if (s) return String(s); } catch (e) { /* ignore */ }
  }
  var d = bDate(v);
  return d ? d.toLocaleDateString() : '—';
}

function bFmtTime(v) {
  if (typeof sysFmtTime === 'function') {
    try { var s = sysFmtTime(v); if (s) return String(s); } catch (e) { /* ignore */ }
  }
  var d = bDate(v);
  return d ? d.toLocaleTimeString() : '—';
}

function bNum(v) {
  if (typeof sysNumber === 'function') {
    try { var s = sysNumber(v); if (s !== undefined && s !== null) return String(s); } catch (e) { /* ignore */ }
  }
  var n = Number(v);
  if (!isFinite(n)) return '—';
  return n.toLocaleString();
}

function bStatusClass(status) {
  if (typeof sysStatusClass === 'function') {
    try { var s = sysStatusClass(status); if (s) return String(s); } catch (e) { /* ignore */ }
  }
  var n = parseInt(status, 10);
  if (isFinite(n)) {
    if (n >= 200 && n < 300) return 'is-ok';
    if (n >= 300 && n < 400) return 'is-info';
    if (n >= 400 && n < 500) return 'is-warn';
    if (n >= 500) return 'is-error';
  }
  var t = String(status || '').toLowerCase();
  if (t === 'ok' || t === 'online' || t === 'passed' || t === 'success') return 'is-ok';
  if (t === 'warning' || t === 'warn' || t === 'degraded') return 'is-warn';
  if (t === 'error' || t === 'failed' || t === 'offline') return 'is-error';
  return 'is-unknown';
}

function bBadge(text, cls) {
  if (typeof sysBadge === 'function') {
    try { var e = sysBadge(text, cls); if (e && e.nodeType) return e; } catch (err) { /* ignore */ }
  }
  return bCreate('span', { class: 'sys-badge' + (cls ? ' ' + cls : ''), text: text });
}

function bMethodBadge(method) {
  var m = String(method || 'GET').toUpperCase();
  if (typeof sysMethodBadge === 'function') {
    try { var e = sysMethodBadge(m); if (e && e.nodeType) return e; } catch (err) { /* ignore */ }
  }
  return bBadge(m, 'sys-method sys-method-' + m.toLowerCase().replace(/[^a-z0-9]/g, ''));
}

function bRiskBadge(risk) {
  var r = String(risk === null || risk === undefined || risk === '' ? 'unknown' : risk).toLowerCase();
  if (typeof sysRiskBadge === 'function') {
    try { var e = sysRiskBadge(risk); if (e && e.nodeType) return e; } catch (err) { /* ignore */ }
  }
  return bBadge(r, 'sys-risk sys-risk-' + r.replace(/[^a-z0-9_-]/g, ''));
}

function bHttpBadge(status) {
  var s = (status === null || status === undefined || status === '') ? '—' : String(status);
  return bCreate('span', { class: 'sys-http ' + bStatusClass(status), text: s });
}

function bSectionHeader(title, subtitle) {
  if (typeof sysSectionHeader === 'function') {
    try { var e = sysSectionHeader(title, subtitle); if (e && e.nodeType) return e; } catch (err) { /* ignore */ }
  }
  var kids = [bCreate('h2', { class: 'sys-section-title', text: title })];
  if (subtitle) kids.push(bCreate('p', { class: 'sys-section-subtitle', text: subtitle }));
  return bCreate('header', { class: 'sys-section-header' }, kids);
}

function bCard(title, children, opts) {
  var o = opts || {};
  if (typeof sysCard === 'function') {
    try {
      var e = sysCard(title, bArr(children));
      if (e && e.nodeType) {
        if (o.class) e.className = (e.className ? e.className + ' ' : '') + o.class;
        return e;
      }
    } catch (err) { /* ignore */ }
  }
  var kids = [];
  if (title) kids.push(bCreate('h3', { class: 'sys-card-title', text: title }));
  var arr = bArr(children);
  for (var i = 0; i < arr.length; i++) kids.push(arr[i]);
  return bCreate('section', { class: 'sys-card' + (o.class ? ' ' + o.class : '') }, kids);
}

function bEmpty(msg) {
  if (typeof sysEmpty === 'function') {
    try { var e = sysEmpty(msg); if (e && e.nodeType) return e; } catch (err) { /* ignore */ }
  }
  return bCreate('div', { class: 'sys-empty', text: msg || bT('common.noData', 'No data available.') });
}

function bWarning(msg, cls) {
  if (typeof sysWarning === 'function') {
    try { var e = sysWarning(msg, cls); if (e && e.nodeType) return e; } catch (err) { /* ignore */ }
  }
  return bCreate('div', { class: 'sys-warning' + (cls ? ' ' + cls : ''), role: 'note' }, [
    bCreate('span', { class: 'sys-warning-icon', 'aria-hidden': 'true', text: '!' }),
    bCreate('span', { class: 'sys-warning-text', text: msg })
  ]);
}

function bChip(label, active, handler) {
  var el = bCreate('button', {
    type: 'button',
    class: 'sys-chip' + (active ? ' is-active' : ''),
    'aria-pressed': active ? true : false,
    text: label
  });
  bOn(el, 'click', handler);
  return el;
}

function bClear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }

function bGrid(children, extra) {
  var g = bCreate('div', { class: 'sys-card-grid' + (extra ? ' ' + extra : '') });
  var arr = bArr(children);
  for (var i = 0; i < arr.length; i++) g.appendChild(arr[i]);
  return g;
}

function bTable(headers, rows, opts) {
  var o = opts || {};
  var head = bCreate('tr', null, headers.map(function (h) {
    return bCreate('th', { scope: 'col', text: String(h) });
  }));
  var body = bCreate('tbody', null, rows.map(function (cells) {
    return bCreate('tr', null, cells.map(function (c) {
      if (c && c.nodeType) return bCreate('td', null, [c]);
      return bCreate('td', null, [document.createTextNode(c === null || c === undefined ? '—' : String(c))]);
    }));
  }));
  return bCreate('div', { class: 'sys-table-wrap' + (o.class ? ' ' + o.class : '') }, [
    bCreate('table', { class: 'sys-table' }, [bCreate('thead', null, [head]), body])
  ]);
}

function bCountList(map) {
  var keys = [];
  for (var k in map) if (bHas(map, k)) keys.push(k);
  keys.sort();
  if (!keys.length) return bEmpty(bT('common.noData', 'No data available.'));
  var ul = bCreate('ul', { class: 'sys-count-list' });
  for (var i = 0; i < keys.length; i++) {
    ul.appendChild(bCreate('li', { class: 'sys-count-item' }, [
      bCreate('span', { class: 'sys-count-key', text: keys[i] }),
      bCreate('span', { class: 'sys-count-value', text: bNum(map[keys[i]]) })
    ]));
  }
  return ul;
}

function bCountBy(list, key) {
  var map = Object.create(null);
  for (var i = 0; i < list.length; i++) {
    var v = list[i][key] || 'unknown';
    map[v] = (map[v] || 0) + 1;
  }
  return map;
}

function bNormalizeList(data, keys) {
  if (data === null || data === undefined) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') {
    for (var i = 0; i < keys.length; i++) if (Array.isArray(data[keys[i]])) return data[keys[i]];
  }
  return [];
}

/* Local helper: API row matching used by the API filter bar. */
function bApiMatches(row, filters, query) {
  var f = filters || {};
  if (f.method && f.method !== 'All' && row.method !== f.method) return false;
  if (f.auth && f.auth !== 'All' && row.auth !== f.auth) return false;
  if (f.risk && f.risk !== 'All' && row.risk !== f.risk) return false;
  if (f.domain && f.domain !== 'All' && row.domain !== f.domain) return false;
  if (query) {
    var hay = (row.method + ' ' + row.path + ' ' + row.auth + ' ' + row.domain + ' ' + row.risk + ' ' + row.notes).toLowerCase();
    if (hay.indexOf(query) === -1) return false;
  }
  return true;
}

/* Local helper: monitoring polyline points, safely clamped. */
function bChartPoints(values, opts) {
  var o = opts || {};
  var w = o.width || 800, h = o.height || 220, padX = o.padX || 20, padY = o.padY || 20;
  var n = values.length;
  if (!n) return '';
  var max = 0, i, v;
  for (i = 0; i < n; i++) { v = Number(values[i]); if (isFinite(v) && v > max) max = v; }
  if (max <= 0) max = 1;
  var innerW = w - padX * 2, innerH = h - padY * 2, pts = [];
  for (i = 0; i < n; i++) {
    v = Number(values[i]);
    if (!isFinite(v) || v < 0) v = 0;
    if (v > max) v = max;
    var x = (n === 1) ? padX + innerW / 2 : padX + (innerW * i) / (n - 1);
    var y = padY + innerH - (innerH * v) / max;
    if (y < padY) y = padY;
    if (y > h - padY) y = h - padY;
    pts.push(Math.round(x * 100) / 100 + ',' + Math.round(y * 100) / 100);
  }
  return pts.join(' ');
}

/* ============================================================================
 * 1. API SURFACE
 * ========================================================================== */
function sysSectionApis() {
  if (typeof document === 'undefined') return null;
  var wrap = bCreate('div', { class: 'sys-section sys-section-apis' });
  wrap.appendChild(bSectionHeader(
    bT('apis.title', 'API Surface'),
    bT('apis.subtitle', 'Read-only endpoint inventory. This console never executes API calls from this view.')
  ));

  var raw = bNormalizeList(bGet('apis'), ['endpoints', 'items', 'routes', 'apis', 'list']);
  var rows = [];
  for (var i = 0; i < raw.length; i++) {
    if (raw[i] && typeof raw[i] === 'object') rows.push(bApiRow(raw[i]));
  }

  var st = bState();
  if (st && (!st.filters || typeof st.filters !== 'object')) st.filters = {};
  var filters = (st && st.filters) ? st.filters : {};
  if (filters.method === undefined) filters.method = 'All';
  if (filters.auth === undefined) filters.auth = 'All';
  if (filters.risk === undefined) filters.risk = 'All';
  if (filters.domain === undefined) filters.domain = 'All';
  if (filters.apisSearch === undefined) filters.apisSearch = '';

  var search = bCreate('input', {
    type: 'search', class: 'sys-input sys-input-search', value: filters.apisSearch,
    placeholder: bT('apis.search', 'Search path, auth, domain, risk…'),
    'aria-label': bT('apis.search', 'Search endpoints')
  });
  var chipsHost = bCreate('div', { class: 'sys-filter-bar' });
  var summaryHost = bCreate('div', { class: 'sys-card-grid sys-summary' });
  var tableHost = bCreate('div', { class: 'sys-table-host' });

  function uniq(key) {
    var seen = Object.create(null), out = [];
    for (var i = 0; i < rows.length; i++) {
      var v = rows[i][key];
      if (!v || seen[v]) continue;
      seen[v] = true; out.push(v);
    }
    out.sort();
    return out;
  }

  function chipGroup(label, key, values) {
    var group = bCreate('div', { class: 'sys-filter-group' });
    group.appendChild(bCreate('span', { class: 'sys-filter-label', text: label }));
    group.appendChild(bChip('All', (filters[key] || 'All') === 'All', function () { filters[key] = 'All'; paint(); }));
    for (var i = 0; i < values.length; i++) {
      (function (val) {
        group.appendChild(bChip(val, filters[key] === val, function () { filters[key] = val; paint(); }));
      })(values[i]);
    }
    return group;
  }

  function matches() {
    var q = { method: filters.method, auth: filters.auth, risk: filters.risk, domain: filters.domain };
    var needle = String(filters.apisSearch || '').trim().toLowerCase();
    var out = [];
    for (var i = 0; i < rows.length; i++) if (bApiMatches(rows[i], q, needle)) out.push(rows[i]);
    return out;
  }

  function apiTable(list) {
    var body = [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      body.push([
        bMethodBadge(r.method),
        bCreate('code', { class: 'sys-path', text: r.path }),
        bCreate('span', { class: 'sys-auth', text: r.auth }),
        r.domain,
        bRiskBadge(r.risk),
        bCreate('span', { class: 'sys-notes', text: r.notes || '—' })
      ]);
    }
    return bTable([
      bT('apis.col.method', 'Method'), bT('apis.col.path', 'Path'), bT('apis.col.auth', 'Auth'),
      bT('apis.col.domain', 'Domain'), bT('apis.col.risk', 'Risk'), bT('apis.col.notes', 'Notes')
    ], body);
  }

  function paint() {
    bClear(chipsHost); bClear(summaryHost); bClear(tableHost);
    var list = matches();
    chipsHost.appendChild(chipGroup(bT('apis.filter.method', 'Method'), 'method', uniq('method')));
    chipsHost.appendChild(chipGroup(bT('apis.filter.auth', 'Auth'), 'auth', uniq('auth')));
    chipsHost.appendChild(chipGroup(bT('apis.filter.risk', 'Risk'), 'risk', uniq('risk')));
    chipsHost.appendChild(chipGroup(bT('apis.filter.domain', 'Domain'), 'domain', uniq('domain')));
    summaryHost.appendChild(bCard(bT('apis.summary.total', 'Total endpoints'), [
      bCreate('p', { class: 'sys-metric-value', text: bNum(rows.length) }),
      bCreate('p', { class: 'sys-metric-note', text: bT('apis.summary.matching', 'Matching current filters: ') + bNum(list.length) })
    ]));
    summaryHost.appendChild(bCard(bT('apis.summary.methods', 'By method'), [bCountList(bCountBy(rows, 'method'))]));
    summaryHost.appendChild(bCard(bT('apis.summary.domains', 'By domain'), [bCountList(bCountBy(rows, 'domain'))]));
    if (!rows.length) tableHost.appendChild(bEmpty(bT('apis.empty', 'The API endpoint reported no endpoints.')));
    else if (!list.length) tableHost.appendChild(bEmpty(bT('apis.noMatch', 'No endpoints match the current filters.')));
    else tableHost.appendChild(apiTable(list));
  }

  bOn(search, 'input', function () { filters.apisSearch = search.value || ''; paint(); });
  bOn(search, 'search', function () { filters.apisSearch = search.value || ''; paint(); });

  wrap.appendChild(bCreate('div', { class: 'sys-toolbar' }, [search]));
  wrap.appendChild(chipsHost);
  wrap.appendChild(summaryHost);
  wrap.appendChild(tableHost);
  paint();
  return wrap;
}

function bApiRow(item) {
  return {
    method: String(bPick(item, ['method', 'verb', 'http_method'], 'GET')).toUpperCase(),
    path: String(bPick(item, ['path', 'route', 'endpoint', 'url'], '—')),
    auth: String(bPick(item, ['auth', 'authentication', 'security'], 'unknown')),
    domain: String(bPick(item, ['domain', 'group', 'area', 'tag'], 'general')),
    risk: String(bPick(item, ['risk', 'risk_level', 'severity'], 'unknown')),
    notes: String(bPick(item, ['notes', 'note', 'description', 'summary'], ''))
  };
}

/* ============================================================================
 * 2. AI / DEEPSEEK AGENT CENTER
 * ========================================================================== */
function sysSectionAi() {
  if (typeof document === 'undefined') return null;
  var data = bGet('ai') || {};
  var wrap = bCreate('div', { class: 'sys-section sys-section-ai' });
  wrap.appendChild(bSectionHeader(
    bT('ai.title', 'DeepSeek Agent Center'),
    bT('ai.subtitle', 'Configuration and capability overview reported by the AI endpoint.')
  ));
  wrap.appendChild(bWarning(bT('ai.readonly',
    'Read-only: this console does not execute agent actions, does not create branches and does not open pull requests.'), 'is-info'));

  var cards = [];
  cards.push(bCard(bT('ai.card.repository', 'Repository'), [
    bCreate('p', { class: 'sys-kv', text: bText(bPick(data, ['repository', 'repo', 'repo_full_name'], null)) })
  ]));
  cards.push(bCard(bT('ai.card.agent', 'Agent'), [
    bCreate('p', { class: 'sys-kv', text: bText(bPick(data, ['agent', 'agent_name', 'model', 'name'], null)) })
  ]));
  var status = bPick(data, ['status', 'state'], null);
  cards.push(bCard(bT('ai.card.status', 'Status'), [
    bBadge(bText(status, bT('common.unknown', 'Unknown')), bStatusClass(status)),
    bCreate('p', { class: 'sys-metric-note', text: bT('ai.card.status.note', 'Reported by the AI endpoint.') })
  ]));
  var exposed = bPick(data, ['secrets_exposed', 'secretsExposed'], undefined);
  var secretsText = bT('common.unknown', 'Unknown');
  if (exposed === false) secretsText = bT('ai.card.secrets.safe', 'Not exposed to the console');
  else if (exposed === true) secretsText = bT('ai.card.secrets.warn', 'The endpoint reports exposure — review required');
  cards.push(bCard(bT('ai.card.secrets', 'Secrets'), [bCreate('p', { class: 'sys-kv', text: secretsText })]));
  wrap.appendChild(bGrid(cards));

  var caps = bSafeArr(bPick(data, ['capabilities', 'features', 'skills'], []));
  var capGrid = bCreate('div', { class: 'sys-capability-grid' });
  if (caps.length) {
    for (var i = 0; i < caps.length; i++) {
      var c = caps[i], name, desc;
      if (c && typeof c === 'object') {
        name = bText(bPick(c, ['name', 'id', 'key', 'title'], null), 'unnamed');
        desc = bText(bPick(c, ['description', 'desc', 'summary', 'detail'], null), '');
      } else { name = String(c); desc = ''; }
      (function (n, d) {
        var cell = bCreate('button', { type: 'button', class: 'sys-capability' }, [
          bCreate('span', { class: 'sys-capability-name', text: n }),
          d ? bCreate('span', { class: 'sys-capability-desc', text: d }) : null
        ]);
        bOn(cell, 'click', function () {
          if (typeof sysOpenDrawer === 'function') {
            try { sysOpenDrawer('capability', { name: n, description: d }); } catch (e) { /* ignore */ }
          }
        });
        capGrid.appendChild(cell);
      })(name, desc);
    }
    wrap.appendChild(bCard(bT('ai.capabilities', 'Capabilities'), [capGrid]));
  } else {
    wrap.appendChild(bCard(bT('ai.capabilities', 'Capabilities'),
      [bEmpty(bT('ai.capabilities.empty', 'The AI endpoint reported no capability list.'))]));
  }

  var flowSteps = [
    bT('ai.flow.vibe', 'Vibe request'), bT('ai.flow.deepseek', 'DeepSeek'), bT('ai.flow.github', 'GitHub'),
    bT('ai.flow.branch', 'Branch'), bT('ai.flow.pr', 'Pull request'), bT('ai.flow.workflow', 'Workflow')
  ];
  var flow = bCreate('ol', { class: 'sys-agent-flow' });
  for (var j = 0; j < flowSteps.length; j++) {
    flow.appendChild(bCreate('li', { class: 'sys-agent-flow-step' }, [
      bCreate('span', { class: 'sys-agent-flow-index', text: String(j + 1) }),
      bCreate('span', { class: 'sys-agent-flow-label', text: flowSteps[j] })
    ]));
  }
  wrap.appendChild(bCard(bT('ai.flow.title', 'Agent flow'), [
    flow,
    bCreate('p', { class: 'sys-metric-note', text: bT('ai.flow.note',
      'The console renders the flow for orientation only; no step is triggered from here.') })
  ]));

  var guards = bSafeArr(bPick(data, ['safeguards', 'guards', 'guardrails'], []));
  var guardList = bCreate('ul', { class: 'sys-safeguard-list' });
  if (guards.length) {
    for (var g = 0; g < guards.length; g++) {
      var gv = guards[g];
      var gtext = (gv && typeof gv === 'object')
        ? bText(bPick(gv, ['description', 'detail', 'name', 'title'], null))
        : String(gv);
      guardList.appendChild(bCreate('li', { class: 'sys-safeguard-item', text: gtext }));
    }
    wrap.appendChild(bCard(bT('ai.safeguards', 'Safeguards'), [guardList]));
  } else {
    wrap.appendChild(bCard(bT('ai.safeguards', 'Safeguards'),
      [bEmpty(bT('ai.safeguards.empty', 'The AI endpoint reported no safeguards.'))]));
  }

  wrap.appendChild(bCard(bT('ai.recent', 'Recent agent actions'), [
    bEmpty(bT('ai.recent.empty', 'Recent agent actions are not exposed by this endpoint. The console does not display surrogate activity.'))
  ]));
  return wrap;
}

/* ============================================================================
 * 3. WORKFLOWS (static repository-known registry)
 * ========================================================================== */
function sysSectionWorkflows() {
  if (typeof document === 'undefined') return null;
  var ov = bGet('overview') || {};
  var ai = bGet('ai') || {};
  var wrap = bCreate('div', { class: 'sys-section sys-section-workflows' });
  wrap.appendChild(bSectionHeader(
    bT('wf.title', 'Workflows'),
    bT('wf.subtitle', 'Repository-known GitHub Actions workflows. The console has no live workflow data endpoint.')
  ));
  wrap.appendChild(bWarning(bT('wf.readonly',
    'Read-only: no workflow dispatch is available in this console.'), 'is-info'));

  wrap.appendChild(bGrid([
    bCard(bT('wf.card.repository', 'Repository'), [
      bCreate('p', { class: 'sys-kv', text: bText(bPick(ai, ['repository', 'repo'], bPick(ov, ['repository', 'repo'], null))) })
    ]),
    bCard(bT('wf.card.branch', 'Console repository branch'), [
      bCreate('p', { class: 'sys-kv', text: bText(bPick(ov, ['branch', 'default_branch', 'ref'], null)) })
    ]),
    bCard(bT('wf.card.dispatch', 'Console dispatch'), [
      bBadge(bT('wf.dispatch.disabled', 'Disabled'), 'sys-state is-unknown'),
      bCreate('p', { class: 'sys-metric-note', text: bT('wf.dispatch.note', 'Console v1 intentionally cannot trigger workflow runs.') })
    ])
  ]));

  var list = [];
  for (var i = 0; i < SYS_WORKFLOW_REGISTRY.length; i++) {
    var wf = SYS_WORKFLOW_REGISTRY[i];
    list.push(bCard(wf.name, [
      bCreate('code', { class: 'sys-path', text: wf.path }),
      bCreate('p', { class: 'sys-kv', text: wf.purpose }),
      bCreate('div', { class: 'sys-kv-row' }, [
        bCreate('span', { class: 'sys-kv-label', text: bT('wf.status', 'Status') + ': ' }),
        bBadge(bT('common.unknown', 'Unknown'), 'sys-state is-unknown')
      ]),
      bCreate('div', { class: 'sys-kv-row' }, [
        bCreate('span', { class: 'sys-kv-label', text: bT('wf.branchScope', 'Branch scope') + ': ' }),
        bCreate('span', { class: 'sys-kv-value', text: bT('wf.branchScope.unknown', 'Unknown — no live workflow data endpoint') })
      ])
    ], { class: 'sys-workflow-card' }));
  }
  wrap.appendChild(bGrid(list));

  wrap.appendChild(bWarning(bT('wf.note',
    'Workflow status is Unknown because no live workflow data endpoint is exposed to this console. Purposes are derived from the workflow file names, not from file contents.'), 'is-note'));
  wrap.appendChild(bWarning(bT('wf.deepseek',
    'DeepSeek has an external dispatch capability outside this console. Console v1 intentionally cannot trigger it; the only way to run these workflows is through the repository tooling itself.'), 'is-note'));
  return wrap;
}

/* ============================================================================
 * 4. SECURITY (evidence based, never a numeric score)
 * ========================================================================== */
function bSecState(v) {
  var s = String(v === null || v === undefined ? '' : v).toLowerCase().trim();
  if (s === 'passed' || s === 'pass' || s === 'ok' || s === 'verified' || s === 'true') return 'passed';
  if (s === 'configured' || s === 'enabled' || s === 'set' || s === 'present') return 'configured';
  if (s === 'warning' || s === 'warn' || s === 'degraded' || s === 'failed' || s === 'fail' || s === 'error' || s === 'exposed' || s === 'risk') return 'warning';
  return 'unknown';
}

function bSecStateLabel(state) {
  if (state === 'passed') return bT('security.state.passed', 'Passed');
  if (state === 'configured') return bT('security.state.configured', 'Configured');
  if (state === 'warning') return bT('security.state.warning', 'Warning');
  return bT('security.state.unknown', 'Unknown');
}

function bSecurityEntries(data) {
  var source = Object.create(null), i, k, def, alias, raw, item;
  raw = bPick(data, ['checks', 'controls', 'items', 'categories', 'findings', 'results'], null);
  if (Array.isArray(raw)) {
    for (i = 0; i < raw.length; i++) {
      item = raw[i];
      if (!item || typeof item !== 'object') continue;
      var id = bPick(item, ['id', 'key', 'name', 'slug'], null);
      if (id) source[String(id)] = item;
    }
  } else if (raw && typeof raw === 'object') {
    for (k in raw) {
      if (!bHas(raw, k)) continue;
      source[k] = (raw[k] && typeof raw[k] === 'object') ? raw[k] : { state: raw[k] };
    }
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (i = 0; i < SYS_SECURITY_DEFS.length; i++) {
      def = SYS_SECURITY_DEFS[i];
      if (source[def.id]) continue;
      for (var a = 0; a < def.aliases.length; a++) {
        alias = def.aliases[a];
        if (bHas(data, alias)) {
          var dv = data[alias];
          source[def.id] = (dv && typeof dv === 'object' && !Array.isArray(dv)) ? dv : { state: dv };
          break;
        }
      }
    }
  }
  var out = [];
  for (i = 0; i < SYS_SECURITY_DEFS.length; i++) {
    def = SYS_SECURITY_DEFS[i];
    var entry = source[def.id] || null;
    var rawState = entry ? bPick(entry, ['state', 'status', 'result', 'value'], null) : null;
    var evidence = entry ? bPick(entry, ['evidence', 'detail', 'details', 'note', 'description', 'message'], null) : null;
    out.push({
      id: def.id,
      label: def.label,
      state: bSecState(rawState),
      severity: entry ? bPick(entry, ['severity', 'level'], null) : null,
      evidence: evidence ? String(evidence) : bT('security.noEvidence', 'No evidence reported by the security endpoint.')
    });
  }
  return out;
}

function sysSectionSecurity() {
  if (typeof document === 'undefined') return null;
  var wrap = bCreate('div', { class: 'sys-section sys-section-security' });
  wrap.appendChild(bSectionHeader(
    bT('security.title', 'Security Posture'),
    bT('security.subtitle', 'Evidence-based security categories. No numeric security score is used.')
  ));
  wrap.appendChild(bWarning(bT('security.banner',
    'Evidence-based view: each category reflects what the security endpoint reported. “Unknown” means no evidence was reported — it is not a failure.'), 'is-info'));

  var entries = bSecurityEntries(bGet('security'));
  var counts = { passed: 0, configured: 0, unknown: 0, warning: 0 };
  for (var i = 0; i < entries.length; i++) counts[entries[i].state] = (counts[entries[i].state] || 0) + 1;

  wrap.appendChild(bGrid([
    bCard(bSecStateLabel('passed'), [bCreate('p', { class: 'sys-metric-value', text: bNum(counts.passed) })]),
    bCard(bSecStateLabel('configured'), [bCreate('p', { class: 'sys-metric-value', text: bNum(counts.configured) })]),
    bCard(bSecStateLabel('unknown'), [bCreate('p', { class: 'sys-metric-value', text: bNum(counts.unknown) })]),
    bCard(bSecStateLabel('warning'), [bCreate('p', { class: 'sys-metric-value', text: bNum(counts.warning) })])
  ], 'sys-summary'));

  var cards = [];
  for (var j = 0; j < entries.length; j++) cards.push(bSecurityCard(entries[j]));
  wrap.appendChild(bGrid(cards));

  var warnings = [];
  for (var w = 0; w < entries.length; w++) if (entries[w].state === 'warning') warnings.push(entries[w]);
  if (warnings.length) {
    var list = bCreate('ul', { class: 'sys-warning-list' });
    for (var x = 0; x < warnings.length; x++) {
      list.appendChild(bCreate('li', { class: 'sys-warning-item' }, [
        bBadge(warnings[x].severity ? String(warnings[x].severity) : bSecStateLabel('warning'), 'sys-severity'),
        bCreate('span', { class: 'sys-warning-label', text: warnings[x].label }),
        bCreate('span', { class: 'sys-warning-evidence', text: warnings[x].evidence })
      ]));
    }
    wrap.appendChild(bCard(bT('security.warnings', 'Warnings'), [list]));
  } else {
    wrap.appendChild(bCard(bT('security.warnings', 'Warnings'),
      [bEmpty(bT('security.warnings.empty', 'No warning-level security items were reported.'))]));
  }
  return wrap;
}

function bSecurityCard(entry) {
  return bCard(entry.label, [
    bCreate('div', { class: 'sys-security-state' }, [
      bBadge(bSecStateLabel(entry.state), 'sys-state is-' + entry.state),
      entry.severity ? bBadge(String(entry.severity), 'sys-severity') : null
    ]),
    bCreate('p', { class: 'sys-evidence', text: entry.evidence })
  ], { class: 'sys-security-card is-' + entry.state });
}

/* ============================================================================
 * 5. MONITORING
 * ========================================================================== */
function bCountPairs(v) {
  var out = [];
  if (Array.isArray(v)) {
    for (var i = 0; i < v.length; i++) {
      var it = v[i];
      if (!it || typeof it !== 'object') continue;
      var k = bPick(it, ['endpoint', 'path', 'route', 'name'], null);
      if (k) out.push([String(k), Number(bPick(it, ['count', 'requests', 'hits'], 0)) || 0]);
    }
  } else if (v && typeof v === 'object') {
    for (var key in v) if (bHas(v, key)) out.push([key, Number(v[key]) || 0]);
  }
  out.sort(function (a, b) { return b[1] - a[1]; });
  return out;
}

function sysSectionMonitoring() {
  if (typeof document === 'undefined') return null;
  var m = bGet('monitoring') || {};
  var wrap = bCreate('div', { class: 'sys-section sys-section-monitoring' });
  wrap.appendChild(bSectionHeader(
    bT('mon.title', 'Monitoring'),
    bT('mon.subtitle', 'Endpoint-reported runtime metrics plus clearly separated client-side measurements.')
  ));

  var events = bSafeArr(bPick(m, ['recent_events', 'recentEvents', 'events'], []));
  var counts = bCountPairs(bPick(m, ['endpoint_counts', 'endpointCounts', 'endpoints'], null));

  wrap.appendChild(bGrid([
    bCard(bT('mon.kpi.runtime', 'Runtime online'), [
      bBadge(bText(bPick(m, ['runtime_online', 'online', 'runtime'], null), bT('common.unknown', 'Unknown')),
        bStatusClass(bPick(m, ['runtime_online', 'online', 'runtime'], null)))
    ]),
    bCard(bT('mon.kpi.requests', 'Total requests'), [bCreate('p', { class: 'sys-metric-value', text: bNum(bPick(m, ['total_requests', 'requests'], null)) })]),
    bCard(bT('mon.kpi.avg', 'Rolling avg duration'), [bCreate('p', { class: 'sys-metric-value', text: bNum(bPick(m, ['rolling_avg_duration_ms', 'avg_duration_ms'], null)) + ' ms' })]),
    bCard(bT('mon.kpi.endpoints', 'Measured endpoints'), [bCreate('p', { class: 'sys-metric-value', text: bNum(counts.length) })])
  ], 'sys-summary'));

  var client = [];
  client.push(bCreate('li', { class: 'sys-client-item' }, [
    bCreate('span', { class: 'sys-kv-label', text: bT('mon.client.online', 'Browser online') + ': ' }),
    bCreate('span', { class: 'sys-kv-value', text: (typeof navigator !== 'undefined' && navigator && typeof navigator.onLine === 'boolean') ? String(navigator.onLine) : bT('common.unknown', 'Unknown') })
  ]));
  var st = bState();
  client.push(bCreate('li', { class: 'sys-client-item' }, [
    bCreate('span', { class: 'sys-kv-label', text: bT('mon.client.latency', 'Last console latency') + ': ' }),
    bCreate('span', { class: 'sys-kv-value', text: (st && st.lastLatencyMs !== null && st.lastLatencyMs !== undefined) ? bNum(st.lastLatencyMs) + ' ms' : bT('common.unknown', 'Unknown') })
  ]));
  var navDuration = null;
  try {
    if (typeof performance !== 'undefined' && performance && typeof performance.getEntriesByType === 'function') {
      var navs = performance.getEntriesByType('navigation');
      if (navs && navs.length && isFinite(navs[0].duration)) navDuration = Math.round(navs[0].duration);
    }
  } catch (e) { navDuration = null; }
  client.push(bCreate('li', { class: 'sys-client-item' }, [
    bCreate('span', { class: 'sys-kv-label', text: bT('mon.client.nav', 'Page navigation duration') + ': ' }),
    bCreate('span', { class: 'sys-kv-value', text: navDuration === null ? bT('common.unknown', 'Unknown') : bNum(navDuration) + ' ms' })
  ]));
  wrap.appendChild(bCard(bT('mon.client.title', 'Client measurements'), [
    bBadge(bT('mon.client.badge', 'CLIENT'), 'sys-scope is-client'),
    bCreate('ul', { class: 'sys-client-list' }, client),
    bCreate('p', { class: 'sys-metric-note', text: bT('mon.client.note', 'Measured in this browser tab only; not server-side telemetry.') })
  ], { class: 'sys-client-metrics' }));

  var series = [];
  for (var i = 0; i < events.length; i++) {
    if (events[i] && typeof events[i] === 'object') {
      var d = Number(bPick(events[i], ['duration_ms', 'durationMs', 'duration'], NaN));
      if (isFinite(d)) series.push(d);
    }
  }
  var chartHost = bCreate('div', { class: 'sys-chart-host' });
  if (series.length) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 800 220');
    svg.setAttribute('class', 'sys-chart');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', bT('mon.chart.alt', 'Recent request durations in milliseconds'));
    for (var g = 0; g <= 4; g++) {
      var gy = 20 + (180 * g) / 4;
      var line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', '20'); line.setAttribute('x2', '780');
      line.setAttribute('y1', String(gy)); line.setAttribute('y2', String(gy));
      line.setAttribute('class', 'sys-chart-grid');
      line.setAttribute('stroke', 'currentColor');
      line.setAttribute('stroke-opacity', '0.15');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }
    var poly = document.createElementNS(NS, 'polyline');
    poly.setAttribute('points', bChartPoints(series, { width: 800, height: 220, padX: 20, padY: 20 }));
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', 'currentColor');
    poly.setAttribute('stroke-width', '2');
    poly.setAttribute('class', 'sys-chart-line');
    svg.appendChild(poly);
    chartHost.appendChild(svg);
  } else {
    chartHost.appendChild(bEmpty(bT('mon.chart.empty', 'No duration samples were reported by the monitoring endpoint.')));
  }
  wrap.appendChild(bCard(bT('mon.chart.title', 'Recent request durations'), [chartHost]));

  if (counts.length) {
    var rows = counts.map(function (p) { return [bCreate('code', { class: 'sys-path', text: p[0] }), bNum(p[1])]; });
    wrap.appendChild(bCard(bT('mon.endpoints.title', 'Endpoint counts'),
      [bTable([bT('mon.col.endpoint', 'Endpoint'), bT('mon.col.count', 'Requests')], rows)]));
  } else {
    wrap.appendChild(bCard(bT('mon.endpoints.title', 'Endpoint counts'),
      [bEmpty(bT('mon.endpoints.empty', 'No endpoint counts were reported.'))]));
  }

  if (events.length) {
    var erows = [];
    for (var e = 0; e < events.length; e++) {
      var ev = events[e] || {};
      var t = bPick(ev, ['timestamp', 'ts', 'time', 'created_at'], null);
      erows.push([
        bCreate('span', { class: 'sys-time', text: bFmtDate(t) + ' ' + bFmtTime(t) }),
        bCreate('code', { class: 'sys-path', text: bText(bPick(ev, ['endpoint', 'path', 'route', 'url'], null)) }),
        bHttpBadge(bPick(ev, ['status', 'http_status', 'status_code'], null)),
        bCreate('span', { class: 'sys-duration', text: bNum(bPick(ev, ['duration_ms', 'durationMs', 'duration'], null)) + ' ms' })
      ]);
    }
    wrap.appendChild(bCard(bT('mon.events.title', 'Recent events'),
      [bTable([bT('mon.col.time', 'Time'), bT('mon.col.endpoint', 'Endpoint'), bT('mon.col.status', 'HTTP status'), bT('mon.col.duration', 'Duration')], erows)]));
  } else {
    wrap.appendChild(bCard(bT('mon.events.title', 'Recent events'),
      [bEmpty(bT('mon.events.empty', 'No recent events were reported.'))]));
  }

  wrap.appendChild(bWarning(bT('mon.scope',
    'Metrics scope: only endpoint-reported runtime values and browser-local measurements are shown. System CPU, memory and network metrics are not collected.'), 'is-note'));
  return wrap;
}

/* ============================================================================
 * 6. DEPLOYMENTS
 * ========================================================================== */
function sysSectionDeployments() {
  if (typeof document === 'undefined') return null;
  var ov = bGet('overview') || {};
  var wrap = bCreate('div', { class: 'sys-section sys-section-deployments' });
  wrap.appendChild(bSectionHeader(
    bT('deploy.title', 'Deployments'),
    bT('deploy.subtitle', 'Repository, branch and hosting information reported by the overview endpoint.')
  ));
  wrap.appendChild(bWarning(bT('deploy.readonly',
    'Read-only: this console provides no deployment, rollback or promotion actions in v1.'), 'is-info'));

  var branch = bPick(ov, ['branch', 'default_branch', 'ref'], null);
  var hosting = bPick(ov, ['hosting', 'host', 'provider', 'platform'], null);
  var depStatus = bPick(ov, ['deployment_status', 'deploymentStatus', 'deploy_status'], null);
  var repo = bPick(ov, ['repository', 'repo', 'repo_full_name'], null);

  var unknownNote = bT('deploy.unknownNote', 'No live status is available from this console.');
  var stages = [
    { id: 'code', label: bT('deploy.stage.code', 'Code'), state: branch ? 'known' : 'unknown',
      note: branch ? bT('deploy.stage.code.note', 'Repository branch is known to the console.') : bT('deploy.stage.code.unknown', 'No branch reported by the overview endpoint.') },
    { id: 'build', label: bT('deploy.stage.build', 'Build'), state: bStatusClass(bPick(ov, ['build_status', 'buildStatus'], null)), note: unknownNote },
    { id: 'test', label: bT('deploy.stage.test', 'Test'), state: bStatusClass(bPick(ov, ['test_status', 'testStatus', 'tests'], null)), note: unknownNote },
    { id: 'deploy', label: bT('deploy.stage.deploy', 'Deploy'), state: bStatusClass(depStatus), note: unknownNote },
    { id: 'monitor', label: bT('deploy.stage.monitor', 'Monitor'), state: bStatusClass(bPick(ov, ['monitoring_status', 'monitoringStatus'], null)), note: unknownNote }
  ];

  var pipe = bCreate('ol', { class: 'sys-pipeline' });
  for (var i = 0; i < stages.length; i++) {
    var s = stages[i];
    var resolved = s.state;
    if (resolved !== 'known' && resolved === 'is-unknown') resolved = 'unknown';
    pipe.appendChild(bCreate('li', { class: 'sys-stage sys-stage-' + resolved }, [
      bCreate('span', { class: 'sys-stage-label', text: s.label }),
      bBadge(resolved === 'known' ? bT('deploy.stage.known', 'Known') : bT('common.unknown', 'Unknown'),
        'sys-state is-' + (resolved === 'known' ? 'ok' : 'unknown')),
      bCreate('span', { class: 'sys-stage-note', text: s.note })
    ]));
  }
  wrap.appendChild(bCard(bT('deploy.pipeline', 'Pipeline'), [pipe]));

  wrap.appendChild(bGrid([
    bCard(bT('deploy.card.repository', 'Repository'), [bCreate('p', { class: 'sys-kv', text: bText(repo) })]),
    bCard(bT('deploy.card.hosting', 'Hosting'), [bCreate('p', { class: 'sys-kv', text: bText(hosting) })]),
    bCard(bT('deploy.card.branch', 'Branch'), [bCreate('p', { class: 'sys-kv', text: bText(branch) })]),
    bCard(bT('deploy.card.status', 'Deployment status'), [
      bBadge(bText(depStatus, bT('common.unknown', 'Unknown')), bStatusClass(depStatus))
    ])
  ]));
  return wrap;
}

/* ============================================================================
 * 7. LOGS (console access events only)
 * ========================================================================== */
function sysSectionLogs() {
  if (typeof document === 'undefined') return null;
  var m = bGet('monitoring') || {};
  var events = bSafeArr(bPick(m, ['recent_events', 'recentEvents', 'events'], []));
  var wrap = bCreate('div', { class: 'sys-section sys-section-logs' });
  wrap.appendChild(bSectionHeader(
    bT('logs.title', 'Engineering Console Events'),
    bT('logs.subtitle', 'Access events reported by the monitoring endpoint.')
  ));
  wrap.appendChild(bWarning(bT('logs.warning',
    'These are console access events only — not application messages. No user identifiers, payloads or message content are displayed.'), 'is-info'));

  if (!events.length) {
    wrap.appendChild(bEmpty(bT('logs.empty', 'The monitoring endpoint reported no console events.')));
    return wrap;
  }
  var rows = [];
  for (var i = 0; i < events.length; i++) {
    var ev = events[i] || {};
    var t = bPick(ev, ['timestamp', 'ts', 'time', 'created_at'], null);
    rows.push([
      bCreate('span', { class: 'sys-time', text: bFmtDate(t) + ' ' + bFmtTime(t) }),
      bCreate('code', { class: 'sys-path', text: bText(bPick(ev, ['endpoint', 'path', 'route', 'url'], null)) }),
      bHttpBadge(bPick(ev, ['status', 'http_status', 'status_code'], null)),
      bCreate('span', { class: 'sys-duration', text: bNum(bPick(ev, ['duration_ms', 'durationMs', 'duration'], null)) + ' ms' })
    ]);
  }
  wrap.appendChild(bTable([
    bT('logs.col.time', 'Time'), bT('logs.col.endpoint', 'Endpoint'),
    bT('logs.col.status', 'HTTP Status'), bT('logs.col.duration', 'Duration')
  ], rows));
  return wrap;
}

/* ============================================================================
 * 8. SETTINGS (read-only summary + console-local cache actions)
 * ========================================================================== */
function bEnvFlags(ov, sec) {
  var names = ['production', 'is_production', 'staging', 'is_staging', 'live', 'debug', 'maintenance'];
  var out = [];
  for (var i = 0; i < names.length; i++) {
    var v = bPick(ov, [names[i]], undefined);
    if (v === undefined) v = bPick(sec, [names[i]], undefined);
    if (typeof v === 'boolean') out.push([names[i], v]);
  }
  return out;
}

function sysSectionSettings() {
  if (typeof document === 'undefined') return null;
  var ov = bGet('overview') || {};
  var sec = bGet('security');
  var st = bState() || {};
  var wrap = bCreate('div', { class: 'sys-section sys-section-settings' });
  wrap.appendChild(bSectionHeader(
    bT('settings.title', 'Settings'),
    bT('settings.subtitle', 'Read-only configuration summary for this console.')
  ));

  var gate = 'unknown';
  var entries = bSecurityEntries(sec);
  for (var i = 0; i < entries.length; i++) if (entries[i].id === 'admin_gate') gate = entries[i].state;
  var gateText = gate === 'configured' || gate === 'passed' ? bT('settings.gate.enabled', 'Enabled')
    : (gate === 'unknown' ? bT('common.unknown', 'Unknown') : bT('settings.gate.other', 'Not confirmed enabled'));

  var lang = (st && st.lang) || (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang) || null;
  if (!lang && typeof navigator !== 'undefined' && navigator) lang = navigator.language;
  var cacheKeys = 0;
  if (st && st.cache && typeof st.cache === 'object') cacheKeys = Object.keys(st.cache).length;
  var lastRefresh = (st && st.lastRefresh) ? (bFmtDate(st.lastRefresh) + ' ' + bFmtTime(st.lastRefresh)) : null;

  function kv(label, value) {
    return bCreate('div', { class: 'sys-kv-row' }, [
      bCreate('span', { class: 'sys-kv-label', text: label + ': ' }),
      bCreate('span', { class: 'sys-kv-value', text: value })
    ]);
  }

  wrap.appendChild(bCard(bT('settings.config', 'Configuration'), [
    kv(bT('settings.language', 'Language'), bText(lang, bT('common.unknown', 'Unknown'))),
    kv(bT('settings.mode', 'Mode'), bT('settings.mode.value', 'READ ONLY')),
    kv(bT('settings.gate', 'Server admin gate'), gateText),
    kv(bT('settings.branch', 'Branch'), bText(bPick(ov, ['branch', 'default_branch', 'ref'], null))),
    kv(bT('settings.hosting', 'Hosting'), bText(bPick(ov, ['hosting', 'host', 'provider', 'platform'], null))),
    kv(bT('settings.cache', 'Local cache keys'), bNum(cacheKeys)),
    kv(bT('settings.lastRefresh', 'Last refresh'), bText(lastRefresh, bT('settings.never', 'Not yet refreshed')))
  ]));

  var flags = bEnvFlags(ov, sec);
  var flagHost = bCreate('div', { class: 'sys-env-flags' });
  if (flags.length) {
    for (var f = 0; f < flags.length; f++) {
      flagHost.appendChild(bCreate('div', { class: 'sys-env-flag' }, [
        bCreate('span', { class: 'sys-kv-label', text: flags[f][0] }),
        bBadge(flags[f][1] ? bT('settings.true', 'true') : bT('settings.false', 'false'),
          'sys-state is-' + (flags[f][1] ? 'ok' : 'unknown'))
      ]));
    }
  } else {
    flagHost.appendChild(bEmpty(bT('settings.env.empty', 'No environment booleans were reported.')));
  }
  wrap.appendChild(bCard(bT('settings.environment', 'Environment flags'), [flagHost]));

  var clearBtn = bCreate('button', {
    type: 'button', class: 'sys-btn', text: bT('settings.clearCache', 'Clear console cache')
  });
  bOn(clearBtn, 'click', function () {
    var s = bState();
    if (!s) return;
    s.cache = Object.create(null);
    s.tableCount = Object.create(null);
    s.lastRefresh = null;
    if (typeof sysLoadSection === 'function' && s.section) {
      try { sysLoadSection(s.section, true); } catch (e) { /* ignore */ }
    }
  });
  var refreshBtn = bCreate('button', {
    type: 'button', class: 'sys-btn', text: bT('settings.refresh', 'Refresh current section')
  });
  bOn(refreshBtn, 'click', function () {
    var s = bState();
    if (typeof sysLoadSection === 'function' && s && s.section) {
      try { sysLoadSection(s.section, true); } catch (e) { /* ignore */ }
    }
  });
  wrap.appendChild(bCard(bT('settings.actions', 'Console-local actions'), [
    bCreate('div', { class: 'sys-actions' }, [clearBtn, refreshBtn]),
    bCreate('p', { class: 'sys-metric-note', text: bT('settings.actions.note',
      'These actions only affect browser-local console cache. No production data is modified.') })
  ]));

  wrap.appendChild(bCard(bT('settings.help', 'Console access'), [
    kv(bT('settings.shortcut', 'Keyboard shortcut'), bT('settings.shortcut.value', 'Alt+Shift+V')),
    kv(bT('settings.url', 'Access URL'), bT('settings.url.value', '#system-console')),
    bCreate('p', { class: 'sys-metric-note', text: bT('settings.help.note',
      'This console is read-only by design and cannot mutate production state.') })
  ]));
  return wrap;
}

/* ============================================================================
 * 10. DRAWER CONTENT EXTENSION (capability, then delegate)
 * ========================================================================== */
function bCapabilityDrawer(payload) {
  var p = payload || {};
  return bCreate('div', { class: 'sys-drawer-body' }, [
    bCreate('h3', { class: 'sys-drawer-title', text: bText(p.name, bT('drawer.capability', 'Capability')) }),
    bCreate('p', { class: 'sys-drawer-text', text: bText(p.description, bT('common.unknown', 'Unknown')) }),
    bWarning(bT('drawer.capability.note',
      'Read-only: capabilities describe what the agent can do. The console cannot execute them.'), 'is-info')
  ]);
}

function bFallbackDrawer(type, payload) {
  var label = bText(type, bT('drawer.unknown', 'Details'));
  var body = bCreate('div', { class: 'sys-drawer-body' }, [
    bCreate('h3', { class: 'sys-drawer-title', text: label })
  ]);
  var detail = null;
  if (payload && typeof payload === 'object') detail = bPick(payload, ['title', 'name', 'label', 'id'], null);
  body.appendChild(detail ? bCreate('p', { class: 'sys-drawer-text', text: String(detail) })
    : bEmpty(bT('drawer.noDetail', 'No detail renderer is registered for this item.')));
  return body;
}

/* Preserve any drawer renderer defined by core or sections-a. */
var sysDrawerContentA = (typeof sysDrawerContent === 'function') ? sysDrawerContent : null;

function sysDrawerContentB(type, payload) {
  if (type === 'capability' || type === 'ai-capability') return bCapabilityDrawer(payload);
  if (sysDrawerContentA) {
    try {
      var rendered = sysDrawerContentA(type, payload);
      if (rendered) return rendered;
    } catch (e) { /* fall through to fallback */ }
  }
  return bFallbackDrawer(type, payload);
}

/* Install the extended drawer renderer without losing existing table/node drawers. */
var sysDrawerContent = sysDrawerContentB;

/* Exported section renderers consumed by system-console-core.js:
 * sysSectionApis, sysSectionAi, sysSectionWorkflows, sysSectionSecurity,
 * sysSectionMonitoring, sysSectionDeployments, sysSectionLogs, sysSectionSettings
 */
