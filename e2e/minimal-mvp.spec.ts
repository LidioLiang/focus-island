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
 await page.locator('[data-place="forest"]').focus();await expect(page.getByRole('tooltip')).toContainText('Forest · Coming soon');
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
 await expect(avatar).toBeVisible();await expect(avatar).toHaveCSS('border-radius','50%');
 const shape=await avatar.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {width:r.width,height:r.height,radius:s.borderRadius};});
 expect(shape.width).toBeGreaterThan(0);expect(shape.width).toBe(shape.height);
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
