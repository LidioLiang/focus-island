import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFile} from 'node:fs/promises';
const code=ts.transpileModule(await readFile(new URL('../lib/account-merge.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function harness({invalid=false,existing=null,url='https://own.supabase.co/storage/v1/object/public/profile-avatars/guest/photo.webp'}={}){
 const calls=[],copies=[];let privilegedReads=0;
 const source={display_name:'Quiet Oak',avatar_skin:2,avatar_source:'upload',avatar_url:url};
 const admin={from(){privilegedReads++;return {select(){return {eq(){return {async maybeSingle(){return {data:source};}};}};}};},storage:{from(){return {async copy(a,b){copies.push([a,b]);return {error:null};},getPublicUrl(path){return {data:{publicUrl:'https://own.supabase.co/storage/v1/object/public/profile-avatars/'+path}};}};}}};
 const exports={};const context=vm.createContext({exports,URL,require(name){if(name==='node:crypto')return {randomUUID:()=> 'unique-file'};if(name==='@/lib/supabase/admin')return {createAdminSupabaseClient:()=>admin};if(name==='@/lib/profile')return {safeAvatarUrl:x=>x};throw new Error(name);}});vm.runInContext(code,context);
 const supabase={async rpc(name,args){calls.push([name,args]);if(name==='complete_account_merge')return invalid?{error:{message:'merge_request_invalid'}}:{data:{anonymousUserId:'guest',ok:true}};if(name==='get_my_profile')return {data:existing};return {data:{},error:null};}};
 return {run:()=>exports.mergeGuestAccount(supabase,{id:'member'},'hash'),calls,copies,reads:()=>privilegedReads};
}
test('a merge token must validate before privileged profile access, and existing members retain their profile',async()=>{
 const invalid=harness({invalid:true});await assert.rejects(invalid.run,/merge_request_invalid/);assert.equal(invalid.reads(),0);
 const member=harness({existing:{display_name:'Existing member'}});await member.run();assert.equal(member.reads(),0);assert.equal(member.calls.length,2);
});
test('a new account receives the guest nickname and a photo copied into its own storage folder',async()=>{
 const h=harness();const result=await h.run();assert.equal(result.profileTransferWarning,false);assert.deepEqual(h.copies,[['guest/photo.webp','member/unique-file.webp']]);
 const saved=h.calls.find(c=>c[0]==='set_my_profile')[1];assert.equal(saved.p_display_name,'Quiet Oak');assert.equal(saved.p_avatar_skin,2);assert.equal(saved.p_avatar_url,'https://own.supabase.co/storage/v1/object/public/profile-avatars/member/unique-file.webp');
});
test('a source profile cannot cause a privileged copy of someone else’s storage object',async()=>{
 const h=harness({url:'https://own.supabase.co/storage/v1/object/public/profile-avatars/other/private.webp'});const result=await h.run();assert.equal(result.profileTransferWarning,true);assert.equal(h.copies.length,0);const saved=h.calls.find(c=>c[0]==='set_my_profile')[1];assert.equal(saved.p_avatar_url,null);assert.equal(saved.p_avatar_source,'builtin');
});
