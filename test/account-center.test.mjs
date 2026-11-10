import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../public/account-center.js',import.meta.url),'utf8');
const ast=ts.createSourceFile('account.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const fn=name=>ast.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name).getText(ast);
test('avatar URLs reject scripts, external tracking hosts, credentials and SVG data',()=>{
 const c=vm.createContext({URL,PUBLIC_CONFIG:{supabaseUrl:'https://own.supabase.co'},identity:{avatarSkin:0},AVATAR_OPTIONS:[{id:0,image:'/avatar.png'}]});vm.runInContext(fn('accountAvatar'),c);
 for(const url of ['javascript:alert(1)','data:image/svg+xml,x','https://evil.invalid/p.png','https://user:pass@avatars.githubusercontent.com/x','https://other.supabase.co/storage/v1/object/public/profile-avatars/x.webp','https://own.supabase.co/untrusted/x'])assert.equal(c.accountAvatar({avatarUrl:url}),'/avatar.png');
 for(const url of ['https://lh3.googleusercontent.com/a/photo','https://avatars.githubusercontent.com/u/1','https://own.supabase.co/storage/v1/object/public/profile-avatars/user/photo.webp'])assert.equal(c.accountAvatar({avatarUrl:url}),url);
});
test('profile changes update storage and visible seat photos without resetting focus',()=>{
 const images=[{},{}],identity={displayName:'Old',avatarSkin:0},state={isRunning:true,remainingSeconds:1234};let saves=0;
 const c=vm.createContext({identity,state,persistIdentity(){saves++;},document:{querySelectorAll(){return images;}},accountAvatar(){return 'https://avatars.githubusercontent.com/u/1';}});vm.runInContext(fn('applyAccountProfile'),c);
 c.applyAccountProfile({displayName:'New name',avatarSkin:2,avatarUrl:'https://avatars.githubusercontent.com/u/1',avatarSource:'github'});
 assert.equal(identity.displayName,'New name');assert.equal(saves,1);assert.equal(images[0].src,identity.avatarUrl);assert.equal(state.remainingSeconds,1234);assert.equal(state.isRunning,true);
});
test('new account UI contains native English and actionable errors without Chinese fallback',()=>{
 assert.doesNotMatch(source,/[\u4e00-\u9fff]/);
 const c=vm.createContext({});vm.runInContext(fn('accountMessage'),c);
 assert.match(c.accountMessage('invalid_credentials'),/email and password/);assert.match(c.accountMessage('provider_unavailable'),/isn’t available yet/);assert.doesNotMatch(c.accountMessage('secret_internal_error'),/secret_internal_error/);
});
