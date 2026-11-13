import {test,expect,type Page} from '@playwright/test';
async function setup(page:Page){
 let profile={displayName:'Quiet Oak',avatarSkin:1,avatarUrl:null as string|null,avatarSource:'builtin'};let signedIn=false;const saves:unknown[]=[];
 await page.route('**/api/auth/session',r=>r.fulfill({json:{authenticated:true,anonymous:!signedIn,userId:'guest-account',developer:false,profile}}));
 await page.route('**/api/access/status',r=>r.fulfill({json:{authenticated:true,canEnterProduct:true,canStartFocus:true,developer:false,accountType:signedIn?'permanent':'anonymous'}}));
 await page.route('**/api/auth/providers',r=>r.fulfill({json:{providers:{google:true,apple:false,github:true,email:true}}}));
 await page.route('**/api/profile',r=>{if(r.request().method()==='PATCH'){const d=r.request().postDataJSON();saves.push(d);profile={...profile,...d};return r.fulfill({json:{profile}});}return r.fulfill({json:{profile,anonymous:!signedIn,email:signedIn?'demo@example.test':null,providers:signedIn?['email']:[],providerPhotos:[]}});});
 await page.route('**/api/auth/merge/prepare',r=>r.fulfill({json:{mergeToken:'test-only-merge-token'}}));
 await page.route('**/api/auth/merge/complete',r=>r.fulfill({json:{ok:true}}));
 await page.route('**/api/auth/sign-in',r=>{signedIn=true;return r.fulfill({json:{ok:true,userId:'guest-account',developer:false,access:{authenticated:true,canEnterProduct:true,canStartFocus:true,accountType:'permanent'}}});});
 await page.goto('/');await page.locator('[data-panel="settings"]').click();await page.locator('[data-minimal="account"]').click();await expect(page.getByRole('heading',{name:'Profile',exact:true})).toBeVisible();await expect(page.getByLabel('Display name',{exact:true})).toHaveValue('Quiet Oak');return {saves};
}
test('profile is English, readable and responsive, and persists nickname plus avatar',async({page},testInfo)=>{
 const {saves}=await setup(page);
 await page.getByLabel('Display name',{exact:true}).fill('River Finch');await page.getByRole('button',{name:'Moonlight',exact:true}).click();await page.getByRole('button',{name:'Save changes'}).click();
 await expect(page.getByRole('status')).toContainText('profile is saved');expect(saves).toHaveLength(1);expect(saves[0]).toMatchObject({displayName:'River Finch',avatarSkin:3,avatarSource:'builtin'});
 for(const tab of ['Profile','Sign-in & security','Preferences','Focus history']){
  await page.getByRole('button',{name:tab,exact:true}).click();expect(await page.locator('.account-center').innerText()).not.toMatch(/[\u4e00-\u9fff]/);
 }
 await page.getByRole('button',{name:'Profile',exact:true}).click();
 const color=await page.locator('.ac-sidebar nav button').first().evaluate(e=>getComputedStyle(e).color);expect(color).not.toBe('rgb(255, 255, 255)');
 await page.screenshot({path:testInfo.outputPath('profile-desktop.png')});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('profile-mobile.png')});
 await page.getByRole('button',{name:'Close profile'}).click();await page.locator('[data-panel="settings"]').click();await page.locator('[data-minimal="account"]').click();await expect(page.getByLabel('Display name',{exact:true})).toHaveValue('River Finch');
});
test('social availability is truthful and email sign-in has no legacy Chinese states',async({page})=>{
 await setup(page);await page.getByRole('button',{name:'Sign-in & security',exact:true}).click();
 await expect(page.getByRole('button',{name:'Continue with Google'})).toBeEnabled();await expect(page.getByRole('button',{name:'Continue with Apple'})).toHaveCount(0);await expect(page.getByRole('button',{name:'Continue with GitHub'})).toHaveCount(0);
 await page.getByLabel('Email address').fill('demo@example.test');await page.getByLabel('Password',{exact:true}).fill('Test-fixture-only');await page.getByRole('button',{name:'Sign in with email'}).click();
 await expect(page.getByRole('status')).toContainText('You’re signed in');await expect(page.locator('.ac-identity')).toContainText('Member');expect(await page.locator('.account-center').innerText()).not.toMatch(/[\u4e00-\u9fff]/);
});

test('a failed registration preserves the guest transfer for a later email sign-in',async({page})=>{
 await setup(page);let prepared=0;let consumed='';
 const token='a-test-only-one-time-merge-token-123456789';
 await page.route('**/api/auth/merge/prepare',r=>{prepared++;return r.fulfill({json:{mergeToken:token}});});
 await page.route('**/api/auth/merge/complete',r=>{consumed=r.request().postDataJSON().mergeToken;return r.fulfill({json:{ok:true}});});
 await page.route('**/api/auth/sign-up',r=>r.fulfill({status:400,json:{error:'email_already_registered'}}));
 await page.getByRole('button',{name:'Sign-in & security',exact:true}).click();await page.getByRole('button',{name:'Create account',exact:true}).click();
 await page.getByLabel('Email address').fill('demo@example.test');await page.getByLabel('Password',{exact:true}).fill('Test-password1!');await page.getByLabel('Confirm password',{exact:true}).fill('Test-password1!');
 await page.locator('[data-center-form="sign-up"] button[type="submit"]').click();await expect(page.locator('.account-center').getByRole('alert')).toContainText('already uses that email');
 await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByLabel('Email address').fill('demo@example.test');await page.getByLabel('Password',{exact:true}).fill('Test-password1!');await page.getByRole('button',{name:'Sign in with email'}).click();
 await expect(page.getByRole('status')).toContainText('You’re signed in');expect(prepared).toBe(1);expect(consumed).toBe(token);
});
