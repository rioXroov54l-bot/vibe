/* Master spec extensions for Vibe.

   scripts/build.mjs appends this file inside the existing app closure, directly
   after public/cloud-ui.js and right before the closing render() call, so every
   existing renderer keeps working and only additive hooks are registered here.

   New class names added on top of the existing ones:
   match-notice, top-artists-card, master-basics-card, master-composer. */
(() => {
  const MASTER_OPTIONS = {
    zodiac: [
      ['aries', 'الحمل', 'Aries'], ['taurus', 'الثور', 'Taurus'], ['gemini', 'الجوزاء', 'Gemini'],
      ['cancer', 'السرطان', 'Cancer'], ['leo', 'الأسد', 'Leo'], ['virgo', 'العذراء', 'Virgo'],
      ['libra', 'الميزان', 'Libra'], ['scorpio', 'العقرب', 'Scorpio'], ['sagittarius', 'القوس', 'Sagittarius'],
      ['capricorn', 'الجدي', 'Capricorn'], ['aquarius', 'الدلو', 'Aquarius'], ['pisces', 'الحوت', 'Pisces']
    ],
    communication_style: [
      ['light_chat', 'سوالف خفيفة', 'Light chat'], ['deep_talks', 'نقاشات عميقة', 'Deep talks'],
      ['voice_notes', 'رسائل صوتية', 'Voice notes'], ['listener', 'أحب أن أسمع أكثر', 'I mostly listen'],
      ['text_first', 'نصّي أكثر', 'Texting first']
    ],
    relationship_goal: [
      ['friends', 'أصدقاء ومجتمعات', 'Friends & community'], ['long_term', 'علاقة طويلة', 'Long-term partnership'],
      ['short_term', 'تعارف مفتوح', 'Open to meeting'], ['figuring_out', 'لسّه أكتشف', 'Still figuring it out']
    ],
    smoking: [['no', 'لا', 'No'], ['sometimes', 'أحيانًا', 'Sometimes'], ['yes', 'نعم', 'Yes']],
    drinking: [['no', 'لا', 'No'], ['sometimes', 'أحيانًا', 'Sometimes'], ['yes', 'نعم', 'Yes']],
    exercise: [
      ['never', 'نادرًا', 'Rarely'], ['sometimes', 'أحيانًا', 'Sometimes'],
      ['often', 'غالبًا', 'Often'], ['daily', 'يوميًا', 'Daily']
    ],
    sleep: [['early_bird', 'صباحي', 'Early bird'], ['night_owl', 'ليلي', 'Night owl'], ['irregular', 'غير منتظم', 'Irregular']],
    pets: [
      ['none', 'لا يوجد', 'None'], ['cats', 'قطط', 'Cats'], ['dogs', 'كلاب', 'Dogs'],
      ['birds', 'طيور', 'Birds'], ['other', 'أخرى', 'Other']
    ]
  };
  const MASTER_BASICS_KEYS = ['zodiac', 'communication_style', 'relationship_goal', 'languages'];
  const MASTER_LIFESTYLE_KEYS = ['smoking', 'drinking', 'exercise', 'sleep', 'pets'];
  const MASTER_LANGUAGE_PATTERN = /^[\p{L}\p{N}\s,،+\-]{0,120}$/u;

  const masterLabel = (options, value) => {
    const found = (options || []).find(([id]) => id === value);
    return found ? found.slice(1) : null;
  };

  /* A) Centered match notice for direct conversations.
     It reuses the existing centered day-divider class and adds match-notice,
     and it only prints a date when a real first created_at exists. */
  const masterBaseMessageList = cloudMessageList;
  cloudMessageList = function () {
    const list = masterBaseMessageList.apply(this, arguments);
    if (typeof list !== 'string' || view !== 'chats' || !cloud.peer) return list;
    const first = Array.isArray(cloud.messages) && cloud.messages.length ? cloud.messages[0] : null;
    const rawStamp = first && typeof first.created_at === 'string' ? Date.parse(first.created_at) : NaN;
    const started = Number.isFinite(rawStamp) ? new Date(rawStamp) : null;
    const text = started
      ? t('بداية المحادثة', 'Conversation started') + ' · ' + started.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })
      : t('هذه بداية محادثتكما', 'This is the start of your conversation');
    const notice = `<div class="message-date match-notice" role="note">${esc(text)}</div>`;
    const open = list.indexOf('>');
    return open < 0 ? notice + list : list.slice(0, open + 1) + notice + list.slice(open + 1);
  };

  /* B) Real Basics/Lifestyle editor. Values are validated against fixed
     allowlists and stored as JSONB through /api/cloud/profile-details. */
  async function masterSaveDetails(event) {
    event.preventDefault();
    if (cloud.busy) return;
    const data = new FormData(event.target);
    const read = (key, max) => String(data.get(key) ?? '').slice(0, max).replace(/[<>]/g, '').trim();
    const languages = read('languages', 120);
    if (languages && !MASTER_LANGUAGE_PATTERN.test(languages)) {
      toast(t('استخدم حروفًا وأرقامًا وفواصل فقط في اللغات.', 'Use letters, numbers and commas only for languages.'));
      return;
    }
    const rawHeight = String(data.get('height_cm') ?? '').trim();
    const height = rawHeight ? Number(rawHeight) : null;
    if (rawHeight && (!Number.isFinite(height) || height < 80 || height > 260)) {
      toast(t('أدخل طولًا بين 80 و260 سم.', 'Enter a height between 80 and 260 cm.'));
      return;
    }
    const pick = (field, key) => {
      const candidate = String(data.get(field) ?? '');
      return (MASTER_OPTIONS[key] || []).some(([id]) => id === candidate) ? candidate : '';
    };
    cloud.busy = true;
    try {
      await cloudAPI('profile-details', 'POST', {
        living_in: read('living_in', 120),
        height_cm: height,
        job: read('job', 120),
        education: read('education', 160),
        basics: {
          zodiac: pick('basics_zodiac', 'zodiac'),
          communication_style: pick('basics_communication_style', 'communication_style'),
          relationship_goal: pick('basics_relationship_goal', 'relationship_goal'),
          languages
        },
        lifestyle: {
          smoking: pick('lifestyle_smoking', 'smoking'),
          drinking: pick('lifestyle_drinking', 'drinking'),
          exercise: pick('lifestyle_exercise', 'exercise'),
          sleep: pick('lifestyle_sleep', 'sleep'),
          pets: pick('lifestyle_pets', 'pets')
        }
      });
      await cloudProfileBundle();
      document.querySelector('#create').close();
      render();
      toast(t('حُفظت التفاصيل في حسابك.', 'Details saved to your account.'));
    } catch (error) {
      toast(cloudError(error));
    } finally {
      cloud.busy = false;
    }
  }

  function masterDetailsEditor() {
    if (!cloud.user) { cloudGuard(); return; }
    const details = (cloud.profileData && cloud.profileData.details) || {};
    const basics = details.basics && typeof details.basics === 'object' ? details.basics : {};
    const lifestyle = details.lifestyle && typeof details.lifestyle === 'object' ? details.lifestyle : {};
    const textValue = key => esc(typeof details[key] === 'string' ? details[key] : '');
    const chosen = (source, key) => masterLabel(MASTER_OPTIONS[key], source[key]) ? source[key] : '';
    const selectField = (name, label, key, source) => {
      const current = chosen(source, key);
      const options = [['', 'غير محدد', 'Not set']].concat(MASTER_OPTIONS[key]);
      return `<label>${t(...label)}<select name="${name}">${options.map(([id, ar, en]) => `<option value="${esc(id)}" ${current === id ? 'selected' : ''}>${t(ar, en)}</option>`).join('')}</select></label>`;
    };
    sheetShell(() => `<h2>${t('تفاصيل ملفي', 'My profile details')}</h2><p class="small muted">${t('تُحفظ هذه التفاصيل في حسابك ويمكن تعديلها لاحقًا.', 'These details are saved to your account and can be edited later.')}</p><form ${on(masterSaveDetails, 'submit')}><label>${t('أسكن في', 'Living in')}<input name="living_in" maxlength="120" value="${textValue('living_in')}"></label><label>${t('الطول (سم)', 'Height (cm)')}<input name="height_cm" type="number" min="80" max="260" inputmode="numeric" value="${details.height_cm ? esc(String(details.height_cm)) : ''}"></label><label>${t('العمل', 'Job')}<input name="job" maxlength="120" value="${textValue('job')}"></label><label>${t('التعليم', 'Education')}<input name="education" maxlength="160" value="${textValue('education')}"></label><h3>${t('الأساسيات', 'Basics')}</h3>${selectField('basics_zodiac', ['البرج', 'Zodiac'], 'zodiac', basics)}${selectField('basics_communication_style', ['طريقة التواصل', 'Communication style'], 'communication_style', basics)}${selectField('basics_relationship_goal', ['ما تبحث عنه', 'Looking for'], 'relationship_goal', basics)}<label>${t('اللغات', 'Languages')}<input name="languages" maxlength="120" placeholder="${t('مثال: العربية، English', 'Example: Arabic, English')}" value="${esc(typeof basics.languages === 'string' ? basics.languages : '')}"></label><h3>${t('نمط الحياة', 'Lifestyle')}</h3>${selectField('lifestyle_smoking', ['التدخين', 'Smoking'], 'smoking', lifestyle)}${selectField('lifestyle_drinking', ['شرب الكحول', 'Drinking'], 'drinking', lifestyle)}${selectField('lifestyle_exercise', ['الرياضة', 'Exercise'], 'exercise', lifestyle)}${selectField('lifestyle_sleep', ['النوم', 'Sleep'], 'sleep', lifestyle)}${selectField('lifestyle_pets', ['الحيوانات الأليفة', 'Pets'], 'pets', lifestyle)}<button class="primary">${t('حفظ التفاصيل', 'Save details')}</button></form>`);
  }
  // The existing attribute pills keep working and now open the richer editor.
  cloudEditDetails = masterDetailsEditor;

  /* C) Top artists, next to "Listening to". Empty state only: no invented
     artists and no claim that Spotify is connected. */
  function masterTopArtistsCard() {
    return `<div class="spotify-card top-artists-card"><span aria-hidden="true">🎧</span><div><strong>${t('أفضل الفنانين', 'Top artists')}</strong><small>${t('لم يتم الربط بعد · لا نعرض بيانات فنانين.', 'Not connected yet · no artist data is shown.')}</small></div><button class="chip" ${on(masterConnectSpotify)}>${t('ربط Spotify', 'Connect Spotify')}</button></div>`;
  }
  function masterConnectSpotify() {
    toast(t('ربط Spotify غير مُفعّل في هذه النسخة؛ لا يوجد حساب موصول.', 'Spotify is not available in this build; no account is connected.'));
  }

  function masterBasicsCard() {
    const details = (cloud.profileData && cloud.profileData.details) || {};
    const basics = details.basics && typeof details.basics === 'object' ? details.basics : {};
    const lifestyle = details.lifestyle && typeof details.lifestyle === 'object' ? details.lifestyle : {};
    const pills = [];
    for (const key of MASTER_BASICS_KEYS) {
      if (key === 'languages') continue;
      const label = masterLabel(MASTER_OPTIONS[key], basics[key]);
      if (label) pills.push(`<span class="profile-pill trait">${t(...label)}</span>`);
    }
    if (typeof basics.languages === 'string' && basics.languages) pills.push(`<span class="profile-pill trait">${esc(basics.languages)}</span>`);
    for (const key of MASTER_LIFESTYLE_KEYS) {
      const label = masterLabel(MASTER_OPTIONS[key], lifestyle[key]);
      if (label) pills.push(`<span class="profile-pill">${t(...label)}</span>`);
    }
    const filled = pills.length;
    return `<section class="profile-section master-basics-card"><div class="section-title"><div><h2>${t('الأساسيات ونمط الحياة', 'Basics & lifestyle')}</h2><small>${filled ? t(filled + ' حقول مكتملة', filled + ' fields filled') : t('لم تُضف بعد', 'Nothing added yet')}</small></div><button class="icon-only" aria-label="${t('تعديل الأساسيات ونمط الحياة', 'Edit basics and lifestyle')}" ${on(masterDetailsEditor)}>✎</button></div>${filled ? `<div class="type-options">${pills.join('')}</div>` : `<p class="muted">${t('أضف برجك وطريقة تواصلك ونمط حياتك.', 'Add your zodiac, communication style and lifestyle.')}</p>`}<button class="chip" ${on(masterDetailsEditor)}>${t('تعديل الأساسيات ونمط الحياة', 'Edit basics & lifestyle')}</button></section>`;
  }

  const masterBaseProfile = profile;
  profile = function () {
    const html = masterBaseProfile.apply(this, arguments);
    if (!cloud.user || typeof html !== 'string') return html;
    const artists = masterTopArtistsCard();
    const listeningCard = /<div class="spotify-card">[\s\S]*?<\/div><\/div>/;
    const withArtists = listeningCard.test(html)
      ? html.replace(listeningCard, match => match + artists)
      : html + `<section class="profile-section top-artists-section">${artists}</section>`;
    return withArtists + masterBasicsCard();
  };

  /* D) Composer exactness. Same DOM order and behavior as the original
     composer (camera left, message pill, gallery, mic, send button while
     typing), with master-composer added as an extra styling hook. */
  const masterBaseSendForm = sendForm;
  sendForm = function (handler) {
    try {
      const draft = chatDrafts[draftKey(handler)] || '';
      return `<form class="send-form smart-composer master-composer ${draft ? 'typing' : ''}" ${on(event => { if (handler === 'sendRoom') sendRoom(event); else sendChat(event); }, 'submit')}><button type="button" class="file-button camera-button" aria-label="${t('التقاط صورة · بلس', 'Take photo · Plus')}" ${on(() => openChatPhoto(handler, true))}>${uiIcon('camera')}</button><input name="message" value="${esc(draft)}" maxlength="2000" aria-label="${t('اكتب رسالة', 'Write a message')}" placeholder="${t('رسالة…', 'Message…')}" autocomplete="off" required ${on(event => { chatDrafts[draftKey(handler)] = event.target.value.slice(0, 2000); const form = event.target.closest('form'); if (form) form.classList.toggle('typing', event.target.value.length > 0); }, 'input')}><div class="composer-side">${chatAttachments(handler)}</div><button class="primary composer-send" aria-label="${t('إرسال', 'Send')}">➤</button></form>`;
    } catch (error) {
      return masterBaseSendForm(handler);
    }
  };
})();
