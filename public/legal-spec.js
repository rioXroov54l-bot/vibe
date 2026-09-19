/* ============================================================================
 * public/legal-spec.js — Vibe Legal & Safety Center (bilingual ar/en)
 * Bundled inside the app IIFE after all additive UI files and before final render().
 * Self-contained: no external dependencies, no inline style, no inline JS attributes.
 *
 * --- OWNER_INPUT_REQUIRED (source comments only; never rendered to users) ---
 * 1. Governing law / jurisdiction / legal entity name + address are intentionally NOT
 *    asserted anywhere in this file. OWNER_INPUT_REQUIRED: owner must decide and
 *    publish entity, address and jurisdiction before any contractual claim is made.
 * 2. Public support email is configured as support@vibe-groups.com. OWNER_INPUT_REQUIRED
 *    still applies to the responsible legal entity, registered address and legal contact URL.
 * 3. OWNER_INPUT_REQUIRED: in-app account deletion control must exist and ship BEFORE
 *    App Store submission. This file describes deletion *policy*, not the control.
 * 4. OWNER_INPUT_REQUIRED: legal minimum age decision. 18+ is described as the current
 *    product setting of the discovery demo, never as a legal minimum.
 * 5. Copyright: no DMCA agent, no registered agent, no legal entity is claimed here.
 * ==========================================================================*/

var LEGAL_POLICY_VERSION = '2026.09';
var LEGAL_LAST_UPDATED = '2026-09-19';

var LEGAL_ORDER = [
  'legal-index', 'legal-terms', 'legal-privacy', 'legal-community',
  'legal-safety', 'legal-deletion', 'legal-copyright', 'legal-support'
];

/* Short chip labels (ar, en). */
var LEGAL_SHORT = {
  'legal-index': ['المركز', 'Center'],
  'legal-terms': ['الشروط', 'Terms'],
  'legal-privacy': ['الخصوصية', 'Privacy'],
  'legal-community': ['المجتمع', 'Community'],
  'legal-safety': ['الأمان', 'Safety'],
  'legal-deletion': ['حذف البيانات', 'Deletion'],
  'legal-copyright': ['حقوق الملكية', 'Copyright'],
  'legal-support': ['الدعم', 'Support']
};

/* ------------------------------- helpers --------------------------------- */

function E(value) {
  var s = (value === undefined || value === null) ? '' : String(value);
  try { if (typeof esc === 'function') return String(esc(s)); } catch (e) {}
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function T(ar, en) {
  try {
    if (typeof t === 'function') {
      var v = t(ar, en);
      if (v !== undefined && v !== null && String(v) !== '') return String(v);
    }
  } catch (e) {}
  try {
    if (typeof lang !== 'undefined' && lang && String(lang).toLowerCase().indexOf('ar') === 0) return String(ar);
  } catch (e) {}
  return String(en);
}

function pg(titleAr, titleEn, introAr, introEn, secs) {
  return { t: [titleAr, titleEn], i: [introAr, introEn], s: secs };
}

function sec(headAr, headEn, paras, bullets, notes) {
  return { h: [headAr, headEn], p: paras || [], u: bullets || [], x: notes || [] };
}

/* ----------------------------- page content ------------------------------ */

var LEGAL_PAGES = {};

LEGAL_PAGES['legal-index'] = pg(
  'مركز القانون والأمان', 'Legal & Safety Center',
  'نظرة عامة على سياسات Vibe. كل صفحة أدناه يمكن قراءتها دون تسجيل الدخول، وتُنشر مع رقم نسخة وتاريخ تحديث واضحين.',
  'An overview of Vibe policies. Every page below can be read without signing in, and each is published with a clear version number and update date.',
  [
    sec('ما تجده هنا', 'What you will find here',
      [['هذه الصفحة نقطة البداية لكل ما يتعلق بالقواعد والخصوصية والأمان داخل Vibe.', 'This page is the starting point for everything about rules, privacy and safety inside Vibe.']],
      [['الشروط — قواعد استخدام الحساب والمحتوى.', 'Terms — rules for using your account and posting content.'],
       ['الخصوصية — ما نعالجه فعليًا وكيف نتعامل معه.', 'Privacy — what we actually process and how we handle it.'],
       ['معايير المجتمع — السلوك المتوقع في الغرف والدردشة.', 'Community standards — expected behavior in rooms and chat.'],
       ['الأمان — الإبلاغ والحظر ومساعدة نفسك.', 'Safety — reporting, blocking and self-help.'],
       ['حذف الحساب والبيانات — النطاق وكيفية الطلب.', 'Deleting your account and data — scope and how to request it.'],
       ['حقوق الملكية — المحتوى الخاص بك وشكاوى حقوق النشر.', 'Copyright & IP — your content and copyright complaints.'],
       ['الدعم — المساعدة في المشاكل التقنية والطلبات.', 'Support — help with technical issues and requests.']]),
    sec('ملاحظة مهمة', 'Important note',
      [['هذا المركز يصف سياسة المنتج الحالية. لا يُعد بديلًا عن القانون المحلي، ولا ندّعي الامتثال الشامل لكل قانون في كل بلد.',
        'This center describes the current product policy. It is not a substitute for local law, and we do not claim blanket compliance with every law in every country.']])
  ]
);

LEGAL_PAGES['legal-terms'] = pg(
  'شروط الاستخدام', 'Terms of Use',
  'تنطبق هذه الشروط على استخدامك لتطبيق Vibe وميزاته: الغرف، الدردشة، النشر، والصوت.',
  'These Terms apply to your use of the Vibe app and its features: rooms, chat, posting and voice.',
  [
    sec('حسابك ومسؤولياتك', 'Your account and responsibilities',
      [['استخدام Vibe بشكل كامل — الانضمام إلى الغرف، الدردشة، النشر والتفاعل — يتطلب حسابًا. أنت مسؤول عن الحفاظ على أمان بيانات الدخول وعن النشاط الذي يحدث من خلال حسابك.',
        'Using Vibe fully — joining rooms, chatting, posting and reacting — requires an account. You are responsible for keeping your credentials safe and for activity that happens through your account.']],
      [['حافظ على سرية بيانات الدخول ولا تشارك حسابك مع الآخرين.', 'Keep your credentials private and do not share your account with others.'],
       ['قدّم بريدًا إلكترونيًا تملكه، لأن الرسائل المعاملاتية مثل التحقق واستعادة كلمة المرور تُرسل إليه.', 'Provide an email address you own, because transactional messages such as verification and password reset are sent to it.'],
       ['أبلغنا عبر الدعم داخل التطبيق إذا لاحظت نشاطًا غير مصرح به.', 'Tell us through in-app support if you notice unauthorized activity.'],
       ['أنت مسؤول عن التزامك بالقوانين المعمول بها في مكان إقامتك.', 'You are responsible for complying with the laws that apply where you live.']],
      [['إعداد المنتج الحالي: استكشاف الغرف في نسخة العرض التجريبية متاح للبالغين 18 عامًا وأكثر فقط. هذا وصف لإعداد منتج حالي، وليس تصريحًا بأن 18 هو الحد القانوني الأدنى للاستخدام. تحديد الحد القانوني الأدنى يتطلب قرارًا من مالك المنتج وسياسة منفصلة.',
        'Current product setting: room discovery in the demo build is available to adults aged 18 and over only. This describes a current product setting; it is not a statement that 18 is the legal minimum age to use Vibe. Setting a legal minimum age requires a decision by the product owner and a separate policy.']]),

    sec('الاستخدام المقبول وملكية المحتوى', 'Acceptable use and ownership of content',
      [['Vibe يعتمد على محتوى ينشره المستخدمون: المطالبات (البرومبتس)، الصور، الملاحظات الصوتية، رسائل الغرف والتفاعلات الاجتماعية.',
        'Vibe relies on user-generated content: prompts, photos, voice notes, room messages and social interactions.']],
      [['المحتوى الذي تنشره يبقى ملكك. لا نطالب بملكية أعمالك.', 'Content you post stays yours. We do not claim ownership of your work.'],
       ['أنت تمنحنا ترخيصًا محدودًا وغير حصري لتخزين وعرض وتشغيل محتواك داخل Vibe فقط، وبالقدر اللازم لتقديم الخدمة وحماية المستخدمين.', 'You grant us a limited, non-exclusive license to store, display and operate your content inside Vibe only, as needed to provide the service and protect users.'],
       ['أنت مسؤول عن امتلاك الحقوق اللازمة لرفع النصوص والصور والصوت.', 'You are responsible for holding the rights needed to upload your text, photos and audio.'],
       ['لا نراجع كل محتوى مسبقًا، لكننا نراجع الإبلاغات والشكاوى.', 'We do not pre-review every piece of content, but we do review reports and complaints.']]),

    sec('السلوك المحظور', 'Prohibited conduct',
      [['لا يجوز استخدام Vibe لنشر محتوى غير قانوني أو للتفاعل بطريقة تضر بالآخرين أو بالخدمة.',
        'You may not use Vibe to post illegal content or to interact in ways that harm others or the service.']],
      [['انتهاك حقوق الملكية الفكرية أو العلامات التجارية.', 'Infringing copyright, trademarks or other intellectual property.'],
       ['مضايقة الآخرين أو تهديدهم أو الترويج للعنف أو الكراهية.', 'Harassing or threatening others, or promoting violence or hatred.'],
       ['الرسائل المزعجة، الاحتيال، الروابط الخبيثة، أو جمع بيانات المستخدمين آليًا.', 'Spam, fraud, malicious links, or automated scraping of user data.'],
       ['محاولة تجاوز حدود الأمان أو الوصول إلى بيانات لا تخصك.', 'Attempting to bypass security limits or access data that is not yours.'],
       ['نشر المعلومات الخاصة لشخص آخر دون إذنه.', 'Publishing another person private information without permission.']]),

    sec('الإشراف والإزالة', 'Moderation and removal',
      [['قد نزيل محتوى أو نوقف ميزة أو نقيّد حسابًا عند مخالفة هذه الشروط أو معايير المجتمع. الإزالة ليست تنازلًا عن أي حقوق.',
        'We may remove content, pause a feature or restrict an account when these Terms or the community standards are violated. Removal does not waive any rights.'],
       ['لا نضمن مراجعة كل بلاغ بواسطة إنسان ولا خلال مدة زمنية محددة.', 'We do not promise that every report will be reviewed by a human, or within a fixed timeframe.']]),

    sec('توفر الخدمة والأطراف الثالثة', 'Service availability and third parties',
      [['نعتمد على مزودين خارجيين لتشغيل Vibe: Supabase (المصادقة وقاعدة البيانات والتخزين والوقت الحقيقي)، Resend (الرسائل المعاملاتية)، وSpotify (فقط إذا ربطت حسابك طوعًا).',
        'We rely on third-party providers to run Vibe: Supabase (authentication, database, storage, realtime), Resend (transactional email) and Spotify (only if you connect your account).']],
      [['قد تتوقف الخدمة أو تتغير الميزات لأسباب تقنية أو تشغيلية أو أمنية.', 'The service may be interrupted or features may change for technical, operational or security reasons.'],
       ['استخدامك لخدمات الطرف الثالث قد يخضع لشروطها وسياساتها الخاصة.', 'Your use of third-party services may be governed by their own terms and policies.']]),

    sec('الإنهاء والتغييرات', 'Termination and changes',
      [['يمكنك التوقف عن استخدام Vibe في أي وقت وطلب حذف حسابك من داخل التطبيق عند توفر الأداة.',
        'You can stop using Vibe at any time and request deletion of your account from inside the app when the control is available.'],
       ['قد نعلّق أو ننهي الوصول عند المخالفة الجسيمة أو المتكررة، أو عند وجود خطر على المستخدمين أو الخدمة.',
        'We may suspend or terminate access for serious or repeated violations, or where there is risk to users or the service.'],
       ['عند تحديث هذه الشروط نغيّر رقم النسخة وتاريخ آخر تحديث في أعلى الصفحة.',
        'When we update these Terms we change the version number and last updated date at the top of this page.']])
  ]
);

LEGAL_PAGES['legal-privacy'] = pg(
  'سياسة الخصوصية', 'Privacy Policy',
  'تصف هذه الصفحة فئات البيانات التي تعالجها النسخة الحالية من التطبيق وكيف يستخدمها التشغيل الفعلي.',
  'This page describes the categories of data the current build of the app processes and how the actual implementation uses them.',
  [
    sec('ما نعالجه فعليًا', 'What we actually process',
      [['القائمة التالية تعكس الفئات التي تعالجها النسخة الحالية من التطبيق، وليس قائمة نوايا مستقبلية.',
        'The list below reflects the categories the current build of the app processes, not a list of future intentions.']],
      [['بيانات الحساب والبريد الإلكتروني عبر Supabase Auth — لتسجيل الدخول والتحقق واستعادة كلمة المرور.',
        'Account identifiers and email through Supabase Auth — used for sign-in, verification and password reset.'],
       ['بيانات الملف الشخصي: الاسم الظاهر، الصورة، النبذة، والمطالبات (البرومبتس) والاهتمامات التي تضيفها.',
        'Profile data: display name, photo, bio, and the prompts and interests you add.'],
       ['رسائل الدردشة داخل الغرف والتفاعلات الاجتماعية: الردود، الإعجابات، الحظر والإبلاغ، والإشعارات داخل التطبيق.',
        'Chat and room messages and social interactions: replies, likes, blocks, reports and in-app notifications.'],
       ['مسارات كائنات الوسائط والملفات التي ترفعها، مثل الصور والملاحظات الصوتية المخزنة في Supabase Storage.',
        'Media object paths and the files you upload, such as photos and voice notes stored in Supabase Storage.'],
       ['بيانات الاتصال الحقيقي (Realtime) اللازمة لتحديث الغرف والدردشة أثناء الاستخدام.',
        'Realtime connection data needed to keep rooms and chat updated while you use the app.'],
       ['بيانات Spotify، فقط عندما تربط حسابك طوعًا لميزات الذوق الموسيقي.',
        'Spotify data, only when you voluntarily connect your account for music taste features.']]),

    sec('من يعالج البيانات', 'Who processes the data',
      [['نشارك البيانات فقط مع مزودي الخدمة اللازمين للتشغيل، وبالحد الأدنى المطلوب:',
        'We share data only with the service providers needed to operate Vibe, and only to the minimum extent required:']],
      [['Supabase: المصادقة وقاعدة البيانات وتخزين الوسائط والاتصال الحقيقي.', 'Supabase: authentication, database, media storage and realtime.'],
       ['Resend: إرسال الرسائل المعاملاتية فقط (مثل التحقق واستعادة كلمة المرور).', 'Resend: transactional email only, such as verification and password reset.'],
       ['Spotify: عند ربط حسابك فقط ولميزات الذوق الموسيقي.', 'Spotify: only when you connect your account, and only for music taste features.']],
      [['لا تتضمن عملية التطبيق الحالية بيع بياناتك أو مشاركتها لأغراض إعلانية.',
        'The current app implementation does not include selling your data or sharing it for advertising purposes.']]),

    sec('الإعلانات والتتبع', 'Advertising and tracking',
      [['لا نجد في التنفيذ الحالي ما يثبت وجود إعلانات، أو أدوات تتبع إعلاني عبر الشركات، أو بيع بيانات لأطراف ثالثة. هذه ملاحظة عن الوضع الحالي، وليست وعدًا دائمًا؛ أي تغيير جوهري يجب أن يُنعكس في تحديث هذه السياسة.',
        'The current implementation does not evidence advertising, cross-company ad tracking, or the sale of your data to third parties. This is a statement about the current build, not a permanent promise; any material change must be reflected in an update to this policy.']]),

    sec('الاحتفاظ والتحكم والحذف', 'Retention, controls and deletion',
      [['تحتفظ البيانات ما دام حسابك قائمًا وبالقدر اللازم لتشغيل الخدمة والأمان.',
        'Data is retained while your account exists and as needed to run the service and keep it secure.']],
      [['يمكنك تعديل أو حذف المحتوى الذي تنشره من داخل التطبيق، وإيقاف الإشعارات، وحظر المستخدمين، وإرسال الإبلاغات.',
        'You can edit or delete content you post from inside the app, turn notifications off, block users and send reports.'],
       ['يمكنك طلب حذف الحساب والبيانات من داخل التطبيق عند توفر أداة الحذف في نسختك. راجع صفحة حذف الحساب والبيانات لمعرفة النطاق المتوقع.',
        'You can request deletion of your account and data from inside the app when the delete control is available in your build. See the account and data deletion page for the expected scope.'],
       ['قد نحتفظ بمعلومات محدودة عند وجود حاجة موثقة لمكافحة الإساءة أو الاحتيال أو لالتزام قانوني أو أمني.',
        'We may retain limited information where there is a documented need to address abuse or fraud, or for a legal or security obligation.']]),

    sec('حقوقك وحدود الوعود', 'Your rights and the limits of our promises',
      [['بعض حقوق الخصوصية قد تنطبق عليك بحسب مكان إقامتك والقانون المعمول به. لا ندّعي الامتثال الشامل لكل قوانين الخصوصية في كل بلد، بما في ذلك عدم تقديم ادعاء عام بالامتثال لـ GDPR أو CCPA.',
        'Some privacy rights may apply to you depending on where you live and the law that applies. We do not claim blanket compliance with every privacy law in every country, and we make no general claim of GDPR or CCPA compliance.'],
       ['لممارسة أي طلب يتعلق بالخصوصية، استخدم الدعم داخل التطبيق أو راسل support@vibe-groups.com. أي عنوان قانوني رسمي إضافي يجب أن يُنشر بوضوح عند اعتماده.',
        'To make a privacy request, use in-app support or email support@vibe-groups.com. Any additional official legal contact must be published clearly once approved.']])
  ]
);

LEGAL_PAGES['legal-community'] = pg(
  'معايير المجتمع', 'Community Standards',
  'قواعد السلوك في غرف Vibe والدردشة والتفاعلات. تنطبق على الجميع بالتساوي.',
  'The rules of behavior in Vibe rooms, chat and interactions. They apply to everyone equally.',
  [
    sec('السلوك الذي لا نسمح به', 'Behavior we do not allow',
      [['تنطبق هذه المعايير على الغرف والدردشة والرسائل والصور والملاحظات الصوتية والأسماء والصور الشخصية وكل محتوى آخر داخل Vibe.',
        'These standards apply to rooms, chat, messages, photos, voice notes, display names, profile pictures and all other content inside Vibe.']],
      [['التحرش أو التنمر أو الملاحقة أو الإهانة المتكررة.', 'Harassment, bullying, stalking or repeated insults.'],
       ['التهديدات بالعنف أو التحريض عليه ضد أي شخص أو مجموعة.', 'Threats of violence, or encouraging violence against any person or group.'],
       ['خطاب الكراهية أو التمييز بسبب الدين أو العرق أو الجنس أو الأصل أو الإعاقة أو الهوية.', 'Hate speech or discrimination based on religion, race, gender, origin, disability or identity.'],
       ['الاستغلال الجنسي أو المحتوى الجنسي غير القانوني أو الترويج له.', 'Sexual exploitation, illegal sexual content, or promoting it.'],
       ['أي محتوى يهدد سلامة القُصّر أو أي محاولة تواصل غير لائقة معهم.', 'Any content that endangers minors, or any inappropriate contact with them.'],
       ['الرسائل المزعجة، الاحتيال، الروابط الخبيثة، والترويج التجاري غير المصرح به.', 'Spam, scams, malicious links and unauthorized commercial promotion.'],
       ['انتحال شخصية مستخدم آخر أو فريق Vibe أو أي جهة رسمية.', 'Impersonating another user, the Vibe team, or an official body.'],
       ['نشر معلومات خاصة عن الآخرين مثل العنوان أو الهاتف أو الموقع الدقيق.', 'Publishing other people private information such as address, phone number or precise location.'],
       ['المحتوى غير القانوني، أو المواد التي تنتهك حقوق النشر أو العلامات التجارية.', 'Illegal content, or material that infringes copyright or trademarks.']]),

    sec('الإبلاغ والحظر: ما نتوقعه منك', 'Reporting and blocking: what we expect',
      [['إذا صادفت محتوى أو سلوكًا مخالفًا، استخدم أدوات الإبلاغ أو الحظر داخل التطبيق بدل الرد بالمثل.',
        'If you encounter content or behavior that breaks these standards, use the in-app report or block controls instead of responding in kind.']],
      [['الإبلاغ الكاذب المتعمد بقصد الإضرار بالآخرين قد يؤدي إلى تقييد حسابك.', 'Knowingly false reports intended to harm others may lead to restrictions on your account.'],
       ['الحظر يوقف التفاعل بينك وبين المستخدم الآخر داخل Vibe، وهو أداة تحكم شخصية وليس عقوبة عامة.', 'Blocking stops interaction between you and the other user inside Vibe; it is a personal control, not a global punishment.'],
       ['لا تنشر تفاصيل نزاع خاص علنًا في الغرف؛ استخدم الإبلاغ والدعم بدلًا من ذلك.', 'Do not post details of a private dispute publicly in rooms; use reporting and support instead.']]),

    sec('كيف نتعامل مع المخالفات', 'How we handle violations',
      [['قد نزيل المحتوى، أو نحد من الوصول إلى الميزات، أو نعلّق الحساب، بحسب شدة المخالفة وتكرارها. لا نعد بمراجعة بشرية لكل بلاغ ولا بإطار زمني محدد.',
        'We may remove content, limit access to features, or suspend an account, depending on severity and repetition. We do not promise human review for every report, nor a fixed timeline.'],
       ['المخالفات الجسيمة مثل التهديدات أو محتوى الاعتداء على الأطفال أو الاحتيال قد تؤدي إلى إنهاء الحساب.',
        'Severe violations such as threats, child sexual abuse material, or fraud may lead to account termination.']])
  ]
);

LEGAL_PAGES['legal-safety'] = pg(
  'مركز الأمان', 'Safety Center',
  'كيف تتصرف إذا تعرضت لمضايقة أو محتوى ضار، وكيف تحمي نفسك داخل Vibe.',
  'What to do if you face harassment or harmful content, and how to protect yourself inside Vibe.',
  [
    sec('كيف تُبلّغ', 'How to report',
      [['الإبلاغ خطوة مباشرة داخل التطبيق ولا يحتاج مراسلة خارجية.', 'Reporting is a direct step inside the app and does not require any external contact.']],
      [['افتح المحتوى أو الملف الشخصي أو الرسالة ثم اختر الإبلاغ وحدد السبب الأقرب للحالة.', 'Open the content, profile or message, then choose report and select the closest reason.'],
       ['استخدم الحظر لإيقاف التفاعل فورًا مع مستخدم معين.', 'Use block to immediately stop interaction with a specific user.'],
       ['أضف تفاصيل مفيدة: متى حدث الأمر، وفي أي غرفة، وما هي الرسالة أو الصورة.', 'Add useful details: when it happened, in which room, and which message or photo.'],
       ['يمكنك أيضًا التحدث مع الدعم داخل التطبيق إذا احتجت متابعة.', 'You can also talk to in-app support if you need follow-up.']]),

    sec('ما لا نعد به', 'What we do not promise',
      [['لا نضمن وجود مراجع بشري متاح على مدار الساعة، ولا وقت استجابة محددًا. نحن نراجع البلاغات، لكن الحجم والتوقيت قد يتغيران.',
        'We do not promise round-the-clock human moderators, and we do not promise a specific response time. We do review reports, but volume and timing can vary.']]),

    sec('الحالات الطارئة', 'Emergency situations',
      [['إذا كان أي شخص في خطر مباشر، تواصل مع خدمات الطوارئ المحلية في بلدك على الفور بدل انتظار رد داخل التطبيق. Vibe ليست قناة طوارئ ولا بديلًا عن المساعدة المهنية.',
        'If anyone is in immediate danger, contact local emergency services right away instead of waiting for a reply inside the app. Vibe is not an emergency channel and is not a substitute for professional help.']]),

    sec('سلامتك الشخصية', 'Your personal safety',
      [['احمِ بياناتك: لا تشارك العنوان الدقيق أو الموقع الحالي أو معلومات مالية أو رمز التحقق مع أي شخص.',
        'Protect your data: do not share your exact address, live location, financial details or verification codes with anyone.']],
      [['كن حذرًا من الطلبات المالية أو الهدايا أو الروابط الخارجية.', 'Be cautious about requests for money, gifts or external links.'],
       ['عند اللقاء الواقعي اختر مكانًا عامًا وأخبر شخصًا تثق به.', 'If you meet in person, choose a public place and tell someone you trust.'],
       ['يمكنك دائمًا الحظر أو تسجيل الخروج من أي غرفة تشعر فيها بعدم الارتياح.', 'You can always block or leave any room where you feel uncomfortable.']]),

    sec('الاعتراض على قرار', 'Appeals',
      [['إذا كنت تعتقد أن قرارًا صدر بحق حسابك أو محتواك كان خاطئًا، أرسل اعتراضًا عبر الدعم داخل التطبيق مع وصف موجز للسياق.',
        'If you believe a decision about your account or content was wrong, send an appeal through in-app support with a short description of the context.']])
  ]
);

LEGAL_PAGES['legal-deletion'] = pg(
  'حذف الحساب والبيانات', 'Account & Data Deletion',
  'تصف هذه الصفحة سياسة الحذف ونطاقه المتوقع. أداة الحذف الفعلية ميزة منفصلة تُنفَّذ داخل التطبيق.',
  'This page describes the deletion policy and its expected scope. The functional delete control is a separate feature implemented inside the app.',
  [
    sec('ما تصفه هذه الصفحة', 'What this page describes',
      [['هذه الصفحة سياسة فقط. أداة حذف الحساب الوظيفية مُنفَّذة في مكان منفصل داخل التطبيق، ويجب أن تكون متاحة قبل إرسال التطبيق إلى App Store. هذه الصفحة لا تعمل كأداة حذف.',
        'This page is a policy statement only. The functional account deletion control is implemented separately inside the app and must be available before the app is submitted to the App Store. This page does not itself perform deletion.']]),

    sec('نطاق الحذف المتوقع', 'Expected scope of deletion',
      [['ينطبق نطاق الحذف المتوقع على الحساب والبيانات المرتبطة به:', 'The expected scope covers the account and the data tied to it:']],
      [['الحساب وبيانات الدخول المرتبطة به.', 'The account and its associated sign-in data.'],
       ['بيانات الملف الشخصي: الاسم الظاهر، الصورة، النبذة والاهتمامات.', 'Profile data: display name, photo, bio and interests.'],
       ['الصور والمطالبات (البرومبتس) التي رفعتها.', 'Photos and prompts you uploaded.'],
       ['ملفات الوسائط المخزنة مثل الصور والملاحظات الصوتية.', 'Stored media objects such as photos and voice notes.'],
       ['الرسائل والمحتوى الذي ينشره المستخدم، بالقدر الذي يسمح به التخزين التقني والقانون المعمول به.', 'Messages and user-generated content, to the extent storage and applicable law allow.']]),

    sec('ما قد يبقى بعد الحذف', 'What may remain after deletion',
      [['إذا وُجدت حاجة موثقة لمكافحة الإساءة أو الاحتيال، أو التزام قانوني، أو حماية أمنية، فقد نحتفظ بمعلومات محدودة لفترة مناسبة. وقد نحتفظ بسجلات مجهولة الهوية لا تُعرّفك شخصيًا.',
        'Where there is a documented need to address abuse or fraud, a legal obligation, or a security need, we may retain limited information for an appropriate period. We may also keep anonymized records that do not identify you.']]),

    sec('كيف تطلب الحذف', 'How to request deletion',
      [['استخدم أداة حذف الحساب داخل التطبيق عندما تكون متاحة في نسختك.', 'Use the in-app account deletion control when it is available in your build.'],
       ['إذا لم تكن الأداة متاحة في نسختك الحالية، فاتصل بالدعم داخل التطبيق وسنُسجّل الطلب.', 'If the control is not available in your current build, contact in-app support and we will log the request.'],
       ['قد نطلب تأكيدًا بسيطًا للتحقق من ملكية الحساب قبل تنفيذ الحذف.', 'We may ask for a simple confirmation to verify account ownership before acting.']])
  ]
);

LEGAL_PAGES['legal-copyright'] = pg(
  'حقوق النشر والملكية الفكرية', 'Copyright & Intellectual Property',
  'ما تملكه، وكيف ترسل شكوى، وما القناة الحالية لاستقبال الشكاوى.',
  'What you own, how to send a complaint, and the current channel for receiving complaints.',
  [
    sec('حقوقك', 'Your rights',
      [['تحتفظ بحقوق المحتوى الذي تنشره في Vibe. في المقابل، لا يجوز رفع محتوى لا تملك حق استخدامه، بما في ذلك الصور والمقاطع الصوتية والنصوص والعلامات التجارية.',
        'You keep the rights to the content you post in Vibe. In return, do not upload material you do not have the right to use, including photos, audio, text and trademarks.']]),

    sec('ما يجب أن تحتويه الشكوى', 'What a complaint should include',
      [['لتمكيننا من مراجعة شكوى حقوق النشر بجدية، أرفق العناصر التالية:', 'To let us review a copyright complaint properly, include the following:']],
      [['وصف العمل المحمي الذي تدّعي أنه استُخدم دون إذن.', 'A description of the protected work you claim was used without permission.'],
       ['مكان المادة المخالفة داخل Vibe: الغرفة أو الحساب أو الرابط أو لقطة شاشة توضح الموقع.', 'Where the material appears inside Vibe: the room, account, link or a screenshot showing the location.'],
       ['بيانات التواصل معك حتى نتمكن من الرد.', 'Your contact details so we can respond.'],
       ['بيان بحسن النية بأن الاستخدام غير مصرح به من مالك الحق أو وكيله أو القانون.', 'A good-faith statement that the use is not authorized by the rights owner, its agent, or the law.'],
       ['بيان بأن المعلومات الواردة دقيقة وأنك مخوّل بالتصرف نيابة عن مالك الحق.', 'A statement that the information is accurate and that you are authorized to act for the rights owner.']]),

    sec('أين ترسل الشكوى', 'Where to send a complaint',
      [['القنوات الحالية لاستقبال شكاوى حقوق النشر هي الدعم داخل التطبيق و support@vibe-groups.com. لا ندّعي وجود وكيل DMCA أو كيان قانوني محدد ما لم يتم اعتماده ونشره رسميًا.',
        'The current channels for copyright complaints are in-app support and support@vibe-groups.com. No DMCA agent or specific legal entity is claimed unless formally designated and published.']]),

    sec('ما قد يحدث بعد ذلك', 'What may happen next',
      [['قد نزيل المحتوى المبلغ عنه أو نقيّد الوصول إليه أثناء المراجعة.', 'We may remove or restrict the reported content while we review it.'],
       ['قد نُبلغ المستخدم الذي نشر المحتوى لتمكينه من الرد.', 'We may notify the user who posted the content so they can respond.'],
       ['الحسابات المتكررة في انتهاك حقوق الملكية قد تُقيَّد أو تُنهى.', 'Accounts that repeatedly infringe intellectual property may be restricted or terminated.']])
  ]
);

LEGAL_PAGES['legal-support'] = pg(
  'الدعم والمساعدة', 'Support & Help',
  'خطوات آمنة لاستكشاف الأخطاء، ومتى تتصل بنا، وما تتوقعه من أوقات الاستجابة.',
  'Safe troubleshooting steps, when to contact us, and what to expect about response times.',
  [
    sec('استكشاف الأخطاء الآمن', 'Safe troubleshooting',
      [['جرّب هذه الخطوات قبل إرسال طلب دعم:', 'Try these steps before sending a support request:']],
      [['تأكد من اتصالك بالإنترنت ثم أعد تحميل الصفحة أو أعد تشغيل التطبيق.', 'Check your internet connection, then reload the page or restart the app.'],
       ['تأكد من منح أذونات الصور أو الميكروفون عند رفع الصور وتسجيل الملاحظات الصوتية.', 'Make sure photo or microphone permissions are granted when uploading photos or recording voice notes.'],
       ['راجع إعدادات الإشعارات داخل التطبيق وفي نظام التشغيل.', 'Check notification settings both inside the app and in your operating system.'],
       ['جرّب تسجيل الخروج ثم الدخول من جديد إذا استمرت المشكلة.', 'Try signing out and back in if the problem continues.'],
       ['لا ترسل كلمة المرور أو رمز التحقق إلى أي شخص؛ نحن لا نطلبها منك أبدًا.', 'Never send your password or verification code to anyone; we never ask you for them.']]),

    sec('متى تتصل بنا', 'When to contact us',
      [['يمكنك التواصل مع الدعم داخل التطبيق في الحالات التالية:', 'You can contact in-app support for the following:']],
      [['الإبلاغ عن سلوك مخالف أو مشكلة أمان.', 'Reporting abusive behavior or a safety problem.'],
       ['طلبات الخصوصية أو حذف الحساب والبيانات.', 'Privacy requests or account and data deletion requests.'],
       ['الاعتراض على قرار إشراف أو تقييد.', 'Appeals against a moderation or restriction decision.'],
       ['شكاوى حقوق النشر أو الملكية الفكرية.', 'Copyright or intellectual property complaints.'],
       ['مشاكل تقنية لا يستطيع استكشاف الأخطاء حلها.', 'Technical problems that troubleshooting does not resolve.']]),

    sec('القناة الحالية', 'Current channel',
      [['تستخدم Vibe حاليًا الدعم داخل التطبيق والبريد support@vibe-groups.com للطلبات المذكورة أعلاه. أي رابط دعم عام إضافي يجب نشره هنا عند اعتماده.',
        'Vibe currently uses in-app support and support@vibe-groups.com for the requests listed above. Any additional public support URL must be published here once approved.']]),

    sec('التوقعات', 'Expectations',
      [['نبذل جهدًا معقولًا للرد، لكننا لا نضمن وقت استجابة محددًا ولا دعمًا بشريًا على مدار الساعة. في حالات الخطر الفوري يجب التوجه إلى خدمات الطوارئ المحلية.',
        'We make a reasonable effort to respond, but we do not guarantee a specific response time or round-the-clock human support. For immediate danger, contact local emergency services.']])
  ]
);

/* ------------------------------- rendering ------------------------------- */

function renderLegalSection(s) {
  var out = '<section class="legal-section"><h2>' + E(T(s.h[0], s.h[1])) + '</h2>';
  (s.p || []).forEach(function (pair) { out += '<p>' + E(T(pair[0], pair[1])) + '</p>'; });
  if (s.u && s.u.length) {
    out += '<ul>';
    s.u.forEach(function (pair) { out += '<li>' + E(T(pair[0], pair[1])) + '</li>'; });
    out += '</ul>';
  }
  (s.x || []).forEach(function (pair) { out += '<p class="legal-note">' + E(T(pair[0], pair[1])) + '</p>'; });
  return out + '</section>';
}

function legalRoot() {
  try {
    if (typeof app !== 'undefined' && app && typeof app === 'object' &&
        'innerHTML' in app && typeof app.appendChild === 'function') return app;
  } catch (e) {}
  try {
    if (typeof document === 'undefined') return null;
    return document.querySelector('#app') || document.querySelector('#root') ||
           document.querySelector('main') || document.body;
  } catch (e) { return null; }
}

function legalMount(html) {
  var root = legalRoot();
  if (root) { try { root.innerHTML = html; } catch (e) {} }
  return root;
}

function legalBackTarget() {
  try { if (cloud && cloud.user) return 'settings'; } catch (e) {}
  try { if (typeof isAuthedFn === 'function') {} } catch (e) {}
  return 'auth';
}

function legalRender(kind) {
  legalInstall();
  var current = '';
  try { current = String(view || ''); } catch (e) {}
  var key = String(kind || current || 'legal-index');
  if (key.indexOf('legal-') !== 0) key = 'legal-' + key;
  if (!LEGAL_PAGES[key]) key = 'legal-index';
  var page = LEGAL_PAGES[key];
  var back = legalBackTarget();

  var chips = LEGAL_ORDER.map(function (k) {
    var short = LEGAL_SHORT[k] || [k, k];
    var active = (k === key);
    return '<button type="button" class="legal-chip' + (active ? ' is-active' : '') +
           '" data-legal="' + E(k) + '"' + (active ? ' aria-current="page"' : '') + '>' +
           E(T(short[0], short[1])) + '</button>';
  }).join('');

  var body = page.s.map(renderLegalSection).join('');
  var meta = T('النسخة', 'Version') + ' ' + LEGAL_POLICY_VERSION + ' · ' +
             T('آخر تحديث', 'Last updated') + ' ' + LEGAL_LAST_UPDATED;

  var html =
    '<div class="legal-page" data-legal-page="' + E(key) + '">' +
      '<nav class="legal-nav" aria-label="' + E(T('تنقل صفحات القانون والأمان', 'Legal and safety pages navigation')) + '">' +
        '<button type="button" class="legal-back" data-legal-nav="' + E(back) + '">' +
          E('&#8592; ' + T('رجوع', 'Back')) + '</button>' +
        '<div class="legal-chips">' + chips + '</div>' +
      '</nav>' +
      '<main class="legal-main" id="legal-main">' +
        '<header class="legal-head">' +
          '<h1>' + E(T(page.t[0], page.t[1])) + '</h1>' +
          '<p class="legal-meta" role="status">' + E(meta) + '</p>' +
          (page.i ? '<p class="legal-intro">' + E(T(page.i[0], page.i[1])) + '</p>' : '') +
        '</header>' +
        body +
      '</main>' +
      '<footer class="legal-footer" role="note">' +
        '<p>' + E(T('تصف هذه الصفحة سياسة المنتج الحالية، وهي ليست نصيحة قانونية محلية.',
                    'This page describes the current product policy and is not local legal advice.')) + '</p>' +
        '<p class="legal-meta">' + E('Vibe · ' + T('النسخة', 'Version') + ' ' + LEGAL_POLICY_VERSION + ' · ' + LEGAL_LAST_UPDATED) + '</p>' +
      '</footer>' +
    '</div>';

  legalMount(html);
  return html;
}

/* ------------------------------ navigation ------------------------------- */

function legalNavigate(target, isPage) {
  if (!target) return;
  var key = String(target);
  if (isPage && key.indexOf('legal-') !== 0) key = 'legal-' + key;
  var sent = false;
  try { if (typeof go === 'function') { go(key); sent = true; } } catch (e) {}
  if (!sent) { try { view = key; } catch (e) {} }
  if (key.indexOf('legal-') !== 0) return;
  var root = legalRoot();
  var shown = null;
  try { shown = root && root.querySelector ? root.querySelector('[data-legal-page]') : null; } catch (e) {}
  var shownKey = shown ? shown.getAttribute('data-legal-page') : null;
  if (shownKey !== key) legalRender(key);
}

var legalDelegated = false;
function legalInstall() {
  if (legalDelegated) return;
  if (typeof document === 'undefined' || !document.addEventListener) return;
  legalDelegated = true;
  document.addEventListener('click', function (ev) {
    var el = ev.target;
    if (!el) return;
    if (typeof el.closest !== 'function') return;
    var hit = el.closest('[data-legal-nav], [data-legal]');
    if (!hit || hit.__legalBound) return;
    var nav = hit.getAttribute('data-legal-nav');
    var page = hit.getAttribute('data-legal');
    if (!nav && !page) return;
    ev.preventDefault();
    legalNavigate(nav || page, !nav && !!page);
  }, false);
}

/* ------------------------------- enhancers ------------------------------- */

function legalBtn(label, target, isNav) {
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'legal-chip';
  b.textContent = label;
  if (isNav) b.setAttribute('data-legal-nav', target);
  else b.setAttribute('data-legal', target);
  b.__legalBound = true;
  b.addEventListener('click', function (ev) {
    ev.preventDefault();
    legalNavigate(target, !isNav);
  });
  return b;
}

function legalSettingsSection(root) {
  var host = null;
  try { host = root.querySelector('.settings-page'); } catch (e) {}
  if (!host || !host.appendChild) return;
  try { if (host.querySelector('[data-legal-section]')) return; } catch (e) {}

  var section = document.createElement('section');
  section.className = 'legal-settings-section';
  section.setAttribute('data-legal-section', '1');

  var h = document.createElement('h2');
  h.textContent = T('القانون والأمان', 'Legal & Safety');
  var lead = document.createElement('p');
  lead.textContent = T(
    'اقرأ الشروط وسياسة الخصوصية ومعايير المجتمع، وأدر طلبات حذف الحساب والبيانات.',
    'Read the Terms, privacy policy and community standards, and manage account and data deletion requests.'
  );

  var nav = document.createElement('nav');
  nav.setAttribute('aria-label', T('روابط القانون والأمان', 'Legal and safety links'));
  nav.appendChild(legalBtn(T('مركز القانون والأمان', 'Legal & Safety Center'), 'legal-index', false));
  nav.appendChild(legalBtn(T('شروط الاستخدام', 'Terms of Use'), 'legal-terms', false));
  nav.appendChild(legalBtn(T('سياسة الخصوصية', 'Privacy Policy'), 'legal-privacy', false));
  nav.appendChild(legalBtn(T('معايير المجتمع', 'Community Standards'), 'legal-community', false));
  nav.appendChild(legalBtn(T('حذف الحساب والبيانات', 'Delete Account & Data'), 'legal-deletion', false));

  section.appendChild(h);
  section.appendChild(lead);
  section.appendChild(nav);
  host.appendChild(section);
}

function legalAuthFooter(root) {
  var v = '';
  try { v = String(view || ''); } catch (e) {}
  var host = null;
  try {
    host = root.querySelector ? root.querySelector('.auth-page, .auth-screen, .auth-card, #auth, .cloud-ui, .cloud-root') : null;
  } catch (e) {}
  var looksAuth = /^(auth|login|signin|sign-in|signup|sign-up|welcome|cloud|)$/.test(v);
  var hasPassword = false;
  try { hasPassword = !!(root.querySelector && root.querySelector('input[type="password"]')); } catch (e) {}
  if (!host && !(looksAuth || hasPassword)) return;

  var target = host || root;
  if (!target || !target.appendChild) return;
  try { if (target.querySelector && target.querySelector('[data-legal-footer]')) return; } catch (e) {}

  var footer = document.createElement('footer');
  footer.className = 'legal-auth-footer';
  footer.setAttribute('data-legal-footer', '1');

  var nav = document.createElement('nav');
  nav.setAttribute('aria-label', T('روابط القانون', 'Legal links'));
  nav.appendChild(legalBtn(T('الشروط', 'Terms'), 'legal-terms', false));
  nav.appendChild(legalBtn(T('الخصوصية', 'Privacy'), 'legal-privacy', false));
  nav.appendChild(legalBtn(T('المجتمع', 'Community'), 'legal-community', false));
  nav.appendChild(legalBtn(T('الدعم', 'Support'), 'legal-support', false));

  var note = document.createElement('p');
  note.className = 'legal-meta';
  note.textContent = T(
    'يمكن قراءة هذه الصفحات قبل إنشاء حساب.',
    'These pages can be read before creating an account.'
  );

  footer.appendChild(nav);
  footer.appendChild(note);
  target.appendChild(footer);
}

function legalEnhance() {
  try {
    if (typeof document === 'undefined') return;
    var root = legalRoot();
    if (!root || !root.querySelector) return;
    var v = '';
    try { v = String(view || ''); } catch (e) {}
    var user = null;
    try { user = cloud && cloud.user ? cloud.user : null; } catch (e) {}
    if (v === 'settings' && !root.querySelector('[data-legal-section]')) legalSettingsSection(root);
    if (!user) legalAuthFooter(root);
  } catch (e) {}
}

/* --------------------------- render interception -------------------------- */

var legalBaseRender = (typeof render === 'function') ? render : null;

(function legalWrapRender() {
  if (typeof render !== 'function') return;
  if (render.__vibeLegalWrapped) return;
  var base = render;
  var wrapped = function () {
    var v = '';
    try { v = String(view || ''); } catch (e) {}
    var legacyLegal = { terms: 'legal-terms', privacy: 'legal-privacy', community: 'legal-community' };
    if (legacyLegal[v]) {
      try { view = legacyLegal[v]; } catch (e) {}
      return legalRender(legacyLegal[v]);
    }
    if (v.indexOf('legal-') === 0) {
      try { return legalRender(v); } catch (e) {}
      return undefined;
    }
    var out = base.apply(this, arguments);
    try { legalEnhance(); } catch (e) {}
    return out;
  };
  wrapped.__vibeLegalWrapped = true;
  try { render = wrapped; } catch (e) { /* render is immutable in this build */ }
})();

legalInstall();

try {
  if (typeof window !== 'undefined') {
    window.__vibeLegal = {
      version: LEGAL_POLICY_VERSION,
      updated: LEGAL_LAST_UPDATED,
      render: legalRender,
      enhance: legalEnhance,
      navigate: legalNavigate,
      pages: LEGAL_ORDER.slice()
    };
  }
} catch (e) {}
