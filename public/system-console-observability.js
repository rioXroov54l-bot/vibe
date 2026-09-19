/* =====================================================================
   Engineering console - observability sections
   Injected in the same scope after core + sections-a + ops.
   Read only, evidence based. No inline styles, no inline event handlers,
   no eval, no fabricated data. Unknown is never reported as a failure.
   ===================================================================== */

/* ---------------------------- local state ---------------------------- */

var sysObsBindingsReady = false;

const sysObsSecurityKeys = [
  'csp', 'cookies', 'rls', 'admin_gate', 'otp_recovery',
  'spotify_token_encryption', 'resend_automation', 'secrets_exposure',
  'deepseek_live_config'
];

const sysObsMetaKeys = [
  'state', 'status', 'value', 'enabled', 'evidence', 'detail', 'note',
  'description', 'message', 'severity', 'level', 'warnings', 'items'
];

const sysObsStateMap = {
  passed: 'passed', pass: 'passed', ok: 'passed', healthy: 'passed',
  verified: 'passed', secured: 'passed', compliant: 'passed',
  active: 'configured', enabled: 'configured', configured: 'configured',
  present: 'configured', on: 'configured', true: 'configured', set: 'configured',
  warning: 'warning', warn: 'warning', failed: 'warning', fail: 'warning',
  error: 'warning', weak: 'warning', exposed: 'warning', missing: 'warning',
  not_configured: 'warning', unconfigured: 'warning', absent: 'warning',
  degraded: 'warning', risk: 'warning', at_risk: 'warning'
};

/* ------------------------- primitive helpers ------------------------- */

function sysObsStr(value, fallback) {
  const dflt = fallback === undefined ? '' : fallback;
  if (value === null || value === undefined || value === '') return dflt;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return sysObsNumStr(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function sysObsNumStr(value) {
  const n = Number(value);
  if (!isFinite(n)) return sysObsStr(value, '');
  if (typeof sysNumber === 'function') {
    try {
      const out = sysNumber(n);
      if (out !== undefined && out !== null) return String(out);
    } catch (err) { /* fall through to raw number */ }
  }
  return String(n);
}

function sysObsFinite(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return isFinite(n) ? n : null;
}

function sysObsEsc(value) {
  const s = sysObsStr(value, '');
  if (typeof esc === 'function') {
    try {
      const out = esc(s);
      if (typeof out === 'string') return out;
    } catch (err) { /* fall through to local escape */ }
  }
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function sysObsArr(value) {
  if (typeof sysSafeArray === 'function') {
    try {
      const out = sysSafeArray(value);
      if (Array.isArray(out)) return out;
    } catch (err) { /* fall through */ }
  }
  return Array.isArray(value) ? value : [];
}

function sysObsObj(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function sysObsGet(key) {
  if (typeof sysGet !== 'function') return null;
  try {
    const out = sysGet(key);
    return out === undefined ? null : out;
  } catch (err) {
    return null;
  }
}

function sysObsT(key, fallback) {
  if (typeof t === 'function' && key) {
    try {
      const out = t(key);
      if (out !== undefined && out !== null && out !== '' && out !== key) return sysObsStr(out, fallback);
    } catch (err) { /* fall through */ }
  }
  return fallback;
}

function sysObsSlug(value) {
  const s = sysObsStr(value, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s || 'unknown';
}

function sysObsMs(value) {
  const n = sysObsFinite(value);
  if (n === null) return 'Unknown';
  return sysObsNumStr(Math.round(n * 10) / 10) + ' ms';
}

function sysObsPick(source, names) {
  const obj = sysObsObj(source);
  for (let i = 0; i < names.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(obj, names[i]) &&
        obj[names[i]] !== undefined && obj[names[i]] !== null) {
      return obj[names[i]];
    }
  }
  return undefined;
}

/* ----------------------- scope helper wrappers ----------------------- */

function sysObsEl(tag, attrs, inner) {
  if (typeof sysE === 'function') {
    try {
      const out = sysE(tag, attrs, inner);
      if (typeof out === 'string' && out.charAt(0) === '<') return out;
    } catch (err) { /* fall through to local builder */ }
  }
  const map = attrs || {};
  let html = '<' + tag;
  Object.keys(map).forEach(function (name) {
    const raw = map[name];
    if (raw === null || raw === undefined || raw === false) return;
    html += ' ' + name + '="' + sysObsEsc(raw === true ? 'true' : raw) + '"';
  });
  const body = inner === undefined || inner === null ? '' : String(inner);
  return html + '>' + body + '</' + tag + '>';
}

function sysObsHeader(title, subtitle) {
  if (typeof sysSectionHeader === 'function') {
    try {
      const out = subtitle === undefined ? sysSectionHeader(title) : sysSectionHeader(title, subtitle);
      if (typeof out === 'string' && out) return out;
    } catch (err) { /* fall through */ }
  }
  return sysObsEl('div', { class: 'sys-section-header' },
    sysObsEl('h2', { class: 'sys-section-title' }, sysObsEsc(title)) +
    (subtitle ? sysObsEl('p', { class: 'sys-section-subtitle' }, sysObsEsc(subtitle)) : ''));
}

function sysObsCard(title, body, extraClass) {
  if (typeof sysCard === 'function') {
    try {
      const out = sysCard(title, body, extraClass);
      if (typeof out === 'string' && out) return out;
    } catch (err) { /* fall through */ }
  }
  return sysObsEl('section', { class: 'sys-card' + (extraClass ? ' ' + extraClass : '') },
    (title ? sysObsEl('h3', { class: 'sys-card-title' }, sysObsEsc(title)) : '') + (body || ''));
}

function sysObsEmpty(message) {
  if (typeof sysEmpty === 'function') {
    try {
      const out = sysEmpty(message);
      if (typeof out === 'string' && out) return out;
    } catch (err) { /* fall through */ }
  }
  return sysObsEl('p', { class: 'sys-empty' }, sysObsEsc(message));
}

function sysObsLoading(message) {
  if (typeof sysLoading === 'function') {
    try {
      const out = sysLoading(message);
      if (typeof out === 'string' && out) return out;
    } catch (err) { /* fall through */ }
  }
  return sysObsEl('p', { class: 'sys-loading' }, sysObsEsc(message));
}

function sysObsWarn(message, severity) {
  const level = severity || 'info';
  if (typeof sysWarning === 'function') {
    try {
      const out = sysWarning(message, level);
      if (typeof out === 'string' && out) return out;
    } catch (err) { /* fall through */ }
  }
  return sysObsEl('p', { class: 'sys-warning sys-warning--' + sysObsSlug(level) }, sysObsEsc(message));
}

function sysObsBadge(text, variant) {
  if (typeof sysBadge === 'function') {
    try {
      const out = sysBadge(text, variant);
      if (typeof out === 'string' && out) return out;
    } catch (err) { /* fall through */ }
  }
  return sysObsEl('span', { class: 'sys-badge sys-badge--' + sysObsSlug(variant) }, sysObsEsc(text));
}

function sysObsRiskBadge(severity) {
  const level = sysObsStr(severity, 'info');
  if (typeof sysRiskBadge === 'function') {
    try {
      const out = sysRiskBadge(level);
      if (typeof out === 'string' && out) return out;
    } catch (err) { /* fall through */ }
  }
  return sysObsBadge(level, sysObsSlug(level));
}

function sysObsTimeText(value) {
  if (value === null || value === undefined || value === '') return 'Unknown';
  const numeric = sysObsFinite(value);
  const date = numeric !== null
    ? new Date(numeric < 1e12 ? numeric * 1000 : numeric)
    : new Date(String(value));
  if (isNaN(date.getTime())) return sysObsStr(value, 'Unknown');
  let datePart = '';
  let timePart = '';
  if (typeof sysFmtDate === 'function') {
    try { datePart = sysObsStr(sysFmtDate(date), ''); } catch (err) { datePart = ''; }
  }
  if (typeof sysFmtTime === 'function') {
    try { timePart = sysObsStr(sysFmtTime(date), ''); } catch (err) { timePart = ''; }
  }
  const composed = (datePart + ' ' + timePart).trim();
  return composed || date.toISOString();
}

/* --------------------------- event binding --------------------------- */

function sysObsDelegate(eventName, selector, handler) {
  if (typeof on === 'function') {
    try {
      if (on.length >= 4) {
        on(document, selector, eventName, handler);
        return true;
      }
      if (on.length === 3) {
        on(selector, eventName, handler);
        return true;
      }
      on(document, selector, eventName, handler);
      return true;
    } catch (err) { /* fall through to native delegation */ }
  }
  if (typeof document === 'undefined' || !document.addEventListener) return false;
  document.addEventListener(eventName, function (event) {
    const target = event.target;
    const match = target && typeof target.closest === 'function' ? target.closest(selector) : null;
    if (match) handler(event, match);
  });
  return true;
}

function sysObsClearLocalCache(event) {
  if (event && typeof event.preventDefault === 'function') event.preventDefault();
  if (typeof sysState === 'undefined' || !sysState) return;
  sysState.cache = Object.create(null);
  sysState.tableCount = Object.create(null);
  sysState.lastRefresh = null;
  sysObsReload();
}

function sysObsReload() {
  if (typeof sysLoadSection !== 'function' || typeof sysState === 'undefined' || !sysState) return;
  try { sysLoadSection(sysState.section, true); } catch (err) { /* section reload deferred */ }
}

function sysObsEnsureBindings() {
  if (sysObsBindingsReady) return;
  sysObsBindingsReady = true;
  sysObsDelegate('click', '[data-sys-obs-action]', function (event, element) {
    const action = element && element.getAttribute ? element.getAttribute('data-sys-obs-action') : '';
    if (action === 'clear-cache') sysObsClearLocalCache(event);
    else if (action === 'refresh-section') {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      sysObsReload();
    }
  });
  sysObsDelegate('keydown', 'body', function (event) {
    if (!event || !event.altKey || !event.shiftKey) return;
    const key = sysObsStr(event.key, '').toLowerCase();
    if (key !== 'v') return;
    if (typeof document === 'undefined' || !document.getElementById) return;
    const consoleEl = document.getElementById('system-console');
    if (consoleEl && typeof consoleEl.scrollIntoView === 'function') consoleEl.scrollIntoView();
  });
}

/* --------------------------- state mapping --------------------------- */

function sysObsStateInfo(raw) {
  const key = sysObsSlug(sysObsStr(raw, 'unknown')).replace(/-/g, '_');
  const mapped = sysObsStateMap[key];
  if (mapped === 'passed') return { label: 'Passed', variant: 'ok' };
  if (mapped === 'configured') return { label: 'Configured', variant: 'info' };
  if (mapped === 'warning') return { label: 'Warning', variant: 'warn' };
  return { label: 'Unknown', variant: 'unknown' };
}

function sysObsHttpBucket(status) {
  const n = sysObsFinite(status);
  if (n === null) return 'unknown';
  if (n >= 200 && n < 300) return 'ok';
  if (n >= 300 && n < 400) return 'info';
  if (n >= 400 && n < 500) return 'warn';
  if (n >= 500 && n < 600) return 'error';
  return 'unknown';
}

function sysObsStatusBadge(status) {
  const text = status === null || status === undefined || status === '' ? 'Unknown' : sysObsStr(status);
  if (typeof sysStatusClass === 'function') {
    try {
      const cls = sysStatusClass(status);
      if (typeof cls === 'string' && cls) return sysObsEl('span', { class: cls }, sysObsEsc(text));
    } catch (err) { /* fall through */ }
  }
  return sysObsBadge(text, sysObsHttpBucket(status));
}

function sysObsLabel(key) {
  const human = sysObsStr(key, '').replace(/[_-]+/g, ' ');
  const pretty = human ? human.charAt(0).toUpperCase() + human.slice(1) : 'Unknown';
  return sysObsT('security.card.' + sysObsSlug(sysObsStr(key, '')), pretty);
}

function sysObsGateState(gate) {
  if (gate === null || gate === undefined || gate === '') return 'Unknown';
  if (typeof gate === 'boolean') return gate ? 'Enabled' : 'Disabled';
  if (typeof gate === 'string') {
    if (/^(true|enabled|on|active)$/i.test(gate)) return 'Enabled';
    if (/^(false|disabled|off|inactive)$/i.test(gate)) return 'Disabled';
    return sysObsStr(gate, 'Unknown');
  }
  const obj = sysObsObj(gate);
  if (typeof obj.enabled === 'boolean') return obj.enabled ? 'Enabled' : 'Disabled';
  if (obj.state !== undefined) return sysObsStateInfo(obj.state).label;
  return 'Unknown';
}

/* --------------------------- small renderers -------------------------- */

function sysObsKpi(label, value, hint) {
  return sysObsEl('div', { class: 'sys-obs-kpi' },
    sysObsEl('span', { class: 'sys-obs-kpi-label' }, sysObsEsc(label)) +
    sysObsEl('span', { class: 'sys-obs-kpi-value' }, sysObsEsc(value)) +
    (hint ? sysObsEl('span', { class: 'sys-obs-kpi-hint' }, sysObsEsc(hint)) : ''));
}

function sysObsKpiRow(items) {
  return sysObsEl('div', { class: 'sys-obs-kpis' }, items.join(''));
}

function sysObsFacts(source) {
  const obj = sysObsObj(source);
  const rows = [];
  Object.keys(obj).forEach(function (key) {
    if (sysObsMetaKeys.indexOf(key) >= 0) return;
    const value = obj[key];
    if (value === null || value === undefined || typeof value === 'object') return;
    rows.push(sysObsEl('div', { class: 'sys-obs-fact' },
      sysObsEl('span', { class: 'sys-obs-fact-key' }, sysObsEsc(key)) +
      sysObsEl('span', { class: 'sys-obs-fact-value' }, sysObsEsc(sysObsStr(value)))));
  });
  return rows.length ? sysObsEl('div', { class: 'sys-obs-facts' }, rows.join('')) : '';
}

function sysObsEvidenceList(list, emptyNote) {
  const items = sysObsArr(list);
  if (!items.length) return sysObsEl('p', { class: 'sys-obs-note' }, sysObsEsc(emptyNote));
  const rows = items.map(function (entry) {
    const obj = sysObsObj(entry);
    const text = typeof entry === 'string'
      ? entry
      : sysObsStr(sysObsPick(obj, ['message', 'detail', 'note', 'description', 'code']), '');
    const severity = typeof entry === 'string'
      ? 'info'
      : sysObsStr(sysObsPick(obj, ['severity', 'level']), 'info');
    return sysObsEl('li', { class: 'sys-obs-warning' },
      sysObsRiskBadge(severity) + sysObsEl('span', { class: 'sys-obs-warning-text' }, sysObsEsc(text)));
  });
  return sysObsEl('ul', { class: 'sys-obs-warnings' }, rows.join(''));
}

function sysObsEndpointTable(endpointCounts) {
  const counts = sysObsObj(endpointCounts);
  const keys = Object.keys(counts).sort();
  if (!keys.length) return sysObsEmpty('No endpoint_counts reported by the backend.');
  const rows = keys.map(function (key) {
    const count = sysObsFinite(counts[key]);
    return sysObsEl('tr', {},
      sysObsEl('td', {}, sysObsEl('code', { class: 'sys-obs-code' }, sysObsEsc(key))) +
      sysObsEl('td', { class: 'sys-obs-num' }, sysObsEsc(count === null ? 'Unknown' : sysObsNumStr(count))));
  });
  return sysObsEl('table', { class: 'sys-obs-table' },
    sysObsEl('thead', {}, sysObsEl('tr', {},
      sysObsEl('th', {}, sysObsEsc(sysObsT('monitoring.endpoint', 'Endpoint'))) +
      sysObsEl('th', {}, sysObsEsc(sysObsT('monitoring.requests', 'Requests'))))) +
    sysObsEl('tbody', {}, rows.join('')));
}

function sysObsEventsTable(events) {
  if (!events.length) return sysObsEmpty('No recent_events reported by the backend.');
  const rows = events.map(function (entry) {
    const ev = sysObsObj(entry);
    const time = sysObsTimeText(sysObsPick(ev, ['timestamp', 'ts', 'time', 'at']));
    const endpoint = sysObsStr(sysObsPick(ev, ['endpoint', 'path', 'route']), 'Unknown');
    const status = sysObsPick(ev, ['status', 'http_status', 'status_code']);
    const duration = sysObsPick(ev, ['duration_ms', 'duration', 'elapsed_ms']);
    return sysObsEl('tr', {},
      sysObsEl('td', { class: 'sys-obs-time' }, sysObsEsc(time)) +
      sysObsEl('td', {}, sysObsEl('code', { class: 'sys-obs-code' }, sysObsEsc(endpoint))) +
      sysObsEl('td', {}, sysObsStatusBadge(status)) +
      sysObsEl('td', { class: 'sys-obs-num' }, sysObsEsc(duration === undefined ? 'Unknown' : sysObsMs(duration))));
  });
  return sysObsEl('table', { class: 'sys-obs-table' },
    sysObsEl('thead', {}, sysObsEl('tr', {},
      sysObsEl('th', {}, sysObsEsc(sysObsT('monitoring.time', 'Time'))) +
      sysObsEl('th', {}, sysObsEsc(sysObsT('monitoring.endpoint', 'Endpoint'))) +
      sysObsEl('th', {}, sysObsEsc(sysObsT('monitoring.status', 'HTTP status'))) +
      sysObsEl('th', {}, sysObsEsc(sysObsT('monitoring.duration', 'Duration'))))) +
    sysObsEl('tbody', {}, rows.join('')));
}

/* --------------------------- 1. security ----------------------------- */

function sysObsSecurityCard(key, item) {
  const scalar = item !== null && item !== undefined && typeof item !== 'object';
  const source = sysObsObj(item);
  const raw = scalar ? item : sysObsPick(source, ['state', 'status', 'value', 'enabled']);
  const info = sysObsStateInfo(raw);
  const evidence = scalar ? '' : sysObsStr(sysObsPick(source, ['evidence', 'detail', 'note', 'description', 'message']), '');
  const body =
    sysObsEl('div', { class: 'sys-obs-card-state' },
      sysObsBadge(info.label, info.variant) +
      sysObsEl('span', { class: 'sys-obs-raw' }, sysObsEsc('reported: ' + sysObsStr(raw, 'unknown')))) +
    (evidence ? sysObsEl('p', { class: 'sys-obs-evidence' }, sysObsEsc(evidence)) : '') +
    sysObsFacts(source);
  return sysObsCard(sysObsLabel(key), body, 'sys-obs-security-card');
}

function sysSectionSecurity() {
  sysObsEnsureBindings();
  const data = sysObsObj(sysObsGet('security'));
  const head = sysObsHeader(sysObsT('security.title', 'Security'), sysObsT('security.subtitle', 'Evidence based configuration posture'));
  if (!Object.keys(data).length) {
    return head + sysObsWarn('Security payload is not available. Unknown does not mean failed.', 'info');
  }
  const banner = sysObsWarn('Evidence based section: Unknown does not mean failed. Only values reported by the backend are shown.', 'info');
  const cards = sysObsSecurityKeys.filter(function (key) {
    return data[key] !== undefined && data[key] !== null;
  }).map(function (key) {
    return sysObsSecurityCard(key, data[key]);
  });
  const summary = sysObsPick(data, ['state', 'status', 'summary', 'checked_at']);
  const summaryCard = summary === undefined ? '' : sysObsEl('p', { class: 'sys-obs-note' },
    sysObsEsc('Reported security status: ' + sysObsStr(summary)));
  const warningBlock = sysObsEl('div', { class: 'sys-obs-block' },
    sysObsEl('h3', { class: 'sys-obs-block-title' }, sysObsEsc(sysObsT('security.warnings', 'Warnings'))),
    sysObsEvidenceList(data.warnings, 'No warnings reported by the backend.'));
  return head + banner + summaryCard +
    (cards.length ? sysObsEl('div', { class: 'sys-obs-grid' }, cards.join('')) : sysObsEmpty('No security checks reported by the backend.')) +
    warningBlock;
}

/* -------------------------- 2. monitoring ---------------------------- */

function sysObsChart(events) {
  const durations = [];
  events.forEach(function (entry) {
    const value = sysObsFinite(sysObsPick(sysObsObj(entry), ['duration_ms', 'duration']));
    if (value !== null) durations.push(Math.max(0, value));
  });
  if (!durations.length) return sysObsEmpty('No duration_ms samples in recent_events.');
  const W = 800;
  const H = 220;
  const left = 56;
  const right = 16;
  const top = 18;
  const bottom = 30;
  const innerW = W - left - right;
  const innerH = H - top - bottom;
  const max = Math.max.apply(null, durations) || 1;
  const step = durations.length > 1 ? innerW / (durations.length - 1) : 0;
  const points = durations.map(function (value, index) {
    const clamped = Math.min(max, Math.max(0, value));
    const x = left + step * index;
    const y = top + innerH - (clamped / max) * innerH;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  let grid = '';
  for (let i = 0; i <= 4; i += 1) {
    const y = top + (innerH / 4) * i;
    const label = Math.round(max - (max / 4) * i);
    grid += sysObsEl('line', {
      class: 'sys-obs-chart-grid',
      x1: left, y1: y.toFixed(1), x2: W - right, y2: y.toFixed(1),
      'stroke-width': 1, 'stroke-dasharray': '4 4'
    });
    grid += sysObsEl('text', { class: 'sys-obs-chart-label', x: 8, y: (y + 4).toFixed(1) },
      sysObsEsc(sysObsNumStr(label)));
  }
  const svg = '<svg class="sys-obs-chart" viewBox="0 0 800 220" role="img" aria-label="' +
    sysObsEsc('Recent request durations in milliseconds') + '">' + grid +
    '<polyline class="sys-obs-chart-line" fill="none" stroke-width="2" points="' + points + '"></polyline></svg>';
  return svg + sysObsEl('p', { class: 'sys-obs-note' },
    sysObsEsc('Recent events plotted: ' + sysObsNumStr(durations.length) + '. Y axis max: ' + sysObsMs(max) + '.'));
}

function sysObsClientCard() {
  const rows = [];
  let online = 'Unknown';
  try {
    if (typeof navigator !== 'undefined' && navigator && typeof navigator.onLine === 'boolean') {
      online = navigator.onLine ? 'Online' : 'Offline';
    }
  } catch (err) { /* navigator unavailable */ }
  rows.push(sysObsKpi('navigator.onLine', online));
  const latency = typeof sysState !== 'undefined' && sysState && sysState.lastLatencyMs !== undefined && sysState.lastLatencyMs !== null
    ? sysObsMs(sysState.lastLatencyMs)
    : 'Not measured in this session';
  rows.push(sysObsKpi('Last observed latency', latency));
  let navigation = 'Not available';
  try {
    if (typeof performance !== 'undefined' && performance && typeof performance.getEntriesByType === 'function') {
      const entries = performance.getEntriesByType('navigation');
      const entry = entries && entries.length ? entries[0] : null;
      const duration = entry ? sysObsFinite(entry.duration) : null;
      if (duration !== null) navigation = sysObsMs(Math.round(duration));
    }
  } catch (err) { /* PerformanceNavigationTiming unavailable */ }
  rows.push(sysObsKpi('Navigation duration (PerformanceNavigationTiming)', navigation));
  return sysObsCard('CLIENT ONLY', sysObsKpiRow(rows) +
    sysObsEl('p', { class: 'sys-obs-note' },
      sysObsEsc('Measured in this browser tab only. These values are not server telemetry and are never merged into backend metrics.')));
}

function sysObsScopeText(scope) {
  if (typeof scope === 'string') return scope;
  const obj = sysObsObj(scope);
  const keys = Object.keys(obj);
  if (!keys.length) return '';
  return keys.map(function (key) { return key + '=' + sysObsStr(obj[key]); }).join(', ');
}

function sysObsHostMetrics(monitoring) {
  const system = sysObsObj(monitoring.system_metrics);
  const values = {
    CPU: sysObsPick(monitoring, ['cpu', 'cpu_percent']) !== undefined ? sysObsPick(monitoring, ['cpu', 'cpu_percent']) : sysObsPick(system, ['cpu', 'cpu_percent', 'usage']),
    Memory: sysObsPick(monitoring, ['memory', 'memory_mb']) !== undefined ? sysObsPick(monitoring, ['memory', 'memory_mb']) : sysObsPick(system, ['memory', 'memory_mb', 'rss']),
    Network: sysObsPick(monitoring, ['network', 'network_kb']) !== undefined ? sysObsPick(monitoring, ['network', 'network_kb']) : sysObsPick(system, ['network', 'network_kb', 'bytes'])
  };
  const rows = Object.keys(values).map(function (name) {
    const value = values[name];
    const present = value !== undefined && value !== null && value !== '';
    return sysObsKpi(name, present ? sysObsStr(value) : 'NOT COLLECTED',
      present ? 'reported by the backend' : 'not reported in this metrics scope');
  });
  return sysObsCard(sysObsT('monitoring.host', 'Host metrics'),
    sysObsKpiRow(rows) +
    sysObsEl('p', { class: 'sys-obs-note' },
      sysObsEsc('Missing values are shown as NOT COLLECTED. They are never estimated.')));
}

function sysSectionMonitoring() {
  sysObsEnsureBindings();
  const monitoring = sysObsObj(sysObsGet('monitoring'));
  const head = sysObsHeader(sysObsT('monitoring.title', 'Monitoring'), sysObsT('monitoring.subtitle', 'Runtime and request telemetry reported by the backend'));
  if (!Object.keys(monitoring).length) {
    return head + sysObsWarn('Monitoring payload is not available. Nothing is estimated. Unknown does not mean failed.', 'info');
  }
  const events = sysObsArr(monitoring.recent_events);
  const endpointCounts = sysObsObj(monitoring.endpoint_counts);
  const endpointCount = Object.keys(endpointCounts).length
    ? Object.keys(endpointCounts).length
    : (sysObsArr(monitoring.endpoints).length || null);
  const online = typeof monitoring.runtime_online === 'boolean'
    ? (monitoring.runtime_online ? 'Online' : 'Offline')
    : 'Unknown';
  const kpis = sysObsKpiRow([
    sysObsKpi('runtime_online', online),
    sysObsKpi('total_requests', monitoring.total_requests === undefined ? 'Unknown' : sysObsNumStr(monitoring.total_requests)),
    sysObsKpi('rolling_avg_duration_ms', monitoring.rolling_avg_duration_ms === undefined ? 'Unknown' : sysObsMs(monitoring.rolling_avg_duration_ms)),
    sysObsKpi('endpoints', endpointCount === null ? 'Unknown' : sysObsNumStr(endpointCount))
  ]);
  const scope = sysObsScopeText(monitoring.metrics_scope);
  const scopeNote = scope
    ? sysObsEl('p', { class: 'sys-obs-note' }, sysObsEsc('metrics_scope: ' + scope))
    : sysObsEl('p', { class: 'sys-obs-note' }, sysObsEsc('metrics_scope was not reported by the backend.'));
  return head + kpis + scopeNote +
    sysObsEl('div', { class: 'sys-obs-block' },
      sysObsEl('h3', { class: 'sys-obs-block-title' }, sysObsEsc('Request duration trend')),
      sysObsChart(events)) +
    sysObsClientCard() +
    sysObsHostMetrics(monitoring) +
    sysObsEl('div', { class: 'sys-obs-block' },
      sysObsEl('h3', { class: 'sys-obs-block-title' }, sysObsEsc('Endpoint counts')),
      sysObsEndpointTable(endpointCounts)) +
    sysObsEl('div', { class: 'sys-obs-block' },
      sysObsEl('h3', { class: 'sys-obs-block-title' }, sysObsEsc('Recent events')),
      sysObsEventsTable(events));
}

/* ---------------------------- 3. logs -------------------------------- */

function sysSectionLogs() {
  sysObsEnsureBindings();
  const monitoring = sysObsObj(sysObsGet('monitoring'));
  const events = sysObsArr(monitoring.recent_events);
  const head = sysObsHeader(sysObsT('logs.title', 'Engineering Console Events'),
    sysObsT('logs.subtitle', 'Admin console access events'));
  const warning = sysObsWarn('These are admin console access events only. They are not application logs and not chat logs.', 'info');
  if (!Object.keys(monitoring).length) {
    return head + warning + sysObsEmpty('Monitoring payload is not available, so no console events can be listed.');
  }
  const privacy = sysObsEl('p', { class: 'sys-obs-note' },
    sysObsEsc('Only time, endpoint, HTTP status and duration are rendered. No identifiers, request bodies or personal data are displayed.'));
  return head + warning + privacy + sysObsEventsTable(events);
}

/* -------------------------- 4. settings ------------------------------ */

function sysSectionSettings() {
  sysObsEnsureBindings();
  const overview = sysObsObj(sysObsGet('overview'));
  const security = sysObsObj(sysObsGet('security'));
  const head = sysObsHeader(sysObsT('settings.title', 'Settings'), sysObsT('settings.subtitle', 'Read only configuration view'));
  const languageCode = typeof lang === 'undefined' ? '' : sysObsStr(lang, '').toLowerCase();
  const language = languageCode === 'ar' ? 'Arabic' : languageCode === 'en' ? 'English' : 'Unknown';
  const branch = sysObsStr(sysObsPick(overview, ['branch', 'git_branch']) !== undefined
    ? sysObsPick(overview, ['branch', 'git_branch'])
    : sysObsPick(security, ['branch']), 'Unknown');
  const hosting = sysObsStr(sysObsPick(overview, ['hosting', 'hosting_provider', 'host', 'environment']), 'Unknown');
  const cachedEndpoints = typeof sysState !== 'undefined' && sysState && sysState.cache && typeof sysState.cache === 'object'
    ? Object.keys(sysState.cache).length
    : null;
  const lastRefresh = typeof sysState !== 'undefined' && sysState ? sysState.lastRefresh : null;
  const config = sysObsKpiRow([
    sysObsKpi('Language', language),
    sysObsKpi('Mode', 'READ ONLY'),
    sysObsKpi('Admin gate', sysObsGateState(security.admin_gate)),
    sysObsKpi('Branch', branch),
    sysObsKpi('Hosting', hosting),
    sysObsKpi('Cached endpoints', cachedEndpoints === null ? 'Unknown' : sysObsNumStr(cachedEndpoints)),
    sysObsKpi('Last refresh', lastRefresh === null || lastRefresh === undefined ? 'Not refreshed in this session' : sysObsTimeText(lastRefresh))
  ]);
  const actions = sysObsEl('div', { class: 'sys-obs-actions' },
    sysObsEl('button', { type: 'button', class: 'sys-btn sys-obs-btn', 'data-sys-obs-action': 'clear-cache' },
      sysObsEsc(sysObsT('settings.clearCache', 'Clear console local cache'))) +
    sysObsEl('button', { type: 'button', class: 'sys-btn sys-obs-btn', 'data-sys-obs-action': 'refresh-section' },
      sysObsEsc(sysObsT('settings.refresh', 'Refresh current section'))));
  const notes = sysObsEl('div', { class: 'sys-obs-block' },
    sysObsEl('h3', { class: 'sys-obs-block-title' }, sysObsEsc('Local controls')),
    sysObsEl('ul', { class: 'sys-obs-notes' },
      sysObsEl('li', {}, sysObsEsc('Clear console local cache removes only in-memory console cache, table counters and the last refresh marker in this tab. It touches no server data.')),
      sysObsEl('li', {}, sysObsEsc('Refresh current section re-fetches the section currently open in the console.')),
      sysObsEl('li', {}, sysObsEsc('Shortcut: Alt + Shift + V focuses and scrolls to the #system-console root element.'))));
  return head +
    sysObsWarn('This view is read only. No production configuration can be changed from the engineering console.', 'info') +
    sysObsCard(sysObsT('settings.config', 'Configuration'), config) +
    actions + notes;
}

/* End of observability sections. Sections return HTML strings; rendering
   stays with the console core and uses the shared state only. */
