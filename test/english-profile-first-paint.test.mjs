import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
const ast=ts.createSourceFile('app.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const fn=name=>ast.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name).getText(ast);
test('a Chinese browser generates an English MVP identity before the translation runtime loads',()=>{
 const stored={};const c=vm.createContext({window:{__FOCUS_ISLAND_CONFIG__:{minimalMvp:true},navigator:{language:'zh-CN'}},crypto:{randomUUID:()=> '55555555-5555-4555-8555-555555555555'},STORAGE_KEYS:{guestIdentity:'identity'},localStorage:{getItem(){return null;},setItem(k,v){stored[k]=v;}}});vm.runInContext(fn('getOrCreateIdentity'),c);const identity=c.getOrCreateIdentity();assert.doesNotMatch(identity.displayName,/[\u4e00-\u9fff]/);assert.equal(JSON.parse(stored.identity).displayName,identity.displayName);
});
test('legacy generated nicknames are English before hydration, while custom names remain unchanged',()=>{
 const c=vm.createContext({window:{__FOCUS_ISLAND_CONFIG__:{minimalMvp:true}}});vm.runInContext(fn('localizedIdentityDisplayName'),c);assert.equal(c.localizedIdentityDisplayName('安静的小鹿'),'Quiet Deer');assert.equal(c.localizedIdentityDisplayName('从容的灯塔'),'Calm Lighthouse');assert.equal(c.localizedIdentityDisplayName('My nickname'),'My nickname');assert.equal(c.localizedIdentityDisplayName('小梁'),'小梁');
});
