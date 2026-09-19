/* Vibe App Store readiness: account deletion + data export UI.
   Bundled inside the app IIFE after legal-spec.js. */
var complianceUiState={status:null,loading:false,error:''};

async function complianceLoadStatus(force){
  if(complianceUiState.loading)return complianceUiState.status;
  if(complianceUiState.status&&!force)return complianceUiState.status;
  complianceUiState.loading=true;complianceUiState.error='';
  try{
    const r=await cloudAPI('compliance-status');
    complianceUiState.status={
      account_deletion_configured:r?.account_deletion_configured===true,
      moderation_blocklist_configured:r?.moderation_blocklist_configured===true,
      reciprocal_block_enforcement_configured:r?.reciprocal_block_enforcement_configured===true
    };
  }catch(e){
    complianceUiState.error='unavailable';
    complianceUiState.status={account_deletion_configured:false,moderation_blocklist_configured:false,reciprocal_block_enforcement_configured:false};
  }finally{complianceUiState.loading=false}
  return complianceUiState.status;
}

async function complianceExportData(){
  try{
    toast(t('جارٍ تجهيز نسخة بياناتك…','Preparing your data export…'));
    const data=await cloudAPI('data-export');
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='vibe-data-export-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),0);
    toast(t('تم تنزيل نسخة بياناتك.','Your data export was downloaded.'));
  }catch(e){toast(t('تعذر تجهيز نسخة البيانات الآن.','Could not prepare your data export right now.'))}
}

function complianceDeletionError(e){
  const code=String(e?.code||e?.error||e?.message||'');
  if(code.includes('account_deletion_not_configured'))return t(
    'الحذف الآمن غير مهيأ في هذه النسخة. لم يتم حذف حسابك.',
    'Secure account deletion is not configured in this build. Your account was not deleted.'
  );
  return t('تعذر حذف الحساب الآن. لم يتم حذف حسابك.','Account deletion could not be completed. Your account was not deleted.');
}

function complianceOpenDelete(){
  sheetShell(()=>`<div class="modal-title"><h2>${t('حذف الحساب نهائيًا','Permanently delete account')}</h2></div>
  <p>${t('سيؤدي الحذف إلى إزالة حسابك وملفك واهتماماتك وصورك وبرومبتاتك وإعداداتك ورسائلك والوسائط المرتبطة بحسابك. قد تُحتفظ بسجلات أمان محدودة بعد إزالة هويتك إذا لزم ذلك لمكافحة الإساءة أو لالتزام قانوني.','Deletion removes your account, profile, interests, photos, prompts, settings, messages and media associated with your account. Limited safety records may be retained after removing your identity where needed for abuse prevention or a legal obligation.')}</p>
  <p class="notice">${t('هذا الإجراء لا يمكن التراجع عنه. اكتب DELETE بالإنجليزية للتأكيد.','This action cannot be undone. Type DELETE to confirm.')}</p>
  <form ${on(async e=>{
    e.preventDefault();
    const input=e.target.confirm,button=e.target.querySelector('button[type="submit"]'),status=e.target.querySelector('[role="status"]');
    const value=String(input?.value||'').trim();
    if(value!=='DELETE'){if(status)status.textContent=t('اكتب DELETE تمامًا للتأكيد.','Type DELETE exactly to confirm.');return}
    if(button)button.disabled=true;if(status)status.textContent=t('جارٍ حذف الحساب…','Deleting account…');
    try{
      await cloudAPI('account-delete','POST',{confirm:'DELETE'});
      document.querySelector('#create')?.close();
      toast(t('تم حذف حسابك.','Your account was deleted.'));
      location.assign('/');
    }catch(err){
      if(button)button.disabled=false;
      if(status)status.textContent=complianceDeletionError(err);
    }
  },'submit')}>
    <label>${t('تأكيد الحذف','Deletion confirmation')}<input name="confirm" required autocomplete="off" placeholder="DELETE"></label>
    <p role="status" class="small muted"></p>
    <button type="submit" class="control leave">${t('حذف حسابي نهائيًا','Permanently delete my account')}</button>
  </form>
  <button class="chip" ${on(()=>{document.querySelector('#create')?.close();view='legal-deletion';render()})}>${t('قراءة سياسة حذف الحساب والبيانات','Read Account & Data Deletion Policy')}</button>`);
}

function complianceAccountMarkup(){
  const configured=complianceUiState.status?.account_deletion_configured===true;
  return `<section class="policy-page compliance-account-page">
    <h1>${t('إدارة الحساب والبيانات','Account & data management')}</h1>
    <p>${t('تحكم في حسابك ونسخة بياناتك وحذف الحساب من داخل Vibe.','Control your account, download your data, and delete your account from inside Vibe.')}</p>
    <article class="aside-card">
      <h2>${t('بياناتي','My data')}</h2>
      <button class="chip" ${on(complianceExportData)}>${t('تنزيل نسخة من بياناتي','Download my data')}</button>
      <button class="chip" ${on(()=>{view='legal-privacy';render()})}>${t('سياسة الخصوصية','Privacy Policy')}</button>
      <button class="chip" ${on(()=>{view='legal-deletion';render()})}>${t('سياسة حذف الحساب والبيانات','Account & Data Deletion Policy')}</button>
    </article>
    <article class="aside-card">
      <h2>${t('الأمان والحساب','Account security')}</h2>
      <button class="chip" ${on(()=>cloudPassword())}>${t('تغيير كلمة المرور','Change password')}</button>
      <button class="chip" ${on(()=>cloudLogout())}>${t('تسجيل الخروج','Sign out')}</button>
    </article>
    <article class="aside-card danger-zone">
      <h2>${t('منطقة حساسة','Danger zone')}</h2>
      ${complianceUiState.loading?`<p class="muted">${t('جارٍ التحقق من خدمة الحذف…','Checking secure deletion…')}</p>`:''}
      ${!complianceUiState.loading&&!configured?`<p class="notice">${t('الحذف الآمن غير متاح في هذه النسخة حتى يكتمل إعداد الخادم. لا يتم اعتبار إرسال طلب دعم حذفًا للحساب.','Secure deletion is unavailable in this build until server configuration is completed. A support request is not treated as account deletion.')}</p>`:''}
      <button class="control leave" ${configured?'': 'disabled'} ${on(complianceOpenDelete)}>${t('حذف حسابي نهائيًا','Permanently delete my account')}</button>
    </article>
  </section>`;
}

var complianceBaseAccountPage=accountPage;
accountPage=function(){
  if(!cloud.user)return cloudGate();
  if(!complianceUiState.status&&!complianceUiState.loading){
    complianceLoadStatus().then(()=>{if(view==='account')render()});
  }
  return complianceAccountMarkup();
};

var complianceBaseSettingsPage=settingsPage;
settingsPage=function(){
  const html=complianceBaseSettingsPage();
  return html.replace('</section>',`<article class="aside-card compliance-settings">
    <h2>${t('الخصوصية والحساب','Privacy & account')}</h2>
    <div class="controls">
      <button class="chip" ${on(()=>go('account'))}>${t('إدارة الحساب','Manage account')}</button>
      <button class="chip" ${on(complianceExportData)}>${t('تنزيل بياناتي','Download my data')}</button>
      <button class="chip" ${on(()=>{view='legal-privacy';render()})}>${t('سياسة الخصوصية','Privacy Policy')}</button>
    </div>
  </article></section>`);
};

var complianceBaseRender=render;
render=function(){
  const out=complianceBaseRender.apply(this,arguments);
  if(cloud?.user&&(view==='settings'||view==='account')&&!complianceUiState.status&&!complianceUiState.loading){
    complianceLoadStatus().then(()=>{if(view==='settings'||view==='account')render()});
  }
  return out;
};
