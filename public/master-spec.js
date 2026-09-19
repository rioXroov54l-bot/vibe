/* public/master-spec.js
 * Additive master-spec layer.
 *
 * scripts/build.mjs injects this file AFTER public/cloud-ui.js and BEFORE the final render() call,
 * inside the exact same IIFE closure that already contains app.js + cloud-ui.js. It therefore can
 * read: render, cloud, cloudPerson, cloudAPI, sheetShell, t, esc, view, sendForm, cloud.messages,
 * cloud.peer, cloud.profileData.
 *
 * It NEVER replaces public/app.js or public/cloud-ui.js and never removes an existing DOM node.
 * Everything it does is idempotent (safe to run on every render).
 */
(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  if (window.__vibeMasterSpecLoaded) return;
  window.__vibeMasterSpecLoaded = true;

  var MAXLEN = 120;
  var STYLE_ID = 'master-spec-style';
  var MATCH_CLASS = 'master-match-notice';
  var TOP_ID = 'master-spec-top-artists';
  var MODAL_ID = 'master-spec-modal-root';
  var FORM_CLASS = 'master-spec-form';
  var SUBMIT_FLAG = 'data-ms-submitting';
  var EMPTY_STATE_EN = 'Connect Spotify to show your top artists';

  var FIELDS = {
    basics: [
      { key: 'zodiac', en: 'Zodiac', ar: '\u0627\u0644\u0628\u0631\u062c' },
      { key: 'communication_style', en: 'Communication style', ar: '\u0623\u0633\u0644\u0648\u0628 \u0627\u0644\u062a\u0648\u0627\u0635\u0644' },
      { key: 'relationship_goal', en: 'Relationship goal', ar: '\u0647\u062f\u0641 \u0627\u0644\u0639\u0644\u0627\u0642\u0629' },
      { key: 'languages', en: 'Languages', ar: '\u0627\u0644\u0644\u063a\u0627\u062a' }
    ],
    lifestyle: [
      { key: 'smoking', en: 'Smoking', ar: '\u0627\u0644\u062a\u062f\u062e\u064a\u0646' },
      { key: 'drinking', en: 'Drinking', ar: '\u0627\u0644\u0634\u0631\u0628' },
      { key: 'exercise', en: 'Exercise', ar: '\u0627\u0644\u0631\u064a\u0627\u0636\u0629' },
      { key: 'sleep', en: 'Sleep', ar: '\u0627\u0644\u0646\u0648\u0645' },
      { key: 'pets', en: 'Pets', ar: '\u0627\u0644\u062d\u064a\u0648\u0627\u0646\u0627\u062a \u0627\u0644\u0623\u0644\u064a\u0641\u0629' }
    ]
  };

  var CSS = [
    '.master-match-notice{display:flex;align-items:flex-start;gap:10px;margin:0 0 10px;padding:10px 12px;border-radius:14px;background:var(--card-bg,var(--surface,rgba(255,255,255,.06)));border:1px solid var(--border-color,var(--border,rgba(255,255,255,.10)));color:var(--text-color,var(--text,#f2f3f5));font-size:13px;line-height:1.45}',
    '.master-match-badge{flex:0 0 auto;line-height:1.2;color:var(--accent,var(--brand,var(--primary,#ff4d6d)))}',
    '.master-match-text{min-width:0}',
    '.master-match-name{font-weight:700}',
    '.master-match-date,.master-match-hint{opacity:.72}',
    '.master-spec-actions{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 4px}',
    '.master-spec-btn{appearance:none;-webkit-appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--border-color,var(--border,rgba(255,255,255,.14)));background:var(--chip-bg,var(--card-bg,rgba(255,255,255,.07)));color:var(--text-color,var(--text,#f2f3f5));border-radius:999px;padding:8px 14px;font-size:13px;font-weight:600;line-height:1.2;cursor:pointer;transition:opacity .15s ease,transform .15s ease}',
    '.master-spec-btn:active{transform:scale(.98)}',
    '.master-spec-btn:disabled,.master-spec-btn[disabled]{opacity:.55;cursor:not-allowed}',
    '.master-spec-btn-primary{background:var(--accent,var(--brand,var(--primary,#ff4d6d)));border-color:transparent;color:var(--accent-text,#fff)}',
    '.master-spec-btn-ghost{background:transparent}',
    '.master-spec-overlay{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.62)}',
    '.master-spec-dialog{width:100%;max-width:420px;max-height:86vh;overflow:auto;border-radius:18px;background:var(--sheet-bg,var(--card-bg,var(--surface,#14161b)));border:1px solid var(--border-color,var(--border,rgba(255,255,255,.12)));color:var(--text-color,var(--text,#f2f3f5));box-shadow:0 24px 60px rgba(0,0,0,.45)}',
    '.master-spec-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border-color,var(--border,rgba(255,255,255,.10)))}',
    '.master-spec-dialog-title{margin:0;font-size:16px;font-weight:700}',
    '.master-spec-close{appearance:none;-webkit-appearance:none;border:0;background:transparent;color:inherit;font-size:22px;line-height:1;padding:2px 6px;border-radius:10px;cursor:pointer}',
    '.master-spec-dialog-body{padding:14px 16px 18px}',
    '.master-spec-form-head{font-weight:700;font-size:14px;margin-bottom:10px}',
    '.master-spec-fields{display:flex;flex-direction:column;gap:10px}',
    '.master-spec-field{display:flex;flex-direction:column;gap:6px}',
    '.master-spec-label{font-size:12px;opacity:.8;font-weight:600}',
    '.master-spec-input{width:100%;box-sizing:border-box;border-radius:12px;border:1px solid var(--border-color,var(--border,rgba(255,255,255,.14)));background:var(--input-bg,rgba(255,255,255,.05));color:inherit;padding:10px 12px;font-size:14px;outline:none}',
    '.master-spec-input:focus{border-color:var(--accent,var(--brand,var(--primary,#ff4d6d)))}',
    '.master-spec-hint{margin:10px 0 0;font-size:11px;opacity:.65}',
    '.master-spec-form-error{display:none;margin:10px 0 0;font-size:12px;color:var(--danger,#ff5c7a)}',
    '.master-spec-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}',
    '.top-artists-card{margin:10px 0;padding:12px 14px;border-radius:16px;background:var(--card-bg,var(--surface,rgba(255,255,255,.05)));border:1px solid var(--border-color,var(--border,rgba(255,255,255,.10)));color:var(--text-color,var(--text,#f2f3f5))}',
    '.top-artists-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}',
    '.top-artists-title{margin:0;font-size:14px;font-weight:700}',
    '.top-artists-badge{font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px;background:var(--chip-bg,rgba(255,255,255,.08));opacity:.8}',
    '.top-artists-empty{margin:0;font-size:12.5px;opacity:.75}',
    '.top-artists-actions{display:flex;gap:8px;margin-top:10px}',
    '.top-artists-connect{appearance:none;-webkit-appearance:none;border:1px solid var(--border-color,var(--border,rgba(255,255,255,.14)));background:var(--chip-bg,rgba(255,255,255,.06));color:inherit;border-radius:999px;padding:7px 13px;font-size:12.5px;font-weight:600;cursor:pointer}',
    '.top-artists-connect:disabled,.top-artists-connect[disabled]{opacity:.5;cursor:not-allowed}',
    '@media (max-width:520px){.master-spec-overlay{align-items:flex-end;padding:0}.master-spec-dialog{max-width:none;border-radius:18px 18px 0 0;max-height:90vh}}'
  ].join('\n');

  var state = { root: null, shellClose: null, keyHandler: null, renderWrapped: false };

  /* ------------------------------------------------------------------ *
   * Small safe helpers (closure globals may not exist in every build)   *
   * ------------------------------------------------------------------ */

  function msCloud() {
    try { return (typeof cloud !== 'undefined' && cloud) ? cloud : null; } catch (e) { return null; }
  }

  function msStr(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object' && typeof value.value === 'string') return value.value;
    return '';
  }

  function msViewName() {
    var direct = '';
    try { direct = msStr(view); } catch (e) { direct = ''; }
    if (direct) return direct;
    var c = msCloud();
    return msStr(c && c.view);
  }

  function msIsAr() {
    try {
      var root = document.documentElement;
      var lang = '';
      if (root) lang = msStr(root.getAttribute('lang')) || msStr(root.lang);
      if (/^ar/i.test(lang)) return true;
      var c = msCloud();
      if (c && /^ar/i.test(msStr(c.language))) return true;
      if (c && c.profileData && /^ar/i.test(msStr(c.profileData.language))) return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  /* t() when it knows the key, otherwise a locale-aware literal. */
  function msT(en, ar) {
    var out = null;
    try { if (typeof t === 'function') out = t(en); } catch (e) { out = null; }
    if (typeof out === 'string' && out && out !== en) return out;
    return msIsAr() ? ar : en;
  }

  function msEsc(value) {
    try {
      if (typeof esc === 'function') {
        var out = esc(value);
        if (typeof out === 'string') return out;
      }
    } catch (e) { /* ignore */ }
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      if (ch === '&') return '&amp;';
      if (ch === '<') return '&lt;';
      if (ch === '>') return '&gt;';
      if (ch === '"') return '&quot;';
      return '&#39;';
    });
  }

  function msPerson(peer) {
    try { if (typeof cloudPerson === 'function') return cloudPerson(peer) || null; } catch (e) { /* ignore */ }
    return null;
  }

  function msPeerId(peer) {
    if (peer == null) return '';
    if (typeof peer === 'string' || typeof peer === 'number') return String(peer);
    if (typeof peer === 'object') {
      var cands = [peer.id, peer.user_id, peer.userId, peer.peer, peer.key, peer.uuid];
      for (var i = 0; i < cands.length; i++) {
        if (cands[i] != null && cands[i] !== '') return String(cands[i]);
      }
    }
    return '';
  }

  function msDisplayName(person, peer) {
    var cands = [];
    if (person) cands.push(person.display_name, person.displayName, person.name, person.full_name, person.username);
    if (peer && typeof peer === 'object') cands.push(peer.display_name, peer.displayName, peer.name);
    for (var i = 0; i < cands.length; i++) {
      if (typeof cands[i] === 'string' && cands[i].trim()) return cands[i].trim();
    }
    return msT('New match', '\u0645\u0637\u0627\u0628\u0642\u0629 \u062c\u062f\u064a\u062f\u0629');
  }

  function msFormatDate(value) {
    if (value == null || value === '') return '';
    var date = (value instanceof Date) ? value : new Date(value);
    if (isNaN(date.getTime())) {
      var numeric = Number(value);
      if (!isNaN(numeric) && numeric > 0) date = new Date(numeric > 1e12 ? numeric : numeric * 1000);
    }
    if (isNaN(date.getTime())) return '';
    try {
      return date.toLocaleDateString(msIsAr() ? 'ar' : 'en', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      try { return date.toISOString().slice(0, 10); } catch (e2) { return ''; }
    }
  }

  function msFirstMessage() {
    var c = msCloud();
    if (!c) return null;
    var list = c.messages;
    if (Array.isArray(list)) return list.length ? list[0] : null;
    if (list && typeof list === 'object') {
      var key = msPeerId(c.peer);
      if (key && Array.isArray(list[key]) && list[key].length) return list[key][0];
      var keys = Object.keys(list);
      for (var i = 0; i < keys.length; i++) {
        var bucket = list[keys[i]];
        if (Array.isArray(bucket) && bucket.length) return bucket[0];
      }
    }
    return null;
  }

  function msDirectChild(host, className) {
    if (!host || !host.children) return null;
    for (var i = 0; i < host.children.length; i++) {
      var node = host.children[i];
      if (node && node.classList && node.classList.contains(className)) return node;
    }
    return null;
  }

  /* ------------------------------------------------------------------ *
   * 1. Style injection (once)                                           *
   * ------------------------------------------------------------------ */

  function msInjectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.setAttribute('data-master-spec', '1');
    style.appendChild(document.createTextNode(CSS));
    head.appendChild(style);
  }

  /* ------------------------------------------------------------------ *
   * 2. Match notice at the top of .premium-messages (chats view only)   *
   * ------------------------------------------------------------------ */

  function msMatchNotice() {
    var wrap = document.querySelector('.premium-messages');
    var c = msCloud();
    var peer = c ? c.peer : null;
    var existing = msDirectChild(wrap, MATCH_CLASS);

    if (!wrap || msViewName() !== 'chats' || !peer) {
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      return;
    }

    var person = msPerson(peer);
    var name = msDisplayName(person, peer);
    var first = msFirstMessage();
    var dateStr = msFormatDate(first && (first.created_at || first.createdAt || first.createdAtMs || first.timestamp));
    var key = msPeerId(peer) || name || 'peer';

    if (existing && existing.getAttribute('data-peer') === key && existing.getAttribute('data-date') === dateStr) return;
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var notice = document.createElement('div');
    notice.className = MATCH_CLASS;
    notice.setAttribute('data-master-spec', 'match-notice');
    notice.setAttribute('data-peer', key);
    notice.setAttribute('data-date', dateStr);
    notice.setAttribute('role', 'status');

    var tail = dateStr
      ? '<span class="master-match-date">\u2022 ' + msEsc(msT('Matched on', '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0637\u0627\u0628\u0642')) + ': ' + msEsc(dateStr) + '</span>'
      : '<span class="master-match-hint">\u2022 ' + msEsc(msT('Say hello to start the conversation.', '\u0642\u0644 \u0645\u0631\u062d\u0628\u064b\u0627 \u0644\u0628\u062f\u0621 \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629.')) + '</span>';

    notice.innerHTML = '<span class="master-match-badge" aria-hidden="true">\u2726</span>'
      + '<span class="master-match-text">'
      + msEsc(msT('Matched with', '\u062a\u0645 \u0627\u0644\u062a\u0637\u0627\u0628\u0642 \u0645\u0639')) + ' '
      + '<strong class="master-match-name">' + msEsc(name) + '</strong> '
      + tail
      + '</span>';

    wrap.insertBefore(notice, wrap.firstChild);
  }

  /* ------------------------------------------------------------------ *
   * 3. Smart composer: placeholder + node order (camera, input, side,   *
   *    send). Nodes are only re-ordered with appendChild, never removed.*
   * ------------------------------------------------------------------ */

  function msComposerField(form) {
    var direct = form.querySelector('textarea, input[type="text"], input[type="search"], input:not([type])');
    if (direct && !direct.disabled && direct.type !== 'hidden' && direct.type !== 'file') return direct;
    var any = form.querySelector('textarea, input');
    if (any && any.type !== 'hidden' && any.type !== 'file' && any.type !== 'checkbox' && any.type !== 'radio' && any.type !== 'submit') return any;
    return null;
  }

  function msOrderComposer(form) {
    var camera = form.querySelector('.camera-button, [data-role="camera"], .composer-camera');
    var side = form.querySelector('.composer-side');
    var send = form.querySelector('.send-button, .composer-send, [data-action="send"], button[type="submit"]');
    var order = [camera, msComposerField(form), side, send].filter(Boolean);
    if (order.length < 2) return;

    var direct = order.filter(function (node) { return node.parentNode === form; });
    if (direct.length < 2) return;

    var current = [];
    for (var i = 0; i < form.children.length; i++) {
      var child = form.children[i];
      if (direct.indexOf(child) !== -1) current.push(child);
    }

    var same = current.length === direct.length;
    if (same) {
      for (var j = 0; j < direct.length; j++) {
        if (current[j] !== direct[j]) { same = false; break; }
      }
    }
    if (same) return;

    for (var k = 0; k < direct.length; k++) {
      try { form.appendChild(direct[k]); } catch (e) { /* ignore */ }
    }
  }

  function msComposer() {
    var form = document.querySelector('form.smart-composer');
    if (!form) return;
    var field = msComposerField(form);
    if (field) {
      var placeholder = msT('Message...', '\u0631\u0633\u0627\u0644\u0629...');
      if (field.getAttribute('placeholder') !== placeholder) field.setAttribute('placeholder', placeholder);
    }
    msOrderComposer(form);
  }

  /* ------------------------------------------------------------------ *
   * 4. Basics / Lifestyle buttons inside .profile-v2 .attribute-strip   *
   * ------------------------------------------------------------------ */

  function msProfileActionHost() {
    return document.querySelector('.profile-v2 .attribute-strip')
      || document.querySelector('.attribute-strip')
      || document.querySelector('.profile-v2');
  }

  function msProfileButtons() {
    var host = msProfileActionHost();
    if (!host) return;
    var wrap = host.querySelector('.master-spec-actions');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'master-spec-actions';
      wrap.setAttribute('data-master-spec', 'actions');
      host.appendChild(wrap);
    }
    if (!wrap.querySelector('[data-master-spec="basics"]')) {
      wrap.appendChild(msActionButton('basics', msT('Basics', '\u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0627\u062a')));
    }
    if (!wrap.querySelector('[data-master-spec="lifestyle"]')) {
      wrap.appendChild(msActionButton('lifestyle', msT('Lifestyle', '\u0646\u0645\u0637 \u0627\u0644\u062d\u064a\u0627\u0629')));
    }
  }

  function msActionButton(kind, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'master-spec-btn master-spec-btn-ghost master-spec-open-editor';
    btn.setAttribute('data-master-spec', kind);
    btn.setAttribute('data-kind', kind);
    btn.textContent = label;
    btn.addEventListener('click', function (event) {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      msOpenEditor(kind);
    });
    return btn;
  }

  /* ------------------------------------------------------------------ *
   * 5. Editor modal (sheetShell first, safe fallback sheet otherwise)   *
   * ------------------------------------------------------------------ */

  function msDetails() {
    var c = msCloud();
    var details = c && c.profileData ? c.profileData.details : null;
    return (details && typeof details === 'object') ? details : {};
  }

  function msClone(value) {
    var out = {};
    if (!value || typeof value !== 'object') return out;
    for (var key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) out[key] = value[key];
    }
    return out;
  }

  function msPick(source, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(source, keys[i])) continue;
      var value = source[keys[i]];
      if (value != null && value !== '') return value;
    }
    return null;
  }

  function msVal(value) {
    if (value == null) return '';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      try {
        var parts = [];
        for (var key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key) && value[key] != null && value[key] !== '') parts.push(String(value[key]));
        }
        return parts.join(', ');
      } catch (e) { return ''; }
    }
    return String(value);
  }

  function msEditorForm(kind) {
    var list = FIELDS[kind] || [];
    var details = msDetails();
    var source = (details[kind] && typeof details[kind] === 'object') ? details[kind] : {};
    var rows = '';
    for (var i = 0; i < list.length; i++) {
      var field = list[i];
      var id = 'master-spec-' + kind + '-' + field.key;
      var value = msVal(source[field.key]).slice(0, MAXLEN);
      rows += '<label class="master-spec-field" for="' + id + '">'
        + '<span class="master-spec-label">' + msEsc(msT(field.en, field.ar)) + '</span>'
        + '<input id="' + id + '" class="master-spec-input" type="text" name="' + field.key + '"'
        + ' maxlength="' + MAXLEN + '" autocomplete="off" spellcheck="false" value="' + msEsc(value) + '" />'
        + '</label>';
    }
    var heading = kind === 'basics'
      ? msT('Basics', '\u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0627\u062a')
      : msT('Lifestyle', '\u0646\u0645\u0637 \u0627\u0644\u062d\u064a\u0627\u0629');
    var hint = msT('Up to 120 characters per field.', '\u062d\u062a\u0649 120 \u062d\u0631\u0641\u064b\u0627 \u0644\u0643\u0644 \u062d\u0642\u0644.');
    return '<form class="' + FORM_CLASS + '" data-kind="' + kind + '" novalidate>'
      + '<div class="master-spec-form-head">' + msEsc(heading) + '</div>'
      + '<div class="master-spec-fields">' + rows + '</div>'
      + '<p class="master-spec-hint">' + msEsc(hint) + '</p>'
      + '<p class="master-spec-form-error" role="alert" aria-live="polite"></p>'
      + '<div class="master-spec-form-actions">'
      + '<button type="button" class="master-spec-btn master-spec-btn-ghost" data-master-spec-cancel="1">'
      + msEsc(msT('Cancel', '\u0625\u0644\u063a\u0627\u0621')) + '</button>'
      + '<button type="submit" class="master-spec-btn master-spec-btn-primary master-spec-save">'
      + msEsc(msT('Save', '\u062d\u0641\u0638')) + '</button>'
      + '</div></form>';
  }

  function msFallbackSheet(title, html) {
    var overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.className = 'master-spec-overlay';
    overlay.setAttribute('data-master-spec', 'sheet-fallback');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<div class="master-spec-dialog" role="document">'
      + '<div class="master-spec-dialog-head">'
      + '<h3 class="master-spec-dialog-title">' + msEsc(title) + '</h3>'
      + '<button type="button" class="master-spec-close" aria-label="' + msEsc(msT('Close', '\u0625\u063a\u0644\u0627\u0642')) + '">\u00d7</button>'
      + '</div>'
      + '<div class="master-spec-dialog-body"></div>'
      + '</div>';
    (document.body || document.documentElement).appendChild(overlay);
    var body = overlay.querySelector('.master-spec-dialog-body');
    if (body) body.innerHTML = html;
    overlay.addEventListener('click', function (event) { if (event && event.target === overlay) msClose(); });
    var closeBtn = overlay.querySelector('.master-spec-close');
    if (closeBtn) closeBtn.addEventListener('click', function (event) {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      msClose();
    });
    return overlay;
  }

  function msStringSheet(markup) {
    var holder = document.createElement('div');
    holder.id = MODAL_ID;
    holder.className = 'master-spec-overlay';
    holder.setAttribute('data-master-spec', 'sheet-string');
    holder.setAttribute('role', 'dialog');
    holder.setAttribute('aria-modal', 'true');
    holder.innerHTML = markup;
    (document.body || document.documentElement).appendChild(holder);
    return holder;
  }

  function msFindSheetNode() {
    var selectors = ['.sheet-shell', '.sheet-modal', '.sheet', 'dialog[open]', '.modal', '[role="dialog"]'];
    for (var i = 0; i < selectors.length; i++) {
      var found = null;
      var list;
      try { list = document.querySelectorAll(selectors[i]); } catch (e) { list = null; }
      if (!list) continue;
      for (var j = 0; j < list.length; j++) {
        var node = list[j];
        if (!node || !node.classList) continue;
        if (node.classList.contains('master-spec-overlay') || node.classList.contains('master-spec-dialog')) continue;
        if (node.id === MODAL_ID) continue;
        if (node.querySelector && node.querySelector('.' + FORM_CLASS)) return node;
        found = node;
      }
      if (found) return found;
    }
    return null;
  }

  function msSheetBody(node) {
    if (!node) return null;
    var selectors = ['.master-spec-dialog-body', '.sheet-body', '.sheet-content', '.sheet__body', '.sheet-main', '.modal-body', '[data-sheet-body]'];
    for (var i = 0; i < selectors.length; i++) {
      var el = node.querySelector ? node.querySelector(selectors[i]) : null;
      if (el) return el;
    }
    return node;
  }

  function msMountSheet(title, html) {
    var node = null;
    var shellClose = null;

    if (typeof sheetShell === 'function') {
      var attempts = [
        function () { return sheetShell({ title: title, html: html, content: html, body: html, closable: true }); },
        function () { return sheetShell({ title: title, render: function () { return html; } }); },
        function () { return sheetShell(html, title); },
        function () { return sheetShell(title, html); }
      ];
      for (var i = 0; i < attempts.length && !node; i++) {
        var result;
        try { result = attempts[i](); } catch (e) { result = null; }
        if (typeof result === 'function') {
          shellClose = result;
          node = msFindSheetNode();
        } else if (result && result.nodeType === 1) {
          node = result;
        } else if (typeof result === 'string' && result.indexOf('<') !== -1) {
          node = msStringSheet(result);
        } else {
          node = msFindSheetNode();
        }
      }
    }

    if (!node) node = msFallbackSheet(title, html);
    state.shellClose = shellClose;

    if (node && (!node.querySelector || !node.querySelector('.' + FORM_CLASS))) {
      var body = msSheetBody(node);
      if (body) { try { body.insertAdjacentHTML('beforeend', html); } catch (e) { /* ignore */ } }
    }
    return node;
  }

  function msClose() {
    try {
      var form = document.querySelector('.' + FORM_CLASS);
      if (form && form.parentNode) form.parentNode.removeChild(form);
    } catch (e) { /* ignore */ }

    try {
      if (state.keyHandler) {
        document.removeEventListener('keydown', state.keyHandler, true);
        state.keyHandler = null;
      }
    } catch (e) { /* ignore */ }

    var root = state.root;
    var shellClose = state.shellClose;
    state.root = null;
    state.shellClose = null;

    if (typeof shellClose === 'function') {
      try { shellClose(); } catch (e) { /* ignore */ }
    }

    try {
      if (root) {
        var dialog = root.closest ? root.closest('dialog') : null;
        if (dialog && typeof dialog.close === 'function') { try { dialog.close(); } catch (e) { /* ignore */ } }
        if (root.parentNode) root.parentNode.removeChild(root);
      }
    } catch (e) { /* ignore */ }

    try {
      var leftover = document.getElementById(MODAL_ID);
      if (leftover && leftover.parentNode) leftover.parentNode.removeChild(leftover);
    } catch (e) { /* ignore */ }
  }

  function msOpenEditor(kind) {
    if (kind !== 'basics' && kind !== 'lifestyle') return;
    msClose();

    var title = kind === 'basics'
      ? msT('Basics', '\u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0627\u062a')
      : msT('Lifestyle', '\u0646\u0645\u0637 \u0627\u0644\u062d\u064a\u0627\u0629');
    var root = msMountSheet(title, msEditorForm(kind));
    if (!root) return;
    state.root = root;

    var form = (root.querySelector && root.querySelector('.' + FORM_CLASS)) || document.querySelector('.' + FORM_CLASS);
    if (!form) return;

    form.addEventListener('submit', msOnSubmit, true);

    var cancel = form.querySelector('[data-master-spec-cancel]');
    if (cancel) cancel.addEventListener('click', function (event) {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      msClose();
    });

    var submitBtn = form.querySelector('button[type="submit"], .master-spec-save');
    if (submitBtn) submitBtn.addEventListener('click', function () {
      setTimeout(function () {
        if (!form.isConnected) return;
        if (form.getAttribute(SUBMIT_FLAG) === '1') return;
        form.setAttribute(SUBMIT_FLAG, '1');
        msRunSave(form);
      }, 0);
    });

    var first = form.querySelector('input, textarea');
    if (first && typeof first.focus === 'function') { try { first.focus(); } catch (e) { /* ignore */ } }

    var keyHandler = function (event) {
      if (event && (event.key === 'Escape' || event.keyCode === 27)) msClose();
    };
    state.keyHandler = keyHandler;
    document.addEventListener('keydown', keyHandler, true);
  }

  function msOnSubmit(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    var form = event && event.currentTarget;
    if (!form || typeof form.getAttribute !== 'function') return;
    if (form.getAttribute(SUBMIT_FLAG) === '1') return;
    form.setAttribute(SUBMIT_FLAG, '1');
    msRunSave(form);
  }

  function msBusy(form, busy) {
    var btn = form.querySelector && form.querySelector('button[type="submit"], .master-spec-save');
    if (!btn) return;
    if (busy) {
      if (!btn.getAttribute('data-label')) btn.setAttribute('data-label', btn.textContent || '');
      btn.disabled = true;
      btn.textContent = msT('Saving...', '\u062c\u0627\u0631\u064d \u0627\u0644\u062d\u0641\u0638...');
    } else {
      var label = btn.getAttribute('data-label');
      btn.disabled = false;
      if (label) btn.textContent = label;
    }
  }

  function msSetError(form, message) {
    var el = form.querySelector && form.querySelector('.master-spec-form-error');
    if (!el) return;
    el.textContent = message || '';
    el.style.display = message ? 'block' : 'none';
  }

  function msSaveProfile(payload) {
    return new Promise(function (resolve, reject) {
      try {
        if (typeof cloudAPI !== 'function') throw new Error('cloudAPI is not available');
        var result = cloudAPI('profile-details', 'POST', payload);
        if (result && typeof result.then === 'function') result.then(resolve, reject);
        else resolve(result);
      } catch (e) { reject(e); }
    });
  }

  function msRefreshProfile() {
    try {
      if (typeof cloudProfileBundle === 'function') {
        var result = cloudProfileBundle();
        if (result && typeof result.then === 'function') return result;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function msRunSave(form) {
    var kind = form.getAttribute('data-kind');
    if (kind !== 'basics' && kind !== 'lifestyle') kind = 'basics';

    var details = msDetails();
    var basics = msClone(details.basics);
    var lifestyle = msClone(details.lifestyle);
    var target = kind === 'basics' ? basics : lifestyle;
    var list = FIELDS[kind];

    for (var i = 0; i < list.length; i++) {
      var field = list[i];
      var input = form.querySelector('[name="' + field.key + '"]');
      if (!input) continue;
      var value = (typeof input.value === 'string' ? input.value : '').trim().slice(0, MAXLEN);
      target[field.key] = value;
    }

    var payload = {
      living_in: msPick(details, ['living_in', 'livingIn', 'living', 'city']),
      height_cm: msPick(details, ['height_cm', 'heightCm', 'height']),
      job: msPick(details, ['job', 'work', 'occupation']),
      education: msPick(details, ['education', 'study', 'school']),
      basics: basics,
      lifestyle: lifestyle
    };

    msSetError(form, '');
    msBusy(form, true);

    msSaveProfile(payload).then(function () {
      return msRefreshProfile();
    }).then(function () {
      msClose();
      try { if (typeof render === 'function') render(); } catch (e) { /* ignore */ }
    }).catch(function (err) {
      form.removeAttribute(SUBMIT_FLAG);
      msBusy(form, false);
      msSetError(form, msT('Could not save your details. Please try again.', '\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644. \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.'));
      try { if (typeof console !== 'undefined' && console.warn) console.warn('[master-spec] profile-details save failed', err); } catch (e) { /* ignore */ }
    });
  }

  /* ------------------------------------------------------------------ *
   * 6. Top artists card next to .spotify-card (empty state only)        *
   * ------------------------------------------------------------------ */

  function msTopArtists() {
    var existing = document.getElementById(TOP_ID);
    if (existing && existing.isConnected) return;
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var spotify = document.querySelector('.spotify-card');
    var host = spotify ? spotify.parentNode : (document.querySelector('.profile-v2') || document.querySelector('.premium-messages'));
    if (!host) return;

    var card = document.createElement('section');
    card.id = TOP_ID;
    card.className = 'top-artists-card';
    card.setAttribute('data-master-spec', 'top-artists');
    card.setAttribute('data-connected', 'false');
    card.innerHTML = '<div class="top-artists-head">'
      + '<h4 class="top-artists-title">' + msEsc(msT('Top artists', '\u0623\u0641\u0636\u0644 \u0627\u0644\u0641\u0646\u0627\u0646\u064a\u0646')) + '</h4>'
      + '<span class="top-artists-badge">' + msEsc(msT('Not connected', '\u063a\u064a\u0631 \u0645\u0648\u0635\u0648\u0644')) + '</span>'
      + '</div>'
      + '<p class="top-artists-empty" data-empty-state="' + msEsc(EMPTY_STATE_EN) + '">'
      + msEsc(msT(EMPTY_STATE_EN, '\u0627\u0631\u0628\u0637 Spotify \u0644\u0639\u0631\u0636 \u0623\u0641\u0636\u0644 \u0627\u0644\u0641\u0646\u0627\u0646\u064a\u0646 \u0644\u062f\u064a\u0643'))
      + '</p>'
      + '<div class="top-artists-actions">'
      + '<button type="button" class="top-artists-connect" disabled aria-disabled="true"'
      + ' title="' + msEsc(msT('Spotify is not connected yet', 'Spotify \u063a\u064a\u0631 \u0645\u0648\u0635\u0648\u0644 \u0628\u0639\u062f')) + '">'
      + msEsc(msT('Connect Spotify', '\u0631\u0628\u0637 Spotify'))
      + '</button>'
      + '</div>';

    if (spotify && spotify.parentNode) spotify.insertAdjacentElement('afterend', card);
    else host.appendChild(card);
  }

  /* ------------------------------------------------------------------ *
   * 7. render() wrapping + observers                                    *
   * ------------------------------------------------------------------ */

  function enhanceMasterSpec() {
    try { msInjectStyle(); } catch (e) { /* ignore */ }
    try { msMatchNotice(); } catch (e) { /* ignore */ }
    try { msComposer(); } catch (e) { /* ignore */ }
    try { msProfileButtons(); } catch (e) { /* ignore */ }
    try { msTopArtists(); } catch (e) { /* ignore */ }
  }

  function msWrapRender() {
    if (state.renderWrapped) return;
    var original = null;
    try { if (typeof render === 'function') original = render; } catch (e) { original = null; }
    if (!original) return;
    var wrapped = function () {
      var result;
      try { result = original.apply(this, arguments); } catch (e) { throw e; }
      try { enhanceMasterSpec(); } catch (e) { /* ignore */ }
      if (result && typeof result.then === 'function') {
        try {
          result.then(function () { try { enhanceMasterSpec(); } catch (e) { /* ignore */ } }, function () { /* ignore */ });
        } catch (e) { /* ignore */ }
      }
      return result;
    };
    try {
      render = wrapped;
      state.renderWrapped = (render === wrapped);
    } catch (e) {
      state.renderWrapped = false;
    }
  }

  function msStartObservers() {
    try {
      var Observer = window.MutationObserver || window.WebKitMutationObserver;
      if (!Observer || !document.body) return;
      var scheduled = false;
      var observer = new Observer(function () {
        if (scheduled) return;
        scheduled = true;
        var run = function () {
          scheduled = false;
          try { enhanceMasterSpec(); } catch (e) { /* ignore */ }
        };
        if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(run);
        else setTimeout(run, 60);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* ignore */ }
  }

  function msBoot() {
    enhanceMasterSpec();
    msStartObservers();
  }

  msWrapRender();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', msBoot, false);
  } else {
    msBoot();
  }
})();
