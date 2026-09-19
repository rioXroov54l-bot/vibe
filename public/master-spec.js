/* public/master-spec.js
 * Additive UI layer. Injected by scripts/build.mjs AFTER public/cloud-ui.js and
 * BEFORE the final `render();` call, inside the same IIFE closure, so it can use:
 * render, cloud, cloudPerson, cloudAPI, sheetShell, t, esc, view, sendForm,
 * cloud.messages, cloud.peer, cloud.profileData.
 *
 * Rules honored here:
 *  - additive only: never replaces app.js / cloud-ui.js, never removes app nodes
 *  - wraps render (original first, then enhanceMasterSpec())
 *  - all own nodes are id-guarded ("once"), all work is wrapped in try/catch
 */
;(function () {
  'use strict';

  if (window.__MASTER_SPEC_INSTALLED__) return;
  window.__MASTER_SPEC_INSTALLED__ = true;

  var MAXLEN = 120;
  var STYLE_ID = 'master-spec-style';
  var NOTICE_ID = 'master-spec-match-notice';
  var ACTIONS_ID = 'master-spec-profile-actions';
  var ARTISTS_ID = 'master-spec-top-artists';

  var FIELDS = {
    basics: [
      ['zodiac', 'Zodiac', 'البرج'],
      ['communication_style', 'Communication style', 'أسلوب التواصل'],
      ['relationship_goal', 'Relationship goal', 'هدف العلاقة'],
      ['languages', 'Languages', 'اللغات']
    ],
    lifestyle: [
      ['smoking', 'Smoking', 'التدخين'],
      ['drinking', 'Drinking', 'الشرب'],
      ['exercise', 'Exercise', 'الرياضة'],
      ['sleep', 'Sleep', 'النوم'],
      ['pets', 'Pets', 'الحيوانات الأليفة']
    ]
  };

  /* ------------------------------------------------------------------ helpers */

  function isAr() {
    try {
      var lang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
      var dir = (document.documentElement.getAttribute('dir') || '').toLowerCase();
      if (lang.indexOf('ar') === 0) return true;
      if (!lang && dir === 'rtl') return true;
      var c = safeCloud();
      if (c && typeof c.locale === 'string' && c.locale.toLowerCase().indexOf('ar') === 0) return true;
    } catch (e) {}
    return false;
  }

  function L(en, ar) { return isAr() ? ar : en; }

  function qs(sel, root) {
    try { return (root || document).querySelector(sel); } catch (e) { return null; }
  }

  function byId(id) {
    try { return document.getElementById(id); } catch (e) { return null; }
  }

  function isFn(fn) { return typeof fn === 'function'; }

  function safeCloud() {
    try { return (typeof cloud !== 'undefined' && cloud) ? cloud : null; } catch (e) { return null; }
  }

  function profileData() {
    var c = safeCloud();
    return (c && c.profileData && typeof c.profileData === 'object') ? c.profileData : {};
  }

  function details() {
    var d = profileData().details;
    return (d && typeof d === 'object') ? d : {};
  }

  function escapeAttr(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function clampText(value) {
    var s = (value == null) ? '' : String(value);
    return s.length > MAXLEN ? s.slice(0, MAXLEN) : s;
  }

  function assign(target) {
    if (Object.assign) return Object.assign.apply(Object, arguments);
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i] || {};
      for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k];
    }
    return target;
  }

  var FOLLOWING = (typeof Node !== 'undefined' && Node.DOCUMENT_POSITION_FOLLOWING) || 4;

  function inOrder(container, nodes) {
    var prev = null;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n || n.parentNode !== container) return false;
      if (prev && !(prev.compareDocumentPosition(n) & FOLLOWING)) return false;
      prev = n;
    }
    return true;
  }

  function sharedParent(nodes) {
    if (!nodes.length) return null;
    var parent = nodes[0].parentNode;
    if (!parent) return null;
    for (var i = 1; i < nodes.length; i++) if (nodes[i].parentNode !== parent) return null;
    return parent;
  }

  function queryEditorForm(uid) {
    try { return document.querySelector('form[data-ms-uid="' + uid + '"]'); } catch (e) { return null; }
  }

  /* ------------------------------------------------------------------- styles */

  var CSS = [
    '.master-spec-match-notice{display:flex;align-items:center;gap:10px;margin:4px 2px 12px;padding:9px 12px;border:1px solid var(--line,rgba(255,255,255,.12));background:var(--bg-2,rgba(255,255,255,.04));border-radius:var(--radius,16px);font-size:13px;line-height:1.35;color:var(--text,inherit);}',
    '.master-spec-match-notice .ms-dot{width:8px;height:8px;border-radius:50%;background:var(--accent,#7c5cff);flex:0 0 auto;}',
    '.master-spec-match-notice .ms-name{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.master-spec-match-notice .ms-sub{margin-inline-start:auto;opacity:.62;font-size:12px;white-space:nowrap;}',
    '.master-spec-profile-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}',
    '.master-spec-chip{appearance:none;-webkit-appearance:none;font:inherit;font-size:13px;line-height:1;cursor:pointer;color:var(--text,inherit);background:var(--bg-2,rgba(255,255,255,.05));border:1px solid var(--line,rgba(255,255,255,.14));border-radius:999px;padding:9px 14px;}',
    '.master-spec-chip:hover:not(:disabled){border-color:var(--accent,#7c5cff);}',
    '.master-spec-chip:disabled{opacity:.5;cursor:not-allowed;}',
    '.master-spec-chip.master-spec-primary{background:var(--accent,#7c5cff);border-color:transparent;color:#fff;}',
    '.top-artists-card{margin-top:12px;padding:14px 16px;border:1px solid var(--line,rgba(255,255,255,.12));background:var(--bg-2,rgba(255,255,255,.04));border-radius:var(--radius,16px);display:flex;flex-direction:column;gap:10px;}',
    '.top-artists-card .top-artists-head{display:flex;align-items:center;justify-content:space-between;gap:10px;}',
    '.top-artists-card .top-artists-title{margin:0;font-size:14px;font-weight:600;}',
    '.top-artists-card .top-artists-status{font-size:11px;opacity:.6;border:1px solid var(--line,rgba(255,255,255,.14));border-radius:999px;padding:3px 8px;white-space:nowrap;}',
    '.top-artists-card .top-artists-empty{margin:0;font-size:13px;opacity:.7;}',
    '[contenteditable="true"][data-placeholder]:empty:before{content:attr(data-placeholder);opacity:.55;}',
    '.master-spec-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;padding:12px;background:rgba(0,0,0,.55);}',
    '@media (min-width:640px){.master-spec-overlay{align-items:center;}}',
    '.master-spec-sheet{box-sizing:border-box;width:min(520px,100%);max-height:86vh;overflow:auto;padding:18px;background:var(--bg-1,#12131a);color:var(--text,inherit);border:1px solid var(--line,rgba(255,255,255,.14));border-radius:var(--radius,20px);}',
    '.master-spec-form{display:flex;flex-direction:column;gap:12px;}',
    '.master-spec-form-title{margin:0 0 2px;font-size:16px;font-weight:600;}',
    '.master-spec-field{display:flex;flex-direction:column;gap:6px;}',
    '.master-spec-field-label{font-size:12px;opacity:.68;}',
    '.master-spec-field input{box-sizing:border-box;width:100%;font:inherit;font-size:14px;color:inherit;background:var(--bg-2,rgba(255,255,255,.05));border:1px solid var(--line,rgba(255,255,255,.14));border-radius:12px;padding:10px 12px;}',
    '.master-spec-field input:focus{outline:none;border-color:var(--accent,#7c5cff);}',
    '.master-spec-form-error{min-height:14px;font-size:12px;color:#ff6b6b;}',
    '.master-spec-form-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:4px;}'
  ].join('\n');

  function injectStyle() {
    if (byId(STYLE_ID)) return;
    try {
      var style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      (document.head || document.documentElement).appendChild(style);
    } catch (e) {}
  }

  /* ------------------------------------------------------ match notice (chats) */

  function firstMessageDate() {
    var c = safeCloud();
    var list = c && c.messages;
    if (!list || typeof list.length !== 'number' || !list.length) return '';
    var best = null;
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (!m) continue;
      var raw = m.created_at || m.createdAt || m.inserted_at || m.sent_at;
      if (!raw) continue;
      var t = new Date(raw).getTime();
      if (isNaN(t)) continue;
      if (best === null || t < best) best = t;
    }
    if (best === null) return '';
    var d = new Date(best);
    try {
      return d.toLocaleDateString(isAr() ? 'ar' : 'en', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      try { return d.toISOString().slice(0, 10); } catch (e2) { return ''; }
    }
  }

  function currentView() {
    try { if (typeof view !== 'undefined') return view; } catch (e) {}
    var c = safeCloud();
    return c ? c.view : null;
  }

  function peerName(peer) {
    var name = '';
    try {
      if (isFn(cloudPerson)) {
        var person = cloudPerson(peer);
        if (person) name = person.display_name || person.displayName || person.name || '';
      }
    } catch (e) { name = ''; }
    if (!name && typeof peer === 'string') name = peer;
    return clampText(name).trim();
  }

  function enhanceMatchNotice() {
    var container = qs('.premium-messages');
    var node = byId(NOTICE_ID);
    var c = safeCloud();
    var peer = c && c.peer;
    var v = currentView();

    if (!container || v !== 'chats' || !peer) {
      if (node && node.parentNode) node.parentNode.removeChild(node);
      return;
    }

    var name = peerName(peer);
    var started = firstMessageDate();
    var lang = isAr() ? 'ar' : 'en';
    var sig = lang + '|' + name + '|' + started;

    if (!node) {
      node = document.createElement('div');
      node.id = NOTICE_ID;
    }
    node.className = 'master-spec-match-notice';

    if (node.dataset.msSig !== sig || !node.firstChild) {
      node.dataset.msSig = sig;
      while (node.firstChild) node.removeChild(node.firstChild);

      var dot = document.createElement('span');
      dot.className = 'ms-dot';
      dot.setAttribute('aria-hidden', 'true');

      var label = document.createElement('span');
      label.className = 'ms-name';
      label.textContent = name ? (L('Matched with ', 'متطابق مع ') + name) : L('Match', 'تطابق');

      node.appendChild(dot);
      node.appendChild(label);

      if (started) {
        var sub = document.createElement('span');
        sub.className = 'ms-sub';
        sub.textContent = L('since ', 'منذ ') + started;
        node.appendChild(sub);
      }
    }

    if (container.firstElementChild !== node) container.insertBefore(node, container.firstChild);
  }

  /* --------------------------------------------- smart composer (order + hint) */

  function findSendButton(form, side) {
    var btn = qs('button[type="submit"]', form) || qs('.send-button', form) || qs('.composer-send', form) || qs('[data-send]', form);
    if (btn) return btn;
    var buttons = form.querySelectorAll ? form.querySelectorAll('button') : [];
    for (var i = buttons.length - 1; i >= 0; i--) {
      var b = buttons[i];
      if (side && side.contains(b)) continue;
      if (b.classList && (b.classList.contains('camera-button') || b.classList.contains('mic-button'))) continue;
      return b;
    }
    return null;
  }

  function enhanceComposer() {
    var form = qs('form.smart-composer');
    if (!form) return;

    var camera = qs('.camera-button', form);
    var side = qs('.composer-side', form);
    var input = qs('[contenteditable="true"]', form) ||
      qs('textarea', form) ||
      qs('input[type="text"]', form) ||
      qs('input[type="search"]', form) ||
      qs('input:not([type])', form);
    var send = findSendButton(form, side);

    if (input) {
      var ph = L('Message...', 'رسالة...');
      var tag = (input.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (input.getAttribute('placeholder') !== ph) input.setAttribute('placeholder', ph);
      } else if (input.getAttribute('contenteditable')) {
        if (input.getAttribute('data-placeholder') !== ph) input.setAttribute('data-placeholder', ph);
      }
    }

    var ordered = [];
    if (camera) ordered.push(camera);
    if (input) ordered.push(input);
    if (side) ordered.push(side);
    if (send) ordered.push(send);
    if (ordered.length < 2) return;

    /* append-only reordering: nodes are moved, never removed */
    var container = sharedParent(ordered);
    if (container && !inOrder(container, ordered)) {
      for (var i = 0; i < ordered.length; i++) container.appendChild(ordered[i]);
    }
  }

  /* ------------------------------------------ basics / lifestyle editor buttons */

  function ensureEditorButton(wrap, kind, label) {
    var btn = wrap.querySelector('[data-ms-editor="' + kind + '"]');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'master-spec-chip master-spec-editor-btn';
      btn.setAttribute('data-ms-editor', kind);
      btn.appendChild(document.createTextNode(''));
    }
    if (btn.textContent !== label) btn.textContent = label;
    if (btn.dataset.msBound !== '1') {
      btn.dataset.msBound = '1';
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        openEditor(kind);
      });
    }
  }

  function enhanceProfileActions() {
    var host = qs('.profile-v2 .attribute-strip') || qs('.attribute-strip') || qs('.profile-v2');
    if (!host) return;
    var wrap = byId(ACTIONS_ID);
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = ACTIONS_ID;
      wrap.className = 'master-spec-profile-actions';
    }
    if (wrap.parentNode !== host) host.appendChild(wrap);
    ensureEditorButton(wrap, 'basics', L('Basics', 'الأساسيات'));
    ensureEditorButton(wrap, 'lifestyle', L('Lifestyle', 'نمط الحياة'));
  }

  /* ----------------------------------------------------------- editor modal */

  function buildEditorHtml(uid, kind, fields, source, title) {
    var html = '';
    html += '<form class="master-spec-form" data-ms-uid="' + escapeAttr(uid) + '" data-ms-kind="' + escapeAttr(kind) + '" novalidate autocomplete="off">';
    html += '<div class="master-spec-form-title">' + escapeAttr(title) + '</div>';
    for (var i = 0; i < fields.length; i++) {
      var name = fields[i][0];
      var label = isAr() ? fields[i][2] : fields[i][1];
      var raw = source[name];
      var value = clampText(raw == null ? '' : raw);
      var id = uid + '-' + name;
      html += '<label class="master-spec-field" for="' + escapeAttr(id) + '">';
      html += '<span class="master-spec-field-label">' + escapeAttr(label) + '</span>';
      html += '<input id="' + escapeAttr(id) + '" name="' + escapeAttr(name) + '" type="text" maxlength="' + MAXLEN + '" autocomplete="off" spellcheck="false" value="' + escapeAttr(value) + '">';
      html += '</label>';
    }
    html += '<div class="master-spec-form-error" role="alert" aria-live="polite"></div>';
    html += '<div class="master-spec-form-actions">';
    html += '<button type="button" class="master-spec-chip" data-ms-cancel="1">' + escapeAttr(L('Cancel', 'إلغاء')) + '</button>';
    html += '<button type="submit" class="master-spec-chip master-spec-primary">' + escapeAttr(L('Save', 'حفظ')) + '</button>';
    html += '</div></form>';
    return html;
  }

  function fallbackSheet(html) {
    var overlay = document.createElement('div');
    overlay.className = 'master-spec-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    var box = document.createElement('div');
    box.className = 'master-spec-sheet sheet-shell';
    /* html is built locally from escaped values only */
    if (html) box.innerHTML = html;
    overlay.appendChild(box);
    (document.body || document.documentElement).appendChild(overlay);
    overlay.addEventListener('click', function (ev) { if (ev.target === overlay) closeHost(box); });
    return box;
  }

  function dismissStraySheets(uid) {
    try {
      var nodes = document.querySelectorAll('dialog[open],[role="dialog"],.sheet-shell,.sheet,.modal');
      for (var i = nodes.length - 1; i >= 0; i--) {
        var n = nodes[i];
        if (n.classList && n.classList.contains('master-spec-overlay')) continue;
        if (n.querySelector && n.querySelector('form[data-ms-uid="' + uid + '"]')) continue;
        var closer = n.querySelector('[data-ms-close],[data-close],.sheet-close,.close,button[aria-label]');
        if (closer && isFn(closer.click)) { try { closer.click(); continue; } catch (e) {} }
        if (n.tagName === 'DIALOG' && isFn(n.close)) { try { n.close(); } catch (e2) {} }
      }
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    } catch (e) {}
  }

  function bindEditor(form, kind, uid) {
    if (!form || form.dataset.msBound === '1') return;
    form.dataset.msBound = '1';
    form.setAttribute('novalidate', 'novalidate');

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      saveEditor(form, kind);
    });

    var cancel = form.querySelector('[data-ms-cancel]');
    if (cancel) {
      cancel.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        closeHost(form);
      });
    }

    var first = form.querySelector('input');
    if (first && isFn(first.focus)) { try { first.focus(); } catch (e) {} }
  }

  function showError(form, message) {
    var box = form.querySelector('.master-spec-form-error');
    if (box) box.textContent = message || '';
  }

  function openEditor(kind) {
    var fields = FIELDS[kind];
    if (!fields) return;
    var source = details()[kind];
    if (!source || typeof source !== 'object') source = {};
    var title = kind === 'basics' ? L('Basics', 'الأساسيات') : L('Lifestyle', 'نمط الحياة');
    var uid = 'ms-' + kind + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    var html = buildEditorHtml(uid, kind, fields, source, title);

    var form = null;
    if (isFn(sheetShell)) {
      try { sheetShell(title, html); } catch (e) { form = null; }
      form = queryEditorForm(uid);
    }
    if (!form) {
      if (isFn(sheetShell)) dismissStraySheets(uid);
      fallbackSheet(html);
      form = queryEditorForm(uid);
    }
    if (!form) return;
    bindEditor(form, kind, uid);
  }

  /* ------------------------------------------------------------------ saving */

  function closeHost(node) {
    var el = (node && node.nodeType === 1) ? node : null;
    if (!el) return;
    var overlay = el.closest ? el.closest('.master-spec-overlay') : null;
    if (overlay && overlay.parentNode) { overlay.parentNode.removeChild(overlay); return; }
    var host = el.closest ? el.closest('dialog[open],[role="dialog"],.sheet-shell,.sheet,.modal') : null;
    if (!host) return;
    if (host.tagName === 'DIALOG' && isFn(host.close)) { try { host.close(); return; } catch (e) {} }
    var closer = host.querySelector('[data-ms-close],[data-close],.sheet-close,.close,button[aria-label]');
    if (closer && isFn(closer.click)) { try { closer.click(); return; } catch (e2) {} }
    try { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); } catch (e3) {}
    try {
      host.classList.remove('open', 'is-open');
      host.removeAttribute('open');
      host.hidden = true;
    } catch (e4) {}
  }

  function saveEditor(form, kind) {
    var fields = FIELDS[kind] || [];
    var patch = {};
    for (var i = 0; i < fields.length; i++) {
      var el = form.querySelector('[name="' + fields[i][0] + '"]');
      if (!el) continue;
      patch[fields[i][0]] = clampText(el.value).trim();
    }

    var current = details();
    var prevBasics = (current.basics && typeof current.basics === 'object') ? current.basics : {};
    var prevLifestyle = (current.lifestyle && typeof current.lifestyle === 'object') ? current.lifestyle : {};
    var basics = assign({}, prevBasics);
    var lifestyle = assign({}, prevLifestyle);
    var merged = (kind === 'basics') ? basics : lifestyle;
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) merged[k] = patch[k];

    var pd = profileData();
    var payload = { basics: basics, lifestyle: lifestyle };
    var keys = ['living_in', 'height_cm', 'job', 'education'];
    for (var j = 0; j < keys.length; j++) {
      if (current[keys[j]] !== undefined) payload[keys[j]] = current[keys[j]];
      else if (pd[keys[j]] !== undefined) payload[keys[j]] = pd[keys[j]];
    }

    var submit = form.querySelector('button[type="submit"]') || form.querySelector('.master-spec-primary');
    var label = submit ? submit.textContent : '';
    if (submit) {
      submit.disabled = true;
      submit.textContent = L('Saving...', 'جارٍ الحفظ...');
    }
    showError(form, '');

    Promise.resolve()
      .then(function () {
        if (!isFn(cloudAPI)) throw new Error('cloudAPI unavailable');
        return cloudAPI('profile-details', 'POST', payload);
      })
      .then(function () {
        try {
          var live = profileData();
          if (live && typeof live === 'object') live.details = assign({}, current, { basics: basics, lifestyle: lifestyle });
        } catch (e) {}
        if (typeof cloudProfileBundle === 'function') {
          try { return cloudProfileBundle(); } catch (e2) { return null; }
        }
        return null;
      })
      .then(function () {
        closeHost(form);
        try { if (typeof render === 'function') render(); } catch (e) { enhanceMasterSpec(); }
      })
      .catch(function (err) {
        try { console.warn('[master-spec] save failed:', err); } catch (e) {}
        if (submit) {
          submit.disabled = false;
          submit.textContent = label || L('Save', 'حفظ');
        }
        showError(form, L('Could not save. Please try again.', 'تعذر الحفظ. حاول مرة أخرى.'));
      });
  }

  /* ---------------------------------------------------------- top artists card */

  function enhanceTopArtistsCard() {
    var spotify = qs('.spotify-card');
    var card = byId(ARTISTS_ID);

    if (!spotify) {
      if (card && card.parentNode) card.parentNode.removeChild(card);
      return;
    }

    if (!card) {
      card = document.createElement('section');
      card.id = ARTISTS_ID;
    }
    card.className = 'top-artists-card';

    var lang = isAr() ? 'ar' : 'en';
    if (card.dataset.msSig !== lang || !card.firstChild) {
      card.dataset.msSig = lang;
      card.innerHTML =
        '<div class="top-artists-head">' +
          '<h3 class="top-artists-title">' + escapeAttr(L('Top artists', 'أفضل الفنانين')) + '</h3>' +
          '<span class="top-artists-status">' + escapeAttr(L('Spotify not connected', 'سبوتيفاي غير موصول')) + '</span>' +
        '</div>' +
        '<p class="top-artists-empty">' + escapeAttr(L('Connect Spotify to show your top artists', 'اربط سبوتيفاي لعرض أفضل فنانيك')) + '</p>' +
        '<div><button type="button" class="master-spec-chip top-artists-connect" disabled aria-disabled="true">' +
          escapeAttr(L('Connect Spotify', 'اربط سبوتيفاي')) +
        '</button></div>';
    }

    /* one instance, placed right next to the spotify card */
    if (spotify.nextElementSibling !== card && spotify.parentNode) {
      spotify.parentNode.insertBefore(card, spotify.nextSibling);
    }
  }

  /* --------------------------------------------------------------- entry point */

  var enhancing = false;

  function enhanceMasterSpec() {
    if (enhancing) return;
    enhancing = true;
    try {
      injectStyle();
      enhanceMatchNotice();
      enhanceComposer();
      enhanceProfileActions();
      enhanceTopArtistsCard();
    } catch (err) {
      try { console.warn('[master-spec] enhancement skipped:', err && err.message); } catch (e) {}
    } finally {
      enhancing = false;
    }
  }

  var scheduled = false;

  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    var raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : function (fn) { return setTimeout(fn, 16); };
    raf(function () {
      scheduled = false;
      enhanceMasterSpec();
    });
  }

  function install() {
    injectStyle();

    /* primary path: wrap render (original first, then enhanceMasterSpec) */
    var original = null;
    try { if (typeof render === 'function') original = render; } catch (e) { original = null; }
    if (original) {
      var wrapped = function () {
        var out = original.apply(this, arguments);
        try { enhanceMasterSpec(); } catch (e) {}
        return out;
      };
      try { render = wrapped; } catch (e) { /* const/immutable binding: rely on observers */ }
    }

    /* safety net: stay enhanced on any re-render / view switch */
    if (typeof MutationObserver === 'function' && document.documentElement) {
      try {
        new MutationObserver(function () { scheduleEnhance(); })
          .observe(document.documentElement, { childList: true, subtree: true });
      } catch (e) {}
    }

    document.addEventListener('click', scheduleEnhance, true);
    document.addEventListener('change', scheduleEnhance, true);
    window.addEventListener('popstate', scheduleEnhance);
    window.addEventListener('hashchange', scheduleEnhance);
    window.addEventListener('resize', scheduleEnhance);
    window.addEventListener('load', scheduleEnhance);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleEnhance);
    scheduleEnhance();
  }

  try { install(); } catch (e) {
    try { console.warn('[master-spec] install failed:', e && e.message); } catch (e2) {}
  }

  window.__MASTER_SPEC__ = { enhance: enhanceMasterSpec, openEditor: openEditor };
})();
