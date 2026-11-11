import {test,expect,type Page} from '@playwright/test';
async function mocks(page:Page,developer=false,solo=false){
 let scene='cafe',room='cafe-01',seat=0,user:Record<string,unknown>={};const starts:Record<string,unknown>[]=[],updates:Record<string,unknown>[]=[];
 const access={authenticated:true,accountType:'anonymous',canEnterProduct:true,canStartFocus:true,entitlementType:'none',developer};
 await page.route('**/api/auth/session',r=>r.fulfill({json:{authenticated:developer,anonymous:!developer,userId:'forest-review-guest',developer}}));
 await page.route('**/api/auth/anonymous',r=>r.fulfill({json:{ok:true,userId:'forest-review-guest',anonymous:true,developer,access}}));
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
test('Forest six seats, independent near views, refresh recovery, and cross-scene lifecycle',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const {starts,updates}=await mocks(page);
 await page.goto('/');await page.locator('[data-place="forest"]').focus();await expect(page.getByRole('tooltip')).toHaveText('Forest · Open now');
 await page.locator('[data-place="forest"]').click();await expect(page.locator('.room-title')).toHaveText('Forest');await expect(page.locator('button.seat.available')).toHaveCount(6);await expect(page.locator('.avatar-marker')).toHaveCount(0);
 for(const viewport of [{width:1920,height:1080},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const bg=(await page.locator('.scene-atmosphere').boundingBox())!;expect(bg.width).toBe(viewport.width);expect(bg.height).toBe(viewport.height);
  expect((await page.locator('.seat-button').first().boundingBox())!.width).toBeGreaterThanOrEqual(44);
 }
 await page.setViewportSize({width:1280,height:820});await page.screenshot({path:info.outputPath('forest-room.png')});
 await page.getByRole('button',{name:'Choose seat 3',exact:true}).click();await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',/forest-deep-focus/);
 await page.locator('[data-panel="scene"]').click();await expect(page.locator('[data-minimal-scene]')).toHaveCount(5);await page.locator('[data-minimal-scene="fern"]').click();await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',/forest-fern-focus/);await page.locator('[data-minimal="close-panel"]').click();
 await page.locator('[data-panel="sound"]').click();await expect(page.getByLabel('Forest breeze',{exact:true})).toBeVisible();await page.locator('[data-minimal="mute"]').click();await page.locator('[data-minimal="close-panel"]').click();
 await page.getByRole('button',{name:'Start',exact:true}).click();await expect.poll(()=>starts.length).toBe(1);expect(starts[0]).toMatchObject({sceneId:'forest',roomId:'forest-01',seatId:3,timerMode:25});
 await expect(page.locator('[data-session-clock]')).not.toHaveText('25:00');await page.screenshot({path:info.outputPath('forest-focus.png')});await page.reload();await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',/forest-fern-focus/);expect(starts).toHaveLength(1);
 await page.locator('.time-readout').hover();await page.getByRole('button',{name:'Pause',exact:true}).click();await expect.poll(()=>updates.some(u=>u.status==='paused')).toBe(true);
 await page.locator('.time-readout').hover();await page.locator('[data-minimal="end"]').click();await page.locator('[data-minimal="accept-confirm"]').click();await expect.poll(()=>updates.some(u=>u.status==='ended_early')).toBe(true);
 await page.locator('[data-minimal="back-island"]').click();await page.locator('[data-place="cafe"]').click();await page.locator('button.seat.available').first().click();await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',/cafe-window-real-focus-view/);await page.getByRole('button',{name:'Start',exact:true}).click();await expect.poll(()=>starts.length).toBe(2);expect(starts[1].sceneId).toBe('cafe');expect(errors).toEqual([]);
});
for(const mode of [50,0])test(`forest solo room supports ${mode||'open'} timing without fake companions`,async({page})=>{
 const {starts}=await mocks(page,false,true);await page.goto('/');await page.locator('[data-panel="settings"]').click();await page.locator(`[data-minimal-mode="${mode}"]`).click();await page.locator('[data-minimal="close-panel"]').click();await page.locator('[data-place="forest"]').click();await expect(page.getByText('Solo room',{exact:true})).toBeVisible();await expect(page.locator('.avatar-marker')).toHaveCount(0);await page.getByRole('button',{name:'Choose seat 6',exact:true}).click();await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',/forest-fern-focus/);await page.getByRole('button',{name:'Start',exact:true}).click();await expect.poll(()=>starts.length).toBe(1);expect(starts[0]).toMatchObject({sceneId:'forest',roomId:'forest-local',timerMode:mode});
});
test('forest developer layout persists separately from cafe and exports the scene id',async({page})=>{
 await mocks(page,true);await page.goto('/');await page.locator('[data-place="forest"]').click();await page.locator('[data-panel="settings"]').click();await page.locator('[data-minimal="layout"]').click();await page.getByLabel('Layout seat',{exact:true}).selectOption('6');await page.locator('[data-layout-kind="button"]').click();await page.getByLabel('Horizontal position').fill('90');await page.getByLabel('Horizontal position').dispatchEvent('change');await page.locator('[data-minimal="save-layout"]').click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('focusIslandMinimalSeatLayoutV1:forest')||'null')['6'].button[0])).toBe(90);expect(await page.evaluate(()=>localStorage.getItem('focusIslandMinimalSeatLayoutV1'))).toBeNull();
 const download=page.waitForEvent('download');await page.locator('[data-minimal="export-layout"]').click();expect((await download).suggestedFilename()).toBe('focus-isle-forest-seat-layout.json');
 await page.reload();await page.locator('[data-place="forest"]').click();await page.locator('[data-panel="settings"]').click();await page.locator('[data-minimal="layout"]').click();await page.getByLabel('Layout seat',{exact:true}).selectOption('6');await page.locator('[data-layout-kind="button"]').click();await expect(page.getByLabel('Horizontal position')).toHaveValue('90');
});
test('resuming an old forest session releases cafe and restores its actual room, seat and view',async({page})=>{
 await mocks(page);const order:string[]=[];let restoredLease='';
 const previous={client_session_id:'previous-forest-focus',scene_id:'forest',room_id:'forest-01',seat_id:3,status:'paused',timer_mode:25,planned_seconds:1500,actual_seconds:120,paused_seconds:0,started_at:new Date(Date.now()-120000).toISOString()};
 await page.route('**/api/focus/sessions/start',r=>r.request().postDataJSON().clientSessionId===previous.client_session_id?r.fulfill({json:{session:previous,resumed:true}}):r.fulfill({status:409,json:{error:'active_session_exists'}}));
 await page.route('**/api/focus/sessions?active=1',r=>r.fulfill({json:{sessions:[previous]}}));
 await page.route('**/api/sessions/*/release',r=>{order.push('release-cafe');return r.fallback();});
 await page.route('**/api/sessions/*/resume',r=>{order.push('resume-forest');expect(r.request().postDataJSON()).toMatchObject({preferredRoomId:'forest-01',preferredSeatId:3,focusing:false});restoredLease=r.request().url().split('/sessions/')[1].split('/')[0];return r.fulfill({json:{ok:true,roomId:'forest-02',seatId:5,moved:true}});});
 await page.route('**/api/rooms/forest-02/state',r=>r.fulfill({json:{serverNow:Date.now(),leases:[{roomId:'forest-02',seatId:5,sessionId:restoredLease,displayName:'Reader',avatarSkin:0,memberType:'human',state:'occupied',activity:'Seated'}]}}));
 await page.goto('/');await page.locator('[data-place="cafe"]').click();await page.getByRole('button',{name:'Choose seat 1',exact:true}).click();await page.getByRole('button',{name:'Start',exact:true}).click();
 await expect(page.locator('#focus-recovery-title')).toBeVisible();expect(await page.locator('[aria-labelledby="focus-recovery-title"]').innerText()).not.toMatch(/[\u4e00-\u9fff]/);
 await page.locator('[data-action="continue-previous-focus"]').click();await expect(page.locator('#focus-recovery-title')).toHaveCount(0);await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',/forest-fern-focus/);await expect(page.locator('[data-session-clock]')).toHaveText('23:00');expect(order).toEqual(['release-cafe','resume-forest']);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('focusIslandActiveSessionV1')||'null'));expect(saved).toMatchObject({sceneId:'forest',roomId:'forest-02',selectedSeat:4,cloudFocusClientId:'previous-forest-focus',isRunning:false});
 await page.locator('[data-minimal="back-room"]').click();await expect(page.locator('.room-title')).toHaveText('Forest');await expect(page.locator('.avatar-marker.is-mine')).toHaveAttribute('aria-label',/^Seat 5:/);
});

test('forest has five functional views and non-overlapping mobile seats; switching views preserves the clock and lease',async({page},info)=>{
 const {starts}=await mocks(page);await page.goto('/');await page.locator('[data-place="forest"]').click();
 for(const viewport of [{width:1280,height:720},{width:390,height:844},{width:320,height:568},{width:844,height:300},{width:844,height:390}]){
  await page.setViewportSize(viewport);await expect(page.locator('button.seat.available')).toHaveCount(6);const boxes=await page.locator('button.seat.available').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
  expect(boxes).toHaveLength(6);for(const b of boxes){expect(b.w).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.w).toBeLessThanOrEqual(viewport.width);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.y+b.h).toBeLessThanOrEqual(viewport.height);}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];expect(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y).toBe(true);}
  await page.screenshot({path:info.outputPath(`forest-room-${viewport.width}.png`)});
 }
 await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:'Choose seat 1',exact:true}).click();await page.getByRole('button',{name:'Start',exact:true}).click();
 await expect.poll(()=>starts.length).toBe(1);const leaseBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('focusIslandGuestIdentityV2')||'null').sessionId);const clockSeconds=async()=>{const t=(await page.locator('[data-session-clock]').innerText()).split(':').map(Number);return t[0]*60+t[1];};const before=await clockSeconds();
 await page.locator('[data-panel="scene"]').click();for(const key of ['root','deep','fern','sun','mist']){await page.locator(`[data-minimal-scene="${key}"]`).click();await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',new RegExp(`forest-${key}-focus`));await expect.poll(()=>page.locator('[data-focus-scene-image]').evaluate((n:HTMLImageElement)=>n.complete&&n.naturalWidth>0)).toBe(true);}
 await page.locator('[data-minimal="close-panel"]').click();await page.locator('[data-minimal="back-room"]').click();await expect(page.locator('.avatar-marker.is-mine')).toHaveCount(1);await page.locator('[data-minimal="focus-view"]').click();expect(starts).toHaveLength(1);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('focusIslandGuestIdentityV2')||'null').sessionId)).toBe(leaseBefore);await expect.poll(clockSeconds).toBeLessThan(before);expect(before-await clockSeconds()).toBeLessThan(30);await expect(page.locator('[data-focus-scene-image]')).toHaveAttribute('src',/forest-mist-focus/);await page.screenshot({path:info.outputPath('forest-misty-focus.png')});
});

test('forest desktop layout save never overlaps mobile seats; compact edits survive closing and reload',async({page})=>{
 await mocks(page,true);await page.setViewportSize({width:1440,height:900});await page.goto('/');await page.locator('[data-place="forest"]').click();await page.locator('[data-panel="settings"]').click();await page.locator('[data-minimal="layout"]').click();await page.locator('[data-minimal="save-layout"]').click();
 await page.setViewportSize({width:390,height:844});await expect(page.getByLabel('Vertical position')).toHaveValue('58');await page.getByLabel('Vertical position').fill('52');await page.getByLabel('Vertical position').dispatchEvent('change');await page.locator('[data-minimal="save-layout"]').click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('focusIslandMinimalSeatLayoutV1:forest:compact')||'null')['1'].avatar[1])).toBe(52);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('focusIslandMinimalSeatLayoutV1:forest')||'null')['1'].avatar[1])).toBe(72.5);
 await page.locator('[data-minimal="layout"]').click();await expect(page.locator('.seat-button[data-seat-id="1"]')).toHaveAttribute('style',/top:58%/);await expect(page.locator('.seat-button[data-seat-id="2"]')).toHaveAttribute('style',/top:90%/);
 await page.reload();await page.locator('[data-place="forest"]').click();await page.locator('[data-panel="settings"]').click();await page.locator('[data-minimal="layout"]').click();await expect(page.getByLabel('Vertical position')).toHaveValue('52');
});

// Mock users here are browser-test fixtures only; the product renders actual leases.
test('six forest member avatars remain separate on short and narrow canvases',async({page},info)=>{
 await mocks(page);await page.route('**/api/rooms/forest-01/state',r=>r.fulfill({json:{serverNow:Date.now(),leases:Array.from({length:6},(_,i)=>({roomId:'forest-01',seatId:i+1,sessionId:'fixture-'+i,displayName:'Test '+i,avatarSkin:i%4,memberType:'human',state:'occupied',activity:'Seated',expiresAt:Date.now()+45000}))}}));
 await page.goto('/');await page.locator('[data-place="forest"]').click();await expect(page.locator('.avatar-marker')).toHaveCount(6);
 for(const viewport of [{width:390,height:844},{width:844,height:300},{width:620,height:900}]){
  await page.setViewportSize(viewport);const boxes=await page.locator('.avatar-marker').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
  for(const b of boxes){expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.w).toBeLessThanOrEqual(viewport.width);expect(b.y+b.h).toBeLessThanOrEqual(viewport.height);}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];expect(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y).toBe(true);}
  await page.screenshot({path:info.outputPath(`forest-members-${viewport.width}-${viewport.height}.png`)});
 }
});
