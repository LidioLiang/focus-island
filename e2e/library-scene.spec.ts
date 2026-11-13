import {test,expect,type Page} from '@playwright/test';
async function mocks(page:Page,developer=false,solo=false){
 let authenticated=developer;let scene='cafe',room='cafe-01',seat=0,user:Record<string,unknown>={};const starts:Record<string,unknown>[]=[],updates:Record<string,unknown>[]=[];
 const access={authenticated:true,accountType:'anonymous',canEnterProduct:true,canStartFocus:true,entitlementType:'none',developer};
 await page.route('**/api/auth/session',r=>r.fulfill({json:{authenticated,anonymous:!developer,userId:'library-review-guest',developer}}));
 await page.route('**/api/auth/anonymous',r=>{authenticated=true;return r.fulfill({json:{ok:true,userId:'library-review-guest',anonymous:true,developer,access}});});
 await page.route('**/api/access/status',r=>r.fulfill({json:access}));
 await page.route('**/api/scenes/*/allocate',r=>{scene=r.request().url().split('/scenes/')[1].split('/')[0];room=scene+(solo?'-local':'-01');seat=0;return r.fulfill({json:{mode:solo?'local':'online',roomId:room}});});
 await page.route('**/api/rooms/*/state',r=>r.fulfill({json:{serverNow:Date.now(),leases:seat?[{...user,roomId:room,seatId:seat,memberType:'human',state:'occupied',activity:'Seated'}]:[]}}));
 await page.route('**/api/rooms/*/seats/*/reserve',r=>{user=r.request().postDataJSON();return r.fulfill({json:{ok:true}});});
 await page.route('**/api/sessions/*/occupy',r=>{seat=r.request().postDataJSON().seatId;return r.fulfill({json:{ok:true}});});
 await page.route('**/api/sessions/*/resume',r=>r.fulfill({json:{ok:true,roomId:room,seatId:seat||1}}));
 await page.route('**/api/sessions/*/heartbeat',r=>r.fulfill({json:{ok:true}}));
 await page.route('**/api/sessions/*/release',r=>{seat=0;return r.fulfill({json:{ok:true}});});
 await page.route('**/api/focus/sessions/start',r=>{starts.push(r.request().postDataJSON());return r.fulfill({json:{session:{status:'running'}}});});
 await page.route('**/api/focus/sessions/*',r=>{if(r.request().method()!=='PATCH')return r.fallback();updates.push(r.request().postDataJSON());return r.fulfill({json:{}});});
 return {starts,updates};
}
test('Academy Library six seats, independent near views, refresh recovery, and cross-scene lifecycle',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const {starts,updates}=await mocks(page);
 await page.goto('/');await page.locator('[data-place="library"]').focus();await expect(page.getByRole('tooltip')).toHaveText('Academy Library · Open now');
 await page.locator('[data-place="library"]').click();await expect(page.locator('.room-title')).toHaveText('Academy Library');await expect(page.locator('button.seat.available')).toHaveCount(6);await expect(page.locator('.avatar-marker')).toHaveCount(0);
 for(const viewport of [{width:1920,height:1080},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const bg=(await page.locator('.scene-atmosphere').boundingBox())!;expect(bg.width).toBe(viewport.width);expect(bg.height).toBe(viewport.height);
  await expect.poll(async()=> (await page.locator('.seat-button').first().boundingBox())?.width || 0).toBeGreaterThanOrEqual(44);
 }
 await page.setViewportSize({width:1280,height:820});await page.screenshot({path:info.outputPath('academy-library-room.png')});
 await page.getByRole('button',{name:'Choose seat 3',exact:true}).click();await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',/library-reading-focus/);
 await page.locator('[data-panel="scene"]').click();await expect(page.locator('[data-minimal-scene]')).toHaveCount(3);await page.locator('[data-minimal-scene="alcove"]').click();await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',/library-alcove-focus/);await page.locator('[data-minimal="close-panel"]').click();
 await page.locator('[data-panel="sound"]').click();await expect(page.getByLabel('Library ambience',{exact:true})).toBeVisible();await page.locator('[data-minimal="mute"]').click();await page.locator('[data-minimal="close-panel"]').click();
 await page.getByRole('button',{name:'Start',exact:true}).click();await expect.poll(()=>starts.length).toBe(1);expect(starts[0]).toMatchObject({sceneId:'library',roomId:'library-01',seatId:3,timerMode:25});
 await expect(page.locator('[data-session-clock]')).not.toHaveText('25:00');await page.screenshot({path:info.outputPath('academy-library-focus.png')});await page.reload();await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',/library-alcove-focus/);expect(starts).toHaveLength(1);
 await page.locator('.time-readout').hover();await page.getByRole('button',{name:'Pause',exact:true}).click();await expect.poll(()=>updates.some(u=>u.status==='paused')).toBe(true);
 await page.locator('.time-readout').hover();await page.locator('[data-minimal="end"]').click();await page.locator('[data-minimal="accept-confirm"]').click();await expect.poll(()=>updates.some(u=>u.status==='ended_early')).toBe(true);
 await page.locator('[data-minimal="back-island"]').click();await page.locator('[data-place="cafe"]').click();await page.locator('button.seat.available').first().click();await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',/cafe-window-real-focus-view/);await page.getByRole('button',{name:'Start',exact:true}).click();await expect.poll(()=>starts.length).toBe(2);expect(starts[1].sceneId).toBe('cafe');expect(errors).toEqual([]);
});
for(const mode of [50,0])test(`library solo room supports ${mode||'open'} timing without fake companions`,async({page})=>{
 const {starts}=await mocks(page,false,true);await page.goto('/');await page.locator('[data-panel="settings"]').click();await page.locator(`[data-minimal-mode="${mode}"]`).click();await page.locator('[data-minimal="close-panel"]').click();await page.locator('[data-place="library"]').click();await expect(page.getByText('Solo room',{exact:true})).toBeVisible();await expect(page.locator('.avatar-marker')).toHaveCount(0);await page.getByRole('button',{name:'Choose seat 6',exact:true}).click();await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',/library-alcove-focus/);await page.getByRole('button',{name:'Start',exact:true}).click();await expect.poll(()=>starts.length).toBe(1);expect(starts[0]).toMatchObject({sceneId:'library',roomId:'library-local',timerMode:mode});
});
test('library developer layout persists separately from cafe and exports the scene id',async({page})=>{
 await mocks(page,true);await page.goto('/');await page.locator('[data-place="library"]').click();await page.locator('[data-panel="settings"]').click();await page.locator('[data-minimal="layout"]').click();await page.getByLabel('Layout seat',{exact:true}).selectOption('6');await page.locator('[data-layout-kind="button"]').click();await page.getByLabel('Horizontal position').fill('90');await page.getByLabel('Horizontal position').dispatchEvent('change');await page.locator('[data-minimal="save-layout"]').click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('focusIslandMinimalSeatLayoutV1:library')||'null')['6'].button[0])).toBe(90);expect(await page.evaluate(()=>localStorage.getItem('focusIslandMinimalSeatLayoutV1'))).toBeNull();
 const download=page.waitForEvent('download');await page.locator('[data-minimal="export-layout"]').click();expect((await download).suggestedFilename()).toBe('focus-isle-library-seat-layout.json');
 await page.reload();await page.locator('[data-place="library"]').click();await page.locator('[data-panel="settings"]').click();await page.locator('[data-minimal="layout"]').click();await page.getByLabel('Layout seat',{exact:true}).selectOption('6');await page.locator('[data-layout-kind="button"]').click();await expect(page.getByLabel('Horizontal position')).toHaveValue('90');
});
test('resuming an old library session releases cafe and restores its actual room, seat and view',async({page})=>{
 await mocks(page);const order:string[]=[];let restoredLease='';
 const previous={client_session_id:'previous-library-focus',scene_id:'library',room_id:'library-01',seat_id:3,status:'paused',timer_mode:25,planned_seconds:1500,actual_seconds:120,paused_seconds:0,started_at:new Date(Date.now()-120000).toISOString()};
 await page.route('**/api/focus/sessions/start',r=>r.request().postDataJSON().clientSessionId===previous.client_session_id?r.fulfill({json:{session:previous,resumed:true}}):r.fulfill({status:409,json:{error:'active_session_exists'}}));
 await page.route('**/api/focus/sessions?active=1',r=>r.fulfill({json:{sessions:[previous]}}));
 await page.route('**/api/sessions/*/release',r=>{order.push('release-cafe');return r.fallback();});
 await page.route('**/api/sessions/*/resume',r=>{order.push('resume-library');expect(r.request().postDataJSON()).toMatchObject({preferredRoomId:'library-01',preferredSeatId:3,focusing:false});restoredLease=r.request().url().split('/sessions/')[1].split('/')[0];return r.fulfill({json:{ok:true,roomId:'library-02',seatId:5,moved:true}});});
 await page.route('**/api/rooms/library-02/state',r=>r.fulfill({json:{serverNow:Date.now(),leases:[{roomId:'library-02',seatId:5,sessionId:restoredLease,displayName:'Reader',avatarSkin:0,memberType:'human',state:'occupied',activity:'Seated'}]}}));
 await page.goto('/');await page.locator('[data-place="cafe"]').click();await page.getByRole('button',{name:'Choose seat 1',exact:true}).click();await page.getByRole('button',{name:'Start',exact:true}).click();
 await expect(page.locator('#focus-recovery-title')).toBeVisible();expect(await page.locator('[aria-labelledby="focus-recovery-title"]').innerText()).not.toMatch(/[\u4e00-\u9fff]/);
 await page.locator('[data-action="continue-previous-focus"]').click();await expect(page.locator('#focus-recovery-title')).toHaveCount(0);await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',/library-alcove-focus/);await expect(page.locator('[data-session-clock]')).toHaveText('23:00');expect(order).toEqual(['release-cafe','resume-library']);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('focusIslandActiveSessionV1')||'null'));expect(saved).toMatchObject({sceneId:'library',roomId:'library-02',selectedSeat:4,cloudFocusClientId:'previous-library-focus',isRunning:false});
 await page.locator('[data-minimal="back-room"]').click();await expect(page.locator('.room-title')).toHaveText('Academy Library');await expect(page.locator('.avatar-marker.is-mine')).toHaveAttribute('aria-label',/^Seat 5:/);
});
