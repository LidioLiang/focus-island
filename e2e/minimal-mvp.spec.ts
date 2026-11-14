import {expect,test,type Page} from '@playwright/test';

async function mockRooms(page:Page,developer=false){
 let user:Record<string,unknown>={};let seat=0,scene='cafe',room='cafe-01';const starts:string[]=[];const patches:Record<string,unknown>[]=[];
 const access={authenticated:true,accountType:'anonymous',canEnterProduct:true,canStartFocus:true,entitlementType:'none',developer};
 await page.route('**/api/auth/session',r=>r.fulfill({json:{authenticated:developer,anonymous:!developer,userId:'guest-test',developer}}));
 await page.route('**/api/auth/anonymous',r=>r.fulfill({json:{ok:true,userId:'guest-test',anonymous:true,developer:false,access}}));
 await page.route('**/api/access/status',r=>r.fulfill({json:access}));
 await page.route('**/api/scenes/*/allocate',r=>{scene=r.request().url().split('/scenes/')[1].split('/')[0];room=scene+'-01';seat=0;return r.fulfill({json:{roomId:room,mode:'online'}});});
 await page.route('**/api/rooms/*/state',r=>r.fulfill({json:{serverNow:Date.now(),leases:seat?[{...user,roomId:room,seatId:seat,memberType:'human',state:'occupied',activity:'Seated'}]:[]}}));
 await page.route('**/api/rooms/*/seats/*/reserve',r=>{user=r.request().postDataJSON();return r.fulfill({json:{ok:true}});});
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
 await page.locator('[data-place="forest"]').focus();await expect(page.getByRole('tooltip')).toContainText('Forest · Open now');
 await page.locator('[data-place="cafe"]').click();await expect(page.locator('button.seat.available')).toHaveCount(6);
 await expect(page.locator('.avatar-marker')).toHaveCount(0);
 await page.locator('button.seat.available').first().click();await expect(page.locator('[data-session-clock]')).toHaveText('25:00');
 expect(starts).toHaveLength(0);await expect(page.locator('.timer-actions button')).toHaveCount(3);
 await page.getByRole('button',{name:'Start',exact:true}).click();await expect.poll(()=>starts.length).toBe(1);
 await page.locator('.time-readout').hover();await page.getByRole('button',{name:'Pause',exact:true}).click();
 await expect.poll(()=>patches.some(p=>p.status==='paused')).toBe(true);
 await page.locator('.time-readout').hover();await page.locator('[data-minimal="end"]').click();await page.locator('[data-minimal="accept-confirm"]').click();
 await expect(page.locator('[data-minimal="again"]')).toBeVisible();
 await page.locator('[data-minimal="back-island"]').click();await page.locator('[data-place="cafe"]').click();await page.locator('button.seat.available').first().click();
 await page.getByRole('button',{name:'Start',exact:true}).click();await expect.poll(()=>starts.length).toBe(2);
 expect(new Set(starts).size).toBe(2);await expect(page.locator('[data-auth-form],.paywall-dialog')).toHaveCount(0);expect(errors).toEqual([]);
});

test('confirmed seat pauses in the room before softly entering the immersive desk',async({page})=>{
 await mockRooms(page);await page.goto('/');await page.locator('[data-place="cafe"]').click();
 const started=Date.now();await page.locator('button.seat.available').first().click();
 await expect(page.locator('.avatar-marker.is-mine')).toBeVisible();
 await expect(page.getByRole('status').filter({hasText:'Seat 1 is ready. Settling in'})).toBeVisible();
 await expect(page.locator('[data-minimal="focus-view"]')).toHaveCount(0);
 await expect(page.locator('[data-session-clock]')).toHaveCount(0);
 await page.waitForTimeout(1500);await expect(page.locator('[data-session-clock]')).toHaveCount(0);
 await expect(page.locator('.minimal-seat-crossfade')).toHaveClass(/is-visible/,{timeout:1500});
 await expect(page.locator('[data-session-clock]')).toHaveText('25:00',{timeout:2000});
 expect(Date.now()-started).toBeGreaterThanOrEqual(2300);
});

test('developer moves the café avatar and seat button together and persists the shared anchor',async({page})=>{
 await mockRooms(page,true);await page.goto('/');await page.locator('[data-panel="settings"]').click();
 await page.locator('[data-minimal="layout"]').click();await expect(page.getByRole('region',{name:'Developer seat layout'})).toBeVisible();
 const avatar=page.locator('[data-layout-target="avatar"][data-layout-seat="1"]');const seat=page.locator('[data-layout-target="button"][data-layout-seat="1"]');
 await expect(seat).toHaveCount(0);await avatar.focus();await avatar.press('ArrowRight');
 const moved=await avatar.evaluate(e=>({left:e.style.left,top:e.style.top}));
 await page.locator('[data-layout-kind="button"]').click();await expect(avatar).toHaveCount(0);
 expect(await seat.evaluate(e=>({left:e.style.left,top:e.style.top}))).toEqual(moved);
 await page.locator('[data-minimal="save-layout"]').click();
 const value=await page.evaluate(()=>JSON.parse(localStorage.getItem('focusIslandMinimalSeatLayoutV1:cafe:unified')||'null'));
 expect(value['1'].avatar[0]).toBe(28.7);expect(value['1'].button).toEqual(value['1'].avatar);
 await page.reload();await page.locator('[data-panel="settings"]').click();await page.locator('[data-minimal="layout"]').click();
 await expect(page.locator('[data-layout-x]')).toHaveValue('28.7');
 await expect(avatar).toBeVisible();await expect(avatar).toHaveCSS('border-radius','50%');
 const shape=await avatar.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {width:r.width,height:r.height,radius:s.borderRadius};});
 expect(shape.width).toBeGreaterThan(0);expect(shape.width).toBe(shape.height);
});

for (const sceneId of ['cafe','library'] as const) for (const viewport of [{width:1920,height:1080},{width:390,height:844},{width:844,height:390}]) {
 test(`${sceneId} selection replaces the marker in place at ${viewport.width}x${viewport.height}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);await mockRooms(page);
  // Legacy developer layouts must not split the new marker back into two positions.
  await page.addInitScript(id=>{const key=id==='cafe'?'focusIslandMinimalSeatLayoutV1':'focusIslandMinimalSeatLayoutV1:library';localStorage.setItem(key,JSON.stringify(Object.fromEntries([1,2,3,4,5,6].map(seat=>[seat,{avatar:[10,10],button:[90,90]}]))));},sceneId);
  await page.goto('/');await page.locator(`[data-place="${sceneId}"]`).click();
  const markers=page.locator('.seat-button');await expect(markers).toHaveCount(6);
  for (const marker of await markers.all()) {
   const geometry=await marker.evaluate(el=>{const r=el.getBoundingClientRect(),stem=getComputedStyle(el.querySelector('.seat-stem')!);return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===el,stemWidth:stem.width,stemColor:stem.backgroundColor};});
   expect(geometry.hit).toBe(true);expect(geometry.x).toBeGreaterThanOrEqual(0);expect(geometry.y).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(viewport.width);expect(geometry.bottom).toBeLessThanOrEqual(viewport.height);
   expect(geometry.stemWidth).toBe('1px');expect(geometry.stemColor).toBe('rgba(248, 253, 255, 0.38)');
  }
  await page.screenshot({path:testInfo.outputPath(`${sceneId}-empty-markers.png`)});
  const button=page.locator('.seat-button[data-seat-id="3"]'),before=(await button.boundingBox())!;
  await button.click();const avatar=page.locator('.avatar-marker.is-mine[data-seat-id="3"]');await expect(avatar).toBeVisible();
  const after=(await avatar.boundingBox())!;
  for (const key of ['x','y','width','height'] as const) expect(Math.abs(after[key]-before[key])).toBeLessThan(.6);
  await expect(button).toHaveCount(0);await expect(avatar.locator('.seat-stem')).toHaveCount(1);
  await page.screenshot({path:testInfo.outputPath(`${sceneId}-selected-marker.png`)});
  await expect(page.locator('[data-session-clock]')).toHaveText('25:00');
 });
}

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

test('requested controls stay centered, ordered and on one row with actions below the clock', async ({page},testInfo)=>{
 await mockRooms(page);await page.goto('/');
 await expect(page.locator('.map-pin .pin-outline')).toHaveCount(6);
 await expect(page.locator('.map-pin .pin-center')).toHaveCount(6);
 await page.screenshot({path:testInfo.outputPath('mist-teardrop-map-pins.png')});
 await page.locator('[data-place="cafe"]').click();
 await expect(page.locator('.static-seat-room')).toBeVisible();await expect(page.locator('.seat-button')).toHaveCount(6);
 for(const viewport of [{width:2048,height:1017},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  const geometry=await page.locator('.seat-button').evaluateAll(nodes=>nodes.map(button=>{
   const b=button.getBoundingClientRect(),i=button.querySelector('svg')!.getBoundingClientRect();
   return {dx:Math.abs(b.x+b.width/2-i.x-i.width/2),dy:Math.abs(b.y+b.height/2-i.y-i.height/2),round:Math.abs(b.width-b.height)};
  }));
  for(const g of geometry){expect(g.dx).toBeLessThan(.6);expect(g.dy).toBeLessThan(.6);expect(g.round).toBeLessThan(.6);}
  await expect(page.locator('.scene-atmosphere')).toBeVisible();
  await expect(page.locator('#app')).toHaveCSS('filter','none');await expect(page.locator('#app')).toHaveCSS('pointer-events','auto');
  const atmosphere=await page.locator('.scene-atmosphere').boundingBox();
  expect(atmosphere?.width).toBe(viewport.width);expect(atmosphere?.height).toBe(viewport.height);
  const art=await page.locator('.room-stage').boundingBox();
  expect(art!.width).toBeLessThanOrEqual(viewport.width+.5);expect(art!.height).toBeLessThanOrEqual(viewport.height+.5);
  expect(art!.width/art!.height).toBeCloseTo(1672/941,2);
 }
 await page.setViewportSize({width:1280,height:820});
 await page.screenshot({path:testInfo.outputPath('room-glass-fill.png')});
 await page.locator('button.seat.available').first().click();
 await expect(page.locator('.back-button')).toHaveText('');
 await expect(page.locator('.back-button')).toHaveAttribute('aria-label','Back to room');
 expect(await page.locator('.scene-tools button').evaluateAll(nodes=>nodes.map(n=>(n as HTMLElement).dataset.panel))).toEqual(['scene','sound','settings','avatar']);
 const arrow=await page.locator('.back-button').evaluate(button=>{
  const b=button.getBoundingClientRect(),icon=button.querySelector('svg')!,i=icon.getBoundingClientRect(),p=icon.querySelector('path')!.getBBox();
  return {dx:Math.abs(b.x+b.width/2-i.x-i.width/2),dy:Math.abs(b.y+b.height/2-i.y-i.height/2),pathX:p.x+p.width/2,pathY:p.y+p.height/2};
 });
 expect(arrow.dx).toBeLessThan(.6);expect(arrow.dy).toBeLessThan(.6);expect(arrow.pathX).toBe(12);expect(arrow.pathY).toBe(12);
 for(const width of [1280,390,320]){
  await page.setViewportSize({width,height:820});
  await page.locator('.time-readout').hover();
  const clock=await page.locator('.time-readout').boundingBox(),actions=await page.locator('.timer-actions').boundingBox();
  expect(actions!.y).toBeGreaterThanOrEqual(clock!.y+clock!.height);expect(actions!.y+actions!.height).toBeLessThanOrEqual(820);
  expect(actions!.x).toBeGreaterThanOrEqual(0);expect(actions!.x+actions!.width).toBeLessThanOrEqual(width);
  await page.locator('[data-panel="settings"]').click();
  const modes=await page.locator('[data-minimal-mode]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right};}));
  expect(modes).toHaveLength(3);expect(Math.max(...modes.map(m=>m.y))-Math.min(...modes.map(m=>m.y))).toBeLessThan(.6);
  expect(modes[2].right).toBeLessThanOrEqual(width);await page.locator('[data-minimal="close-panel"]').click();
 }
 await page.setViewportSize({width:1280,height:820});await page.locator('.time-readout').hover();
 await page.screenshot({path:testInfo.outputPath('timer-below-controls.png')});
});

test('developer panel can move and collapse while seat six remains draggable',async({page},testInfo)=>{
 await page.setViewportSize({width:2048,height:1017});await mockRooms(page,true);await page.goto('/');
 await page.locator('[data-panel="settings"]').click();await page.locator('[data-minimal="layout"]').click();
 await page.getByLabel('Layout seat',{exact:true}).selectOption('6');await page.locator('[data-layout-kind="button"]').click();
 const marker=page.locator('[data-layout-target="button"][data-layout-seat="6"]');
 expect(await marker.evaluate(n=>{const r=n.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-layout-target]')===n;})).toBe(true);
 const before=Number(await page.getByLabel('Horizontal position').inputValue()),r=(await marker.boundingBox())!;
 await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2+25,r.y+r.height/2-15,{steps:5});await page.mouse.up();
 await expect.poll(async()=>Number(await page.getByLabel('Horizontal position').inputValue())).toBeGreaterThan(before);
 const handle=page.locator('[data-layout-panel-handle]'),h=(await handle.boundingBox())!;
 await page.mouse.move(h.x+100,h.y+15);await page.mouse.down();await page.mouse.move(h.x+400,h.y+45,{steps:6});await page.mouse.up();
 await expect.poll(async()=>(await handle.boundingBox())!.x).toBeGreaterThan(h.x+200);
 await page.getByRole('button',{name:'Collapse layout tools',exact:true}).click();await expect(page.locator('.minimal-layout-tools')).toHaveClass(/is-collapsed/);
 expect(await marker.evaluate(n=>{const r=n.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-layout-target]')===n;})).toBe(true);
 await page.getByRole('button',{name:'Expand layout tools',exact:true}).click();await page.locator('[data-minimal="save-layout"]').click();
 await page.screenshot({path:testInfo.outputPath('seat-six-movable-inspector.png')});
});

test('native focus controls respond to the first click without rebuilding the panel', async ({page}) => {
 await mockRooms(page);await page.goto('/');
 await page.locator('[data-place="cafe"]').click();await page.locator('button.seat.available').first().click();
 await page.locator('[data-panel="settings"]').click();
 const control=page.locator('[data-minimal-motion]');
 await control.evaluate(e=>e.setAttribute('data-click-proof','kept'));
 await control.click();
 await expect(control).toBeChecked();await expect(control).toHaveAttribute('data-click-proof','kept');
 await expect(page.locator('#minimal-panel')).toBeVisible();
 await page.locator('[data-panel="sound"]').click();
 const sound=page.getByLabel('White noise',{exact:true});await sound.click();await expect(sound).toBeChecked();
 await expect(page.locator('#minimal-panel')).toBeVisible();
});

test('a pressed seat survives the first snapshot and atomic entry does not wait for another snapshot', async ({page}) => {
 await mockRooms(page);
 let snapshot: import('@playwright/test').Route|undefined;
 let claim: import('@playwright/test').Route|undefined;
 let claims=0,occupies=0;
 await page.route('**/api/rooms/cafe-01/state',r=>{snapshot=r;});
 await page.route('**/api/rooms/cafe-01/seats/*/reserve',r=>{claims++;claim=r;});
 await page.route('**/api/sessions/*/occupy',r=>{occupies++;return r.fulfill({json:{ok:true}});});
 await page.goto('/');await page.locator('[data-place="cafe"]').click();
 const seat=page.locator('[data-seat="0"]');await expect(seat).toBeVisible();
 await expect.poll(()=>Boolean(snapshot)).toBe(true);
 const box=await seat.boundingBox();if(!box)throw new Error('seat missing');
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 await seat.evaluate(e=>e.setAttribute('data-click-proof','kept'));
 await snapshot!.fulfill({json:{serverNow:Date.now(),leases:[]}});
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 await expect(seat).toHaveAttribute('data-click-proof','kept');
 await page.mouse.up();await expect.poll(()=>claims).toBe(1);
 await expect(page.getByRole('status').filter({hasText:'Preparing seat 1'})).toBeVisible();
 await expect(seat).toBeDisabled();await expect(page.locator('[data-session-clock]')).toHaveCount(0);
 await seat.dispatchEvent('click');expect(claims).toBe(1);
 expect(claim!.request().postDataJSON().occupyImmediately).toBe(true);
 await claim!.fulfill({json:{ok:true,state:'occupied',roomId:'cafe-01',seatId:1,expiresAt:Date.now()+45000}});
 await expect(page.locator('[data-session-clock]')).toHaveText('25:00');expect(occupies).toBe(0);
 // The background snapshot deliberately remains pending throughout this assertion.
});

test('a rejected atomic seat claim stays in the room and allows another seat', async ({page}) => {
 await mockRooms(page);let calls=0;
 await page.route('**/api/rooms/cafe-01/seats/*/reserve',r=>{
  calls++;return calls===1?r.fulfill({status:409,json:{error:'seat_taken'}}):r.fulfill({json:{ok:true,state:'occupied',roomId:'cafe-01',seatId:2}});
 });
 await page.goto('/');await page.locator('[data-place="cafe"]').click();await page.locator('[data-seat="0"]').click();
 await expect(page.locator('[data-session-clock]')).toHaveCount(0);await expect(page.locator('[data-seat="1"]')).toBeEnabled();
 await page.locator('[data-seat="1"]').click();await expect(page.locator('[data-session-clock]')).toHaveText('25:00');expect(calls).toBe(2);
});

test('slow start gives immediate feedback and ignores repeat clicks and navigation', async ({page}) => {
 await mockRooms(page);let start:import('@playwright/test').Route|undefined;let starts=0;
 await page.route('**/api/focus/sessions/start',r=>{starts++;start=r;});
 await page.goto('/');await page.locator('[data-place="cafe"]').click();await page.locator('button.seat.available').first().click();
 const button=page.getByRole('button',{name:'Start',exact:true});await button.click();
 await expect.poll(()=>starts).toBe(1);await expect(button).toBeDisabled();
 await expect(page.getByRole('status').filter({hasText:'Starting your focus session'})).toBeVisible();
 await button.dispatchEvent('click');await page.locator('[data-minimal="back-room"]').click();
 await expect(page.locator('[data-session-clock]')).toBeVisible();expect(starts).toBe(1);
 await start!.fulfill({json:{session:{status:'running'}}});
 await page.locator('.time-readout').hover();await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeVisible();expect(starts).toBe(1);
});

test('island artwork fills portrait, desktop and ultrawide screens without blur or clipped entry controls',async({page},testInfo)=>{
 await mockRooms(page);await page.goto('/');
 for(const [width,height] of [[390,844],[360,800],[768,1024],[1280,800],[1920,1080],[3440,1440],[844,390]]){
  await page.setViewportSize({width,height});
  const art=page.locator('.island-panorama');
  await expect(art).toBeVisible();await expect.poll(()=>art.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);
  await expect.poll(()=>art.evaluate((e:HTMLImageElement)=>e.currentSrc)).toContain(height>width?'expanded-portrait.webp':width/height>=2?'detail-wide.webp':'detail-landscape.webp');
  const image=await art.evaluate((e:HTMLImageElement)=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,filter:getComputedStyle(e).filter,src:e.currentSrc,width:r.width,naturalWidth:e.naturalWidth};});
  expect(image.x).toBeLessThanOrEqual(1);expect(image.y).toBeLessThanOrEqual(1);
  expect(image.right).toBeGreaterThanOrEqual(width-1);expect(image.bottom).toBeGreaterThanOrEqual(height-1);
  expect(image.filter).toBe('none');expect(image.src).toContain(height>width?'expanded-portrait.webp':width/height>=2?'detail-wide.webp':'detail-landscape.webp');
  // Guard against restoring the oversized square camera that caused the blur.
  if(width===1920){expect(image.naturalWidth).toBeGreaterThanOrEqual(1672);expect(image.width/image.naturalWidth).toBeLessThan(1.16);}
  if(width===3440){expect(image.naturalWidth).toBeGreaterThanOrEqual(1586);expect(image.width).toBeLessThanOrEqual(width+1);}
  await expect(page.locator('.scene-atmosphere')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const pins=await page.locator('[data-place]').evaluateAll(nodes=>nodes.map(node=>{
   const r=node.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
   return {id:node.getAttribute('data-place'),x:r.x,y:r.y,right:r.right,bottom:r.bottom,hit:hit?.closest('[data-place]')===node};
  }));
  expect(pins).toHaveLength(6);
  for(const pin of pins){expect(pin.x,`${pin.id} left at ${width}x${height}`).toBeGreaterThanOrEqual(0);expect(pin.y,`${pin.id} top`).toBeGreaterThanOrEqual(0);expect(pin.right).toBeLessThanOrEqual(width);expect(pin.bottom).toBeLessThanOrEqual(height);expect(pin.hit,`${pin.id} clickable at ${width}x${height}`).toBe(true);}
  if([390,1920,3440].includes(width))await page.screenshot({path:testInfo.outputPath(`fullscreen-island-${width}x${height}.png`)});
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('[data-place="cafe"]').click();await expect(page.locator('button.seat.available')).toHaveCount(6);
 await page.getByRole('button',{name:'Back to island',exact:true}).click();await expect(page.locator('.island-panorama')).toBeVisible();
});


test('a failed online start offers local focus and preserves the ambiguous session ID',async({page})=>{
 await mockRooms(page);let attempted='';
 await page.route('**/api/focus/sessions/start',r=>{attempted=r.request().postDataJSON().clientSessionId;return r.fulfill({status:503,json:{error:'focus_start_failed'}});});
 await page.goto('/');await page.locator('[data-place="cafe"]').click();await page.locator('button.seat.available').first().click();await page.getByRole('button',{name:'Start',exact:true}).click();
 await page.getByRole('button',{name:'Continue locally'}).click();await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeVisible();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('focusIslandActiveSessionV1') || 'null'));
 expect(saved.offlineFocus).toBe(true);expect(saved.ownerUserId).toBe('guest-test');expect(saved.cloudFocusClientId).toBe(attempted);expect(saved.roomId).toBe('cafe-local');
});
