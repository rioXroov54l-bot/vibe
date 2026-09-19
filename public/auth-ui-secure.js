/* =====================================================================
 * auth-ui-secure.js
 * Injected inside the SAME closure as auth-spec.js, immediately after it.
 *
 * Scope: overrides `cloudRecoveryView` ONLY.
 * Everything else defined by auth-spec.js stays untouched.
 *
 * Rules honoured here:
 *   - Reuse Vibe's native markup structure and class names.
 *   - No inline handlers at all (no inline submit, no inline click).
 *   - Copy is explicit that a one-time OTP code arrives by email and that
 *     there is NO magic link.
 * ===================================================================== */

cloudRecoveryView = function () {
  var noticeHtml = cloud.recoveryNotice
    ? '<p class="auth-notice" role="status">' +
        String(cloud.recoveryNotice).replace(/[&<>"]/g, function (ch) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
        }) +
      '</p>'
    : '';

  return (
    '<div class="auth-form-screen">' +
      '<div class="auth-form-top">' +
        '<button type="button" class="auth-back" aria-label="Back">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" ' +
            'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
            'stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M15 18l-6-6 6-6"></path>' +
          '</svg>' +
        '</button>' +
        '<div class="auth-language">' +
          '<button type="button" class="auth-text-link" data-action="toggle-language">' +
            'Language' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="auth-form-brand">' +
        '<span class="auth-brand-mark" aria-hidden="true"></span>' +
      '</div>' +
      '<form class="auth-clean-card" id="cloudRecover" novalidate>' +
        '<h1 class="auth-title">Account recovery</h1>' +
        '<p class="auth-lead">' +
          'Enter your email address and we will send you a one-time code (OTP) ' +
          'by email. This is not a magic link: open the email, copy the code, ' +
          'then enter it here to continue.' +
        '</p>' +
        noticeHtml +
        '<label class="auth-field" for="cloudRecoverEmail">' +
          '<span class="auth-field-label">Email</span>' +
          '<input id="cloudRecoverEmail" name="email" type="email" required ' +
            'autocomplete="email" inputmode="email" placeholder="you@example.com" />' +
        '</label>' +
        '<button type="submit" class="auth-submit">Email me a one-time code</button>' +
        '<a class="auth-text-link" href="#" data-action="back-to-signin">' +
          'Back to sign in' +
        '</a>' +
      '</form>' +
    '</div>'
  );
};

/* ------------------------------------------------------------------ *
 * Event wiring, registered through the shared `on` helper.            *
 * No inline handlers are used anywhere above.                         *
 * ------------------------------------------------------------------ */

function cloudRecoverSubmit(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  var form = (event && event.currentTarget) || document.getElementById('cloudRecover');
  var input = form ? form.querySelector('input[name="email"]') : null;
  var value = input && input.value ? input.value.trim() : '';

  if (!value) {
    if (input && typeof input.focus === 'function') {
      input.focus();
    }
    return;
  }

  cloud.recoveryEmail = value;
  cloud.recoveryNotice =
    'A one-time code (OTP) is on its way to ' + value +
    '. Open the email, copy the 6-digit code, and enter it here. ' +
    'There is no magic link to click.';

  render();
}

on(cloudRecover, 'submit', cloudRecoverSubmit);

on(function () {
  authScreen = 'welcome';
  cloud.recoveryNotice = '';
  render();
});
