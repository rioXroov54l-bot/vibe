'use strict';

const spotifySpecBaseRender=render;
const spotifySpecState={loaded:false,loading:false,configured:false,connected:false,artists:[],error:''};

(function spotifyReturnState(){
  try{
    const u=new URL(location.href),status=u.searchParams.get('spotify');
    if(!status)return;
    u.searchParams.delete('spotify');
    history.replaceState(null,'',u.pathname+(u.search?'?'+u.searchParams.toString():'')+u.hash);
    if(status==='connected'){spotifySpecState.loaded=false;try{view='profile'}catch{}}
    else if(status==='error')spotifySpecState.error=t('تعذر ربط Spotify. حاول مرة أخرى.','Spotify connection could not be completed. Try again.');
  }catch{}
})();

async function spotifySpecJson(path,options){
  const r=await fetch(path,{credentials:'same-origin',cache:'no-store',...(options||{})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok){const e=Error(data.error||'spotify_request_failed');e.status=r.status;throw e}
  return data;
}

async function spotifySpecLoad(force=false){
  if(spotifySpecState.loading||spotifySpecState.loaded&&!force)return;
  spotifySpecState.loading=true;spotifySpecState.error='';
  try{
    const status=await spotifySpecJson('/api/cloud/spotify/status');
    spotifySpecState.configured=!!status.configured;
    spotifySpecState.connected=!!status.connected;
    spotifySpecState.artists=[];
    if(spotifySpecState.configured&&spotifySpecState.connected){
      const top=await spotifySpecJson('/api/cloud/spotify/top');
      spotifySpecState.artists=Array.isArray(top.artists)?top.artists.slice(0,6):[];
    }
  }catch(e){
    if(e.status===401)spotifySpecState.connected=false;
    else spotifySpecState.error=t('تعذر تحميل بيانات Spotify الآن.','Spotify data could not be loaded right now.');
  }finally{
    spotifySpecState.loading=false;spotifySpecState.loaded=true;
    try{render()}catch{}
  }
}

async function spotifySpecDisconnect(){
  if(spotifySpecState.loading)return;
  spotifySpecState.loading=true;
  try{
    await spotifySpecJson('/api/cloud/spotify/disconnect',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    spotifySpecState.connected=false;spotifySpecState.artists=[];spotifySpecState.error='';spotifySpecState.loaded=true;
  }catch{
    spotifySpecState.error=t('تعذر فصل Spotify الآن.','Spotify could not be disconnected right now.');
  }finally{
    spotifySpecState.loading=false;render();
  }
}

function spotifySpecText(tag,className,text){
  const el=document.createElement(tag);if(className)el.className=className;el.textContent=text;return el;
}

function spotifySpecEnhance(){
  if(typeof document==='undefined'||view!=='profile')return;
  const card=document.querySelector('.top-artists-card');
  if(!card)return;
  if(!spotifySpecState.loaded&&!spotifySpecState.loading)spotifySpecLoad();

  const head=document.createElement('div');head.className='top-artists-head';
  head.append(spotifySpecText('h3','top-artists-title',t('أفضل الفنانين','Top artists')));
  const status=spotifySpecText('span','top-artists-status',
    spotifySpecState.loading?t('جارٍ التحميل','Loading'):
    !spotifySpecState.configured?t('الإعداد مطلوب','Setup required'):
    spotifySpecState.connected?t('متصل','Connected'):t('غير متصل','Not connected'));
  head.append(status);
  const body=document.createElement('div');

  if(spotifySpecState.error)body.append(spotifySpecText('p','top-artists-empty',spotifySpecState.error));

  if(spotifySpecState.loading){
    body.append(spotifySpecText('p','top-artists-empty',t('جارٍ تحميل Spotify…','Loading Spotify…')));
  }else if(!spotifySpecState.configured){
    body.append(spotifySpecText('p','top-artists-empty',t('أضف مفاتيح Spotify في إعدادات تشغيل Vibe لتفعيل الربط.','Add Spotify runtime credentials to enable account connection.')));
    const button=spotifySpecText('button','master-spec-chip top-artists-connect',t('Spotify غير مهيأ','Spotify not configured'));
    button.type='button';button.disabled=true;body.append(button);
  }else if(!spotifySpecState.connected){
    body.append(spotifySpecText('p','top-artists-empty',t('اربط Spotify لعرض أفضل الفنانين من حسابك.','Connect Spotify to show your real top artists.')));
    const button=spotifySpecText('button','master-spec-chip top-artists-connect',t('اربط Spotify','Connect Spotify'));
    button.type='button';button.addEventListener('click',()=>location.assign('/api/cloud/spotify/connect'));body.append(button);
  }else{
    const list=document.createElement('div');list.className='top-artists-list';
    if(!spotifySpecState.artists.length)list.append(spotifySpecText('p','top-artists-empty',t('لا توجد بيانات فنانين كافية في حسابك حتى الآن.','No top-artist data is available for this account yet.')));
    for(const artist of spotifySpecState.artists){
      const row=document.createElement('a');row.className='profile-pill top-artist-pill';row.textContent=String(artist?.name||'').slice(0,120);
      try{const u=new URL(String(artist?.url||''));if(u.protocol==='https:'&&u.hostname==='open.spotify.com'){row.href=u.href;row.target='_blank';row.rel='noopener noreferrer';}}
      catch{}
      list.append(row);
    }
    body.append(list);
    const disconnect=spotifySpecText('button','master-spec-chip',t('فصل Spotify','Disconnect Spotify'));
    disconnect.type='button';disconnect.addEventListener('click',spotifySpecDisconnect);body.append(disconnect);
  }

  card.replaceChildren(head,body);
}

render=function(){
  spotifySpecBaseRender();
  spotifySpecEnhance();
};
