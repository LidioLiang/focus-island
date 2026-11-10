import {expect,test,type Page} from '@playwright/test';

async function mockRooms(page:Page,developer=false){
 let user:Record<string,unknown>={};let seat=0;const starts:string[]=[];const patches:Record<string,unknown>[]=[];
 const access={authenticated:true,accountType:'anonymous',canEnterProduct:true,canStartFocus:true,entitlementType:'none',developer};
 await page.route('**/api/auth/session',r=>r.fulfill({json:{authenticated:developer,anonymous:!developer,userId:'guest-test',developer}}));
 await page.route('**/api/auth/anonymous',r=>r.fulfill({json:{ok:true,userId:'guest-test',anonymous:true,developer:false,access}}));
 await page.route('**/api/access/status',r=>r.fulfill({json:access}));
 await page.route('**/api/scenes/cafe/allocate',r=>r.fulfill({json:{roomId:'cafe-01',mode:'online'}}));
 await page.route('**/api/rooms/cafe-01/state',r=>r.fulfill({json:{serverNow:Date.now(),leases:seat?[{...user,roomId:'cafe-01',seatId:seat,memberType:'human',state:'occupied',activity:'Seated'}]:[]}}));
 await page.route('**/api/rooms/cafe-01/seats/*/reserve',r=>{user=r.request().postDataJSON();return r.fulfill({json:{ok:true}});});
 await page.route('**/api/sessions/*/occupy',r=>{seat=r.request().postDataJSON().seatId;return r.fulfill({json:{ok:true}});});
 await page.route('**/api/sessions/*/heartbeat',r=>r.fulfill({json:{ok:true}}));
 await page.route('**/api/sessions/*/release',r=>{seat=0;return r.fulfill({json:{ok:true}});});
 await page.route('**/api/focus/sessions/start',r=>{starts.push(r.request().postDataJSON().clientSessionId);return r.fulfill({json:{session:{status:'running'}}});});
 await page.route('**/api/focus/sessions/*',r=>{if(r.request().method()!=='PATCH')return r.fallback();patches.push(r.request().postDataJSON());return r.fulfill({json:{}});});
 return {starts,patches};
}

test('guest can focus twice with no account, no fake companions, and only three timer actions',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const {starts,patches}=await mockRooms(page);
 await page.goto('/');await expect(page.locator('[data-place]')).toHaveCount(6);
 await page.locator('[data-place="library"]').focus();await expect(page.getByRole('tooltip')).toContainText('Library · Coming soon');
 await page.locator('[data-place="cafe"]').click();await expect(page.locator('button.seat.available')).toHaveCount(6);
 await expect(page.locator('.avatar-marker')).toHaveCount(0);
 await page.locator('button.seat.available').first().click();await expect(page.locator('[data-session-clock]')).toHaveText('25:00');
 expect(starts).toHaveLength(0);await expect(page.locator('.timer-actions button')).toHaveCount(3);
 await page.getByRole('button',{name:'Start',exact:true}).click();await expect.poll(()=>starts.length).toBe(1);
 await page.locator('.time-readout').hover();await page.getByRole('button',{name:'Pause',exact:true}).click();
 await expect.poll(()=>patches.some(p=>p.status==='paused')).toBe(true);
 await page.locator('[data-minimal="end"]').click();await page.locator('[data-minimal="accept-confirm"]').click();
 await expect(page.locator('[data-minimal="again"]')).toBeVisible();
 await page.locator('[data-minimal="back-island"]').click();await page.locator('[data-place="cafe"]').click();await page.locator('button.seat.available').first().click();
 await page.getByRole('button',{name:'Start',exact:true}).click();await expect.poll(()=>starts.length).toBe(2);
 expect(new Set(starts).size).toBe(2);await expect(page.locator('[data-auth-form],.paywall-dialog')).toHaveCount(0);expect(errors).toEqual([]);
});

test('developer can move an upright avatar without moving its seat button and persist it',async({page})=>{
 await mockRooms(page,true);await page.goto('/');await page.locator('[data-panel="settings"]').click();
 await page.locator('[data-minimal="layout"]').click();await expect(page.getByRole('region',{name:'Developer seat layout'})).toBeVisible();
 const avatar=page.locator('[data-layout-target="avatar"][data-layout-seat="1"]');const seat=page.locator('[data-layout-target="button"][data-layout-seat="1"]');
 const before=await seat.getAttribute('style');await avatar.focus();await avatar.press('ArrowRight');
 await page.locator('[data-minimal="save-layout"]').click();expect(await seat.getAttribute('style')).toBe(before);
 const value=await page.evaluate(()=>JSON.parse(localStorage.getItem('focusIslandMinimalSeatLayoutV1')||'null'));
 expect(value['1'].avatar[0]).toBe(28.7);expect(value['1'].button[0]).toBe(28.11);
 await page.reload();await page.locator('[data-panel="settings"]').click();await page.locator('[data-minimal="layout"]').click();
 await expect(page.locator('[data-layout-x]')).toHaveValue('28.7');
 const shape=await avatar.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {width:r.width,height:r.height,radius:s.borderRadius};});
 expect(shape.width).toBe(shape.height);expect(shape.radius).toBe('50%');
});

test('island settings work before a room and reduce motion disables marker animation',async({page})=>{
 await mockRooms(page);await page.goto('/');await page.locator('[data-panel="settings"]').click();
 await page.locator('[data-minimal-mode="50"]').click();await expect(page.locator('[data-place]')).toHaveCount(6);
 await page.locator('[data-minimal-motion]').check();await expect(page.locator('[data-minimal="layout"]')).toHaveCount(0);
 await page.locator('[data-minimal="close-panel"]').click();await page.locator('[data-place="cafe"]').click();await page.locator('button.seat.available').first().click();
 await expect(page.locator('[data-session-clock]')).toHaveText('50:00');
 await page.locator('[data-panel="sound"]').click();await page.getByLabel('White noise',{exact:true}).check();await expect(page.getByLabel('White noise',{exact:true})).toBeChecked();
});


test('all three scenes fit narrow and desktop screens with four focus tools',async({page},testInfo)=>{
 await mockRooms(page);await page.goto('/');
 await page.screenshot({path:testInfo.outputPath('island-desktop.png')});
 for(const width of [390,1280,1920]){
  await page.setViewportSize({width,height:820});
  await expect(page.locator('[data-place]')).toHaveCount(6);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.setViewportSize({width:1280,height:820});await page.locator('[data-place="cafe"]').click();
 await page.screenshot({path:testInfo.outputPath('room-desktop.png')});
 await page.locator('button.seat.available').first().click();
 await expect(page.locator('.scene-tools .tool-button')).toHaveCount(4);
 await page.screenshot({path:testInfo.outputPath('focus-desktop.png')});
 await page.locator('[data-panel="sound"]').click();
 await page.screenshot({path:testInfo.outputPath('sound-desktop.png')});
 await page.setViewportSize({width:390,height:820});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('focus-mobile.png')});
});
