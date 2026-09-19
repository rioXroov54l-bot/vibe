/* public/master-spec.js — additive enhancement layer for Vibe.
 *
 * Injected by scripts/build.mjs inside the SAME IIFE closure as public/app.js
 * and public/cloud-ui.js: it runs right after cloud-ui.js and before the final
 * render() call. It never replaces app.js / cloud-ui.js, and it never removes
 * existing DOM nodes — every helper below is additive, idempotent and
 * defensive (all DOM/closure access is wrapped so a failure can never break
 * the existing UI, chat, composer or profile features).
 *
 * Available in this closure: render, cloud, cloudPerson, cloudAPI, sheetShell,
 * t, esc, view, sendForm, cloud.messages, cloud.peer, cloud.profileData
 * (cloudProfileBundle is used only when it happens to exist).
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || !window.document) return;
  if (window.__masterSpecInstalled) return;
  window.__masterSpecInstalled = true;

  var MAX_LEN = 120;
  var NOTICE_ID = 'ms-match-notice';
  var ARTISTS_ID = 'ms-top-artists-card';
  var FORM_ID = 'ms-editor-form';
  var OVERLAY_ID = 'ms-editor-overlay';
  var STYLE_ID = 'master-spec-style';

  var FIELDS = {
    basics: [
      ['zodiac', 'Zodiac', 'البرج'],
      ['communication_style', 'Communication style', 'أسلوب التواصل'],
      ['relationship_goal', 'Relationship goal', 'هدف العلاقة'],
      ['languages', 'Languages', 'اللغات']
    ],
    lifestyle: [
      ['smoking', 'Smoking', 'التدخين'],
      ['drinking', 'Drinking', 'المشروبات'],
      ['exercise', 'Exercise', 'الرياضة'],
      ['sleep', 'Sleep', 'النوم'],
      ['pets', 'Pets', 'الحيوانات الأليفة']
    ]
  };

  var cachedArabic = null;

  /* ------------------------------ helpers ------------------------------ */

  function safe(fn, fallback) {
    try { return fn(); } catch (e) { return fallback; }
  }

  function isArabic() {
    if (cachedArabic !== null) return cachedArabic;
    cachedArabic = safe(function () {
      var html = document.documentElement || {};
      var dir = String((html.getAttribute && html.getAttribute('dir')) || html.dir || '');
      if (/rtl/i.test(dir)) return true;
      var lang = String((html.getAttribute && html.getAttribute('lang')) || html.lang || '');
      if (/^ar/i.test(lang)) return true;
      var el = document.querySelector('.smart-composer textarea, form.smart-composer input, .smart-composer input');
      var ph = (el && el.getAttribute && el.getAttribute('placeholder')) || '';
      if (/[\u0600-\u06FF]/.test(ph)) return true;
      var nav = (typeof navigator !== 'undefined' && navigator && navigator.language) || '';
      return /^ar/i.test(String(nav));
    }, false) === true;
    return cachedArabic;
  }

  function L(en, ar) { return isArabic() ? ar : en; }

  function escSafe(value) {
    var str = String(value === null || value === undefined ? '' : value);
    var fn = safe(function () { return typeof esc === 'function' ? esc : null; }, null);
    if (fn) {
      var out = safe(function () { return String(fn(str)); }, null);
      if (out !== null) return out;
    }
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ------------------------------- style ------------------------------- */

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      '#ms-match-notice{display:flex;align-items:center;gap:12px;margin:10px 12px 2px;padding:12px 14px;border:1px solid var(--border-color,rgba(255,255,255,.14));border-radius:16px;background:var(--surface-2,rgba(255,255,255,.06));color:var(--text-primary,#fff);box-shadow:0 6px 20px rgba(0,0,0,.12)}',
      '#ms-match-notice .ms-notice-icon{width:34px;height:34px;flex:0 0 34px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--accent-soft,rgba(124,92,255,.22));color:var(--accent,#7c5cff);font-size:15px;line-height:1}',
      '#ms-match-notice .ms-notice-title{font-size:14px;font-weight:600;color:var(--text-primary,#fff)}',
      '#ms-match-notice .ms-notice-sub{margin-top:2px;font-size:12px;color:var(--text-secondary,rgba(255,255,255,.72))}',
      '.ms-strip-btn{margin:0 6px 0 0;padding:7px 14px;border:1px solid var(--border-color,rgba(255,255,255,.16));border-radius:999px;background:var(--surface-2,rgba(255,255,255,.06));color:var(--text-primary,#fff);font:inherit;font-size:12px;font-weight:600;line-height:1.4;cursor:pointer;transition:background .15s ease,border-color .15s ease}',
      '.ms-strip-btn:hover{background:var(--accent-soft,rgba(124,92,255,.2));border-color:var(--accent,#7c5cff)}',
      '.ms-strip-btn:focus-visible{outline:2px solid var(--accent,#7c5cff);outline-offset:2px}',
      '#' + OVERLAY_ID + '{position:fixed;top:0;right:0;bottom:0;left:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;padding:16px;background:rgba(0,0,0,.55)}',
      '#' + FORM_ID + '{width:100%;max-width:520px;box-sizing:border-box;max-height:86vh;overflow:auto;padding:16px;border:1px solid var(--border-color,rgba(255,255,255,.14));border-radius:18px;background:var(--surface-1,#15151c);color:var(--text-primary,#fff)}',
      '#' + FORM_ID + ' .ms-editor-title{margin:0 0 12px;font-size:16px;font-weight:700}',
      '#' + FORM_ID + ' .ms-editor-row{display:block;margin:0 0 10px}',
      '#' + FORM_ID + ' .ms-editor-label{display:block;margin:0 0 4px;font-size:12px;color:var(--text-secondary,rgba(255,255,255,.72))}',
      '#' + FORM_ID + ' input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--border-color,rgba(255,255,255,.16));border-radius:12px;background:var(--surface-2,rgba(255,255,255,.05));color:var(--text-primary,#fff);font:inherit;font-size:14px}',
      '#' + FORM_ID + ' input:focus{outline:none;border-color:var(--accent,#7c5cff)}',
      '#' + FORM_ID + ' .ms-editor-status{min-height:16px;margin:6px 0 0;font-size:12px;color:var(--text-secondary,rgba(255,255,255,.72))}',
      '#' + FORM_ID + ' .ms-editor-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}',
      '#' + FORM_ID + ' .ms-btn{padding:9px 16px;border-radius:999px;border:1px solid var(--border-color,rgba(255,255,255,.16));background:var(--surface-2,rgba(255,255,255,.06));color:var(--text-primary,#fff);font:inherit;font-size:13px;font-weight:600;cursor:pointer}',
      '#' + FORM_ID + ' .ms-btn-primary{background:var(--accent,#7c5cff);border-color:var(--accent,#7c5cff);color:#fff}',
      '#' + FORM_ID + ' .ms-btn[disabled]{opacity:.6;cursor:default}',
      '.top-artists-card{margin:12px 0;padding:14px;border:1px solid var(--border-color,rgba(255,255,255,.14));border-radius:16px;background:var(--surface-2,rgba(255,255,255,.05));color:var(--text-primary,#fff)}',
      '.top-artists-card .ms-artists-title{font-size:14px;font-weight:600}',
      '.top-artists-card .ms-artists-sub{margin-top:4px;font-size:12px;color:var(--text-secondary,rgba(255,255,255,.72))}',
      '.top-artists-card .ms-artists-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;padding:0;list-style:none}',
      '.top-artists-card .ms-artists-list li{padding:5px 10px;border-radius:999px;background:var(--accent-soft,rgba(124,92,255,.18));font-size:12px}',
      '.top-artists-card .ms-btn{display:inline-block;margin-top:10px;padding:8px 14px;border:1px solid var(--border-color,rgba(255,255,255,.16));border-radius:999px;background:var(--surface-1,#15151c);color:var(--text-primary,#fff);font:inherit;font-size:12px;font-weight:600}',
      '.top-artists-card .ms-btn[disabled]{opacity:.55;cursor:not-allowed}'
    ].join('\n');
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ---------------------------- match notice ---------------------------- */

  function peerName() {
    return safe(function () {
      var peer = cloud && cloud.peer;
      if (!peer) return '';
      if (typeof cloudPerson === 'function') {
        var person = cloudPerson(peer);
        if (person && person.display_name) return String(person.display_name);
      }
      if (peer.display_name) return String(peer.display_name);
      if (peer.name) return String(peer.name);
      return '';
    }, '') || '';
  }

  function firstMessageDate() {
    return safe(function () {
      var msgs = cloud && cloud.messages;
      if (!msgs || !msgs.length) return '';
      var raw = msgs[0] && msgs[0].created_at;
      if (!raw) return '';
      var date = new Date(raw);
      if (isNaN(date.getTime())) return '';
      var loc = isArabic() ? 'ar' : undefined;
      return date.toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' });
    }, '') || '';
  }

  function ensureMatchNotice() {
    var list = document.querySelector('.premium-messages');
    if (!list) return;
    var existing = document.getElementById(NOTICE_ID);

    var isChats = safe(function () { return typeof view !== 'undefined' && view === 'chats'; }, false) === true;
    var hasPeer = safe(function () { return !!(cloud && cloud.peer); }, false) === true;
    if (!isChats || !hasPeer) {
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      return;
    }

    var name = peerName();
    var date = firstMessageDate();
    var title = name || L('New match', 'توافق جديد');
    var sub = date
      ? L('Matched on ' + date, 'تم التوافق في ' + date)
      : L('Start the conversation', 'ابدأ المحادثة');
    var key = title + '|' + sub;

    var notice = existing;
    if (!notice) {
      notice = document.createElement('div');
      notice.id = NOTICE_ID;
      notice.className = 'ms-match-notice';
      notice.setAttribute('role', 'status');
    }
    if (notice.getAttribute('data-ms-key') !== key) {
      notice.setAttribute('data-ms-key', key);
      notice.innerHTML =
        '<div class="ms-notice-icon" aria-hidden="true">&#10022;</div>' +
        '<div class="ms-notice-text">' +
        '<div class="ms-notice-title">' + escSafe(title) + '</div>' +
        '<div class="ms-notice-sub">' + escSafe(sub) + '</div>' +
        '</div>';
    }
    if (list.firstChild !== notice) list.insertBefore(notice, list.firstChild);
  }

  /* ------------------------ composer: order + hint ---------------------- */

  function composerField(form) {
    return form.querySelector('textarea, input[type="text"], input:not([type="hidden"]), [contenteditable="true"]');
  }

  function setComposerPlaceholder() {
    var form = document.querySelector('form.smart-composer') || document.querySelector('.smart-composer');
    if (!form) return;
    var field = composerField(form);
    if (!field || !field.setAttribute) return;

    var phrase = safe(function () {
      if (typeof t === 'function') {
        var keys = ['type_message', 'message_placeholder', 'chat_placeholder', 'placeholder_message', 'message'];
        for (var i = 0; i < keys.length; i += 1) {
          var value = t(keys[i]);
          if (typeof value === 'string' && value && value !== keys[i] && value.length <= 60) return value;
        }
      }
      return null;
    }, null);
    if (!phrase) phrase = L('Message...', 'رسالة...');

    if (field.getAttribute('contenteditable') === 'true') {
      if (field.getAttribute('data-placeholder') !== phrase) field.setAttribute('data-placeholder', phrase);
      if (!field.getAttribute('aria-label')) field.setAttribute('aria-label', phrase);
      return;
    }
    if (field.getAttribute('placeholder') !== phrase) field.setAttribute('placeholder', phrase);
    if (!field.getAttribute('aria-label')) field.setAttribute('aria-label', phrase);
  }

  function orderComposer() {
    var form = document.querySelector('form.smart-composer');
    if (!form) return;
    var wanted = [
      form.querySelector('.camera-button'),
      composerField(form),
      form.querySelector('.composer-side'),
      form.querySelector('button[type="submit"], .send-button, .composer-send, .send-btn, [data-send]')
    ];

    var ordered = [];
    for (var i = 0; i < wanted.length; i += 1) {
      var node = wanted[i];
      if (node && node.parentNode === form && ordered.indexOf(node) === -1) ordered.push(node);
    }
    if (!ordered.length) return;

    var present = [];
    for (var j = 0; j < form.children.length; j += 1) {
      if (ordered.indexOf(form.children[j]) !== -1) present.push(form.children[j]);
    }
    var mismatch = present.length !== ordered.length;
    if (!mismatch) {
      for (var k = 0; k < ordered.length; k += 1) {
        if (present[k] !== ordered[k]) { mismatch = true; break; }
      }
    }
    if (!mismatch) return;

    /* appendChild only *moves* existing nodes: nothing is removed or recreated. */
    for (var m = 0; m < ordered.length; m += 1) {
      safe(function () { form.appendChild(ordered[m]); });
    }
  }

  /* ------------------------ basics / lifestyle editor ------------------- */

  function detailsObject() {
    var details = safe(function () {
      var profile = cloud && cloud.profileData;
      var raw = profile && profile.details;
      if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch (e) { raw = null; }
      }
      return raw && typeof raw === 'object' ? raw : null;
    }, null);
    return details || {};
  }

  function normalizeGroup(value) {
    var group = value;
    if (typeof group === 'string') {
      group = safe(function () { return JSON.parse(group); }, null);
    }
    return group && typeof group === 'object' ? group : {};
  }

  function groupObject(kind) {
    return normalizeGroup(detailsObject()[kind]);
  }

  function fieldValue(kind, key) {
    var value = groupObject(kind)[key];
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      return safe(function () {
        return Array.isArray(value) ? value.join(', ') : JSON.stringify(value);
      }, '') || '';
    }
    return String(value);
  }

  function clamp(value) {
    var str = String(value === null || value === undefined ? '' : value).replace(/[\r\n\t]+/g, ' ').trim();
    return str.length > MAX_LEN ? str.slice(0, MAX_LEN) : str;
  }

  function buildEditorHtml(kind, title) {
    var html = '<form id="' + FORM_ID + '" class="ms-editor" novalidate>';
    html += '<div class="ms-editor-title">' + escSafe(title) + '</div>';
    html += '<input type="hidden" name="ms_kind" value="' + kind + '">';
    for (var i = 0; i < FIELDS[kind].length; i += 1) {
      var def = FIELDS[kind][i];
      html += '<label class="ms-editor-row" for="ms-f-' + def[0] + '">' +
        '<span class="ms-editor-label">' + escSafe(L(def[1], def[2])) + '</span>' +
        '<input id="ms-f-' + def[0] + '" name="' + def[0] + '" type="text" maxlength="' + MAX_LEN + '" autocomplete="off" ' +
        'value="' + escSafe(fieldValue(kind, def[0])) + '">' +
        '</label>';
    }
    html += '<div class="ms-editor-status" role="status"></div>';
    html += '<div class="ms-editor-actions">' +
      '<button type="button" class="ms-btn" data-ms-cancel>' + escSafe(L('Cancel', 'إلغاء')) + '</button>' +
      '<button type="submit" class="ms-btn ms-btn-primary">' + escSafe(L('Save', 'حفظ')) + '</button>' +
      '</div>';
    html += '</form>';
    return html;
  }

  function mountFallback(title, html) {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('role', 'presentation');
    overlay.innerHTML = html;
    overlay.setAttribute('data-ms-title', title);
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) closeEditor();
    });
    (document.body || document.documentElement).appendChild(overlay);
  }

  function setStatus(form, text) {
    var node = form.querySelector('.ms-editor-status');
    if (node) node.textContent = text || '';
  }

  function bindEditor(kind) {
    var form = document.getElementById(FORM_ID);
    if (!form || form.getAttribute('data-ms-bound') === '1') return;
    form.setAttribute('data-ms-bound', '1');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      saveEditor(kind, form);
    });
    var cancel = form.querySelector('[data-ms-cancel]');
    if (cancel) {
      cancel.addEventListener('click', function (ev) {
        ev.preventDefault();
        closeEditor();
      });
    }
  }

  function openEditor(kind) {
    if (!FIELDS[kind]) return;
    closeEditor();
    var title = kind === 'basics' ? L('Edit basics', 'تعديل الأساسيات') : L('Edit lifestyle', 'تعديل نمط الحياة');
    var html = buildEditorHtml(kind, title);

    var usedSheet = false;
    safe(function () {
      if (typeof sheetShell === 'function') {
        if (sheetShell.length >= 2) sheetShell(title, html);
        else sheetShell({ title: title, body: html, html: html, content: html });
        usedSheet = true;
      }
      return true;
    }, false);

    if (document.getElementById(FORM_ID)) { bindEditor(kind); return; }

    if (usedSheet) {
      /* Give the existing sheet a moment to mount, then fall back safely. */
      var tries = 0;
      var tick = function () {
        if (document.getElementById(FORM_ID)) { bindEditor(kind); return; }
        tries += 1;
        if (tries <= 6) setTimeout(tick, 40);
        else { mountFallback(title, html); bindEditor(kind); }
      };
      setTimeout(tick, 40);
      return;
    }
    mountFallback(title, html);
    bindEditor(kind);
  }

  function closeEditor() {
    safe(function () {
      var overlay = document.getElementById(OVERLAY_ID);
      if (overlay && overlay.parentNode) { overlay.parentNode.removeChild(overlay); return; }
      var form = document.getElementById(FORM_ID);
      if (!form) return;
      var closeBtn = form.querySelector('[data-close],[data-dismiss],.sheet-close,.modal-close');
      if (closeBtn && typeof closeBtn.click === 'function') { closeBtn.click(); return; }
      var dialog = (form.closest && form.closest('[role="dialog"],dialog,.sheet,.sheet-shell,.bottom-sheet,.modal,.overlay')) || form;
      if (dialog && dialog.parentNode) dialog.parentNode.removeChild(dialog);
    });
  }

  function saveEditor(kind, form) {
    var details = detailsObject();
    var group = normalizeGroup(details[kind]);
    for (var i = 0; i < FIELDS[kind].length; i += 1) {
      var key = FIELDS[kind][i][0];
      var input = form.querySelector('[name="' + key + '"]');
      if (input) group[key] = clamp(input.value);
    }

    var payload = {
      living_in: details.living_in === undefined ? null : details.living_in,
      height_cm: details.height_cm === undefined ? null : details.height_cm,
      job: details.job === undefined ? null : details.job,
      education: details.education === undefined ? null : details.education,
      basics: normalizeGroup(details.basics),
      lifestyle: normalizeGroup(details.lifestyle)
    };
    payload[kind] = group;

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    setStatus(form, L('Saving...', 'جارٍ الحفظ...'));

    var done = function () {
      safe(function () {
        if (typeof cloudProfileBundle === 'function') return cloudProfileBundle();
        return null;
      });
      closeEditor();
      safe(function () { render(); });
    };
    var fail = function (err) {
      if (submitBtn) submitBtn.disabled = false;
      setStatus(form, L('Could not save. Try again.', 'تعذّر الحفظ. حاول مرة أخرى.'));
      safe(function () {
        if (window.console && window.console.warn) window.console.warn('[master-spec] profile-details save failed', err);
      });
    };

    var result = safe(function () { return cloudAPI('profile-details', 'POST', payload); }, null);
    if (result === null) { fail(new Error('cloudAPI unavailable')); return; }
    if (result && typeof result.then === 'function') result.then(done, fail);
    else done();
  }

  function ensureEditorButtons() {
    var strip = document.querySelector('.profile-v2 .attribute-strip') || document.querySelector('.attribute-strip');
    if (!strip) return;
    var defs = [
      { id: 'ms-basics-btn', kind: 'basics', label: L('Basics', 'الأساسيات') },
      { id: 'ms-lifestyle-btn', kind: 'lifestyle', label: L('Lifestyle', 'نمط الحياة') }
    ];
    for (var i = 0; i < defs.length; i += 1) {
      var def = defs[i];
      var button = document.getElementById(def.id);
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.id = def.id;
        button.className = 'ms-strip-btn';
        button.setAttribute('data-ms-editor', def.kind);
        button.addEventListener('click', (function (kind) {
          return function (ev) { ev.preventDefault(); openEditor(kind); };
        }(def.kind)));
        strip.appendChild(button);
      }
      if (button.parentNode !== strip) strip.appendChild(button);
      if (button.textContent !== def.label) button.textContent = def.label;
    }
  }

  /* --------------------------- top artists card ------------------------- */

  function realArtists() {
    var found = safe(function () {
      var profile = cloud && cloud.profileData;
      var details = detailsObject();
      var candidates = [
        profile && profile.spotify && profile.spotify.top_artists,
        profile && profile.spotify_top_artists,
        profile && profile.top_artists,
        details && details.spotify_top_artists,
        details && details.top_artists
      ];
      for (var i = 0; i < candidates.length; i += 1) {
        var candidate = candidates[i];
        if (Array.isArray(candidate) && candidate.length) {
          var names = [];
          for (var j = 0; j < candidate.length; j += 1) {
            var item = candidate[j];
            var name = typeof item === 'string' ? item : ((item && (item.name || item.display_name)) || '');
            if (name) names.push(String(name));
            if (names.length >= 8) break;
          }
          if (names.length) return names;
        }
      }
      return [];
    }, []);
    return found || [];
  }

  function buildArtistsCard() {
    var artists = realArtists();
    var card = document.createElement('div');
    card.id = ARTISTS_ID;
    card.className = 'top-artists-card';

    var title = L('Top artists', 'أفضل الفنانين');
    var emptyEn = 'Connect Spotify to show your top artists';
    var emptyText = L(emptyEn, 'اربط Spotify لعرض أفضل الفنانين');
    var buttonLabel = L('Connect Spotify', 'اربط Spotify');

    var html = '<div class="ms-artists-title">' + escSafe(title) + '</div>';
    if (artists.length) {
      html += '<ul class="ms-artists-list">';
      for (var i = 0; i < artists.length; i += 1) html += '<li>' + escSafe(artists[i]) + '</li>';
      html += '</ul>';
    } else {
      html += '<div class="ms-artists-sub" data-empty-state="' + escSafe(emptyEn) + '">' + escSafe(emptyText) + '</div>';
    }
    /* Explicitly not connected: the action stays disabled, no fake artists are shown. */
    html += '<button type="button" class="ms-btn" disabled aria-disabled="true" ' +
      'title="' + escSafe(L('Spotify is not connected', 'Spotify غير موصول')) + '">' +
      escSafe(buttonLabel) + '</button>';
    card.innerHTML = html;
    return card;
  }

  function ensureTopArtists() {
    var spotify = document.querySelector('.spotify-card');
    if (!spotify || !spotify.parentNode) return;
    var card = document.getElementById(ARTISTS_ID);
    if (card) {
      if (spotify.nextElementSibling !== card) spotify.parentNode.insertBefore(card, spotify.nextSibling);
      if (card.getAttribute('data-ms-state') !== String(realArtists().length)) {
        var rebuilt = buildArtistsCard();
        card.innerHTML = rebuilt.innerHTML;
        card.setAttribute('data-ms-state', String(realArtists().length));
      }
      return;
    }
    card = buildArtistsCard();
    card.setAttribute('data-ms-state', String(realArtists().length));
    spotify.parentNode.insertBefore(card, spotify.nextSibling);
  }

  /* ------------------------------ enhancer ------------------------------ */

  function enhanceMasterSpec() {
    safe(injectStyle);
    safe(ensureMatchNotice);
    safe(setComposerPlaceholder);
    safe(orderComposer);
    safe(ensureEditorButtons);
    safe(ensureTopArtists);
  }

  /* Wrap render(): original render first, then the additive enhancements. */
  var baseRender = safe(function () { return render; }, null);
  var wrapped = false;
  if (typeof baseRender === 'function') {
    safe(function () {
      render = function () {
        var out = baseRender.apply(this, arguments);
        safe(enhanceMasterSpec);
        return out;
      };
      wrapped = true;
      return true;
    }, false);
    window.__masterSpecRenderWrapped = wrapped === true;
  }

  if (!window.__masterSpecRenderWrapped) {
    /* Fallback if `render` cannot be reassigned: keep the layer in sync idempotently. */
    safe(function () {
      var scheduled = false;
      var run = function () { scheduled = false; safe(enhanceMasterSpec); };
      var schedule = function () {
        if (scheduled) return;
        scheduled = true;
        setTimeout(run, 120);
      };
      var target = document.body || document.documentElement;
      if (target && typeof MutationObserver === 'function') {
        new MutationObserver(schedule).observe(target, { childList: true, subtree: true });
      }
      document.addEventListener('DOMContentLoaded', schedule);
      return true;
    }, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { safe(enhanceMasterSpec); });
  } else {
    safe(enhanceMasterSpec);
  }
}());
