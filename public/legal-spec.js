/* legal-spec.js - Vibe Legal & Safety Center. Policy version 2026.09.
   OWNER_INPUT_REQUIRED: public legal contact/entity, governing law & jurisdiction.
   Policy text only. Functional in-app account deletion is a separate engineering task. */
(function(){
if(typeof render!=='function'||render.__legal)return;
var LEGAL_POLICY_VERSION='2026.09',LEGAL_LAST_UPDATED='2026-09-19';
var ES=String(lang||'').toLowerCase().indexOf('es')===0;
function L(en,es){return ES?es:en;}
function R(v){return esc(v==null?'':String(v));}
var NAV=['legal-terms','legal-privacy','legal-community','legal-safety','legal-deletion','legal-copyright','legal-support'];
var LABELS={
'legal-index':L('Legal & Safety Center','Centro Legal y de Seguridad'),
'legal-terms':L('Terms of Service','Términos de Servicio'),
'legal-privacy':L('Privacy Policy','Política de Privacidad'),
'legal-community':L('Community Guidelines','Normas de la Comunidad'),
'legal-safety':L('Safety Center','Centro de Seguridad'),
'legal-deletion':L('Data Deletion','Eliminación de Datos'),
'legal-copyright':L('Copyright & IP','Derechos de Autor y PI'),
'legal-support':L('Support','Soporte')};
var PAGES={
'legal-index':{intro:['Policies and safety resources for Vibe.','Políticas y recursos de seguridad de Vibe.'],sections:[
 ['Policies','Políticas',null,[
  ['Terms of Service - your account, content, and rules.','Términos de Servicio - tu cuenta, contenido y reglas.'],
  ['Privacy Policy - data we collect and how it is used.','Política de Privacidad - datos que recopilamos y cómo se usan.'],
  ['Community Guidelines - allowed and prohibited behavior.','Normas de la Comunidad - comportamiento permitido y prohibido.'],
  ['Safety Center - reporting, blocking, emergencies, appeals.','Centro de Seguridad - reportes, bloqueo, emergencias, apelaciones.'],
  ['Data Deletion - what deletion covers.','Eliminación de Datos - qué abarca la eliminación.'],
  ['Copyright & IP - rights and complaint steps.','Derechos de Autor y PI - derechos y pasos de reclamación.'],
  ['Support - troubleshooting and contacts.','Soporte - solución de problemas y contactos.']]],
 ['Version','Versión',[['Policy version '+LEGAL_POLICY_VERSION+', last updated '+LEGAL_LAST_UPDATED+'.','Versión de la política '+LEGAL_POLICY_VERSION+', última actualización '+LEGAL_LAST_UPDATED+'.']]]]},
'legal-terms':{intro:['These Terms govern your use of Vibe. Policy version '+LEGAL_POLICY_VERSION+'.','Estos Términos rigen tu uso de Vibe. Versión de la política '+LEGAL_POLICY_VERSION+'.'],sections:[
 ['Your account','Tu cuenta',[
  ['You must be old enough to use the service where you live, give accurate information, and keep your login secure.','Debes tener la edad suficiente para usar el servicio donde vives, dar información veraz y mantener tu inicio de sesión seguro.'],
  ['You are responsible for activity under your account and for following these Terms and the Community Guidelines.','Eres responsable de la actividad de tu cuenta y de cumplir estos Términos y las Normas de la Comunidad.']]],
 ['Your content','Tu contenido',[
  ['You keep ownership of the content you create or upload (user-generated content).','Conservas la propiedad del contenido que creas o subes (contenido generado por el usuario).'],
  ['You grant Vibe a limited, non-exclusive, worldwide, royalty-free license to host, store, display, and process your content only to operate and provide the service.','Otorgas a Vibe una licencia limitada, no exclusiva, mundial y libre de regalías para alojar, almacenar, mostrar y procesar tu contenido solo para operar y prestar el servicio.'],
  ['This license ends when your content is deleted, except for limited retention described in the Privacy Policy.','Esta licencia termina cuando tu contenido se elimina, salvo la retención limitada descrita en la Política de Privacidad.']]],
 ['Limited license to the service','Licencia limitada del servicio',[
  ['We grant you a personal, non-transferable, revocable, limited license to use Vibe for personal, non-commercial purposes.','Te otorgamos una licencia personal, intransferible, revocable y limitada para usar Vibe con fines personales y no comerciales.'],
  ['Do not copy, reverse engineer, scrape, resell, or misuse the service.','No copies, apliques ingeniería inversa, extraigas datos, revendas ni hagas mal uso del servicio.']]],
 ['Prohibited conduct','Conducta prohibida',[
  ['You must follow the Community Guidelines. Do not use the service unlawfully, harm others, or interfere with the service or its security.','Debes seguir las Normas de la Comunidad. No uses el servicio de forma ilegal, no dañes a otros ni interfieras con el servicio o su seguridad.']]],
 ['Moderation and removal','Moderación y eliminación',[
  ['We may review, restrict, or remove content or accounts that violate these Terms or the Community Guidelines, and may report unlawful content where required.','Podemos revisar, restringir o eliminar contenido o cuentas que infrinjan estos Términos o las Normas de la Comunidad, y reportar contenido ilegal cuando sea exigible.']]],
 ['Third-party services','Servicios de terceros',[
  ['Vibe uses third-party providers described in the Privacy Policy. Their terms may apply to their services, and we are not responsible for them.','Vibe usa proveedores terceros descritos en la Política de Privacidad. Sus términos pueden aplicar a sus servicios y no somos responsables de ellos.']]],
 ['Availability','Disponibilidad',[
  ['The service is provided "as is" and "as available". Features may change or be unavailable, and we do not promise uninterrupted or error-free operation.','El servicio se ofrece "tal cual" y "según disponibilidad". Las funciones pueden cambiar o no estar disponibles, y no prometemos un funcionamiento ininterrumpido ni libre de errores.']]],
 ['Suspension and termination','Suspensión y terminación',[
  ['We may suspend or terminate access for violations of these Terms or for legal or security reasons.','Podemos suspender o terminar el acceso por infracciones de estos Términos o por motivos legales o de seguridad.'],
  ['You may stop using Vibe at any time and request deletion of your data.','Puedes dejar de usar Vibe en cualquier momento y solicitar la eliminación de tus datos.']]],
 ['Governing law and jurisdiction','Ley aplicable y jurisdicción',[
  ['OWNER_INPUT_REQUIRED: governing law and jurisdiction have not been decided and require an owner/legal decision. This page does not state one.','OWNER_INPUT_REQUIRED: la ley aplicable y la jurisdicción no se han decidido y requieren una decisión del propietario/legal. Esta página no especifica ninguna.']]],
 ['Changes to these Terms','Cambios en estos Términos',[
  ['We may update these Terms. Material changes are announced in the app with a new policy version. Continuing to use Vibe means you accept the updated Terms.','Podemos actualizar estos Términos. Los cambios importantes se anuncian en la app con una nueva versión de la política. Si sigues usando Vibe, aceptas los Términos actualizados.']]]]},
'legal-privacy':{intro:['How Vibe handles your data. Policy version '+LEGAL_POLICY_VERSION+'.','Cómo trata Vibe tus datos. Versión de la política '+LEGAL_POLICY_VERSION+'.'],sections:[
 ['Data we collect','Datos que recopilamos',[
  ['Account: email and authentication identifiers.','Cuenta: correo electrónico e identificadores de autenticación.'],
  ['Profile and interests: name, bio, photos, prompts, and the interests you choose.','Perfil e intereses: nombre, biografía, fotos, respuestas y los intereses que eliges.'],
  ['Activity: chat messages, media uploads, notifications, reactions, likes, blocks, and reports.','Actividad: mensajes de chat, archivos multimedia, notificaciones, reacciones, me gusta, bloqueos y reportes.']]],
 ['Service providers','Proveedores de servicios',[
  ['Supabase provides authentication, database, storage, and realtime features.','Supabase proporciona autenticación, base de datos, almacenamiento y funciones en tiempo real.'],
  ['Resend sends transactional email, such as account and notification emails.','Resend envía correo transaccional, como correos de cuenta y notificaciones.'],
  ['Spotify is used only if you connect your account, to show listening activity. It is not used unless you connect it.','Spotify se usa solo si conectas tu cuenta, para mostrar actividad de escucha. No se usa a menos que lo conectes.']]],
 ['Advertising and tracking','Publicidad y seguimiento',[
  ['Current code shows no advertising and no cross-company tracking. We do not sell personal data.','El código actual no muestra publicidad ni seguimiento entre empresas. No vendemos datos personales.']]],
 ['Retention and deletion summary','Resumen de retención y eliminación',[
  ['We keep data while your account is active and as needed to operate the service, handle reports, and meet legal obligations.','Conservamos los datos mientras tu cuenta está activa y según sea necesario para operar el servicio, gestionar reportes y cumplir obligaciones legales.'],
  ['Deleting your account removes your account and profile content. Some records, such as abuse, security, or log records, may be retained or anonymized as required.','Eliminar tu cuenta borra tu cuenta y el contenido de tu perfil. Algunos registros, como los de abuso, seguridad o técnicos, pueden conservarse o anonimizarse según sea necesario.']]],
 ['Your choices','Tus opciones',[
  ['You can edit your profile, disconnect Spotify, and delete your account using in-app controls.','Puedes editar tu perfil, desconectar Spotify y eliminar tu cuenta con los controles de la app.']]],
 ['Compliance note','Nota de cumplimiento',[
  ['This policy describes current data practices. It is not a claim of GDPR, CCPA, or any other regulatory compliance.','Esta política describe las prácticas actuales de datos. No es una declaración de cumplimiento del GDPR, CCPA ni de ninguna otra normativa.']]],
 ['Legal contact','Contacto legal',[
  ['OWNER_INPUT_REQUIRED: a public legal contact and the responsible legal entity have not been configured yet. Use in-app support for now.','OWNER_INPUT_REQUIRED: aún no se han configurado un contacto legal público ni la entidad legal responsable. Por ahora usa el soporte dentro de la app.']]]]},
'legal-community':{intro:['These guidelines explain the behavior we expect. In-app report and block tools are the fastest way to flag problems.','Estas normas explican el comportamiento que esperamos. Las herramientas de reportar y bloquear dentro de la app son la forma más rápida de señalar problemas.'],sections:[
 ['Not allowed','No permitido',null,[
  ['Harassment, bullying, or targeted abuse.','Acoso, intimidación o abuso dirigido.'],
  ['Threats of violence or incitement to harm.','Amenazas de violencia o incitación a dañar.'],
  ['Hate speech or attacks based on protected characteristics.','Discurso de odio o ataques por características protegidas.'],
  ['Sexual exploitation, or any content that endangers minors.','Explotación sexual o cualquier contenido que ponga en peligro a menores.'],
  ['Spam, scams, phishing, or fraud.','Spam, estafas, phishing o fraude.'],
  ['Impersonation of people or organizations.','Suplantación de personas u organizaciones.'],
  ['Doxxing or sharing private information without consent.','Doxxing o compartir información privada sin consentimiento.'],
  ['Illegal content or activity.','Contenido o actividad ilegal.'],
  ['Infringing copyright or other intellectual property.','Infringir derechos de autor u otra propiedad intelectual.']]],
 ['How to respond','Cómo actuar',[
  ['Use report to flag content and block to stop contact. Reports help us review and act.','Usa reportar para señalar contenido y bloquear para detener el contacto. Los reportes nos ayudan a revisar y actuar.']]],
 ['Enforcement','Aplicación',[
  ['Content or accounts that break these guidelines may be restricted or removed, as described in the Terms.','El contenido o las cuentas que incumplan estas normas pueden restringirse o eliminarse, según los Términos.']]]]},
'legal-safety':{intro:['Safety tools and what to do in urgent situations.','Herramientas de seguridad y qué hacer en situaciones urgentes.'],sections:[
 ['Report and block','Reportar y bloquear',[
  ['Use report to send a concern to our review process, and block to prevent further contact from a user.','Usa reportar para enviar una preocupación a nuestro proceso de revisión, y bloquear para impedir más contacto de un usuario.']]],
 ['Review times','Tiempos de revisión',[
  ['We do not promise a specific moderation response time (no SLA). Reports are reviewed as capacity allows.','No prometemos un tiempo de respuesta de moderación específico (sin SLA). Los reportes se revisan según la capacidad disponible.']]],
 ['Emergencies','Emergencias',[
  ['If you or someone else is in immediate danger, contact your local emergency services right away. Vibe is not an emergency service.','Si tú o alguien más está en peligro inmediato, contacta de inmediato a los servicios de emergencia locales. Vibe no es un servicio de emergencia.']]],
 ['Appeals','Apelaciones',[
  ['If you believe a moderation decision was wrong, submit an appeal through in-app support.','Si crees que una decisión de moderación fue incorrecta, envía una apelación mediante el soporte dentro de la app.']]]]},
'legal-deletion':{intro:['This page explains the scope of deletion. Functional in-app account deletion must be delivered as a separate engineering task; this page is policy only and does not itself delete data.','Esta página explica el alcance de la eliminación. La eliminación funcional de la cuenta dentro de la app debe entregarse como tarea de ingeniería aparte; esta página es solo informativa y no elimina datos por sí misma.'],sections:[
 ['How to delete','Cómo eliminar',[
  ['Use the in-app account deletion control in Settings when it is available. You can also contact in-app support.','Usa el control de eliminación de cuenta en Ajustes cuando esté disponible. También puedes contactar al soporte dentro de la app.']]],
 ['What deletion covers','Qué abarca la eliminación',null,[
  ['Account and profile.','Cuenta y perfil.'],
  ['Interests.','Intereses.'],
  ['Photos and prompts.','Fotos y respuestas.'],
  ['Uploaded media.','Archivos multimedia subidos.'],
  ['Messages.','Mensajes.'],
  ['Other user-generated content.','Otro contenido generado por el usuario.']]],
 ['Caveats','Advertencias',[
  ['Records tied to abuse reports, security, or legal obligations may be retained or anonymized as required by law.','Los registros vinculados a reportes de abuso, seguridad u obligaciones legales pueden conservarse o anonimizarse según lo exija la ley.'],
  ['Copies held by other users, for example messages they saved, or by third-party providers may not be under our control.','Las copias en poder de otros usuarios, por ejemplo mensajes que guardaron, o de proveedores terceros pueden no estar bajo nuestro control.']]]]},
'legal-copyright':{intro:['How to report copyright or intellectual property concerns.','Cómo reportar asuntos de derechos de autor o propiedad intelectual.'],sections:[
 ['Your rights','Tus derechos',[
  ['Only upload content you own or are allowed to use. You must have the rights to everything you post.','Sube solo contenido que te pertenezca o que puedas usar. Debes tener los derechos de todo lo que publicas.']]],
 ['Filing a complaint','Presentar una reclamación',[
  ['To report infringement, contact in-app support and include:','Para reportar una infracción, contacta al soporte dentro de la app e incluye:']],[
  ['Identification of the work you own.','Identificación de la obra que te pertenece.'],
  ['The location (link or details) of the infringing content.','La ubicación (enlace o detalles) del contenido infractor.'],
  ['Your name and contact information.','Tu nombre e información de contacto.'],
  ['A statement that you have a good-faith belief the use is unauthorized.','Una declaración de que crees de buena fe que el uso no está autorizado.'],
  ['A statement that the information is accurate and that you are the owner or authorized to act.','Una declaración de que la información es exacta y que eres el titular o estás autorizado a actuar.'],
  ['Your signature, electronic is fine.','Tu firma, la electrónica es válida.']]],
 ['Contact','Contacto',[
  ['In-app support is the current channel for copyright complaints. OWNER_INPUT_REQUIRED: a public copyright/legal contact has not been configured.','El soporte dentro de la app es el canal actual para reclamaciones de derechos de autor. OWNER_INPUT_REQUIRED: no se ha configurado un contacto público de derechos de autor/legal.']]]]},
'legal-support':{intro:['Help with common issues and where to reach us in the app.','Ayuda con problemas comunes y cómo contactarnos en la app.'],sections:[
 ['Troubleshooting','Solución de problemas',[
  ['For sign-in, loading, or notification issues, restart the app, check your connection, and try again. Include device and app version when you contact us.','Para problemas de inicio de sesión, carga o notificaciones, reinicia la app, revisa tu conexión e inténtalo de nuevo. Incluye el dispositivo y la versión de la app cuando nos contactes.']]],
 ['Reporting and appeals','Reportes y apelaciones',[
  ['Use report and block for content, and in-app support for appeals or account issues.','Usa reportar y bloquear para contenido, y el soporte dentro de la app para apelaciones o problemas de cuenta.']]],
 ['Privacy and deletion','Privacidad y eliminación',[
  ['For privacy questions or deletion help, use in-app support. See the Privacy Policy and Data Deletion pages.','Para preguntas de privacidad o ayuda con la eliminación, usa el soporte dentro de la app. Consulta las páginas de Privacidad y Eliminación de Datos.']]],
 ['Copyright and IP','Derechos de autor y PI',[
  ['For intellectual property concerns, use in-app support and the Copyright page checklist.','Para asuntos de propiedad intelectual, usa el soporte dentro de la app y la lista de la página de Derechos de Autor.']]],
 ['Contact','Contacto',[
  ['OWNER_INPUT_REQUIRED: no public support email, company name, or address is shown here because none has been provided. In-app support is the current channel.','OWNER_INPUT_REQUIRED: no se muestra aquí un correo de soporte, nombre de empresa ni dirección porque no se han proporcionado. El soporte dentro de la app es el canal actual.']]]]}};
function isAuthed(){try{return !!(typeof app!=='undefined'&&app&&(app.session||app.user||app.currentUser||(app.auth&&app.auth.user)));}catch(_){return false;}}
function sections(list){
var h='',i,j,s,ps,ls;
for(i=0;i<list.length;i++){s=list[i];ps=s[2]||[];ls=s[3]||[];
h+='<section class="legal-sec"><h2>'+R(L(s[0],s[1]))+'</h2>';
for(j=0;j<ps.length;j++)h+='<p>'+R(L(ps[j][0],ps[j][1]))+'</p>';
if(ls.length){h+='<ul>';for(j=0;j<ls.length;j++)h+='<li>'+R(L(ls[j][0],ls[j][1]))+'</li>';h+='</ul>';}
h+='</section>';}
return h;}
function legalNav(cur){
var h='<nav class="legal-nav" aria-label="'+R(L('Legal pages','Páginas legales'))+'"><ul>',i;
for(i=0;i<NAV.length;i++){if(NAV[i]===cur)continue;h+='<li><button type="button" data-legal-go="'+NAV[i]+'">'+R(LABELS[NAV[i]])+'</button></li>';}
return h+'</ul></nav>';}
function legalPage(id){
var p=PAGES[id]||PAGES['legal-index'],back=isAuthed()?'settings':'auth';
var h='<main class="legal-center" role="main" aria-labelledby="legal-title">';
h+='<header class="legal-head"><button type="button" data-legal-go="'+back+'" aria-label="'+R(L('Back','Volver'))+'">'+R(L('Back','Volver'))+'</button>';
h+='<h1 id="legal-title" tabindex="-1">'+R(LABELS[id]||LABELS['legal-index'])+'</h1>';
h+='<p class="legal-meta">'+R(L('Policy','Política'))+' '+R(LEGAL_POLICY_VERSION)+' &middot; '+R(L('Updated','Actualizado'))+' '+R(LEGAL_LAST_UPDATED)+'</p></header>';
h+='<p class="legal-intro">'+R(L(p.intro[0],p.intro[1]))+'</p>';
return h+legalNav(id)+sections(p.sections||[])+'</main>';}
function legalCard(){
var h='<section class="legal-center legal-card" aria-labelledby="legal-center-title"><h2 id="legal-center-title">'+R(L('Legal & Safety','Legal y Seguridad'))+'</h2>';
h+='<p>'+R(L('Policy version','Versión de la política'))+' '+R(LEGAL_POLICY_VERSION)+'</p><div class="legal-actions">';
for(var i=0;i<NAV.length;i++)h+='<button type="button" data-legal-go="'+NAV[i]+'">'+R(LABELS[NAV[i]])+'</button>';
return h+'</div></section>';}
function authFooter(){
var ids=['legal-terms','legal-privacy','legal-community','legal-support'];
var h='<footer class="legal-auth-footer" aria-label="'+R(L('Legal links','Enlaces legales'))+'"><nav><ul>';
for(var i=0;i<ids.length;i++)h+='<li><button type="button" data-legal-go="'+ids[i]+'">'+R(LABELS[ids[i]])+'</button></li>';
return h+'</ul></nav><p>'+R(L('Policy version','Versión de la política'))+' '+R(LEGAL_POLICY_VERSION)+'</p></footer>';}
function enhance(v,out){
if(/settings/i.test(v))return out+legalCard();
if(!isAuthed()&&/auth|login|signin|welcome|landing/i.test(v))return out+authFooter();
return out;}
function enhanceDom(v){
if(typeof document==='undefined')return;
var run=function(){var c;
if(/settings/i.test(v)){c=document.querySelector('[data-view="settings"],#settings,.settings');if(c)c.insertAdjacentHTML('beforeend',legalCard());}
else if(!isAuthed()&&/auth|login|signin|welcome|landing/i.test(v)){c=document.querySelector('[data-view="auth"],#auth,.auth-screen');if(c)c.insertAdjacentHTML('beforeend',authFooter());}};
if(typeof Promise!=='undefined')Promise.resolve().then(run);else setTimeout(run,0);}
var base=render;
render=function(view){
var v=String(view==null?'':view);
if(v.indexOf('legal-')===0)return legalPage(v);
var out=base.apply(this,arguments);
if(typeof out==='string')return enhance(v,out);
enhanceDom(v);return out;};
render.__legal=true;
if(typeof document!=='undefined')document.addEventListener('click',function(e){
var el=e.target&&e.target.closest?e.target.closest('[data-legal-go]'):null;
if(!el)return;e.preventDefault();
var id=el.getAttribute('data-legal-go');
if(typeof go==='function')go(id);
setTimeout(function(){var h=document.getElementById('legal-title');if(h){try{h.focus();}catch(_){}}},0);});})();
