/* =====================================================================
 * Vibe System Console — Sections A
 * Injected after system-console-core.js inside the shared IIFE scope.
 * Core available: sysState, sysFetch, sysGet, sysLoadSection,
 * sysOpenDrawer, sysCloseDrawer, sysE, sysFmtDate, sysFmtTime, sysNumber,
 * sysStatusClass, sysBadge, sysMethodBadge, sysRiskBadge, sysCard,
 * sysSectionHeader, sysEmpty, sysLoading, sysWarning, sysFilterButton,
 * sysSafeArray, t, esc, on, render.
 * No inline styles / no inline events / no eval. All strings are escaped.
 * Sections: Overview, Architecture, Database, Auth, Rooms, Messaging,
 * Realtime, Storage. Plus drawer content + post-render wiring.
 * ===================================================================== */

/* --- local safe primitives ------------------------------------------- */

function secEsc(value) {
  var s = (value === null || value === undefined) ? '' : String(value);
  if (typeof esc === 'function') { try { return esc(s); } catch (e) { /* fall through */ } }
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function secArr(value) {
  if (typeof sysSafeArray === 'function') { try { return sysSafeArray(value); } catch (e) { /* fall through */ } }
  return Array.isArray(value) ? value : [];
}

function secNum(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof sysNumber === 'function') { try { return sysNumber(value); } catch (e) { /* fall through */ } }
  return String(value);
}

function secT(key, fallback) {
  if (typeof t === 'function') { try { var v = t(key); if (v && v !== key) return v; } catch (e) { /* fall through */ } }
  return (fallback === undefined || fallback === null) ? String(key) : fallback;
}

function secSlug(value) {
  var s = String(value === null || value === undefined ? '' : value).toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s || 'other';
}

function secTrunc(value, max) {
  var s = String(value === null || value === undefined ? '' : value);
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function secRender() {
  if (typeof render === 'function') { try { render(); } catch (e) { /* ignore */ } }
}

/* --- local markup helpers -------------------------------------------- */

function secHeader(title, sub) {
  if (typeof sysSectionHeader === 'function') { try { return sysSectionHeader(title, sub); } catch (e) { /* fall through */ } }
  return '<div class="sys-section-header"><h2 class="sys-section-title">' + secEsc(title) + '</h2>' +
    (sub ? '<p class="sys-section-sub">' + secEsc(sub) + '</p>' : '') + '</div>';
}

function secEmpty(msg) {
  if (typeof sysEmpty === 'function') { try { return sysEmpty(msg); } catch (e) { /* fall through */ } }
  return '<div class="sys-empty">' + secEsc(msg) + '</div>';
}

function secWarning(msg) {
  if (typeof sysWarning === 'function') { try { return sysWarning(msg); } catch (e) { /* fall through */ } }
  return '<div class="sys-warning sys-card">' + secEsc(msg) + '</div>';
}

function secBadge(text, status) {
  var cls = 'sys-badge';
  if (status && typeof sysStatusClass === 'function') {
    try { var extra = sysStatusClass(status); if (extra) cls += ' ' + extra; } catch (e) { /* ignore */ }
  }
  return '<span class="' + cls + '">' + secEsc(text === null || text === undefined ? '' : text) + '</span>';
}

function secMethod(method) {
  var m = method || 'GET';
  if (typeof sysMethodBadge === 'function') { try { return sysMethodBadge(m); } catch (e) { /* fall through */ } }
  return secBadge(m, 'info');
}

function secBlock(title, inner, sub) {
  return '<section class="sys-block">' +
    '<div class="sys-block-head">' + secEsc(title) +
    (sub ? ' <span class="sys-muted">' + secEsc(sub) + '</span>' : '') + '</div>' + inner + '</section>';
}

function secTable(headers, rows) {
  var head = secArr(headers).map(function (h) { return '<th>' + secEsc(h) + '</th>'; }).join('');
  var body = secArr(rows).map(function (r) {
    return '<tr>' + secArr(r).map(function (c) { return '<td>' + (c === null || c === undefined ? '' : c) + '</td>'; }).join('') + '</tr>';
  }).join('');
  return '<table class="sys-table"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>';
}

function secKpi(label, value) {
  return '<div class="sys-card sys-kpi-card">' +
    '<div class="sys-kpi-value">' + (value === null || value === undefined ? '—' : value) + '</div>' +
    '<div class="sys-kpi-label">' + secEsc(label) + '</div></div>';
}

function secBoolCard(label, value) {
  var status = value === true ? 'ok' : (value === false ? 'off' : 'unknown');
  var text = value === true ? secT('configured', 'Configured')
    : (value === false ? secT('not_configured', 'Not configured') : secT('unknown', 'Unknown'));
  return '<div class="sys-card sys-config-card">' +
    '<div class="sys-config-label">' + secEsc(label) + '</div>' +
    '<div class="sys-config-value">' + secBadge(text, status) + '</div></div>';
}

function secDate(ts) {
  if (ts === null || ts === undefined || ts === '') return '—';
  try {
    if (typeof sysFmtDate === 'function') {
      var d = sysFmtDate(ts);
      var tm = (typeof sysFmtTime === 'function') ? sysFmtTime(ts) : '';
      return String(d || '') + (tm ? ' ' + tm : '');
    }
  } catch (e) { /* ignore */ }
  return String(ts);
}

function secEntries(obj) {
  var out = [];
  if (!obj) return out;
  if (Array.isArray(obj)) {
    obj.forEach(function (x, i) {
      if (x && typeof x === 'object') {
        out.push({ key: x.name || x.id || ('item_' + (i + 1)), status: x.status || x.state, detail: x.detail || x.message || x.summary });
      } else { out.push({ key: String(x), status: x === true ? 'ok' : x, detail: null }); }
    });
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      if (v && typeof v === 'object') out.push({ key: k, status: v.status || v.state, detail: v.detail || v.message || v.summary });
      else out.push({ key: k, status: v === true ? 'ok' : (v === false ? 'off' : v), detail: null });
    });
  }
  return out;
}

/* Relation shapes: the backend emits source_table / target_table; older shapes
   (from / to, from_table / to_table, source / target, parent / child, table /
   references) are still accepted as fallbacks. */
function secRelationFrom(r) { return r && (r.from || r.from_table || r.source_table || r.source || r.parent || r.table); }
function secRelationTo(r) { return r && (r.to || r.to_table || r.target_table || r.target || r.child || r.references); }

/* schema?table=<name> reports the RLS-scoped visible row count. Accepts both the
   grouped payload { visible: { table, scope, visible_count, error } } and the
   flat visible_count / visible_count_error keys. Always returns
   { count: number|null, error: string|null } — never an object. */
function secVisibleCount(result) {
  var r = (result && typeof result === 'object') ? result : {};
  var v = (r.visible && typeof r.visible === 'object' && !Array.isArray(r.visible)) ? r.visible : null;
  var rawCount = v ? v.visible_count : r.visible_count;
  var rawError = v ? v.error : r.visible_count_error;
  var count = (typeof rawCount === 'number' && isFinite(rawCount)) ? rawCount : null;
  return { count: count, error: rawError ? String(rawError) : null };
}

function secFindTable(name) {
  var schema = (typeof sysGet === 'function') ? sysGet('schema') : null;
  var found = null;
  secArr(schema && schema.tables).forEach(function (tb) { if (tb && tb.name === name) found = tb; });
  return found;
}

/* --- event binding helpers (no inline handlers) ---------------------- */

var SYS_SEC_A_GLOBAL_BOUND = false;

function secDelegate(scope, type, selector, handler) {
  var root = (typeof scope === 'string') ? document.querySelector(scope) : scope;
  if (!root || !root.addEventListener) return;
  root.addEventListener(type, function (ev) {
    var t = ev.target;
    var hit = (t && t.closest) ? t.closest(selector) : null;
    if (hit && root.contains(hit)) handler(ev, hit);
  });
}

function secBindGlobalOnce() {
  if (SYS_SEC_A_GLOBAL_BOUND) return;
  SYS_SEC_A_GLOBAL_BOUND = true;

  secDelegate(document, 'click', '[data-sys-load]', function (ev, el) {
    ev.preventDefault();
    if (typeof sysLoadSection === 'function') sysLoadSection(el.getAttribute('data-sys-load'));
  });

  secDelegate(document, 'click', '[data-sys-table]', function (ev, el) {
    ev.preventDefault();
    var table = secFindTable(el.getAttribute('data-sys-table'));
    if (table && typeof sysOpenDrawer === 'function') sysOpenDrawer('table', table);
  });

  secDelegate(document, 'click', '[data-sys-domain]', function (ev, el) {
    ev.preventDefault();
    var value = el.getAttribute('data-sys-domain');
    if (!sysState.filters) sysState.filters = {};
    sysState.filters.domain = (value && value !== '__all__') ? value : null;
    secRender();
  });

  secDelegate(document, 'click', '[data-sys-check]', function (ev, el) {
    ev.preventDefault();
    var name = el.getAttribute('data-sys-check');
    if (!name || typeof sysFetch !== 'function') return;
    if (!sysState.tableCount) sysState.tableCount = {};
    if (!sysState.tableCountError) sysState.tableCountError = {};
    el.disabled = true;
    Promise.resolve(sysFetch('schema?table=' + encodeURIComponent(name), true)).then(function (result) {
      var info = secVisibleCount(result);
      if (info.error || info.count === null) {
        /* Unknown count: store null, never 0, and keep the error separate. */
        sysState.tableCount[name] = null;
        sysState.tableCountError[name] = info.error || 'visible_count_unavailable';
      } else {
        sysState.tableCount[name] = info.count;
        sysState.tableCountError[name] = null;
      }
      secRender();
    }).catch(function () {
      sysState.tableCount[name] = null;
      sysState.tableCountError[name] = 'request_failed';
      secRender();
    });
  });
}

/* =====================================================================
 * 1) Overview
 * ===================================================================== */

function sysSectionOverview() {
  var d = (typeof sysGet === 'function') ? sysGet('overview') : null;
  if (!d) {
    return secHeader(secT('overview', 'Overview'), secT('overview_sub', 'Repository, health, environment and deployment')) +
      secEmpty(secT('overview_empty', 'Overview data is not loaded yet.'));
  }

  var html = secHeader(secT('overview', 'Overview'), secT('overview_sub', 'Repository, health, environment and deployment'));

  var legacy = d.legacy_rooms;
  var legacyCount = Array.isArray(legacy) ? legacy.length : (typeof legacy === 'number' ? legacy : null);

  html += '<div class="sys-kpi-grid">' +
    secKpi(secT('tables', 'Tables'), secNum(d.tables_count)) +
    secKpi(secT('rls_tables', 'RLS tables'), secNum(d.rls_tables_count)) +
    secKpi(secT('api_endpoints', 'API endpoints'), secNum(d.api_count)) +
    secKpi(secT('arch_nodes', 'Architecture nodes'), secNum(d.architecture_nodes_count)) +
    secKpi(secT('legacy_rooms', 'Legacy rooms'), legacyCount === null ? '—' : secNum(legacyCount)) +
    '</div>';

  var repo = d.repository;
  var repoName = (typeof repo === 'string') ? repo : (repo && (repo.name || repo.full_name || repo.slug) || '');
  var repoBranch = (repo && typeof repo === 'object' && repo.branch) || (d.build && d.build.branch) || '';
  if (repoName || repoBranch) {
    html += '<div class="sys-card sys-card-wide"><div class="sys-card-title">' + secEsc(secT('repository', 'Repository')) + '</div>' +
      '<div class="sys-kv">' + secEsc(repoName || '—') +
      (repoBranch ? ' · <span class="sys-muted">' + secEsc(repoBranch) + '</span>' : '') + '</div></div>';
  }

  /* Backend environment keys: admin_console_configured, spotify_configured, support_configured. */
  var env = d.environment || {};
  html += secBlock(secT('environment', 'Environment'), '<div class="sys-grid sys-grid-3">' +
    secBoolCard('Admin', env.admin_console_configured) +
    secBoolCard('Spotify', env.spotify_configured) +
    secBoolCard('Support', env.support_configured) +
    '</div>');

  var modules = d.modules;
  var moduleItems = [];
  if (Array.isArray(modules)) {
    moduleItems = modules.map(function (m, i) {
      if (m && typeof m === 'object') return { name: m.name || m.id || ('Module ' + (i + 1)), status: m.status, detail: m.detail || m.description };
      return { name: String(m), status: null, detail: null };
    });
  } else if (modules && typeof modules === 'object') {
    moduleItems = Object.keys(modules).map(function (k) {
      var v = modules[k];
      if (v && typeof v === 'object') return { name: k, status: v.status, detail: v.detail || v.description };
      return { name: k, status: v === true ? 'ok' : (v === false ? 'off' : null), detail: null };
    });
  }
  html += secBlock(secT('modules', 'Modules'), moduleItems.length
    ? '<div class="sys-grid sys-grid-3">' + moduleItems.map(function (it) {
        return '<div class="sys-card sys-module-card">' +
          '<div class="sys-module-name">' + secEsc(it.name) + (it.status ? secBadge(it.status, it.status) : '') + '</div>' +
          (it.detail ? '<div class="sys-module-detail">' + secEsc(it.detail) + '</div>' : '') + '</div>';
      }).join('') + '</div>'
    : secEmpty(secT('modules_empty', 'No modules reported.')));

  var build = d.build || {};
  var stageBranch = build.branch || build.ref || repoBranch || secT('unknown', 'unknown');
  var stages = [
    { name: secT('stage_code', 'Code'), status: 'ok', detail: stageBranch },
    { name: secT('stage_build', 'Build'), status: 'unknown', detail: secT('unknown', 'unknown') },
    { name: secT('stage_test', 'Test'), status: 'unknown', detail: secT('unknown', 'unknown') },
    { name: secT('stage_deploy', 'Deploy'), status: 'unknown', detail: secT('unknown', 'unknown') },
    { name: secT('stage_monitor', 'Monitor'), status: 'unknown', detail: secT('unknown', 'unknown') }
  ];
  html += secBlock(secT('deployment', 'Deployment'), '<div class="sys-pipeline">' + stages.map(function (s, i) {
    var part = '<div class="sys-pipeline-stage">' +
      '<div class="sys-pipeline-name">' + secEsc(s.name) + '</div>' +
      '<div class="sys-pipeline-status">' + secBadge(s.status, s.status) + '</div>' +
      '<div class="sys-pipeline-detail">' + secEsc(s.detail) + '</div></div>';
    if (i < stages.length - 1) part += '<div class="sys-pipeline-arrow" aria-hidden="true">→</div>';
    return part;
  }).join('') + '</div>', secT('deploy_sub', 'status unknown except code/branch'));

  var health = secEntries(d.health);
  html += secBlock(secT('health', 'Health'), health.length
    ? '<div class="sys-grid sys-grid-2">' + health.map(function (it) {
        return '<div class="sys-card sys-health-card">' +
          '<div class="sys-health-name">' + secEsc(it.key) + secBadge(it.status || 'unknown', it.status) + '</div>' +
          '<div class="sys-health-detail">' + secEsc(it.detail || '—') + '</div></div>';
      }).join('') + '</div>'
    : secEmpty(secT('health_empty', 'No health signals reported.')));

  var events = secArr(d.safe_events);
  if (events.length) {
    var rows = events.slice(-8).reverse().map(function (ev) {
      var when = ev && (ev.created_at || ev.time || ev.timestamp || ev.at);
      var type = ev && (ev.type || ev.event || ev.kind);
      var detail = ev && (ev.detail || ev.message || ev.summary);
      return [secEsc(secDate(when)), secBadge(type || 'event', ev && ev.status), secEsc(detail === null || detail === undefined ? '' : detail)];
    });
    html += secBlock(secT('safe_events', 'Safe events'), '<div class="sys-table-wrap">' +
      secTable([secT('time', 'Time'), secT('type', 'Type'), secT('detail', 'Detail')], rows) + '</div>',
      secT('last_8', 'last 8'));
  }

  html += '<div class="sys-card sys-cta-card"><div class="sys-card-title">' + secEsc(secT('architecture', 'Architecture')) + '</div>' +
    '<p class="sys-muted">' + secEsc(secT('arch_cta', 'Review the system architecture map, nodes and edges.')) + '</p>' +
    '<button type="button" class="sys-btn" data-sys-load="architecture">' + secEsc(secT('open_architecture', 'Open architecture map')) + '</button></div>';

  return html;
}

/* =====================================================================
 * 2) Architecture
 * ===================================================================== */

var SYS_ARCH_LAYOUT = {
  client: [80, 90], worker: [330, 90], admin_console: [570, 40],
  supabase_auth: [570, 155], postgrest: [570, 270], realtime: [820, 80],
  storage: [820, 200], profiles: [820, 320], chat: [330, 300],
  rooms: [330, 440], notifications: [570, 420], spotify: [1040, 90],
  resend: [1040, 200], deepseek: [80, 520], github: [330, 590], cinema: [820, 520]
};
var SYS_ARCH_NODE_W = 180;
var SYS_ARCH_NODE_H = 68;

function secArchNodeHtml(node, mutedGroups) {
  var pos = SYS_ARCH_LAYOUT[node && node.id];
  if (!pos) return '';
  var group = secSlug(node.group || 'other');
  var cls = 'sys-node group-' + group + ' status-' + secSlug(node.status || 'unknown');
  if (mutedGroups && mutedGroups !== group) cls += ' is-muted';
  return '<g class="' + cls + '" transform="translate(' + pos[0] + ' ' + pos[1] + ')" ' +
    'data-sys-node="' + secEsc(node.id) + '" tabindex="0" role="button" ' +
    'aria-label="' + secEsc(node.label || node.id) + '">' +
    '<rect width="' + SYS_ARCH_NODE_W + '" height="' + SYS_ARCH_NODE_H + '" rx="12"></rect>' +
    '<text class="sys-node-label" x="' + (SYS_ARCH_NODE_W / 2) + '" y="30" text-anchor="middle">' +
    secEsc(secTrunc(node.label || node.id, 24)) + '</text>' +
    '<text class="sys-node-status" x="' + (SYS_ARCH_NODE_W / 2) + '" y="50" text-anchor="middle">' +
    secEsc(secTrunc(node.group || node.status || 'unknown', 24)) + '</text></g>';
}

function secArchEdgeHtml(edge) {
  var a = SYS_ARCH_LAYOUT[edge && edge.from];
  var b = SYS_ARCH_LAYOUT[edge && edge.to];
  if (!a || !b) return '';
  var x1 = a[0] + SYS_ARCH_NODE_W / 2, y1 = a[1] + SYS_ARCH_NODE_H / 2;
  var x2 = b[0] + SYS_ARCH_NODE_W / 2, y2 = b[1] + SYS_ARCH_NODE_H / 2;
  return '<line class="sys-edge" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" ' +
    'marker-end="url(#sys-arch-arrow)" data-sys-edge-from="' + secEsc(edge.from) + '" data-sys-edge-to="' + secEsc(edge.to) + '"></line>';
}

function sysSectionArchitecture() {
  var arch = (typeof sysGet === 'function') ? sysGet('architecture') : null;
  if (!arch || !secArr(arch.nodes).length) {
    return secHeader(secT('architecture', 'Architecture'), secT('arch_svg', 'Client, services and data flow')) +
      secEmpty(secT('arch_empty', 'Architecture data is not loaded yet.'));
  }

  var zoom = (typeof sysState.zoom === 'number') ? sysState.zoom : 100;
  var search = (sysState.search || '').toLowerCase();
  var activeGroup = sysState.archGroup || null;

  var allNodes = secArr(arch.nodes).filter(function (n) { return n && n.id; });
  var nodes = allNodes.filter(function (n) {
    if (!search) return true;
    var hay = [n.id, n.label, n.group, n.detail].join(' ').toLowerCase();
    return hay.indexOf(search) !== -1;
  });
  var visibleIds = {};
  nodes.forEach(function (n) { visibleIds[n.id] = true; });
  var edges = secArr(arch.edges).filter(function (e) { return e && visibleIds[e.from] && visibleIds[e.to]; });

  var groups = [];
  var legend = secArr(arch.legend);
  if (legend.length) {
    legend.forEach(function (l) { if (l) groups.push({ id: l.group || l.id, label: l.label || l.title || l.group || l.id }); });
  }
  if (!groups.length) {
    var seen = {};
    allNodes.forEach(function (n) {
      var g = n.group || 'other';
      if (!seen[g]) { seen[g] = true; groups.push({ id: g, label: g }); }
    });
  }

  var html = secHeader(secT('architecture', 'Architecture'), secT('arch_svg', 'Client, services and data flow'));

  var toolbar = '<div class="sys-architecture-toolbar" role="toolbar">' +
    '<div class="sys-zoom-group">' +
    '<button type="button" class="sys-btn sys-zoom-btn" data-sys-zoom="90">90%</button>' +
    '<button type="button" class="sys-btn sys-zoom-btn" data-sys-zoom="100">100%</button>' +
    '<button type="button" class="sys-btn sys-zoom-btn" data-sys-zoom="110">110%</button></div>' +
    '<input type="text" class="sys-input sys-arch-search" data-sys-arch-search ' +
    'placeholder="' + secEsc(secT('search_nodes', 'Search nodes')) + '" value="' + secEsc(sysState.search || '') + '"></div>';

  var legendHtml = '<div class="sys-arch-legend">' + groups.map(function (g) {
    var active = activeGroup === g.id;
    return '<button type="button" class="sys-chip' + (active ? ' is-active' : '') + '" data-sys-arch-group="' +
      secEsc(g.id) + '">' + secEsc(g.label) + '</button>';
  }).join('') + '</div>';

  var svg = '<svg class="sys-architecture-stage" viewBox="0 0 1200 700" role="img" ' +
    'aria-label="' + secEsc(secT('arch_svg', 'Architecture map')) + '" data-sys-arch-svg>' +
    '<defs><marker id="sys-arch-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
    '<path class="sys-edge-arrow" d="M0 0 L10 5 L0 10 z"></path></marker></defs>' +
    edges.map(secArchEdgeHtml).join('') +
    nodes.map(function (n) { return secArchNodeHtml(n, activeGroup); }).join('') +
    '</svg>';

  html += '<div class="sys-architecture-wrap sys-zoom-' + zoom + '" data-sys-arch-wrap>' + toolbar + legendHtml + svg + '</div>';

  html += '<div class="sys-card sys-arch-summary">' +
    '<div class="sys-kv">' + secEsc(secT('nodes', 'Nodes')) + ': ' + secNum(nodes.length) + ' / ' + secNum(allNodes.length) + '</div>' +
    '<div class="sys-kv">' + secEsc(secT('edges', 'Edges')) + ': ' + secNum(edges.length) + '</div>' +
    '<div class="sys-muted">' + secEsc(secT('arch_hint', 'Select a node to inspect id, group, status and connected edges.')) + '</div></div>';

  return html;
}

/* =====================================================================
 * 3) Database
 * ===================================================================== */

function sysSectionDatabase() {
  var schema = (typeof sysGet === 'function') ? sysGet('schema') : null;
  if (!schema || !secArr(schema.tables).length) {
    return secHeader(secT('database', 'Database'), secT('db_sub', 'Tables, domains, RLS and relations')) +
      secEmpty(secT('db_empty', 'Schema is not loaded yet.'));
  }

  if (!sysState.filters) sysState.filters = {};
  var domainFilter = sysState.filters.domain || null;
  var search = (sysState.dbSearch || '').toLowerCase();

  var tables = secArr(schema.tables).filter(function (tb) { return tb && tb.name; });
  var relations = secArr(schema.relations);
  var domains = (schema.domains && typeof schema.domains === 'object') ? schema.domains : {};

  var totalColumns = 0, rlsCount = 0;
  tables.forEach(function (tb) {
    totalColumns += secArr(tb.columns).length;
    if (tb.rls === true) rlsCount += 1;
  });

  var filtered = tables.filter(function (tb) {
    if (domainFilter && tb.domain !== domainFilter) return false;
    if (!search) return true;
    var hay = [tb.name, tb.domain].concat(secArr(tb.columns).map(function (c) { return c && c.name; })).join(' ').toLowerCase();
    return hay.indexOf(search) !== -1;
  });

  var html = secHeader(secT('database', 'Database'), secT('db_sub', 'Tables, domains, RLS and relations'));

  var summary = schema.summary || {};
  html += '<div class="sys-kpi-grid">' +
    secKpi(secT('tables', 'Tables'), secNum(summary.tables !== undefined ? summary.tables : tables.length)) +
    secKpi(secT('rls_tables', 'RLS tables'), secNum(summary.rls_tables !== undefined ? summary.rls_tables : rlsCount)) +
    secKpi(secT('columns', 'Columns'), secNum(summary.columns !== undefined ? summary.columns : totalColumns)) +
    secKpi(secT('relations', 'Relations'), secNum(summary.relations !== undefined ? summary.relations : relations.length)) +
    secKpi(secT('domains', 'Domains'), secNum(summary.domains !== undefined ? summary.domains : Object.keys(domains).length)) +
    '</div>';

  var chips = ['<button type="button" class="sys-chip' + (domainFilter ? '' : ' is-active') + '" data-sys-domain="__all__">' +
    secEsc(secT('all', 'All')) + '</button>'];
  Object.keys(domains).forEach(function (key) {
    var active = domainFilter === key;
    chips.push('<button type="button" class="sys-chip' + (active ? ' is-active' : '') + '" data-sys-domain="' +
      secEsc(key) + '">' + secEsc(key) + '</button>');
  });
  html += secBlock(secT('domains', 'Domains'), '<div class="sys-chip-row">' + chips.join('') + '</div>');

  html += '<div class="sys-card sys-search-card"><label class="sys-label">' + secEsc(secT('search', 'Search')) + '</label>' +
    '<input type="text" class="sys-input" data-sys-dbsearch value="' + secEsc(sysState.dbSearch || '') + '" ' +
    'placeholder="' + secEsc(secT('search_tables', 'Search tables, columns, domains')) + '"></div>';

  if (!filtered.length) {
    html += secEmpty(secT('db_no_match', 'No tables match the current filter.'));
  } else {
    html += '<div class="sys-grid sys-grid-2">' + filtered.map(function (tb) {
      var outgoing = relations.filter(function (r) { return secRelationFrom(r) === tb.name; }).length;
      var pk = secArr(tb.primary_key);
      return '<div class="sys-card sys-table-card" data-sys-table="' + secEsc(tb.name) + '" tabindex="0" role="button">' +
        '<div class="sys-table-card-head"><span class="sys-table-name">' + secEsc(tb.name) + '</span>' +
        secBadge(tb.domain || '—', 'info') + '</div>' +
        '<div class="sys-table-card-meta">' +
        secBadge(tb.rls ? secT('rls_on', 'RLS on') : secT('rls_off', 'RLS off'), tb.rls ? 'ok' : 'off') +
        '<span class="sys-chip">' + secEsc(secT('columns', 'Columns')) + ': ' + secNum(secArr(tb.columns).length) + '</span>' +
        '<span class="sys-chip">' + secEsc(secT('relations', 'Relations')) + ': ' + secNum(outgoing) + '</span>' +
        '</div>' +
        '<div class="sys-table-card-pk">' + secEsc(secT('primary_key', 'PK')) + ': ' +
        secEsc(pk.length ? pk.join(', ') : '—') + '</div></div>';
    }).join('') + '</div>';
  }

  if (relations.length) {
    var relRows = relations.slice(0, 20).map(function (r) {
      return [secEsc(secRelationFrom(r) || '—'), secEsc(secRelationTo(r) || '—'), secBadge(r.kind || r.type || 'rel', 'info')];
    });
    html += secBlock(secT('relations', 'Relations'), '<div class="sys-table-wrap">' +
      secTable([secT('from', 'From'), secT('to', 'To'), secT('kind', 'Kind')], relRows) + '</div>',
      secT('first_20', 'first 20'));
  }

  return html;
}

/* =====================================================================
 * 4) Auth
 * ===================================================================== */

function sysSectionAuth() {
  var security = (typeof sysGet === 'function') ? sysGet('security') : null;
  var apis = (typeof sysGet === 'function') ? sysGet('apis') : null;
  var schema = (typeof sysGet === 'function') ? sysGet('schema') : null;

  var html = secHeader(secT('auth', 'Auth'), secT('auth_sub', 'Supabase Auth, OTP, session and onboarding evidence'));

  if (!security && !apis) {
    return html + secEmpty(secT('auth_empty', 'Security data is not loaded yet.'));
  }

  var sec = security || {};
  var authBlocks = [
    { title: secT('supabase_auth', 'Supabase Auth'), value: sec.auth !== undefined ? sec.auth : sec.supabase_auth },
    { title: secT('otp_verify', 'OTP verify'), value: sec.otp_verify !== undefined ? sec.otp_verify : (sec.otp && sec.otp.verify) },
    { title: secT('otp_signup', 'OTP signup'), value: sec.otp_signup !== undefined ? sec.otp_signup : (sec.otp && sec.otp.signup) },
    { title: secT('otp_recovery', 'OTP recovery'), value: sec.otp_recovery !== undefined ? sec.otp_recovery : (sec.otp && sec.otp.recovery) },
    { title: secT('session_cookies', 'Session cookies'), value: sec.session_cookies !== undefined ? sec.session_cookies : (sec.session && sec.session.cookies) },
    { title: secT('onboarding', 'Onboarding'), value: sec.onboarding },
    { title: secT('resend', 'Resend'), value: sec.resend !== undefined ? sec.resend : sec.email }
  ];

  html += '<div class="sys-grid sys-grid-3">' + authBlocks.map(function (b) {
    if (b.value && typeof b.value === 'object') {
      var inner = secEntries(b.value).map(function (it) {
        return '<div class="sys-status-row"><span class="sys-status-row-label">' + secEsc(it.key) + '</span>' +
          secBadge(it.status === undefined ? 'unknown' : it.status, it.status) + '</div>';
      }).join('');
      return '<div class="sys-card sys-config-card"><div class="sys-config-label">' + secEsc(b.title) + '</div>' +
        '<div class="sys-config-body">' + (inner || secBadge('unknown', 'unknown')) + '</div></div>';
    }
    var status = b.value === true ? 'ok' : (b.value === false ? 'off' : 'unknown');
    var text = b.value === true ? secT('configured', 'Configured') : (b.value === false ? secT('not_configured', 'Not configured') : secT('unknown', 'Unknown'));
    return '<div class="sys-card sys-config-card"><div class="sys-config-label">' + secEsc(b.title) + '</div>' +
      '<div class="sys-config-value">' + secBadge(text, status) + '</div></div>';
  }).join('') + '</div>';

  if (!schema) {
    html += secWarning(secT('auth_schema_limited', 'Schema not cached — auth table mapping is limited. Load the database section to enrich this view.'));
  }

  var endpoints = secArr(apis && apis.endpoints).filter(function (ep) {
    var domain = (ep && (ep.domain || ep.group)) || '';
    return domain === 'auth' || domain === 'security';
  });
  if (endpoints.length) {
    var rows = endpoints.map(function (ep) {
      return [secMethod(ep.method), secEsc(ep.path || ep.route || ep.name || '—'), secEsc(ep.domain || 'auth')];
    });
    html += secBlock(secT('auth_apis', 'Auth APIs'), '<div class="sys-table-wrap">' +
      secTable([secT('method', 'Method'), secT('path', 'Path'), secT('domain', 'Domain')], rows) + '</div>');
  } else {
    html += secBlock(secT('auth_apis', 'Auth APIs'), secEmpty(secT('auth_apis_empty', 'No auth-domain endpoints reported.')));
  }

  return html;
}

/* =====================================================================
 * 5) Rooms
 * ===================================================================== */

function sysSectionRooms() {
  var rooms = (typeof sysGet === 'function') ? sysGet('rooms') : null;
  var html = secHeader(secT('rooms', 'Rooms'), secT('rooms_sub', 'Legacy rooms registry and data flow'));

  if (!rooms) return html + secEmpty(secT('rooms_empty', 'Rooms data is not loaded yet.'));

  var list = secArr(rooms.rooms);
  html += '<div class="sys-grid sys-grid-3">' + (list.length ? list.map(function (r) {
    return '<div class="sys-card sys-room-card">' +
      '<div class="sys-room-title">' + secEsc(r.title || r.legacy_id || '—') + '</div>' +
      '<div class="sys-room-meta">' + secBadge(r.kind || 'room', 'info') +
      '<span class="sys-chip">' + secEsc(r.legacy_id || '—') + '</span></div></div>';
  }).join('') : secEmpty(secT('rooms_none', 'No legacy rooms reported.'))) + '</div>';

  var kinds = rooms.kinds_summary;
  var kindItems = secEntries(kinds);
  if (kindItems.length) {
    html += secBlock(secT('kinds_summary', 'Kinds summary'),
      '<div class="sys-chip-row">' + kindItems.map(function (k) {
        return secBadge(k.key + (k.status !== undefined && k.status !== null ? ': ' + k.status : ''), 'info');
      }).join('') + '</div>');
  }

  html += secBlock(secT('data_flow', 'Data flow'),
    '<div class="sys-agent-flow">' +
    '<span class="sys-flow-node">vibe_rooms</span>' +
    '<span class="sys-flow-arrow" aria-hidden="true">→</span>' +
    '<span class="sys-flow-node">vibe_members</span>' +
    '<span class="sys-flow-arrow" aria-hidden="true">→</span>' +
    '<span class="sys-flow-node">messages / likes</span>' +
    '</div>' + secBadge(secT('schema_backed', 'schema-backed'), 'ok'));

  html += '<div class="sys-card sys-cta-card">' +
    '<button type="button" class="sys-btn" data-sys-load="database">' +
    secEsc(secT('open_database', 'Open database schema')) + '</button></div>';

  return html;
}

/* =====================================================================
 * 6) Messaging
 * ===================================================================== */

function secMessagingTables(schema, names) {
  var tables = secArr(schema && schema.tables);
  return names.map(function (name) {
    var found = null;
    tables.forEach(function (tb) { if (tb && tb.name === name) found = tb; });
    return { name: name, table: found };
  });
}

function sysSectionMessaging() {
  var schema = (typeof sysGet === 'function') ? sysGet('schema') : null;
  var apis = (typeof sysGet === 'function') ? sysGet('apis') : null;

  var html = secHeader(secT('messaging', 'Messaging'), secT('messaging_sub', 'Messages, reactions and notifications metadata'));

  if (!schema) {
    html += secWarning(secT('messaging_no_schema', 'Schema not cached. Load the database section to resolve messaging tables.'));
    html += '<div class="sys-card sys-cta-card">' +
      '<button type="button" class="sys-btn" data-sys-load="database">' +
      secEsc(secT('load_database', 'Load database schema')) + '</button></div>';
  } else {
    var wanted = secMessagingTables(schema, ['messages', 'message_reactions', 'notifications']);
    html += '<div class="sys-grid sys-grid-3">' + wanted.map(function (entry) {
      var tb = entry.table;
      if (!tb) {
        return '<div class="sys-card sys-config-card"><div class="sys-config-label">' + secEsc(entry.name) + '</div>' +
          '<div class="sys-config-value">' + secBadge(secT('unknown', 'Unknown'), 'unknown') + '</div></div>';
      }
      return '<div class="sys-card sys-config-card"><div class="sys-config-label">' + secEsc(tb.name) + '</div>' +
        '<div class="sys-table-card-meta">' + secBadge(tb.rls ? 'RLS on' : 'RLS off', tb.rls ? 'ok' : 'off') +
        '<span class="sys-chip">' + secEsc(secT('columns', 'Columns')) + ': ' + secNum(secArr(tb.columns).length) + '</span>' +
        secBadge(tb.domain || '—', 'info') + '</div></div>';
    }).join('') + '</div>';
  }

  html += secBlock(secT('message_flow', 'Message flow'), '<div class="sys-agent-flow">' +
    '<span class="sys-flow-node">' + secEsc(secT('sender', 'Sender')) + '</span>' +
    '<span class="sys-flow-arrow" aria-hidden="true">→</span>' +
    '<span class="sys-flow-node">messages</span>' +
    '<span class="sys-flow-arrow" aria-hidden="true">→</span>' +
    '<span class="sys-flow-node">reaction / notification</span>' +
    '<span class="sys-flow-arrow" aria-hidden="true">→</span>' +
    '<span class="sys-flow-node">' + secEsc(secT('receiver_room', 'Receiver / Room')) + '</span></div>');

  var mediaCards = [
    { title: secT('images', 'Images'), status: secT('configured', 'configured') },
    { title: secT('voice_notes', 'Voice notes'), status: secT('configured', 'configured') }
  ];
  html += secBlock(secT('media_capabilities', 'Media capabilities'), '<div class="sys-grid sys-grid-2">' +
    mediaCards.map(function (m) {
      return '<div class="sys-card sys-config-card"><div class="sys-config-label">' + secEsc(m.title) + '</div>' +
        '<div class="sys-config-value">' + secBadge(m.status, 'ok') + '</div>' +
        '<div class="sys-muted">' + secEsc(secT('implementation_registry', 'implementation-registry status')) + '</div></div>';
    }).join('') + '</div>');

  var keywords = ['chat', 'messages', 'message', 'inbox', 'notifications', 'notification', 'reaction', 'upload', 'file'];
  var endpoints = secArr(apis && apis.endpoints).filter(function (ep) {
    var hay = [(ep && ep.path) || '', (ep && ep.route) || '', (ep && ep.name) || '', (ep && ep.domain) || ''].join(' ').toLowerCase();
    return keywords.some(function (k) { return hay.indexOf(k) !== -1; });
  });
  if (endpoints.length) {
    var rows = endpoints.map(function (ep) {
      return [secMethod(ep.method), secEsc(ep.path || ep.route || ep.name || '—'), secEsc(ep.domain || '—')];
    });
    html += secBlock(secT('messaging_apis', 'Messaging APIs'), '<div class="sys-table-wrap">' +
      secTable([secT('method', 'Method'), secT('path', 'Path'), secT('domain', 'Domain')], rows) + '</div>');
  } else {
    html += secBlock(secT('messaging_apis', 'Messaging APIs'), secEmpty(secT('messaging_apis_empty', 'No messaging endpoints reported.')));
  }

  return html;
}

/* =====================================================================
 * 7) Realtime
 * ===================================================================== */

function sysSectionRealtime() {
  var arch = (typeof sysGet === 'function') ? sysGet('architecture') : null;
  var node = null;
  secArr(arch && arch.nodes).forEach(function (n) { if (n && (n.id === 'realtime' || n.group === 'realtime')) node = n; });

  var online = (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') ? navigator.onLine : null;

  var html = secHeader(secT('realtime', 'Realtime'), secT('realtime_sub', 'Realtime architecture, client network and polling fallback'));

  var nodeStatus = node ? (node.status || 'unknown') : 'unknown';
  html += '<div class="sys-grid sys-grid-3">' +
    '<div class="sys-card sys-config-card"><div class="sys-config-label">' + secEsc(secT('realtime_node', 'Realtime node')) + '</div>' +
    '<div class="sys-config-value">' + secBadge(node ? secT('status', 'status') + ': ' + nodeStatus : secT('unknown', 'unknown'), nodeStatus) + '</div>' +
    '<div class="sys-muted">' + secEsc(node ? (node.detail || node.label || '') : secT('not_in_architecture', 'Not present in cached architecture')) + '</div></div>' +

    '<div class="sys-card sys-config-card"><div class="sys-config-label">' + secEsc(secT('client_network', 'Client network')) + '</div>' +
    '<div class="sys-config-value">' + secBadge(online === null ? secT('unknown', 'unknown') : (online ? 'online' : 'offline'), online ? 'ok' : (online === false ? 'off' : 'unknown')) + '</div>' +
    '<div class="sys-muted">' + secEsc(secT('client_metric', 'client-side metric (navigator.onLine)')) + '</div></div>' +

    '<div class="sys-card sys-config-card"><div class="sys-config-label">' + secEsc(secT('polling_fallback', 'Polling fallback')) + '</div>' +
    '<div class="sys-config-value">' + secBadge(secT('implementation', 'implementation'), 'info') + '</div>' +
    '<div class="sys-muted">' + secEsc(secT('polling_detail', 'Vibe app message refresh (5s)')) + '</div></div>' +
    '</div>';

  var assumedConnected = node && (node.status === 'active' || node.status === 'ok');
  html += secBlock(secT('realtime_notes', 'Realtime notes'),
    (assumedConnected
      ? secBadge(secT('realtime_active', 'Realtime reported active by backend'), 'ok')
      : secBadge(secT('realtime_unknown', 'Supabase Realtime connection status unknown'), 'unknown')) +
    '<div class="sys-muted">' + secEsc(secT('realtime_disclaimer', 'No connection is claimed unless backend data reports it as active.')) + '</div>');

  html += secBlock(secT('notifications_path', 'Notifications path'), '<div class="sys-agent-flow">' +
    '<span class="sys-flow-node">event</span>' +
    '<span class="sys-flow-arrow" aria-hidden="true">→</span>' +
    '<span class="sys-flow-node">polling / realtime</span>' +
    '<span class="sys-flow-arrow" aria-hidden="true">→</span>' +
    '<span class="sys-flow-node">notifications</span>' +
    '<span class="sys-flow-arrow" aria-hidden="true">→</span>' +
    '<span class="sys-flow-node">' + secEsc(secT('client', 'Client')) + '</span></div>');

  return html;
}

/* =====================================================================
 * 8) Storage
 * ===================================================================== */

function sysSectionStorage() {
  var storage = (typeof sysGet === 'function') ? sysGet('storage') : null;
  var html = secHeader(secT('storage', 'Storage'), secT('storage_sub', 'Buckets, access and media routes'));

  if (!storage) return html + secEmpty(secT('storage_empty', 'Storage data is not loaded yet.'));

  var items = secArr(storage.items || storage.buckets);
  html += '<div class="sys-grid sys-grid-2">' + (items.length ? items.map(function (it) {
    return '<div class="sys-card sys-storage-card">' +
      '<div class="sys-storage-head">' + secEsc(it.id || it.name || '—') +
      secBadge(it.status || 'unknown', it.status) + '</div>' +
      '<div class="sys-storage-meta">' +
      '<span class="sys-chip">' + secEsc(secT('usage', 'Usage')) + ': ' + secEsc(it.usage || '—') + '</span>' +
      '<span class="sys-chip">' + secEsc(secT('access', 'Access')) + ': ' + secEsc(it.access || '—') + '</span>' +
      '</div></div>';
  }).join('') : secEmpty(secT('storage_none', 'No storage items reported.'))) + '</div>';

  var privacy = storage.privacy || {};
  html += secBlock(secT('privacy', 'Privacy'), '<div class="sys-grid sys-grid-2">' +
    secBoolCard(secT('objects_listed', 'Objects listed'), privacy.objects_listed === true ? true : (privacy.objects_listed === false ? false : null)) +
    secBoolCard(secT('signed_urls_exposed', 'Signed URLs exposed'), privacy.signed_urls_exposed === true ? true : (privacy.signed_urls_exposed === false ? false : null)) +
    '</div>');

  var routes = storage.media_routes || {};
  var routeKeys = Object.keys(routes);
  html += secBlock(secT('media_routes', 'Media routes'), routeKeys.length
    ? '<div class="sys-grid sys-grid-2">' + routeKeys.map(function (k) {
        return '<div class="sys-card sys-config-card"><div class="sys-config-label">' + secEsc(k) + '</div>' +
          '<div class="sys-config-value">' + secBadge(routes[k] || 'unknown', 'info') + '</div></div>';
      }).join('') + '</div>'
    : '<div class="sys-grid sys-grid-4">' +
      secBadge(secT('avatar_photos', 'Avatar / profile photos'), 'info') +
      secBadge(secT('chat_images', 'Chat images'), 'info') +
      secBadge(secT('voice_notes', 'Voice notes'), 'info') +
      '</div>');

  return html;
}

/* =====================================================================
 * 9) Drawer content override
 * ===================================================================== */

function sysDrawerContent(drawer) {
  if (!drawer) return secEmpty(secT('drawer_empty', 'No selection.'));

  var type = drawer.type || drawer.kind;
  var data = drawer.data || drawer;

  if (type === 'node') {
    var node = data.node || data;
    if (!node || !node.id) return secEmpty(secT('node_empty', 'Node not available.'));

    var arch = (typeof sysGet === 'function') ? sysGet('architecture') : null;
    var related = secArr(arch && arch.edges).filter(function (e) {
      return e && (e.from === node.id || e.to === node.id);
    });

    var rows = [
      [secEsc(secT('id', 'ID')), secEsc(node.id)],
      [secEsc(secT('label', 'Label')), secEsc(node.label || '—')],
      [secEsc(secT('group', 'Group')), secEsc(node.group || '—')],
      [secEsc(secT('status', 'Status')), secBadge(node.status || 'unknown', node.status)],
      [secEsc(secT('detail', 'Detail')), secEsc(node.detail || '—')]
    ];

    var relatedHtml = related.length
      ? '<ul class="sys-drawer-list">' + related.map(function (e) {
          return '<li>' + secEsc(e.from) + ' <span class="sys-flow-arrow" aria-hidden="true">→</span> ' + secEsc(e.to) +
            (e.kind ? ' ' + secBadge(e.kind, 'info') : '') + '</li>';
        }).join('') + '</ul>'
      : secEmpty(secT('node_no_edges', 'No related edges.'));

    return '<div class="sys-drawer-body"><div class="sys-drawer-title">' + secEsc(node.label || node.id) + '</div>' +
      '<div class="sys-table-wrap">' + secTable([secT('field', 'Field'), secT('value', 'Value')], rows) + '</div>' +
      '<div class="sys-drawer-sub">' + secEsc(secT('related_edges', 'Related edges')) + '</div>' + relatedHtml + '</div>';
  }

  if (type === 'table') {
    var table = data.table || data;
    if (!table || !table.name) return secEmpty(secT('table_empty', 'Table not available.'));

    var schema = (typeof sysGet === 'function') ? sysGet('schema') : null;
    var relations = secArr(schema && schema.relations);
    var outgoing = relations.filter(function (r) { return secRelationFrom(r) === table.name; });
    var incoming = relations.filter(function (r) { return secRelationTo(r) === table.name; });
    var pk = secArr(table.primary_key);

    var columns = secArr(table.columns);
    var columnRows = columns.map(function (c) {
      var isPk = pk.indexOf(c && c.name) !== -1;
      return [secEsc((c && c.name) || '—'), secEsc((c && (c.type || c.data_type)) || '—'),
        secEsc(c && c.nullable === true ? 'yes' : (c && c.nullable === false ? 'no' : '—')),
        secEsc((c && (c.default || c.default_value)) || '—'),
        isPk ? secBadge('PK', 'ok') : ''];
    });

    var known = sysState.tableCount ? sysState.tableCount[table.name] : undefined;
    var hasError = sysState.tableCountError ? sysState.tableCountError[table.name] : false;

    /* Only a real number is rendered. null means the count is unknown and is
       never displayed as 0. */
    var countHtml = '';
    if (hasError) countHtml = secWarning(secT('check_failed', 'Could not read visible rows.'));
    else if (typeof known === 'number') countHtml = '<div class="sys-kv">' + secEsc(secT('visible_rows', 'Visible rows')) + ': ' + secEsc(secNum(known)) + '</div>';
    else countHtml = '<div class="sys-muted">' + secEsc(secT('visible_unknown', 'Visible row count not checked yet.')) + '</div>';

    var relHtml = '';
    relHtml += '<div class="sys-drawer-sub">' + secEsc(secT('outgoing_relations', 'Outgoing relations')) + '</div>';
    relHtml += outgoing.length
      ? '<ul class="sys-drawer-list">' + outgoing.map(function (r) {
          return '<li>' + secEsc(secRelationFrom(r)) + ' <span class="sys-flow-arrow" aria-hidden="true">→</span> ' + secEsc(secRelationTo(r) || '—') + '</li>';
        }).join('') + '</ul>'
      : secEmpty(secT('no_outgoing', 'No outgoing relations.'));
    relHtml += '<div class="sys-drawer-sub">' + secEsc(secT('incoming_relations', 'Incoming relations')) + '</div>';
    relHtml += incoming.length
      ? '<ul class="sys-drawer-list">' + incoming.map(function (r) {
          return '<li>' + secEsc(secRelationFrom(r) || '—') + ' <span class="sys-flow-arrow" aria-hidden="true">→</span> ' + secEsc(secRelationTo(r)) + '</li>';
        }).join('') + '</ul>'
      : secEmpty(secT('no_incoming', 'No incoming relations.'));

    return '<div class="sys-drawer-body"><div class="sys-drawer-title">' + secEsc(table.name) + '</div>' +
      '<div class="sys-drawer-meta">' +
      secBadge(table.domain || '—', 'info') +
      secBadge(table.rls ? secT('rls_on', 'RLS on') : secT('rls_off', 'RLS off'), table.rls ? 'ok' : 'off') +
      '<span class="sys-chip">' + secEsc(secT('primary_key', 'PK')) + ': ' + secEsc(pk.length ? pk.join(', ') : '—') + '</span>' +
      '</div>' +
      '<div class="sys-table-wrap">' + secTable(
        [secT('column', 'Column'), secT('type', 'Type'), secT('nullable', 'Nullable'), secT('default', 'Default'), ''],
        columnRows) + '</div>' +
      relHtml +
      '<div class="sys-drawer-actions">' +
      '<button type="button" class="sys-btn" data-sys-check="' + secEsc(table.name) + '">' +
      secEsc(secT('check_visible_rows', 'Check visible rows')) + '</button></div>' +
      countHtml +
      '<div class="sys-muted">' + secEsc(secT('rls_scope', 'scope: rls_session')) + ' — ' +
      secEsc(secT('rls_disclaimer', 'only rows visible through the current RLS session')) + '</div>' +
      '</div>';
  }

  return secEmpty(secT('drawer_unknown', 'Unsupported drawer content.'));
}

/* =====================================================================
 * 10) Post render wiring
 * ===================================================================== */

function secArchActivate(ev) {
  var t = ev.target;
  var el = (t && t.closest) ? t.closest('[data-sys-node]') : null;
  if (!el) return;
  var id = el.getAttribute('data-sys-node');
  var arch = (typeof sysGet === 'function') ? sysGet('architecture') : null;
  var node = null;
  secArr(arch && arch.nodes).forEach(function (n) { if (n && n.id === id) node = n; });
  if (node && typeof sysOpenDrawer === 'function') sysOpenDrawer('node', node);
}

function secArchKeydown(ev) {
  if (ev.key !== 'Enter' && ev.key !== ' ' && ev.key !== 'Spacebar') return;
  ev.preventDefault();
  secArchActivate(ev);
}

function secBindArchitecture() {
  var svg = document.querySelector('[data-sys-arch-svg]');
  if (!svg || svg.getAttribute('data-sys-bound') === '1') return;
  svg.setAttribute('data-sys-bound', '1');
  svg.addEventListener('click', secArchActivate);
  svg.addEventListener('keydown', secArchKeydown);

  var wrap = document.querySelector('[data-sys-arch-wrap]');
  if (wrap && wrap.getAttribute('data-sys-toolbound') !== '1') {
    wrap.setAttribute('data-sys-toolbound', '1');
    wrap.addEventListener('click', function (ev) {
      var t = ev.target;
      var z = (t && t.closest) ? t.closest('[data-sys-zoom]') : null;
      if (z) {
        var val = parseInt(z.getAttribute('data-sys-zoom'), 10) || 100;
        sysState.zoom = val;
        wrap.classList.remove('sys-zoom-90', 'sys-zoom-100', 'sys-zoom-110');
        wrap.classList.add('sys-zoom-' + val);
        return;
      }
      var g = (t && t.closest) ? t.closest('[data-sys-arch-group]') : null;
      if (g) {
        var gid = g.getAttribute('data-sys-arch-group');
        sysState.archGroup = (sysState.archGroup === gid) ? null : gid;
        secRender();
      }
    });
    var search = wrap.querySelector('[data-sys-arch-search]');
    if (search) {
      search.addEventListener('input', function () {
        sysState.search = search.value;
        secRender();
      });
    }
  }
}

function secRestoreSearchFocus() {
  var s = document.querySelector('[data-sys-arch-search]');
  if (s && sysState.search && document.activeElement === document.body) {
    try { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } catch (e) { /* ignore */ }
  }
  var d = document.querySelector('[data-sys-dbsearch]');
  if (d && sysState.dbSearch && document.activeElement === document.body) {
    try { d.focus(); d.setSelectionRange(d.value.length, d.value.length); } catch (e) { /* ignore */ }
  }
}

function secBindDbSearch() {
  if (SYS_SEC_A_GLOBAL_BOUND) {
    var input = document.querySelector('[data-sys-dbsearch]');
    if (input && input.getAttribute('data-sys-bound') !== '1') {
      input.setAttribute('data-sys-bound', '1');
      input.addEventListener('input', function () {
        sysState.dbSearch = input.value;
        secRender();
      });
    }
  }
}

function sysSectionPostRender() {
  secBindGlobalOnce();
  secBindArchitecture();
  secBindDbSearch();
  secRestoreSearchFocus();
}
