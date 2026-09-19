const spotifyBaseCloudRoute=cloudRoute;
const SPOTIFY_STATE_COOKIE='__Host-vibe-spotify-state';
const SPOTIFY_REFRESH_COOKIE='__Host-vibe-spotify-refresh';
const SPOTIFY_REDIRECT_PATH='/api/cloud/spotify/callback';

function spotifyHeaders(type='application/json; charset=utf-8'){
  return new Headers({...common,'Content-Type':type});
}
function spotifyJson(data,status=200,cookies=[]){
  const headers=spotifyHeaders();
  for(const cookie of cookies)headers.append('Set-Cookie',cookie);
  return new Response(JSON.stringify(data),{status,headers});
}
function spotifyRedirect(location,cookies=[]){
  const headers=new Headers({...common,Location:location});
  for(const cookie of cookies)headers.append('Set-Cookie',cookie);
  return new Response(null,{status:302,headers});
}
function spotifyCookie(name,value,maxAge){
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(0,Math.floor(maxAge))}`;
}
function spotifyClear(name){return spotifyCookie(name,'',0)}
function spotifyConfig(env){
  return {
    clientId:String(env?.SPOTIFY_CLIENT_ID||''),
    clientSecret:String(env?.SPOTIFY_CLIENT_SECRET||'')
  };
}
function spotifyConfigured(config){return !!(config.clientId&&config.clientSecret)}
function spotifyBytesToBase64Url(bytes){
  let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function spotifyBase64UrlToBytes(value){
  const base64=String(value).replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-String(value).length%4)%4);
  const binary=atob(base64),out=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);
  return out;
}
async function spotifyKey(secret){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function spotifyEncrypt(secret,value){
  const iv=crypto.getRandomValues(new Uint8Array(12)),key=await spotifyKey(secret);
  const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(value)));
  const merged=new Uint8Array(iv.length+cipher.length);merged.set(iv);merged.set(cipher,iv.length);
  return spotifyBytesToBase64Url(merged);
}
async function spotifyDecrypt(secret,value){
  const merged=spotifyBase64UrlToBytes(value);
  if(merged.length<=12)throw Error('invalid_cookie');
  const key=await spotifyKey(secret),iv=merged.slice(0,12),cipher=merged.slice(12);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,cipher);
  return new TextDecoder().decode(plain);
}
function spotifyState(){
  return spotifyBytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}
function spotifyEqual(a,b){
  const x=new TextEncoder().encode(String(a)),y=new TextEncoder().encode(String(b));
  let diff=x.length^y.length,len=Math.max(x.length,y.length);
  for(let i=0;i<len;i++)diff|=(x[i]||0)^(y[i]||0);
  return diff===0;
}
async function spotifyToken(config,params){
  return fetch('https://accounts.spotify.com/api/token',{
    method:'POST',
    headers:{
      'Authorization':'Basic '+btoa(config.clientId+':'+config.clientSecret),
      'Content-Type':'application/x-www-form-urlencoded',
      'Accept':'application/json'
    },
    body:params.toString(),
    signal:AbortSignal.timeout(12000)
  });
}
function spotifyArtistString(value,max){
  return typeof value==='string'?value.trim().slice(0,max):'';
}
function spotifyArtists(payload){
  return (Array.isArray(payload?.items)?payload.items:[]).slice(0,6).flatMap(item=>{
    const id=spotifyArtistString(item?.id,64),name=spotifyArtistString(item?.name,120);
    if(!id||!name)return [];
    const genres=(Array.isArray(item?.genres)?item.genres:[]).map(x=>spotifyArtistString(x,40)).filter(Boolean).slice(0,5);
    return [{id,name,genres,url:'https://open.spotify.com/artist/'+encodeURIComponent(id)}];
  });
}
async function spotifyCloudRoute(req,env,url,action){
  const identity=await cloudIdentity(req);
  if(!identity)return spotifyJson({error:'sign_in_required'},401);
  const config=spotifyConfig(env),cookies=cloudCookies(req);

  if(action==='status'&&req.method==='GET'){
    if(!spotifyConfigured(config))return spotifyJson({configured:false,connected:false});
    const encrypted=cookies[SPOTIFY_REFRESH_COOKIE];
    if(!encrypted)return spotifyJson({configured:true,connected:false});
    try{
      const token=await spotifyDecrypt(config.clientSecret,encrypted);
      return spotifyJson({configured:true,connected:!!token});
    }catch{
      return spotifyJson({configured:true,connected:false},200,[spotifyClear(SPOTIFY_REFRESH_COOKIE)]);
    }
  }

  if(action==='connect'&&req.method==='GET'){
    if(!spotifyConfigured(config))return spotifyJson({error:'spotify_not_configured'},503);
    const state=spotifyState(),redirectUri=url.origin+SPOTIFY_REDIRECT_PATH;
    const auth=new URL('https://accounts.spotify.com/authorize');
    auth.searchParams.set('response_type','code');
    auth.searchParams.set('client_id',config.clientId);
    auth.searchParams.set('redirect_uri',redirectUri);
    auth.searchParams.set('scope','user-top-read');
    auth.searchParams.set('state',state);
    return spotifyRedirect(auth.toString(),[spotifyCookie(SPOTIFY_STATE_COOKIE,state,600)]);
  }

  if(action==='callback'&&req.method==='GET'){
    if(!spotifyConfigured(config))return spotifyJson({error:'spotify_not_configured'},503);
    const state=url.searchParams.get('state')||'',expected=cookies[SPOTIFY_STATE_COOKIE]||'',code=url.searchParams.get('code')||'';
    if(url.searchParams.get('error'))return spotifyRedirect('/?spotify=error',[spotifyClear(SPOTIFY_STATE_COOKIE)]);
    if(!state||!expected||!code||!spotifyEqual(state,expected))return spotifyJson({error:'invalid_state'},400,[spotifyClear(SPOTIFY_STATE_COOKIE)]);
    const redirectUri=url.origin+SPOTIFY_REDIRECT_PATH;
    let response;
    try{response=await spotifyToken(config,new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:redirectUri}))}
    catch{return spotifyJson({error:'spotify_unavailable'},502,[spotifyClear(SPOTIFY_STATE_COOKIE)])}
    const data=await response.json().catch(()=>null),refresh=typeof data?.refresh_token==='string'?data.refresh_token:'';
    if(!response.ok||!refresh)return spotifyJson({error:'spotify_token_exchange_failed'},502,[spotifyClear(SPOTIFY_STATE_COOKIE)]);
    const encrypted=await spotifyEncrypt(config.clientSecret,refresh);
    return spotifyRedirect('/?spotify=connected',[
      spotifyCookie(SPOTIFY_REFRESH_COOKIE,encrypted,2592000),
      spotifyClear(SPOTIFY_STATE_COOKIE)
    ]);
  }

  if(action==='top'&&req.method==='GET'){
    if(!spotifyConfigured(config))return spotifyJson({error:'spotify_not_configured'},503);
    const encrypted=cookies[SPOTIFY_REFRESH_COOKIE];
    if(!encrypted)return spotifyJson({error:'spotify_not_connected'},401);
    let refresh;
    try{refresh=await spotifyDecrypt(config.clientSecret,encrypted)}
    catch{return spotifyJson({error:'spotify_not_connected'},401,[spotifyClear(SPOTIFY_REFRESH_COOKIE)])}
    let tokenResponse;
    try{tokenResponse=await spotifyToken(config,new URLSearchParams({grant_type:'refresh_token',refresh_token:refresh}))}
    catch{return spotifyJson({error:'spotify_unavailable'},502)}
    const tokenData=await tokenResponse.json().catch(()=>null),access=typeof tokenData?.access_token==='string'?tokenData.access_token:'';
    if(!tokenResponse.ok||!access)return spotifyJson({error:'spotify_not_connected'},401,[spotifyClear(SPOTIFY_REFRESH_COOKIE)]);
    const rotated=typeof tokenData?.refresh_token==='string'?tokenData.refresh_token:'';
    const setCookies=[];
    if(rotated&&rotated!==refresh)setCookies.push(spotifyCookie(SPOTIFY_REFRESH_COOKIE,await spotifyEncrypt(config.clientSecret,rotated),2592000));
    let topResponse;
    try{
      topResponse=await fetch('https://api.spotify.com/v1/me/top/artists?limit=6&time_range=medium_term',{
        headers:{Authorization:'Bearer '+access,Accept:'application/json'},
        signal:AbortSignal.timeout(12000)
      });
    }catch{return spotifyJson({error:'spotify_unavailable'},502,setCookies)}
    const top=await topResponse.json().catch(()=>null);
    if(!topResponse.ok)return spotifyJson({error:'spotify_top_artists_failed'},502,setCookies);
    return spotifyJson({artists:spotifyArtists(top)},200,setCookies);
  }

  if(action==='disconnect'&&req.method==='POST'){
    if(req.headers.get('Origin')!==url.origin)return spotifyJson({error:'forbidden_origin'},403);
    return spotifyJson({ok:true},200,[spotifyClear(SPOTIFY_REFRESH_COOKIE),spotifyClear(SPOTIFY_STATE_COOKIE)]);
  }

  return spotifyJson({error:'method_not_allowed'},405);
}

cloudRoute=async function(req,env,url){
  const action=url.pathname.slice('/api/cloud/'.length);
  if(action.startsWith('spotify/'))return spotifyCloudRoute(req,env,url,action.slice('spotify/'.length));
  return spotifyBaseCloudRoute(req,env,url);
};
