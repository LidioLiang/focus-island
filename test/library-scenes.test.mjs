import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const catalog=JSON.parse(await readFile(new URL('../lib/scene-catalog.json',import.meta.url),'utf8'));
const src=await readFile(new URL('../public/scene-runtime.js',import.meta.url),'utf8');
const ast=ts.createSourceFile('scene.js',src,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const functions=names=>names.map(name=>ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name.text===name).getText(ast)).join('\n');
function context(extra={}){return vm.createContext({PUBLIC_CONFIG:{minimalMvp:true,sceneCatalog:catalog},state:{sceneId:'library'},preferences:{rememberLastFocusView:true},MINIMAL_LAYOUT_KEY:'layout',staticSeatSlots:[],...extra});}
test('per-scene seat defaults and remembered views never leak across places',()=>{
 const c=context();vm.runInContext(functions(['focusSceneDefinition','sceneDefaultFocusView','sceneLayoutStorageKey']),c);
 assert.equal(c.sceneDefaultFocusView(1),'window');assert.equal(c.sceneDefaultFocusView(3),'reading');assert.equal(c.sceneDefaultFocusView(6),'alcove');
 c.preferences.sceneViews={cafe:'mist',library:'reading'};assert.equal(c.sceneDefaultFocusView(6),'reading');assert.equal(c.sceneLayoutStorageKey(),'layout:library');
 c.state.sceneId='cafe';assert.equal(c.sceneDefaultFocusView(3),'mist');assert.equal(c.sceneLayoutStorageKey(),'layout');
 c.preferences.sceneViews.cafe='alcove';assert.equal(c.sceneDefaultFocusView(1),'bar');
});
test('all shipped scene assets exist and room slots stay within six-seat bounds',async()=>{
 for(const scene of Object.values(catalog)){
  assert.equal(scene.seats.length,6);assert.equal(scene.onlineRooms.length,3);
  for(const seat of scene.seats){for(const point of [seat.hit_area,seat.avatar_anchor])assert.ok(point.every(n=>n>=0&&n<=100));}
  for(const asset of [scene.roomImage,...scene.focusViews.map(v=>v.image),...(scene.ambientAsset?[scene.ambientAsset]:[])])assert.ok((await readFile(new URL('../public'+asset,import.meta.url))).length>1000,asset);
 }
});
test('a late library ambience decode cannot play after mute or scene change',async()=>{
 let finish;let sources=0;const gain={gain:{value:0,cancelScheduledValues(){},setValueAtTime(){},setTargetAtTime(){}},connect(){}};
 const audio={state:'running',currentTime:0,createGain:()=>gain,decodeAudioData:()=>new Promise(r=>finish=r),createBufferSource:()=>{sources++;return {connect(){},start(){}};},destination:{}};
 const c=context({audioContext:audio,fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)})});
 c.state.isRunning=true;c.state.sounds={ambient:true};c.state.soundVolumes={ambient:25};
 vm.runInContext(src.slice(src.indexOf('let sceneAmbience')),c);vm.runInContext(functions(['focusSceneDefinition']),c);
 const pending=c.syncSceneAmbience();await new Promise(r=>setImmediate(r));c.state.sceneId='cafe';finish({});await pending;assert.equal(sources,0);
});

test('shared runtime is loaded before minimal UI and app boot',async()=>{
 const layout=await readFile(new URL('../app/layout.tsx',import.meta.url),'utf8');
 assert.match(layout,/<Script src="\/scene-runtime.js\?v=1" strategy="beforeInteractive"/);
 assert.ok(layout.indexOf('/scene-runtime.js')<layout.indexOf('/minimal-mvp.js'));
});
test('late recovery is drained before release and cannot restore the ended seat',async()=>{
 const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');const tree=ts.createSourceFile('app.js',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const names=['recoverCafeSeat','releaseSeat','releaseSeatOnce'];const code=names.map(name=>tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name.text===name).getText(tree)).join('\n');
 let finish;const order=[];
 const c=vm.createContext({state:{sceneId:'library',view:'focus',currentSeatId:3},identity:{sessionId:'current'},document:{hidden:false},seatRecoveryPromise:null,seatReleasePromise:null,seatReleaseRevision:0,sharedFocusScene:()=>true,currentRoomApiId:()=>'library-01',currentSeatActivity:()=>'Focusing',api:()=>new Promise(r=>{finish=r;}),fetch:async()=>{order.push('release');},clearImmersiveAutoEnter(){},stopRoomPresence(){},navigator:{},persistActiveSession(){order.push('persist');},syncCafeState:async()=>{},showToast(){},window:{dispatchEvent(){}},CustomEvent:class {}});
 vm.runInContext(code,c);const pending=c.recoverCafeSeat();const releasing=c.releaseSeat();assert.deepEqual(order,[]);finish({roomId:'library-01',seatId:3});await pending;await releasing;assert.equal(c.state.currentSeatId,null);assert.deepEqual(order,['release']);
});

test('both supported scenes dispatch directly to minimal room without legacy furniture',async()=>{
 const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');const tree=ts.createSourceFile('app.js',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const code=tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name.text==='renderRoom').getText(tree);
 let rendered=0;const c=vm.createContext({PUBLIC_CONFIG:{minimalMvp:true},state:{sceneId:'library'},sharedFocusScene:()=>true,renderMinimalRoom:()=>rendered++});
 vm.runInContext(code,c);c.renderRoom();c.state.sceneId='cafe';c.renderRoom();assert.equal(rendered,2);
});
test('losing a seat never makes a running or paused focus disappear from exit confirmation',async()=>{
 const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');const tree=ts.createSourceFile('app.js',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const c=vm.createContext({state:{view:'focus',sceneId:'library',currentSeatId:null,sessionStartedAt:100,isRunning:false}});
 vm.runInContext(tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name.text==='isActiveFocusSession').getText(tree),c);
 assert.equal(c.isActiveFocusSession(),true);c.state.view='room';assert.equal(c.isActiveFocusSession(),true);c.state.view='summary';assert.equal(c.isActiveFocusSession(),false);
});

test('late initial presence cannot restart room subscriptions after leaving',async()=>{
 const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');const tree=ts.createSourceFile('app.js',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 let finish;const events=[];const c=vm.createContext({state:{sceneId:'library',view:'room',localRoom:false},roomSyncRevision:0,sharedFocusScene:()=>true,currentRoomApiId:()=>'library-01',stopRoomPresence(){c.roomSyncRevision++;},document:{querySelector:()=>({})},syncCafeState:()=>new Promise(r=>finish=r),window:{dispatchEvent:e=>events.push(e),setInterval:()=>events.push('timer')},CustomEvent:class {}});
 vm.runInContext(tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name.text==='startCafePresence').getText(tree),c);const pending=c.startCafePresence();c.stopRoomPresence();c.state.view='island';finish();await pending;assert.deepEqual(events,[]);
});
test('first library visit preserves cafe sound defaults and later restores each place independently',async()=>{
 const defaults=()=>({sounds:{ambient:true,white:false,music:false},soundVolumes:{ambient:55,white:30,music:24},musicTrack:'rainy-notes'});
 const c=context({seatReleasePromise:null,minimalUi:{},identity:{},crypto:{randomUUID:()=> 'session'},persistIdentity(){},hasActiveSeatSession:()=>false,showToast(){},stopRoomPresence(){},suspendAudio(){},resetTimerState(){},savePreferences(){},localStorage:{setItem(){}},defaultPreferences:defaults,clampVolume:(x,f)=>Number.isFinite(Number(x))?Math.min(100,Math.max(0,Number(x))):f,FOCUS_MUSIC_TRACKS:{'rainy-notes':{}},enterCafeRoom:async()=>{c.state.view='room';c.state.roomId=c.state.sceneId+'-01';}});
 c.state={sceneId:null,...defaults()};c.preferences={...defaults(),rememberLastSound:true,rememberLastFocusView:true};
 vm.runInContext(functions(['focusSceneDefinition','sceneDefaultFocusView','rememberSceneAudio','applySceneAudioPreferences','enterMinimalScene']),c);
 await c.enterMinimalScene('library');assert.equal(c.state.soundVolumes.ambient,25);c.state.sounds.music=true;c.rememberSceneAudio();
 await c.enterMinimalScene('cafe');assert.equal(c.state.soundVolumes.ambient,55);assert.equal(c.state.sounds.music,false);
 await c.enterMinimalScene('library');assert.equal(c.state.sounds.music,true);c.state.sounds={ambient:false,white:false,music:false};
 await c.enterMinimalScene('cafe');assert.equal(Object.values(c.state.sounds).some(Boolean),false);
});

for(const fail of [false,true])test(`cloud resume restores the old place only after lease confirmation (failure=${fail})`,async()=>{
 const calls=[];const session={scene_id:'library',room_id:'library-01',seat_id:3,status:'paused',started_at:new Date().toISOString()};
 const c=context({seatReleaseRevision:0,seatRecoveryPromise:null,identity:{sessionId:'cafe-lease',displayName:'Reader',avatarSkin:1},minimalUi:{},crypto:{randomUUID:()=> 'library-lease'},persistIdentity(){},releaseSeat:async()=>{calls.push('release-cafe');c.state.currentSeatId=null;},api:async(path,options)=>{calls.push('resume-library');assert.equal(JSON.parse(options.body).preferredRoomId,'library-01');if(fail)throw new Error('session_conflict');return {roomId:'library-02',seatId:5};},suspendAudio(){},applySceneAudioPreferences(){},localStorage:{setItem(){}}});
 c.state={sceneId:'cafe',roomId:'cafe-01',currentSeatId:1};vm.runInContext(functions(['focusSceneDefinition','sceneDefaultFocusView','restoreCloudFocusPlace']),c);
 if(fail){await assert.rejects(c.restoreCloudFocusPlace(session),/session_conflict/);assert.equal(c.state.sceneId,'cafe');assert.equal(c.state.currentSeatId,null);}
 else{await c.restoreCloudFocusPlace(session);assert.equal(c.state.sceneId,'library');assert.equal(c.state.roomId,'library-02');assert.equal(c.state.currentSeatId,5);assert.equal(c.state.focusImageChoice,'alcove');}
 assert.deepEqual(calls,['release-cafe','resume-library']);
});

for(const localOrigin of [false,true])for(const fail of [false,true])test(`exiting during cloud place recovery drains its RPC before releasing (failure=${fail}, local origin=${localOrigin})`,async()=>{
 const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');const tree=ts.createSourceFile('app.js',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const releaseCode=['releaseSeat','releaseSeatOnce'].map(name=>tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name.text===name).getText(tree)).join('\n');
 let finish;const order=[];
 const c=context({identity:{sessionId:'cafe-lease',displayName:'Reader',avatarSkin:1},minimalUi:{},crypto:{randomUUID:()=> 'library-lease'},persistIdentity(){},seatReleaseRevision:0,seatReleasePromise:null,seatRecoveryPromise:null,stopRoomPresence(){},clearImmersiveAutoEnter(){},createLocalNpcLeases:()=>[],navigator:{},fetch:async url=>{order.push(url);},api:(url)=>url.endsWith('/release')?Promise.resolve({}):new Promise((resolve,reject)=>{finish=()=>fail?reject(new Error('session_conflict')):resolve({roomId:'library-02',seatId:5});}),suspendAudio(){},applySceneAudioPreferences(){},localStorage:{setItem(){}}});
 c.state={sceneId:'cafe',roomId:localOrigin?'cafe-local':'cafe-01',currentSeatId:1,view:'focus',localRoom:localOrigin,localNpcRoster:[],roomPresence:{}};
 vm.runInContext(releaseCode+'\n'+functions(['focusSceneDefinition','sceneDefaultFocusView','restoreCloudFocusPlace']),c);
 const restoring=c.restoreCloudFocusPlace({scene_id:'library',room_id:'library-01',seat_id:3,status:'paused',started_at:new Date().toISOString()});
 await new Promise(r=>setImmediate(r));const firstReleases=localOrigin?[]:['/api/sessions/cafe-lease/release'];assert.deepEqual(order,firstReleases);
 const rejected=assert.rejects(restoring,fail?/session_conflict/:/focus_place_unavailable/);
 const leaving=c.releaseSeat();c.state.view='island';c.state.sceneId=null;
 assert.equal(order.length,firstReleases.length);finish();await rejected;await leaving;
 assert.deepEqual(order,[...firstReleases,'/api/sessions/library-lease/release']);
 assert.equal(c.state.sceneId,null);assert.equal(c.state.currentSeatId,null);assert.equal(c.state.view,'island');assert.equal(c.seatRecoveryPromise,null);
});
