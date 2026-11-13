import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,readdir} from 'node:fs/promises';
import ts from 'typescript';
const historySource=await readFile(new URL('../public/focus-history.js',import.meta.url),'utf8');
const appSource=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
const ast=ts.createSourceFile('app.js',appSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const fn=name=>ast.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name).getText(ast);
function store(){const data=new Map();const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};const c=vm.createContext({});vm.runInContext(historySource,c);return {data,history:c.FocusHistory.createStore(storage,()=> 'guest')};}
test('sign-out and switching accounts cannot reveal or import a previous owner’s records',()=>{
 const {history:h,data}=store();data.set('focusIslandHistoryV1',JSON.stringify([{id:'legacy'}]));
 h.select('A');h.put({id:'a',endedAt:10});h.select('B');assert.equal(h.records().length,0);assert.equal(h.pending().length,0);
 h.newGuest();assert.equal(h.records().length,0);h.select('A');assert.equal(h.records()[0].id,'a');assert.equal(h.legacyCount(),1);
});
test('explicit guest transfer is retry-safe and never claims legacy records',()=>{
 const {history:h}=store();h.select('anonymous');h.put({id:'guest-focus',endedAt:20});h.transfer('anonymous','member');h.transfer('anonymous','member');h.select('member');assert.equal(h.records().length,1);assert.equal(h.records()[0].ownerUserId,'member');h.markSynced('member',['guest-focus']);assert.equal(h.pending().length,0);
});
test('loading earlier pages does not evict earlier or unsynced records',()=>{
 const {history:h}=store();h.select('member');for(let n=0;n<251;n++)h.put({id:String(n),endedAt:n,synced:n>0});assert.equal(h.records().length,251);assert.equal(h.pending().length,1);
});
test('a history response arriving after account switch is discarded',async()=>{
 const {history}=store();history.select('A');let resolve;const c=vm.createContext({onlineUserId:'A',historyRevision:1,historyNextOffset:0,historyStatus:'ready',historyHasMore:true,focusHistory:history,importLocalHistory:async()=>{},api:()=>new Promise(r=>{resolve=r;}),state:{personalCenter:{open:false}},Date,readHistory:()=>history.records()});vm.runInContext(fn('refreshFocusHistory'),c);const pending=c.refreshFocusHistory();await new Promise(r=>setImmediate(r));c.onlineUserId='B';c.historyRevision++;history.select('B');resolve({userId:'A',sessions:[{status:'completed',client_session_id:'A-record',started_at:new Date().toISOString(),ended_at:new Date().toISOString()}]});await pending;assert.equal(history.records().length,0);
});
test('pause recovery preserves actual time and running recovery adds only time since last update',()=>{
 const now=Date.now(), c=vm.createContext({Date});vm.runInContext(fn('recoveredFocusSeconds'),c);
 assert.equal(c.recoveredFocusSeconds({status:'paused',actual_seconds:120,started_at:new Date(now-600000).toISOString()}),120);
 assert.equal(c.recoveredFocusSeconds({status:'running',actual_seconds:120,updated_at:new Date(now-30000).toISOString()}),150);
});
test('password recovery accepts only a fresh verified recovery method for the matching subject',async()=>{
 const source=await readFile(new URL('../lib/password-recovery.ts',import.meta.url),'utf8');const c=vm.createContext({Date});vm.runInContext(ts.transpileModule(source.replaceAll('export ',''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText,c);const now=Date.now();const claims={sub:'A',session_id:'session-a',amr:[{method:'recovery',timestamp:now/1000}]};assert.equal(c.recoverySession(claims,'A',now),'session-a');assert.equal(c.recoverySession(claims,'B',now),null);assert.equal(c.recoverySession({...claims,amr:[{method:'password',timestamp:now/1000}]},'A',now),null);assert.equal(c.recoverySession(claims,'A',now+601000),null);
});
test('every shipped public script is complete JavaScript',async()=>{
 for(const name of await readdir(new URL('../public',import.meta.url))){if(name.endsWith('.js'))new vm.Script(await readFile(new URL('../public/'+name,import.meta.url),'utf8'),{filename:name});}
});
test('history APIs reject an expected-owner mismatch before touching the database',async()=>{
 for(const path of ['sessions/route.ts','sessions/start/route.ts','sessions/[id]/route.ts']){
  const src=await readFile(new URL('../app/api/focus/'+path,import.meta.url),'utf8');assert.match(src,/request.headers.get\("X-Focus-User"\) !== auth.user.id/);
 }
});
test('a transferred guest history cannot be claimed by a second member',()=>{
 const {history:h}=store();h.put({id:'guest-focus',endedAt:5});const source=h.owner();h.transfer(source,'A');h.transfer(source,'B');h.select('B');assert.equal(h.records().length,0);h.select('A');assert.equal(h.records().length,1);
});
test('another tab observes the new local guest scope after sign-out',()=>{
 const {history:h,data}=store();h.put({id:'old-guest',endedAt:5});data.set('focusIslandHistoryGuestV2','local:new-tab-guest');h.select(null);assert.equal(h.owner(),'local:new-tab-guest');assert.equal(h.records().length,0);
});
test('a late start response cannot attach an old owner session after identity switch',async()=>{
 let resolve;const c=vm.createContext({historyRevision:1,seatReleaseRevision:0,state:{sceneId:'cafe',selectedSeat:0,roomId:'cafe-01',timerMode:25},crypto:{randomUUID:()=> 'client-start-a'},ensureOnlineIdentity:async()=>{},flushPendingFocusUpdates:async()=>{},api:()=>new Promise(r=>{resolve=r;})});vm.runInContext(fn('requestFocusAuthorization'),c);const pending=c.requestFocusAuthorization();await new Promise(r=>setImmediate(r));c.historyRevision++;c.seatReleaseRevision++;c.state.cloudFocusClientId=null;resolve({});assert.equal(await pending,false);assert.equal(c.state.cloudFocusClientId,null);
});
test('passive initialization and first entry may resolve the same identity concurrently',async()=>{
 let resolve;const c=vm.createContext({historyRevision:0,historyIdentityEpoch:0,onlineUserId:null,onlineIdentityPromise:null,focusHistory:{owner:()=> 'local:guest'},state:{},api:()=>new Promise(r=>{resolve=r;}),applyAccountProfile(){},setHistoryIdentity(){}});vm.runInContext(fn('ensureOnlineIdentity'),c);const pending=c.ensureOnlineIdentity();c.historyRevision=1;c.onlineUserId='same-user';resolve({authenticated:true,userId:'same-user'});assert.equal((await pending).userId,'same-user');
});
test('a stale identity lookup cannot undo an explicit sign-out',async()=>{
 let resolve;const c=vm.createContext({historyRevision:1,historyIdentityEpoch:0,onlineUserId:'A',onlineIdentityPromise:null,focusHistory:{owner:()=> 'A'},state:{},api:()=>new Promise(r=>{resolve=r;}),applyAccountProfile(){assert.fail('stale profile');},setHistoryIdentity(){assert.fail('stale identity');}});vm.runInContext(fn('ensureOnlineIdentity'),c);const pending=c.ensureOnlineIdentity();c.historyRevision=2;c.historyIdentityEpoch=1;c.onlineUserId=null;resolve({authenticated:true,userId:'A'});await assert.rejects(pending,/identity_changed/);
});
