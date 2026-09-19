/*
 * public/auth-spec.js
 *
 * Additive override of the account-recovery flow only.
 *
 * Injected by scripts/build.mjs into the same app closure as public/cloud-ui.js
 * (after public/master-spec.js and before the final render() call), so every
 * symbol used here resolves from that shared closure:
 *   pendingAuth, showVerification, cloudAuthDirect, finishAuth, cloudPassword,
 *   cloudRecover, cloudRecoveryView, verifyAuthCode, resendAuthCode, render, t, esc, cloud.
 *
 * Recovery is now email OTP, not a magic link:
 *   request -> cloudAuthDirect('otp',    { email })                       -> server POST auth/otp
 *   verify  -> cloudAuthDirect('verify', { email, token, type: 'email' }) -> server POST auth/verify
 *
 * Intentional constraints:
 *   - Signup OTP is unchanged: non-recovery calls fall through to the previous implementation.
 *   - The legacy magic-link callback is left untouched so previously sent links keep working.
 *   - Nothing is removed and nothing throws at load time: each slot is installed defensively.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Previous (untouched) implementations, for the non-recovery paths.   *
   * ------------------------------------------------------------------ */
  var PREV_VERIFY_AUTH_CODE = (typeof verifyAuthCode === 'function') ? verifyAuthCode : null;
  var PREV_RESEND_AUTH_CODE = (typeof resendAuthCode === 'function') ? resendAuthCode : null;

  /* ------------------------------------------------------------------ *
   * Selector tables. First match wins; every lookup is try/catch safe.   *
   * ------------------------------------------------------------------ */
  var EMAIL_SELECTORS = [
    '#cloudRecoverEmail',
    '#cloudRecoveryEmail',
    '#recovery-email',
    '#recoveryEmail',
    '#cloudEmail',
    'input[name="recovery-email"]',
    'input[name="email"]',
    'input[type="email"]'
  ];

  var CODE_SELECTORS = [
    '#cloudAuthCode',
    '#cloudCode',
    '#cloudVerifyCode',
    '#auth-code',
    '#otp',
    'input[name="code"]',
    'input[name="token"]',
    'input[autocomplete="one-time-code"]',
    'input[inputmode="numeric"]'
  ];

  var NOTICE_SELECTORS = [
    '#cloudAuthNotice',
    '#cloudNotice',
    '#cloudAuthError',
    '#cloudError',
    '[data-auth-notice]',
    '[data-cloud-notice]'
  ];

  var COPY_SELECTORS = [
    '#cloudVerificationCopy',
    '#cloudAuthCopy',
    '#cloudVerificationHint',
    '[data-auth-copy]'
  ];

  /* ------------------------------------------------------------------ *
   * Tiny helpers.                                                       *
   * ------------------------------------------------------------------ */
  function tr(key, fallback) {
    try {
      if (typeof t === 'function') {
        var value = t(key);
        if (value && value !== key) return String(value);
      }
    } catch (_) { /* fall through to the plain fallback */ }
    return fallback;
  }

  function h(value) {
    var text = (value === null || value === undefined) ? '' : String(value);
    try {
      if (typeof esc === 'function') return esc(text);
    } catch (_) { /* fall through to the local escaper */ }
    return text.replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function firstElement(selectors) {
    if (typeof document === 'undefined') return null;
    for (var i = 0; i < selectors.length; i++) {
      var el = null;
      try { el = document.querySelector(selectors[i]); } catch (_) { el = null; }
      if (el) return el;
    }
    return null;
  }

  function valueOf(selectors, node) {
    if (typeof document === 'undefined') return null;
    var i, el;

    if (node && typeof node.matches === 'function') {
      for (i = 0; i < selectors.length; i++) {
        try {
          if (node.matches(selectors[i]) && typeof node.value === 'string' && node.value.trim()) return node;
        } catch (_) { /* ignore */ }
      }
    }

    if (node && typeof node.querySelector === 'function') {
      for (i = 0; i < selectors.length; i++) {
        el = null;
        try { el = node.querySelector(selectors[i]); } catch (_) { el = null; }
        if (el && typeof el.value === 'string' && el.value.trim()) return el;
      }
    }

    for (i = 0; i < selectors.length; i++) {
      el = null;
      try { el = document.querySelector(selectors[i]); } catch (_) { el = null; }
      if (el && typeof el.value === 'string' && el.value.trim()) return el;
    }

    return null;
  }

  function rootOf(e) {
    if (!e) return null;
    var current = e.currentTarget || e.target || null;
    if (current && current.form) return current.form;
    if (current && typeof current.closest === 'function') {
      try { return current.closest('form') || current; } catch (_) { return current; }
    }
    return current;
  }

  function readEmail(e) {
    var el = valueOf(EMAIL_SELECTORS, rootOf(e));
    if (el) return el.value.trim();

    try { if (pendingAuth && pendingAuth.email) return String(pendingAuth.email).trim(); } catch (_) { /* ignore */ }
    try { if (cloud && cloud.email) return String(cloud.email).trim(); } catch (_) { /* ignore */ }
    return '';
  }

  function readCode(e) {
    var el = valueOf(CODE_SELECTORS, rootOf(e));
    return el ? el.value.trim() : '';
  }

  function rememberEmail(email) {
    try {
      if (pendingAuth) {
        if (pendingAuth.email !== undefined) pendingAuth.email = email;
        if (pendingAuth.kind !== undefined) pendingAuth.kind = 'recovery';
      }
    } catch (_) { /* ignore */ }
  }

  function notice(message, tone) {
    if (typeof document === 'undefined') return;
    var el = firstElement(NOTICE_SELECTORS);
    if (!el) return;
    try {
      el.textContent = message;
      if (tone && typeof el.setAttribute === 'function') el.setAttribute('data-tone', tone);
    } catch (_) { /* ignore */ }
  }

  function otpSentMessage(email) {
    return tr('auth.recoveryOtpSent', 'We emailed a one-time code (OTP) to') +
      ' ' + email + '. ' +
      tr('auth.recoveryOtpSentHint', 'Enter that code below to continue. No magic link is sent for password recovery.');
  }

  function setRecoveryCopy(email) {
    if (typeof document === 'undefined') return;
    var el = firstElement(COPY_SELECTORS);
    if (!el) return;
    try { el.textContent = otpSentMessage(email); } catch (_) { /* ignore */ }
  }

  function backToSignIn() {
    var candidates = [
      (typeof cloudSignInView === 'function') ? cloudSignInView : null,
      (typeof cloudSignIn === 'function') ? cloudSignIn : null,
      (typeof cloudAuthView === 'function') ? cloudAuthView : null,
      (typeof cloudAuth === 'function') ? cloudAuth : null,
      (typeof showAuth === 'function') ? showAuth : null
    ];
    for (var i = 0; i < candidates.length; i++) {
      if (!candidates[i]) continue;
      try {
        var out = candidates[i]();
        if (out !== undefined) {
          try { if (typeof render === 'function') render(); } catch (_) { /* ignore */ }
          return false;
        }
      } catch (_) { /* try the next candidate */ }
    }
    return false;
  }

  /* ------------------------------------------------------------------ *
   * Recovery overrides.                                                 *
   * ------------------------------------------------------------------ */

  /* Request the recovery OTP (auth/otp) instead of a magic link. */
  async function authSpecRecover(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    var email = readEmail(e);
    if (!email) {
      notice(tr('auth.recoveryEmailRequired', 'Enter the email address of your account.'), 'error');
      return false;
    }

    notice(tr('auth.recoverySending', 'Sending a one-time code...'), 'info');
    try {
      await cloudAuthDirect('otp', { email: email });
      rememberEmail(email);
      if (typeof showVerification === 'function') showVerification(email, 'recovery', true);
      setRecoveryCopy(email);
      notice(otpSentMessage(email), 'success');
      return true;
    } catch (err) {
      notice(tr('auth.recoverySendFailed', 'Could not send the one-time code. Please try again.'), 'error');
      return false;
    }
  }

  /* Verify the recovery OTP via auth/verify, then let the user set a new password. */
  async function authSpecVerify(e) {
    var kind = '';
    try { kind = (pendingAuth && pendingAuth.kind) || ''; } catch (_) { kind = ''; }

    /* Signup / any other flow: keep the previous behaviour exactly as it was. */
    if (kind !== 'recovery') {
      if (PREV_VERIFY_AUTH_CODE) return await PREV_VERIFY_AUTH_CODE.call(this, e);
      return undefined;
    }

    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    var email = readEmail(e);
    var token = readCode(e);
    if (!email || !token) {
      notice(tr('auth.recoveryCodeRequired', 'Enter the one-time code we emailed you.'), 'error');
      return false;
    }

    var result;
    try {
      result = await cloudAuthDirect('verify', { email: email, token: token, type: 'email' });
      if (typeof finishAuth === 'function') await finishAuth(result);
    } catch (err) {
      notice(tr('auth.recoveryCodeInvalid', 'That code is invalid or has expired. Request a new one.'), 'error');
      return false;
    }

    /* Signed in: open the password screen so a new password can be set. */
    try { if (typeof cloudPassword === 'function') cloudPassword(); } catch (_) { /* ignore */ }
    return true;
  }

  /* Recovery resend uses auth/otp as well; all other kinds use the old path. */
  async function authSpecResend(e) {
    var kind = '';
    try { kind = (pendingAuth && pendingAuth.kind) || ''; } catch (_) { kind = ''; }

    if (kind !== 'recovery') {
      if (PREV_RESEND_AUTH_CODE) return await PREV_RESEND_AUTH_CODE.call(this, e);
      return undefined;
    }

    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    var email = readEmail(e);
    if (!email) {
      notice(tr('auth.recoveryEmailRequired', 'Enter the email address of your account.'), 'error');
      return false;
    }

    try {
      await cloudAuthDirect('otp', { email: email });
      rememberEmail(email);
      setRecoveryCopy(email);
      notice(otpSentMessage(email), 'success');
      return true;
    } catch (err) {
      notice(tr('auth.recoverySendFailed', 'Could not send the one-time code. Please try again.'), 'error');
      return false;
    }
  }

  /* Recovery view: asks for the email and states that a code arrives by email. */
  function authSpecRecoveryView() {
    var title = tr('auth.recoveryTitle', 'Reset your password');
    var intro = tr(
      'auth.recoveryIntro',
      'Enter your email address and we will send a one-time code (OTP) by email. Password recovery does not use a magic link.'
    );
    var label = tr('auth.recoveryEmailLabel', 'Email address');
    var submit = tr('auth.recoverySendCode', 'Email me a code');
    var back = tr('auth.backToSignIn', 'Back to sign in');

    return '' +
      '<section class="cloud-auth cloud-recovery" data-cloud-view="recovery">' +
        '<h2 class="cloud-auth__title">' + h(title) + '</h2>' +
        '<p class="cloud-auth__copy" data-auth-copy>' + h(intro) + '</p>' +
        '<form class="cloud-auth__form" data-cloud-form="recovery" onsubmit="return cloudRecover(event)">' +
          '<label class="cloud-auth__label" for="cloudRecoverEmail">' + h(label) + '</label>' +
          '<input id="cloudRecoverEmail" name="email" type="email" autocomplete="email" required ' +
            'class="cloud-auth__input" placeholder="you@example.com" />' +
          '<button type="submit" class="cloud-auth__submit">' + h(submit) + '</button>' +
        '</form>' +
        '<p class="cloud-auth__notice" id="cloudAuthNotice" role="alert" aria-live="polite"></p>' +
        '<button type="button" class="cloud-auth__link" ' +
          'onclick="return (typeof window !== &quot;undefined&quot; && window.__vibeAuthSpecBack) ? window.__vibeAuthSpecBack() : false;">' +
          h(back) +
        '</button>' +
      '</section>';
  }

  /* ------------------------------------------------------------------ *
   * Install. Additive: an immutable or missing binding simply keeps the *
   * original behaviour instead of breaking the bundle at load time.     *
   * ------------------------------------------------------------------ */
  var installed = [];

  function tryInstall(slot, impl) {
    try {
      if (slot === 'cloudRecover') { cloudRecover = impl; }
      else if (slot === 'cloudRecoveryView') { cloudRecoveryView = impl; }
      else if (slot === 'verifyAuthCode') { verifyAuthCode = impl; }
      else if (slot === 'resendAuthCode') { resendAuthCode = impl; }
      else { throw new Error('unknown auth slot: ' + slot); }
      installed.push(slot);
    } catch (err) {
      /* Binding is immutable (or the symbol is absent): keep the original. */
    }
  }

  tryInstall('cloudRecover', authSpecRecover);
  tryInstall('cloudRecoveryView', authSpecRecoveryView);
  tryInstall('verifyAuthCode', authSpecVerify);
  tryInstall('resendAuthCode', authSpecResend);

  try {
    var scope = (typeof globalThis !== 'undefined') ? globalThis : ((typeof window !== 'undefined') ? window : null);
    if (scope) {
      scope.__vibeAuthSpec = { version: 'recovery-otp-1', installed: installed.slice(), backToSignIn: backToSignIn };
      scope.__vibeAuthSpecBack = backToSignIn;
    }
  } catch (_) { /* diagnostics only */ }
})();
