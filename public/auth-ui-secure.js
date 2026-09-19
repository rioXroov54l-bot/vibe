'use strict';

cloudRecoveryView=function(){
  return `<section class="recovery-screen">
    <div class="recovery-top">
      <button class="auth-back" aria-label="${t('رجوع','Back')}" ${on(()=>{authScreen='welcome';cloud.recoveryNotice='';render()})}>‹</button>
      <button class="auth-language" ${on(switchLang)}>${t('English','العربية')}</button>
    </div>
    <div class="recovery-copy">
      ${authLogo()}
      <h1>${t('خلّنا نرجّعك لحسابك…','Let’s get you back in…')}</h1>
      <form ${on(cloudRecover,'submit')}>
        <label>${t('أدخل بريدك الإلكتروني','Enter email')}
          <span>${t('أدخل البريد المرتبط بحسابك، وسنرسل لك رمز تحقق لمرة واحدة عبر البريد.','Enter the email associated with your account. We’ll send you a one-time verification code by email.')}</span>
          <input name="email" type="email" required autocomplete="email" inputmode="email" placeholder="name@example.com">
        </label>
        ${cloud.recoveryNotice?`<p role="status" class="recovery-notice">${esc(cloud.recoveryNotice)}</p>`:''}
        <button class="recovery-submit" ${cloud.busy?'disabled':''}>${cloud.busy?t('جارٍ الإرسال…','Sending…'):t('إرسال الرمز','Send code')}</button>
      </form>
    </div>
  </section>`;
};
