/* public/auth-ui-secure.js
 * ---------------------------------------------------------------------------
 * CSP-safe override for the cloud account recovery (OTP) view.
 *
 * This file is concatenated into the SAME closure right after
 * public/auth-spec.js (see scripts/build.mjs), so the following bindings are
 * in scope:
 *
 *     on(), authScreen, cloud, render, t, esc, cloudRecover
 *
 * It replaces ONLY cloudRecoveryView(). The markup it renders contains no
 * textual inline event attributes: the form submit and the "back" button are
 * wired through the on() helper instead, which is required because the page
 * policy is "script-src-attr 'none'".
 *
 * All shared state below uses `var` on purpose: this file is appended to the
 * bundle, so its top-level statements may execute *after* the app bootstrap
 * already triggered a first render. `var` avoids any temporal-dead-zone error
 * in that situation.
 * ---------------------------------------------------------------------------
 */

/* --------------------------------------------------------------- helpers -- */

var __secureRecoveryBound = false; /* on() handlers registered at least once   */
var __secureRecoveryBusy = false;  /* a submit is currently in flight          */

function __secureTr(key, fallback) {
  try {
    if (typeof t !== 'function') return fallback;
    var value = t(key);
    return value && value !== key ? String(value) : fallback;
  } catch (_) {
    return fallback;
  }
}

function __secureEsc(value) {
  var text = value === null || value === undefined ? '' : String(value);
  try {
    return typeof esc === 'function' ? String(esc(text)) : text;
  } catch (_) {
    return text;
  }
}

function __secureRecoveryNotice() {
  try {
    return cloud && cloud.recoveryNotice ? String(cloud.recoveryNotice) : '';
  } catch (_) {
    return '';
  }
}

/* ---------------------------------------------------------- recovery view -- */

function cloudRecoveryView() {
  /* Register the handlers as early as possible; retried on every render until
   * the on() targets exist. Never allowed to break rendering. */
  try {
    __bindCloudRecoverySecure();
  } catch (_) {}

  var tr = __secureTr;
  var notice = __secureRecoveryNotice();

  return '' +
    '<form id="cloudRecoveryForm" class="auth-form cloud-recovery" ' +
    'data-auth-view="cloud-recovery" novalidate>' +
      '<h2 class="auth-title">' +
        __secureEsc(tr('cloudRecoveryTitle', 'Recover your account')) +
      '</h2>' +
      '<p class="auth-hint" data-auth-otp-hint>' +
        __secureEsc(tr(
          'cloudRecoveryOtpHint',
          'We will email you a one-time code (OTP) to verify it is you. ' +
            'No magic link is sent.'
        )) +
      '</p>' +
      '<label class="auth-field">' +
        '<span>' + __secureEsc(tr('emailLabel', 'Email')) + '</span>' +
        '<input type="email" name="email" autocomplete="email" ' +
          'inputmode="email" required />' +
      '</label>' +
      '<p class="auth-notice" data-auth-notice' + (notice ? '' : ' hidden') + '>' +
        __secureEsc(notice) +
      '</p>' +
      '<p class="auth-error" data-auth-error hidden></p>' +
      '<button type="submit" class="auth-submit" data-auth-submit>' +
        __secureEsc(tr('cloudRecoverySendOtp', 'Email me a one-time code')) +
      '</button>' +
      '<button type="button" class="auth-back" data-auth-back>' +
        __secureEsc(tr('cloudRecoveryBack', 'Back to sign in')) +
      '</button>' +
    '</form>';
}

/* ------------------------------------------------------------- handlers --- */

function __secureRecoveryFormFrom(event) {
  var current = event && event.currentTarget;
  if (current && typeof current.querySelector === 'function') return current;

  var node = event && event.target;
  if (node && typeof node.closest === 'function') {
    var form = node.closest('form#cloudRecoveryForm, .cloud-recovery');
    if (form) return form;
  }
  return null;
}

function __secureSetText(node, message) {
  if (!node) return;
  node.textContent = message ? String(message) : '';
  node.hidden = !message;
}

function __secureSendRecoveryOtp(email) {
  var account = null;
  try {
    account = cloud || null;
  } catch (_) {
    account = null;
  }

  /* auth-spec.js owns the actual transport; try the conventional entry points
   * in order and fall back to a DOM event for any other wiring. */
  var senders = [
    'sendRecoveryOtp',
    'requestRecoveryOtp',
    'sendRecoveryCode',
    'requestRecoveryCode',
    'sendOtp',
    'requestOtp',
    'recoverWithOtp',
    'recover',
    'requestRecovery'
  ];

  if (account) {
    for (var i = 0; i < senders.length; i += 1) {
      var fn = account[senders[i]];
      if (typeof fn === 'function') return fn.call(account, email);
    }
  }

  var handled = false;
  try {
    if (typeof CustomEvent === 'function' && typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('vibe:cloud-recovery', {
        bubbles: true,
        cancelable: true,
        detail: {
          email: email,
          handled: function () { handled = true; }
        }
      }));
    }
  } catch (_) {}

  if (handled) return null;

  throw new Error(__secureTr(
    'cloudRecoveryUnavailable',
    'Recovery is unavailable right now. Please try again later.'
  ));
}

function __secureRecoverySubmit(event) {
  if (!event) return;
  if (event.__vibeSecureHandled) return; /* already handled by the other binding */
  event.__vibeSecureHandled = true;

  try {
    if (typeof event.preventDefault === 'function') event.preventDefault();
  } catch (_) {}

  var form = __secureRecoveryFormFrom(event);
  if (!form) return;

  var input = form.querySelector('input[name="email"], input[type="email"], input[name="identifier"]');
  var errorNode = form.querySelector('[data-auth-error]');
  var noticeNode = form.querySelector('[data-auth-notice]');
  var submitBtn = form.querySelector('[data-auth-submit]');

  var email = input && input.value ? String(input.value).trim() : '';

  __secureSetText(errorNode, '');
  __secureSetText(noticeNode, '');

  if (!email) {
    __secureSetText(errorNode, __secureTr(
      'cloudRecoveryEmailRequired',
      'Enter the email address of your account.'
    ));
    if (input && typeof input.focus === 'function') input.focus();
    return;
  }

  if (__secureRecoveryBusy) return;
  __secureRecoveryBusy = true;
  if (submitBtn) submitBtn.disabled = true;

  var release = function () {
    __secureRecoveryBusy = false;
    if (submitBtn) submitBtn.disabled = false;
  };

  var sentMessage = __secureTr(
    'cloudRecoveryOtpSent',
    'If an account exists for that address, a one-time code (OTP) is on its way by email.'
  );

  var result;
  try {
    result = __secureSendRecoveryOtp(email);
  } catch (err) {
    release();
    __secureSetText(errorNode, (err && err.message) || __secureTr(
      'cloudRecoveryFailed',
      'We could not send the code. Please try again.'
    ));
    return;
  }

  if (result && typeof result.then === 'function') {
    result.then(function () {
      release();
      __secureSetText(noticeNode, sentMessage);
    }, function (err) {
      release();
      __secureSetText(errorNode, (err && err.message) || __secureTr(
        'cloudRecoveryFailed',
        'We could not send the code. Please try again.'
      ));
    });
    return;
  }

  release();
  __secureSetText(noticeNode, sentMessage);
}

function __secureRecoveryBack() {
  try {
    if (typeof authScreen === 'function') {
      var screens = ['signin', 'signIn', 'login'];
      for (var i = 0; i < screens.length; i += 1) {
        try {
          authScreen(screens[i]);
          return;
        } catch (_) {}
      }
      try {
        authScreen();
        return;
      } catch (_) {}
    }
  } catch (_) {}

  try {
    if (typeof render === 'function') render();
  } catch (_) {}
}

function __secureRecoveryClick(event) {
  if (!event) return;
  if (event.__vibeSecureHandled) return;
  event.__vibeSecureHandled = true;

  var node = event.target;
  if (!node || typeof node.closest !== 'function') return;
  if (!node.closest('[data-auth-back], .auth-back')) return;

  try {
    if (typeof event.preventDefault === 'function') event.preventDefault();
  } catch (_) {}

  __secureRecoveryBack();
}

/* -------------------------------------------------------------- binding --- */

function __secureTryBind(target, type, handler) {
  try {
    if (!target) return false;
    if (typeof on !== 'function') return false;
    on(target, type, handler);
    return true;
  } catch (_) {
    return false;
  }
}

function __bindCloudRecoverySecure() {
  if (__secureRecoveryBound) return;

  var bound = false;

  /* Primary binding: the recovery target exposed by the auth layer. */
  try {
    if (__secureTryBind(cloudRecover, 'submit', __secureRecoverySubmit)) bound = true;
    if (__secureTryBind(cloudRecover, 'click', __secureRecoveryClick)) bound = true;
  } catch (_) {
    /* cloudRecover may still be uninitialized on a very early render — retry later */
  }

  /* Safety net so the view keeps working even if the target above is not
   * resolvable yet. Both handlers are idempotent per event object. */
  try {
    if (__secureTryBind(document, 'submit', __secureRecoverySubmit)) bound = true;
    if (__secureTryBind(document, 'click', __secureRecoveryClick)) bound = true;
  } catch (_) {}

  if (bound) __secureRecoveryBound = true;
}

/* Bind once here too, for the case where the first render already happened
 * while this file was still being evaluated. */
try {
  __bindCloudRecoverySecure();
} catch (_) {}
