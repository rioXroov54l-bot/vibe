import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync('public/cloud-ui.js','utf8');
const code=source.slice(0,source.indexOf('async function cloudRecover'));
const storage=new Map();let calls=[],reply={ok:true},replyStatus=200;
const ctx=vm.createContext({Date,JSON,URLSearchParams,FormData:class {constructor(v){this.v=v;}get(k){return this.v[k];}},Blob,Error,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},location:{origin:'https://example.test'},render(){},go(){},profile(){},onboarding(){},authMode:'signup',t:(a,b)=>b,esc:s=>s,on:()=>'',switchLang(){},document:{querySelector:()=>null},fetch:async(url,opts)=>{calls.push({url,body:opts.body?JSON.parse(opts.body):null,opts});return {ok:replyStatus>=200&&replyStatus<300,status:replyStatus,json:async()=>reply};}});
vm.runInContext(code,ctx);
const run=s=>vm.runInContext(s,ctx);
const submit=values=>({preventDefault(){},target:{...values,querySelector:()=>null}});

reply={ok:true,confirmation_required:true};replyStatus=200;
await ctx.cloudAuth(submit({email:'test@example.invalid',password:'testing123',name:'Test',accepted:'on'}));
assert.equal(calls.at(-1).url,'/api/cloud/auth/signup');
assert.equal(calls.at(-1).body.accepted,true);
assert.equal(run('authScreen'),'verify');assert.match(ctx.verificationView(),/one-time-code/);assert.equal(run('pendingAuth.email'),'test@example.invalid');

reply={error:'email_not_confirmed'};replyStatus=400;run("authMode='login';authScreen='form'");
await ctx.cloudAuth(submit({email:'test@example.invalid',password:'testing123'}));
assert.equal(calls.at(-1).url,'/api/cloud/auth/login');assert.equal(run('authScreen'),'verify');

reply={error:'otp_expired'};replyStatus=400;
await ctx.verifyAuthCode(submit({token:'١٢٣٤٥٦'}));
assert.equal(calls.at(-1).url,'/api/cloud/auth/verify');assert.equal(calls.at(-1).body.token,'123456');assert.equal(run('authScreen'),'verify');assert.match(run('cloud.authNotice'),/expired/);

reply={ok:true,confirmation_required:false};replyStatus=200;
run('cloudBoot=async()=>{cloud.error="";cloud.user={id:"test"};cloud.onboarding={complete:true}}');
await ctx.verifyAuthCode(submit({token:'123456'}));
assert.equal(calls.at(-1).url,'/api/cloud/auth/verify');assert.equal(run('pendingAuth'),null);assert.equal(storage.size,0);

console.log('PASS: browser auth uses same-origin server endpoints; signup/login verification remains retryable; Arabic digits normalize; successful verification relies on HttpOnly-cookie session. Network mocked.');
