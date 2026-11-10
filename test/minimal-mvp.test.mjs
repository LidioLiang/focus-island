import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../public/minimal-mvp.js',import.meta.url),'utf8');
const ast=ts.createSourceFile('minimal.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
function fn(name){return ast.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name).getText(ast);}
test('layout validation rejects corrupted, incomplete and out-of-bounds positions',()=>{
 const c=vm.createContext({});vm.runInContext(fn('validMinimalLayout'),c);
 const good=Object.fromEntries([1,2,3,4,5,6].map(id=>[id,{avatar:[20,30],button:[30,40]}]));
 assert.equal(c.validMinimalLayout(good),true);assert.equal(Boolean(c.validMinimalLayout({})),false);
 good[1].avatar=[NaN,20];assert.equal(c.validMinimalLayout(good),false);
 good[1].avatar=[101,20];assert.equal(c.validMinimalLayout(good),false);
});
test('avatar and seat button adjustments remain independent and cannot be edited by ordinary accounts',()=>{
 const slot={seat_id:1,avatar_anchor:[20,30],hit_area:[40,50]};
 const c=vm.createContext({minimalUi:{layout:{},layoutScene:'cafe',seat:1,target:'avatar',editing:true},state:{isDeveloper:true},staticSeatSlots:[slot],sceneSeatSlots:()=>[slot],sceneLayoutStorageKey:()=>"layout",minimalUpdateLayoutFields(){},document:{querySelector(){return null;}},localStorage:{getItem(){return null;}}});
 vm.runInContext([fn('minimalSeatPosition'),fn('minimalMoveMarker')].join('\n'),c);
 c.minimalMoveMarker(25,35);assert.deepEqual(Array.from(c.minimalUi.layout[1].button),[40,50]);assert.deepEqual(Array.from(c.minimalUi.layout[1].avatar),[25,35]);
 c.state.isDeveloper=false;c.minimalMoveMarker(70,80);assert.deepEqual(Array.from(c.minimalUi.layout[1].avatar),[25,35]);
});
test('new timer shows exactly start, restart and end with native English and no reward UI',()=>{
 const c=vm.createContext({state:{sessionPhase:'focus',isRunning:false,sessionStartedAt:null},minimalUi:{timerMenu:false},minimalIcon:()=>'',formatTime:()=> '25:00'});
 vm.runInContext(fn('minimalTimerMarkup'),c);const html=c.minimalTimerMarkup();
 assert.match(html,/>Start</);assert.match(html,/>Restart</);assert.match(html,/>End session</);assert.doesNotMatch(html,/reward|streak|宠物|[\u4e00-\u9fff]/);
 assert.equal((html.match(/<nav/g)||[]).length,1);
});

test('unconfirmed and expired remote portraits never claim live focus',()=>{
 const lease={sessionId:'someone',avatarSkin:1,focusStartedAt:Date.now(),activity:'Focusing',memberType:'human',expiresAt:Date.now()+60000};
 const c=vm.createContext({state:{localRoom:false,presenceUnavailable:true,isDeveloper:false,presenceFetchedAt:Date.now()},minimalUi:{editing:false},identity:{sessionId:'me'},staticSeatSlots:[{seat_id:1}],sceneSeatSlots:()=>[{seat_id:1}],leaseForSeat:()=>lease,AVATAR_OPTIONS:[{id:1,image:'portrait.png'}],Date,accountAvatar:()=> 'portrait.png',escapeHtml:x=>x,minimalSeatPosition:()=>[20,30]});
 vm.runInContext(fn('minimalAvatarMarkup'),c);assert.equal(c.minimalAvatarMarkup(),'');
 c.state.presenceUnavailable=false;assert.match(c.minimalAvatarMarkup(),/rippling/);
 lease.expiresAt=Date.now()-1;assert.equal(c.minimalAvatarMarkup(),'');
});
