/* Vibe App Store readiness: in-app account deletion + data export.
   Runs inside the app IIFE after legal-spec.js. No inline JS / style attrs. */
var complianceUiState = { status: null, loading: false, error: '' };
var __complianceBooted = false;
var __complianceRerendering = false;

function complianceSignedIn() {
  try {
    if (typeof cloud === 'undefined' || !cloud) return false;
    if (typeof cloud.isSignedIn === 'function') return !!cloud.isSignedIn();
    if (typeof cloud.getUser === 'function') return !!cloud.getUser();
    if (cloud.session) return true;
    if (cloud.user) return true;
  } catch (e) {}
  return false;
}

function complianceFlags(d) {
  d = d || {};
  return {
    account_deletion_configured: d.account_deletion_configured === true,
    data_export_configured: d.data_export_configured === true,
    privacy_policy_configured: d.privacy_policy_configured === true
  };
}

/* Cache only safe booleans. Never surface internal config values. */
async function complianceLoadStatus(force) {
  if (complianceUiState.loading) return complianceUiState.status;
  if (complianceUiState.status && !force) return complianceUiState.status;
  complianceUiState.loading = true;
  complianceUiState.error = '';
  try {
    var r = await cloudAPI('compliance-status');
    var d = (r && r.data) || r || {};
    complianceUiState.status = complianceFlags(d);
  } catch (e) {
    complianceUiState.error = 'unavailable';
    complianceUiState.status = complianceFlags({});
  } finally {
    complianceUiState.loading = false;
  }
  return complianceUiState.status;
}

async function complianceExportData() {
  try {
    if (typeof toast === 'function') toast('Preparing your data export\u2026');
    var r = await cloudAPI('data-export');
    var payload = (r && r.data) || r || {};
    var text = JSON.stringify(payload, null, 2);
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'vibe-data-export-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 0);
    if (typeof toast === 'function') toast('Your data export has downloaded.');
  } catch (e) {
    if (typeof toast === 'function') toast('Could not prepare your data export. Please try again.');
  }
}

function complianceErrorText(err) {
  var raw = '';
  try { raw = String((err && (err.code || err.error || err.message)) || ''); } catch (e) {}
  if (raw.toLowerCase().indexOf('account_deletion_not_configured') !== -1) {
    return 'Account deletion is unavailable in this build. Secure deletion must be configured before App Store release. Your account has not been deleted.';
  }
  return 'We could not complete account deletion right now. Your account has not been deleted. Please try again later.';
}

function complianceCloseSheet(sheet) {
  try {
    if (sheet && sheet.remove) { sheet.remove(); return; }
    var d = document.querySelector('[role="dialog"], .sheet');
    if (d && d.remove) d.remove();
  } catch (e) {}
}

function complianceOpenDelete() {
  var wrap = document.createElement('div');
  wrap.className = 'compliance-delete';

  var p1 = document.createElement('p');
  p1.textContent = 'Deleting your account permanently removes your account, profile, interests, photos, prompts, settings, and messages, together with their associated media.';
  var p2 = document.createElement('p');
  p2.textContent = 'Limited anonymized safety and legal records may be retained where required by law.';

  var form = document.createElement('form');
  form.className = 'compliance-delete-form';
  var label = document.createElement('label');
  label.setAttribute('for', 'compliance-delete-confirm');
  label.textContent = 'Type DELETE to confirm';
  var input = document.createElement('input');
  input.type = 'text';
  input.id = 'compliance-delete-confirm';
  input.name = 'confirm';
  input.required = true;
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('placeholder', 'DELETE');
  var msg = document.createElement('p');
  msg.className = 'compliance-error';
  msg.setAttribute('role', 'alert');
  var submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'destructive';
  submit.textContent = 'Permanently delete my account';

  form.appendChild(label);
  form.appendChild(input);
  form.appendChild(submit);
  form.appendChild(msg);
  wrap.appendChild(p1);
  wrap.appendChild(p2);
  wrap.appendChild(form);

  var sheet = null;
  try { sheet = sheetShell('Delete account', wrap); } catch (e) { sheet = wrap; }
  return sheet;
}

function complianceOpenPolicy() {
  try {
    view = 'legal-deletion';
    render();
    return;
  } catch (e) {}
  try { go('legal-deletion'); } catch (e2) {}
}

function complianceSectionHtml() {
  var s = complianceUiState.status || {};
  var ok = s.account_deletion_configured === true;
  var notice = '';
  if (complianceUiState.loading) notice = 'Checking secure deletion availability\u2026';
  else if (!ok) notice = 'Secure deletion is not available in this build.';
  return [
    '<section class="card privacy-card compliance-card" aria-labelledby="compliance-dp-heading">',
    '<h2 id="compliance-dp-heading">Data &amp; privacy</h2>',
    '<p>Download a copy of your data, review the deletion policy, or delete your account.</p>',
    '<div class="actions">',
    '<button type="button" data-compliance="export">Download my data</button>',
    '<button type="button" data-compliance="policy">Account &amp; Data Deletion Policy</button>',
    '<button type="button" class="destructive" data-compliance="delete"' + (ok ? '' : ' disabled') + '>Delete my account</button>',
    '</div>',
    notice ? '<p class="compliance-notice" role="status">' + esc(notice) + '</p>' : '',
    '</section>'
  ].join('');
}

var __complianceBaseAccountPage = (typeof accountPage === 'function') ? accountPage : null;

function complianceAccountPage() {
  var base = '';
  try {
    if (__complianceBaseAccountPage) {
      var b = __complianceBaseAccountPage.apply(this, arguments);
      if (typeof b === 'string') base = b;
    }
  } catch (e) {}
  return '<section class="account-page compliance-account">' +
    '<h1>Account management</h1>' +
    complianceSectionHtml() +
    '</section>' + base;
}

function complianceBtn(label, kind) {
  var b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.setAttribute('data-compliance', kind);
  return b;
}

function complianceSettingsCard() {
  var card = document.createElement('section');
  card.className = 'card privacy-card compliance-card';
  var h = document.createElement('h2');
  h.textContent = 'Privacy & Account';
  var p = document.createElement('p');
  p.textContent = 'Manage your account, download your data, or review our privacy policy.';
  var actions = document.createElement('div');
  actions.className = 'actions';
  actions.appendChild(complianceBtn('Manage account', 'manage'));
  actions.appendChild(complianceBtn('Download my data', 'export'));
  actions.appendChild(complianceBtn('Privacy Policy', 'privacy'));
  card.appendChild(h);
  card.appendChild(p);
  card.appendChild(actions);
  return card;
}

function complianceAugmentDom() {
  var acc = document.querySelector('.compliance-account, .account-page');
  if (acc && !acc.getAttribute('data-compliance-ready')) {
    acc.setAttribute('data-compliance-ready', '1');
    if (!acc.querySelector('[data-compliance="delete"]')) {
      try { acc.insertAdjacentHTML('beforeend', complianceSectionHtml()); } catch (e) {}
    }
  }
  var set = document.querySelector('.settings-page');
  if (set && !set.getAttribute('data-compliance-ready')) {
    set.setAttribute('data-compliance-ready', '1');
    try { set.appendChild(complianceSettingsCard()); } catch (e) {}
  }
}

/* Bind delegated handlers once (safe helper, no inline JS). */
if (typeof on === 'function') {
  on(function (e) {
    var el = e && e.target;
    if (!el || !el.closest) return;
    var hit = el.closest('[data-compliance]');
    if (!hit) return;
    var kind = hit.getAttribute('data-compliance');
    if (kind === 'export') { e.preventDefault(); complianceExportData(); }
    else if (kind === 'policy' || kind === 'privacy') { e.preventDefault(); complianceOpenPolicy(); }
    else if (kind === 'delete') { e.preventDefault(); complianceOpenDelete(); }
    else if (kind === 'manage') {
      e.preventDefault();
      try { go('account'); } catch (e2) { try { view = 'account'; render(); } catch (e3) {} }
    }
  }, 'click');

  on(async function (e) {
    var f = e && e.target;
    if (!f || !f.classList || !f.classList.contains('compliance-delete-form')) return;
    e.preventDefault();
    var input = f.querySelector('input[name="confirm"]');
    var msg = f.querySelector('.compliance-error');
    var submit = f.querySelector('button[type="submit"]');
    var value = input ? input.value.trim() : '';
    if (value !== 'DELETE') {
      if (msg) msg.textContent = 'Please type DELETE exactly to confirm.';
      return;
    }
    if (msg) msg.textContent = 'Deleting your account\u2026';
    if (submit) submit.disabled = true;
    try {
      await cloudAPI('account-delete', 'POST', { confirm: value });
      complianceCloseSheet(f.closest('[role="dialog"], .sheet'));
      if (typeof toast === 'function') toast('Your account has been deleted.');
      try { location.assign('/'); } catch (e2) {}
    } catch (err) {
      if (submit) submit.disabled = false;
      if (msg) msg.textContent = complianceErrorText(err);
    }
  }, 'submit');
}

/* Route hook: load status once, then re-render. */
function complianceOnRoute() {
  try {
    if (!complianceSignedIn()) return;
    if (view !== 'account' && view !== 'settings') return;
    complianceAugmentDom();
    if (!complianceUiState.status && !complianceUiState.loading && !__complianceBooted) {
      __complianceBooted = true;
      complianceLoadStatus().then(function () {
        complianceAugmentDom();
        try { if (__complianceBaseRender) __complianceBaseRender(); } catch (e) {}
      });
    }
  } catch (e) {}
}

var __complianceBaseRender = (typeof render === 'function') ? render : null;

try {
  accountPage = complianceAccountPage;
  if (__complianceBaseRender) {
    render = function () {
      var out = __complianceBaseRender.apply(this, arguments);
      if (!__complianceRerendering) {
        __complianceRerendering = true;
        try { complianceOnRoute(); } finally { __complianceRerendering = false; }
      }
      return out;
    };
  }
} catch (e) {}
