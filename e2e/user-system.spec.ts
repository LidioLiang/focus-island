import { test, expect } from '@playwright/test';

test('cloud history follows the signed-in owner and does not transfer on sign-out',async({page})=>{
 let member=true;
 const imports:unknown[]=[];
 await page.route('**/api/auth/session',r=>r.fulfill({json:member?{authenticated:true,anonymous:false,userId:'member-a'}:{authenticated:false}}));
 await page.route('**/api/auth/providers',r=>r.fulfill({json:{providers:{email:true,google:false}}}));
 await page.route('**/api/profile',r=>r.fulfill({json:{anonymous:false,email:'a@example.test',providers:['email'],profile:{displayName:'Member A',avatarSkin:0},providerPhotos:[]}}));
 await page.route('**/api/focus/sessions**',r=>{if(r.request().method()==='POST')imports.push(r.request().postDataJSON());return r.fulfill({json:{userId:'member-a',hasMore:false,sessions:[{client_session_id:'cloud-session-a',status:'completed',scene_id:'cafe',timer_mode:25,planned_seconds:1500,actual_seconds:1500,started_at:new Date().toISOString(),ended_at:new Date().toISOString()}]}});});
 await page.route('**/api/auth/sign-out',r=>{member=false;return r.fulfill({json:{ok:true}});});
 await page.goto('/');await page.locator('[data-panel="settings"]').click();await page.locator('[data-minimal="account"]').click();await page.getByRole('button',{name:'Focus history',exact:true}).click();
 await expect(page.locator('.ac-history')).toContainText('25 min');
 await page.getByRole('button',{name:'Sign-in & security',exact:true}).click();await page.getByRole('button',{name:'Sign out on this device'}).click();
 await expect(page.locator('.ac-identity')).toContainText('Guest');await page.getByRole('button',{name:'Focus history',exact:true}).click();await expect(page.locator('.ac-history')).toHaveCount(0);expect(imports).toHaveLength(0);
});

test('recovery callback opens the password form and submits matching passwords',async({page})=>{
 await page.route('**/api/auth/session',r=>r.fulfill({json:{authenticated:false}}));
 await page.route('**/api/auth/providers',r=>r.fulfill({json:{providers:{email:true}}}));
 let password='';await page.route('**/api/auth/password/recover',r=>{password=r.request().postDataJSON().password;return r.fulfill({json:{ok:true}});});
 await page.goto('/?account=reset-password');await expect(page.getByRole('heading',{name:'Choose a new password'})).toBeVisible();
 await page.getByLabel('New password',{exact:true}).fill('New-test-password1!');await page.getByLabel('Confirm password',{exact:true}).fill('New-test-password1!');await page.getByRole('button',{name:'Save new password'}).click();
 await expect(page.locator('.ac-feedback')).toContainText('Password updated');expect(password).toBe('New-test-password1!');
});

test('forgot password provides a real email request and unavailable providers are absent',async({page})=>{
 await page.route('**/api/auth/session',r=>r.fulfill({json:{authenticated:false}}));await page.route('**/api/auth/providers',r=>r.fulfill({json:{providers:{email:true,google:false,apple:false,github:false}}}));
 let sent=false;await page.route('**/api/auth/password/reset',r=>{sent=true;return r.fulfill({json:{ok:true}});});
 await page.goto('/');await page.locator('[data-panel="settings"]').click();await page.locator('[data-minimal="account"]').click();await page.getByRole('button',{name:'Sign-in & security',exact:true}).click();await expect(page.locator('.ac-provider')).toHaveCount(0);await page.getByRole('button',{name:'Forgot password?'}).click();await page.getByLabel('Email address').fill('a@example.test');await page.getByRole('button',{name:'Send reset link'}).click();await expect(page.locator('.ac-feedback')).toContainText('reset link');expect(sent).toBe(true);
});
