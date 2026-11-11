/* Focus Isle shared scenes: presentation-only layer. Seat, focus and authorization stay in app.js/API/RPC. */
const MINIMAL_LAYOUT_KEY = "focusIslandMinimalSeatLayoutV1";
const minimalUi = { panel: null, layout: null, editing: false, target: "avatar", seat: 1, confirm: null, busy: false, timerMenu: false, identity: null };
let minimalDrag = null;
let minimalPanelDrag = null;
let minimalIgnoreClick = 0;
let minimalPresenceExpiryTimer = null;

function minimalIcon(name) {
  const paths = {
    back: '<path d="M19 12H5m7-7-7 7 7 7"/>',
    sound: '<path d="m11 5-6 4H2v6h3l6 4V5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
    settings: '<path d="m10 3-.5 3-2 .9L5 6 3 9l2 2v2l-2 2 2 3 2.5-.9 2 .9.5 3h4l.5-3 2-.9 2.5.9 2-3-2-2v-2l2-2-2-3-2.5.9-2-.9L14 3Z"/><circle cx="12" cy="12" r="3"/>',
    scene: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="16" cy="9" r="1"/><path d="m4 17 5-6 4 4 3-2 5 5"/>',
    coffee: '<path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5ZM16 10h2a3 3 0 0 1 0 6h-2M7 3v3M12 3v3M3 22h16"/>',
    book: '<path d="M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2ZM12 6v15"/>',
    forest: '<path d="m12 2-5 6h3l-5 6h4l-4 5h14l-4-5h4l-5-6h3ZM12 19v3"/>',
    lake: '<path d="M2 6q3-3 6 0t6 0 8 0M2 12q3-3 6 0t6 0 8 0M2 18q3-3 6 0t6 0 8 0"/>',
    sea: '<path d="M2 17c6 0 5-11 12-11 7 0 8 10 3 10-5 0-4-6-1-5M2 21q4-3 8 0t12 0"/>',
    mountain: '<path d="m2 20 8-15 5 9 3-5 4 11ZM7 11l3 2 3-2"/>',
    play: '<path d="m8 5 11 7-11 7Z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
    restart: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>', end: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    plus: '<path d="M5 12h14M12 5v14"/>', minus: '<path d="M5 12h14"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m4 12 5 5L20 6"/>', move: '<path d="M12 2v20M2 12h20m-6-6-4-4-4 4m8 12-4 4-4-4M6 8l-4 4 4 4m12-8 4 4-4 4"/>',
    rain: '<path d="M7 15a5 5 0 1 1 2-9 5 5 0 0 1 9 1 4 4 0 0 1 0 8M8 18l-1 3m6-3-1 3m6-3-1 3"/>',
    music: '<path d="M9 17V5l11-2v12M9 6l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
    noise: '<path d="M3 10v4M7 6v12M11 3v18M15 7v10M19 5v14M23 10v4"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.plus}</svg>`;
}

function validMinimalLayout(value) {
  return value && typeof value === "object" && [1,2,3,4,5,6].every(id => ["avatar","button"].every(key => Array.isArray(value[id]?.[key]) && value[id][key].length === 2 && value[id][key].every(n => Number.isFinite(n) && n >= 0 && n <= 100)));
}

function minimalSeatPosition(slot, target) {
  if (!minimalUi.layout || minimalUi.layoutScene !== (state.sceneId || "cafe") || minimalUi.layoutKey !== sceneLayoutStorageKey()) {
    minimalUi.layoutScene = state.sceneId || "cafe";
    minimalUi.layoutKey = sceneLayoutStorageKey();
    try { const saved = JSON.parse(localStorage.getItem(sceneLayoutStorageKey()) || "null"); minimalUi.layout = validMinimalLayout(saved) ? saved : {}; }
    catch (_) { minimalUi.layout = {}; }
  }
  const custom = minimalUi.layout[slot.seat_id]?.[target];
  if (custom) return custom;
  const point = target === "avatar" ? slot.avatar_anchor : slot.hit_area;
  // Stagger the six controls on compact forest canvases. The editor sees the same
  // coordinates as visitors, and explicitly saved coordinates always win.
  return sceneUsesCompactLayout()
    ? [point[0], slot.seat_id % 2 ? 58 : 90] : point;
}

function minimalTool(panel, name, avatar = false) {
  const image = AVATAR_OPTIONS.find(item => item.id === Number(identity.avatarSkin)) || AVATAR_OPTIONS[0];
  return `<div class="tool-wrap"><button type="button" class="tool-button ${avatar ? "avatar-tool" : ""}" data-minimal="panel" data-panel="${panel}" aria-label="${name}" aria-expanded="${minimalUi.panel === panel}" aria-controls="minimal-panel">${avatar ? `<img src="${escapeHtml(accountAvatar())}" alt="">` : minimalIcon(panel === "scene" ? "scene" : panel)}</button><span class="tool-tip">${name}</span></div>`;
}

function minimalHeader(view) {
  const left = view === "island" ? '<span class="wordmark">Focus Isle</span>' : `<button type="button" class="back-button" data-minimal="${view === "focus" ? "back-room" : "back-island"}" aria-label="${view === "focus" ? "Back to room" : "Back to island"}">${minimalIcon("back")}</button>${view === "room" ? `<span class="room-title">${escapeHtml(sceneLabel())}</span>` : ""}`;
  const tools = view === "focus"
    ? minimalTool("scene", "Scene") + minimalTool("sound", "Sound") + minimalTool("settings", "Settings") + minimalTool("avatar", "Your avatar", true)
    : (view !== "island" ? minimalTool("sound", "Sound") : "") + minimalTool("settings", "Settings") + (view === "room" ? minimalTool("avatar", "Your avatar", true) : "");
  return `<header class="scene-header chrome"><div class="scene-left">${left}</div><nav class="scene-tools" aria-label="View controls">${tools}</nav></header>`;
}

function minimalBackdrop(image) {
  return `<div class="scene-atmosphere" aria-hidden="true"><img src="${image}" alt="" draggable="false"></div>`;
}

function minimalMapPin(icon) {
  return `<span class="pin-face"><svg class="pin-shape" viewBox="0 0 48 64" aria-hidden="true"><path class="pin-outline" d="M24 63C19 56 1 38 1 24a23 23 0 0 1 46 0c0 14-18 32-23 39Z"/><circle class="pin-ring" cx="24" cy="24" r="15"/><circle class="pin-center" cx="24" cy="24" r="11"/></svg><span class="pin-glyph">${minimalIcon(icon)}</span></span>`;
}

function minimalShell(view, content) {
  document.body.classList.add("minimal-mvp");
  app.dataset.view = view;
  app.innerHTML = `<section class="view minimal-root ${view === "room" ? "static-seat-room" : ""}" data-no-auto-i18n data-reduced="${Boolean(preferences.reduceMotion)}" data-view="${view === "room" ? state.sceneId : view}" data-dev="${minimalUi.editing && state.isDeveloper}"><div class="world">${content}${minimalHeader(view)}<section id="minimal-panel" class="floating-panel" hidden></section><div class="map-hint" role="tooltip" hidden></div><div class="confirm-layer" hidden></div></div></section>`;
  minimalRenderPanel();
  minimalRenderConfirm();
  if (view === "focus") scheduleHudFade();
}

// Keep request feedback outside replaceable controls, and announce it immediately.
function setMinimalPending(message) {
  let status = document.querySelector('.minimal-pending');
  if (!status && message) {
    status = document.createElement('div');
    status.className = 'minimal-pending';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    document.querySelector('.minimal-root .world')?.append(status);
  }
  if (status) { status.textContent = message || ''; status.hidden = !message; }
  document.querySelectorAll('[data-place], [data-minimal="return-place"]').forEach(button => {
    button.disabled = Boolean(message && state.isAllocatingRoom);
    button.setAttribute('aria-busy', String(button.disabled));
  });
}

function acceptMinimalSeatConfirmation(confirmation, seatId) {
  // Discard snapshots requested before this transaction committed.
  roomSyncRevision += 1;
  roomSyncInFlight = false;
  state.presenceUnavailable = false;
  state.roomPresence = {
    serverNow: Date.now(),
    leases: [...state.roomPresence.leases.filter(lease => lease.sessionId !== identity.sessionId), {
      ...identityBody(), ...confirmation, roomId: currentRoomApiId(), seatId,
      sessionId: identity.sessionId, memberType: 'human', state: 'occupied',
    }],
  };
}

const MINIMAL_ISLAND_IMAGE = "/assets/20261111-island-detail-landscape.webp";
const MINIMAL_ISLAND_WIDE = "/assets/20261111-island-detail-wide.webp";
const MINIMAL_ISLAND_PORTRAIT = "/assets/20261111-island-expanded-portrait.webp";

function renderMinimalIsland() {
  const pins = [["cafe","coffee","Four Seasons Café",25,48,true],["library","book","Academy Library",42,28,Boolean(PUBLIC_CONFIG.sceneCatalog?.library?.enabled)],["forest","forest","Forest",74,44,Boolean(PUBLIC_CONFIG.sceneCatalog?.forest?.enabled)],["lakeside","lake","Lakeside",52,57,false],["seaside","sea","Seaside",74,75,false],["snow","mountain","Snowy Mountains",69.5,22,false]];
  const widePins = {cafe:[29,47.4],library:[42.7,31.8],forest:[72.5,44.4],lakeside:[50.4,53.4],seaside:[69.4,65.5],snow:[66.8,25.2]};
  const portraitPins = {cafe:[32,52],library:[44.4,47],forest:[66,53.5],lakeside:[50.2,56.2],seaside:[66,61],snow:[64,44.5]};
  minimalShell("island", `<div class="island-canvas"><picture><source media="(min-aspect-ratio: 2/1)" srcset="${MINIMAL_ISLAND_WIDE}"><source media="(orientation: portrait)" srcset="${MINIMAL_ISLAND_PORTRAIT}"><img class="island-panorama" src="${MINIMAL_ISLAND_IMAGE}" alt="Focus Isle, surrounded by sky and sea" fetchpriority="high" draggable="false"></picture><div class="scene-markers">${pins.map(([id,icon,name,x,y,open]) => `<button type="button" class="map-pin ${open ? "" : "future"}" data-minimal="place" data-place="${id}" data-place-name="${name}" data-open="${open}" style="--pin-x:${x}%;--pin-y:${y}%;--wide-x:${widePins[id][0]}%;--wide-y:${widePins[id][1]}%;--portrait-x:${portraitPins[id][0]}%;--portrait-y:${portraitPins[id][1]}%" aria-label="${name}, ${open ? "Open now" : "Coming soon"}">${minimalMapPin(icon)}</button>`).join("")}</div></div><div class="scene-veil"></div>${Boolean(PUBLIC_CONFIG.sceneCatalog?.[localStorage.getItem("focusIslandLastPlaceV1")]?.enabled) ? '<button class="minimal-return" type="button" data-minimal="return-place">Return to your quiet corner</button>' : ""}<footer class="minimal-legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a></footer>`);
}

function minimalAvatarMarkup() {
  return sceneSeatSlots().map(slot => {
    let lease = leaseForSeat(slot.seat_id - 1);
    if (lease && lease.sessionId !== identity.sessionId && !state.localRoom &&
      (state.presenceUnavailable || (state.presenceFetchedAt && Date.now()-state.presenceFetchedAt>90000) || (lease.expiresAt && Number(lease.expiresAt)<=Date.now()))) lease = null;
    if (!lease && !(minimalUi.editing && state.isDeveloper)) return "";
    const mine = lease?.sessionId === identity.sessionId;
    const ghost = !lease;
    const image = AVATAR_OPTIONS.find(item => item.id === Number(lease?.avatarSkin || 0)) || AVATAR_OPTIONS[0];
    const focusing = mine ? state.isRunning : Boolean(lease?.focusStartedAt) && !/paused|已入座|暂停|暂离/i.test(lease?.activity || "");
    const label = ghost ? "Layout sample" : mine ? "You" : lease.memberType === "npc" ? "Islander" : focusing ? "Focusing" : "Seated";
    const [x,y] = minimalSeatPosition(slot, "avatar");
    const edit = minimalUi.editing && state.isDeveloper;
    return `<button type="button" class="avatar-marker ${focusing ? "rippling" : ""} ${ghost ? "ghost" : ""} ${mine ? "is-mine" : ""}" data-minimal="${edit ? "select-marker" : "avatar-info"}" ${edit ? `data-layout-target="avatar" data-layout-seat="${slot.seat_id}"` : ""} data-seat-id="${slot.seat_id}" style="left:${x}%;top:${y}%" aria-label="Seat ${slot.seat_id}: ${escapeHtml((mine?identity.displayName:lease?.displayName || label)+" · "+label)}"><img src="${escapeHtml(accountAvatar(mine ? identity : {avatarSkin:lease?.avatarSkin,avatarUrl:lease?.avatarUrl}))}" alt=""><span class="seat-caption">${label}</span></button>`;
  }).join("");
}

function minimalButtonMarkup() {
  return sceneSeatSlots().map(slot => {
    const lease = leaseForSeat(slot.seat_id - 1);
    const edit = minimalUi.editing && state.isDeveloper;
    if (lease && !edit) return "";
    const [x,y] = minimalSeatPosition(slot, "button");
    return `<button type="button" class="seat-button seat ${lease ? "occupied" : "available"}" ${edit ? `data-minimal="select-marker" data-layout-target="button" data-layout-seat="${slot.seat_id}"` : `data-seat="${slot.seat_id - 1}"`} data-seat-id="${slot.seat_id}" style="left:${x}%;top:${y}%" ${(state.isTransitioning || state.presenceUnavailable) && !edit ? "disabled" : ""} aria-label="${edit ? "Position seat button" : "Choose seat"} ${slot.seat_id}">${minimalIcon("plus")}</button>`;
  }).join("");
}

function refreshMinimalSeats() {
  if (minimalDrag || state.view !== "room") return;
  for (const [selector,markup] of [[".static-occupants",minimalAvatarMarkup()],[".seat-markers",minimalButtonMarkup()]]) {
    const node=document.querySelector(selector);if(node && node.dataset.renderKey !== markup){node.innerHTML=markup;node.dataset.renderKey=markup;}
  }
  const status=document.querySelector('.minimal-presence-status');
  if(status){status.hidden=!state.presenceUnavailable;status.textContent='Reconnecting to the room…';}
  minimalUpdateLayoutFields();
}

function renderMinimalRoom() {
  if (!minimalPresenceExpiryTimer) minimalPresenceExpiryTimer = window.setInterval(() => { if(state.view === "room") refreshMinimalSeats(); }, 2000);
  minimalShell("room", `${minimalBackdrop(scenes[state.sceneId].image)}<div class="room-stage" style="--scene-width:${focusSceneDefinition()?.designSize[0] || 1672};--scene-height:${focusSceneDefinition()?.designSize[1] || 941}"><img class="scene-image" src="${scenes[state.sceneId].image}" alt="${escapeHtml(sceneLabel())}, six-seat room"><div class="seat-layer"><div class="static-occupants">${minimalAvatarMarkup()}</div><div class="seat-markers">${minimalButtonMarkup()}</div></div></div>${state.localRoom ? '<span class="minimal-room-mode">Solo room</span>' : '<span class="minimal-room-mode minimal-presence-status" role="status" hidden></span>'}${state.currentSeatId ? '<button type="button" class="minimal-return" data-minimal="focus-view">Return to focus</button>' : '<div class="room-hint">Choose a seat. Make yourself comfortable.</div>'}${minimalUi.editing && state.isDeveloper ? minimalLayoutTools() : ""}`);
  // Seed render keys so the first presence response does not detach a pressed button.
  for (const [selector, markup] of [[".static-occupants", minimalAvatarMarkup()], [".seat-markers", minimalButtonMarkup()]]) {
    document.querySelector(selector).dataset.renderKey = markup;
  }
  minimalUpdateLayoutFields();
  minimalPositionLayoutPanel();
  requestAnimationFrame(() => startCafePresence());
}

function minimalTimerMarkup() {
  const resting = state.sessionPhase === "rest";
  const label = state.isRunning ? "Pause" : state.sessionStartedAt ? "Resume" : "Start";
  return `<aside class="focus-widget ${minimalUi.timerMenu || !state.sessionStartedAt ? "show-menu" : ""}" aria-label="Focus timer"><nav class="timer-actions" id="minimal-timer-actions" aria-label="Timer actions">${resting ? `<button type="button" data-minimal="end-break">${minimalIcon("end")}<span>End break</span></button>` : `<button type="button" data-action="toggle-timer" aria-label="${label}">${minimalIcon(state.isRunning ? "pause" : "play")}<span>${label}</span></button><button type="button" data-minimal="restart">${minimalIcon("restart")}<span>Restart</span></button><button type="button" data-minimal="end">${minimalIcon("end")}<span>End session</span></button>`}</nav><button type="button" class="time-readout immersive-timer" data-minimal="timer-menu" aria-label="${resting ? "Break timer" : "Focus timer"}; show controls" aria-expanded="${minimalUi.timerMenu}" aria-controls="minimal-timer-actions"><span ${resting ? "data-rest-clock" : "data-session-clock"}>${resting ? formatRestTime() : formatTime()}</span></button></aside>`;
}

function renderMinimalFocus() {
  window.clearInterval(roomSyncTimer);roomSyncTimer=null;
  minimalShell("focus", `<img class="minimal-focus-image" data-focus-scene-image src="${selectedFocusImage()}" alt="${escapeHtml(sceneLabel())} focus setting">${minimalTimerMarkup()}`);
  persistActiveSession();
  if(state.isRunning || state.sessionPhase === "rest")startTicker();
  if(state.currentSeatId){window.clearInterval(heartbeatTimer);heartbeatTimer=window.setInterval(sendHeartbeat,15000);sendHeartbeat();}
}

function renderMinimalSummary() {
  minimalUi.panel=null;state.sessionPanelOpen=false;
  const result=state.sessionResult;const minutes=Math.floor(Number(result?.elapsedSeconds || 0)/60);
  minimalShell("summary", `<img class="minimal-focus-image" src="${selectedFocusImage()}" alt="${escapeHtml(sceneLabel())} quiet view"><article class="minimal-summary"><h1>${result?.status === "completed" ? "A little time, well spent." : "Welcome back."}</h1><p>${minutes > 0 ? `${minutes} ${minutes === 1 ? "minute" : "minutes"} of focus.` : "Every beginning counts."}</p><div><button type="button" class="primary" data-minimal="again">Another session</button><button type="button" data-minimal="break">Take a break</button><button type="button" data-minimal="done">Done for now</button></div></article>`);
}

function minimalPanelHeading(title) { return `<header class="panel-heading"><strong>${title}</strong><button type="button" class="close-panel" data-minimal="close-panel" aria-label="Close ${title.toLowerCase()}">${minimalIcon("close")}</button></header>`; }

function minimalRenderPanel() {
  const box=document.getElementById("minimal-panel");if(!box)return;
  box.hidden=!minimalUi.panel;if(!minimalUi.panel){box.innerHTML="";return;}
  box.setAttribute("role","dialog");box.setAttribute("aria-label",{sound:"Sound",settings:"Settings",avatar:"Your avatar",scene:"Scene"}[minimalUi.panel]);
  let body="";
  if(minimalUi.panel === "sound"){
    body=minimalPanelHeading("Sound")+[["ambient","rain",focusSceneDefinition()?.ambientLabel || "Café ambience"],["white","noise","White noise"],["music","music","Soft music"]].map(([key,icon,label])=>`<div class="minimal-sound-group"><label class="sound-row"><span class="sound-name">${minimalIcon(icon)}${label}</span><input class="switch" type="checkbox" data-minimal-sound="${key}" aria-label="${label}" ${state.sounds[key] ? "checked" : ""}></label><label class="volume-row"><span class="sr-only">${label} volume</span><input type="range" min="0" max="100" value="${state.soundVolumes[key]}" data-minimal-volume="${key}" aria-label="${label} volume"><output>${state.soundVolumes[key]}%</output></label></div>`).join("")+`<label class="minimal-select-label">Music<select data-minimal-music aria-label="Music track">${Object.entries(FOCUS_MUSIC_TRACKS).map(([key,track])=>`<option value="${key}" ${key===state.musicTrack?"selected":""}>${escapeHtml({'rainy-notes':'Rainy Notes','warm-reverie':'Warm Reverie','moonlit-walk':'Moonlit Walk','island-breeze':'Island Breeze'}[key] || track.name)}</option>`).join("")}</select></label><button type="button" class="minimal-panel-link" data-minimal="mute">Mute all</button>`;
  }else if(minimalUi.panel === "settings"){
    body=minimalPanelHeading("Settings")+`<div class="setting-row focus-length-setting"><span>Focus length</span><div class="segmented focus-mode-options">${[25,50,0].map(mode=>`<button type="button" data-minimal-mode="${mode}" aria-pressed="${state.timerMode===mode}">${mode || "Open"}${mode?" min":""}</button>`).join("")}</div></div><label class="setting-row"><span>Reduce motion</span><input class="switch" type="checkbox" data-minimal-motion ${preferences.reduceMotion?"checked":""}></label><button type="button" class="minimal-panel-link" data-minimal="account">Account & data</button>${state.isDeveloper?'<button type="button" class="minimal-panel-link" data-minimal="developer">Developer tools</button><button type="button" class="minimal-panel-link" data-minimal="layout">Adjust seat layout</button>':'<button type="button" class="minimal-panel-link" data-minimal="sign-in">Sign in (optional)</button>'}<small class="minimal-version">Focus Isle ${escapeHtml(PUBLIC_CONFIG.appVersion)}</small>`;
  }else if(minimalUi.panel === "avatar"){
    const avatar=AVATAR_OPTIONS.find(a=>a.id===Number(identity.avatarSkin))||AVATAR_OPTIONS[0];
    body=minimalPanelHeading("Your avatar")+`<div class="profile-sample"><img src="${avatar.image}" alt="Your illustrated avatar"><span>You</span></div><label class="minimal-select-label">Display name<input class="name-input" data-minimal-name maxlength="24" value="${escapeHtml(localizedIdentityDisplayName(identity.displayName))}"></label><button class="minimal-panel-link" type="button" data-minimal="save-name">Save name</button>`;
  }else{
    body=minimalPanelHeading("Scene")+(focusSceneDefinition()?.focusViews || []).filter(view=>!view.hidden).map(view=>`<button type="button" class="scene-choice" data-minimal-scene="${view.id}" aria-pressed="${state.focusImageChoice===view.id}"><img src="${view.thumbnail || view.image}" alt="" loading="lazy"><span>${view.label}</span>${state.focusImageChoice===view.id?minimalIcon("check"):""}</button>`).join("");
  }
  box.innerHTML=body;
  const active=document.querySelector(`[data-minimal="panel"][data-panel="${minimalUi.panel}"]`);
  if(active){const a=active.getBoundingClientRect(),world=box.closest(".world").getBoundingClientRect();box.style.left=`${Math.max(12,Math.min(world.width-box.offsetWidth-12,a.right-world.left-box.offsetWidth))}px`;box.style.right="auto";box.style.top=`${a.bottom-world.top+10}px`;box.style.maxHeight=`${Math.max(160,world.bottom-a.bottom-24)}px`;}
}

function selectedMinimalSceneImage(key){const previous=state.focusImageChoice;state.focusImageChoice=key;const image=selectedFocusImage();state.focusImageChoice=previous;return image;}

function minimalSetPanel(name){minimalUi.panel=minimalUi.panel===name?null:name;state.sessionPanelOpen=Boolean(minimalUi.panel);document.querySelectorAll('[data-minimal="panel"]').forEach(b=>b.setAttribute("aria-expanded",String(b.dataset.panel===minimalUi.panel)));minimalRenderPanel();scheduleHudFade();}

function minimalRenderConfirm(){
  const layer=document.querySelector('.minimal-root .confirm-layer');if(!layer)return;layer.hidden=!minimalUi.confirm;
  if(!minimalUi.confirm){layer.innerHTML="";return;}
  const restart=minimalUi.confirm==='restart';
  layer.innerHTML=`<div class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="minimal-confirm-title"><h2 id="minimal-confirm-title">${restart?'Restart this session?':'End this session?'}</h2><p>${restart?'Your time so far will be saved. A fresh timer will begin.':'Your time so far will be saved. You can return whenever you’re ready.'}</p><div class="confirm-actions"><button type="button" data-minimal="cancel-confirm">Keep focusing</button><button type="button" data-minimal="accept-confirm" ${minimalUi.busy?'disabled':''}>${minimalUi.busy?'Saving…':restart?'Restart':'End session'}</button></div></div>`;
  layer.querySelector('button')?.focus();
}

function minimalLayoutTools(){return `<section class="minimal-layout-tools ${minimalUi.layoutCollapsed ? "is-collapsed" : ""}" aria-label="Developer seat layout"><header data-layout-panel-handle tabindex="0" aria-label="Move layout panel"><strong>${minimalIcon('move')}Developer layout</strong><div><button type="button" data-minimal="collapse-layout" aria-label="${minimalUi.layoutCollapsed ? 'Expand' : 'Collapse'} layout tools" aria-expanded="${!minimalUi.layoutCollapsed}">${minimalIcon(minimalUi.layoutCollapsed ? 'plus' : 'minus')}</button><button type="button" data-minimal="layout" aria-label="Close layout tools">${minimalIcon('close')}</button></div></header><div class="minimal-layout-body"><div class="minimal-layout-row"><label>Seat<select data-layout-select aria-label="Layout seat">${sceneSeatSlots().map(s=>`<option value="${s.seat_id}" ${s.seat_id===minimalUi.seat?'selected':''}>${s.seat_id}</option>`).join('')}</select></label><div class="segmented"><button type="button" data-layout-kind="avatar" aria-pressed="${minimalUi.target==='avatar'}">Avatar</button><button type="button" data-layout-kind="button" aria-pressed="${minimalUi.target==='button'}">Seat button</button></div><label>X<input type="number" data-layout-x step=".1" min="0" max="100" aria-label="Horizontal position"></label><label>Y<input type="number" data-layout-y step=".1" min="0" max="100" aria-label="Vertical position"></label></div><div class="minimal-layout-row"><button type="button" data-minimal="save-layout">Save layout</button><button type="button" data-minimal="export-layout">Export layout</button><button type="button" data-minimal="reset-layout">Reset layout</button></div><small>Drag this panel to move it. Drag markers or use arrow keys. Save applies on this browser. Forest keeps separate desktop and compact layouts.</small></div></section>`;}

function minimalPositionLayoutPanel(position = minimalUi.panelPosition) {
  const panel = document.querySelector('.minimal-layout-tools');
  if (!panel) return;
  const world = panel.closest('.world').getBoundingClientRect();
  const x = Math.max(8, Math.min(world.width - panel.offsetWidth - 8, position?.x ?? 16));
  const y = Math.max(8, Math.min(world.height - panel.offsetHeight - 8, position?.y ?? 84));
  panel.style.left = `${x}px`; panel.style.top = `${y}px`;
  minimalUi.panelPosition = { x, y };
}

function minimalUpdateLayoutFields(){
  if(!minimalUi.editing||!state.isDeveloper)return;
  const slot=sceneSeatSlots().find(s=>s.seat_id===minimalUi.seat),p=minimalSeatPosition(slot,minimalUi.target);
  const x=document.querySelector('[data-layout-x]'),y=document.querySelector('[data-layout-y]');if(x)x.value=p[0];if(y)y.value=p[1];
  document.querySelectorAll('[data-layout-target]').forEach(n=>n.classList.toggle('edit-selected',n.dataset.layoutTarget===minimalUi.target&&Number(n.dataset.layoutSeat)===minimalUi.seat));
  document.querySelectorAll('[data-layout-kind]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.layoutKind===minimalUi.target)));
  const select=document.querySelector('[data-layout-select]');if(select)select.value=minimalUi.seat;
}

function minimalMoveMarker(x,y){
  if(!state.isDeveloper||!minimalUi.editing)return;
  const slot=sceneSeatSlots().find(s=>s.seat_id===minimalUi.seat);
  const current=minimalUi.layout[slot.seat_id]||{avatar:[...minimalSeatPosition(slot,'avatar')],button:[...minimalSeatPosition(slot,'button')]};
  current[minimalUi.target]=[Math.round(Math.max(0,Math.min(100,x))*10)/10,Math.round(Math.max(0,Math.min(100,y))*10)/10];minimalUi.layout[slot.seat_id]=current;
  const n=document.querySelector(`[data-layout-target="${minimalUi.target}"][data-layout-seat="${slot.seat_id}"]`);if(n){n.style.left=current[minimalUi.target][0]+'%';n.style.top=current[minimalUi.target][1]+'%';}minimalUpdateLayoutFields();
}

async function minimalFinishAction(){
  if(minimalUi.busy)return;minimalUi.busy=true;minimalRenderConfirm();const action=minimalUi.confirm;
  try{
    if(action==='restart'){
      if(state.isRunning)syncTimerFromClock({finishOnComplete:false});
      state.isRunning=false;stopTicker();suspendAudio();
      if(state.elapsedSeconds>0)saveSessionResult(buildSessionResult('ended_early'));
      if(state.cloudFocusClientId){queueFocusUpdate(state.cloudFocusClientId,{status:'ended_early',actualSeconds:state.elapsedSeconds,pausedSeconds:0});await flushPendingFocusUpdates();}
      resetTimerState();minimalUi.confirm=null;minimalUi.busy=false;await toggleTimer();
    }else{
      minimalUi.confirm=null;await finishSession();if(action==='leave'){resetTimerState();state.view='island';state.sceneId=null;render();}
    }
  }catch(_){showToast('Your session could not be updated. Please try again.');}
  finally{minimalUi.busy=false;minimalRenderConfirm();}
}

document.addEventListener('click',async event=>{
  if(!window.__FOCUS_ISLAND_CONFIG__?.minimalMvp)return;
  const node=event.target.closest('[data-minimal],[data-minimal-mode],[data-minimal-scene],[data-layout-kind]');if(!node)return;
  event.stopImmediatePropagation();if(Date.now()<minimalIgnoreClick&&node.dataset.minimal==='select-marker')return;
  if(state.isStartingFocus && !['panel','close-panel','timer-menu'].includes(node.dataset.minimal)){showToast('Your focus session is starting. One moment…');return;}
  if(node.dataset.layoutKind){if(!state.isDeveloper)return;minimalUi.target=node.dataset.layoutKind;minimalUpdateLayoutFields();return;}
  if(node.dataset.minimalMode!==undefined){if(state.sessionStartedAt){showToast('End this session before changing its length.');return;}preferences.defaultTimerMode=Number(node.dataset.minimalMode);savePreferences();if(state.view==='island'){state.timerMode=preferences.defaultTimerMode;}else await setTimerMode(preferences.defaultTimerMode);minimalRenderPanel();return;}
  if(node.dataset.minimalScene){state.focusImageChoice=node.dataset.minimalScene;rememberSceneFocusView();savePreferences();const image=document.querySelector('[data-focus-scene-image]');if(image)image.src=selectedFocusImage();persistActiveSession(true);minimalRenderPanel();return;}
  const action=node.dataset.minimal;
  if(action==='place'||action==='return-place'){
    if(action==='place'&&node.dataset.open!=='true'){minimalShowPlace(node);return;}
    await enterMinimalScene(action==='return-place' ? localStorage.getItem('focusIslandLastPlaceV1') || 'cafe' : node.dataset.place);return;
  }
  if(action==='panel'){if(node.dataset.panel==='avatar'){minimalUi.panel=null;state.sessionPanelOpen=false;openPersonalCenter({tab:'account'});return;}minimalSetPanel(node.dataset.panel);if(node.dataset.panel==='settings'&&!minimalUi.identity){try{const session=await api('/api/auth/session');minimalUi.identity=session;const changed=state.isDeveloper!==(session.developer===true);state.isDeveloper=session.developer===true;if(changed&&minimalUi.panel==='settings')minimalRenderPanel();}catch(_){/* Optional identity lookup never blocks local preferences. */}}return;}
  if(action==='close-panel'){minimalSetPanel(null);return;}
  if(action==='back-room'){state.view='room';render();return;}
  if(action==='back-island'){if(state.isTransitioning){showToast('Your seat is being prepared. One moment…');return;}if(isActiveFocusSession()){minimalUi.confirm='leave';minimalRenderConfirm();}else{await releaseSeat();resetTimerState();state.view='island';state.sceneId=null;render();}return;}
  if(action==='focus-view'){state.view='focus';render();return;}
  if(action==='timer-menu'){minimalUi.timerMenu=!minimalUi.timerMenu;document.querySelector('.focus-widget')?.classList.toggle('show-menu',minimalUi.timerMenu);node.setAttribute('aria-expanded',String(minimalUi.timerMenu));return;}
  if(action==='restart'||action==='end'){minimalUi.confirm=action;minimalRenderConfirm();return;}
  if(action==='cancel-confirm'){minimalUi.confirm=null;minimalRenderConfirm();document.querySelector('.time-readout')?.focus();return;}
  if(action==='accept-confirm'){await minimalFinishAction();return;}
  if(action==='again'){const sceneId=state.sceneId;resetTimerState();await enterMinimalScene(sceneId);return;}
  if(action==='done'){resetTimerState();state.view='island';state.sceneId=null;render();return;}
  if(action==='break'){state.view='focus';beginRestStage(25);return;}
  if(action==='end-break'){document.title='Focus Isle';stopTicker();state.restStartedAt=null;state.sessionPhase='focus';localStorage.removeItem(STORAGE_KEYS.activeSession);state.view='summary';render();return;}
  if(action==='account'){minimalUi.panel=null;state.sessionPanelOpen=false;openPersonalCenter({tab:'account'});return;}
  if(action==='sign-in'){minimalUi.panel=null;state.sessionPanelOpen=false;openPersonalCenter({tab:'account'});state.personalCenter.tab='security';renderPersonalCenter();return;}
  if(action==='developer'){if(!state.isDeveloper)return;minimalUi.panel=null;state.sessionPanelOpen=false;openPersonalCenter({tab:'developer'});return;}
  if(action==='developer-scene'){if(!state.isDeveloper)return;closePersonalCenter();await enterMinimalScene(node.dataset.sceneId);return;}
  if(action==='layout'){if(!state.isDeveloper)return;minimalUi.editing=!minimalUi.editing;minimalUi.panel=null;state.sessionPanelOpen=false;if(minimalUi.editing&&(!state.sceneId||!state.roomId||!focusSceneDefinition())){await enterMinimalScene('cafe');if(state.view!=='room'||!state.roomId){minimalUi.editing=false;return;}}state.view='room';render();return;}
  if(action==='collapse-layout'){if(!state.isDeveloper)return;minimalUi.layoutCollapsed=!minimalUi.layoutCollapsed;const panel=document.querySelector('.minimal-layout-tools');panel.classList.toggle('is-collapsed',minimalUi.layoutCollapsed);node.setAttribute('aria-expanded',String(!minimalUi.layoutCollapsed));node.setAttribute('aria-label',(minimalUi.layoutCollapsed?'Expand':'Collapse')+' layout tools');node.innerHTML=minimalIcon(minimalUi.layoutCollapsed?'plus':'minus');minimalPositionLayoutPanel();return;}
  if(action==='select-marker'){if(!state.isDeveloper)return;minimalUi.seat=Number(node.dataset.layoutSeat);minimalUi.target=node.dataset.layoutTarget;minimalUpdateLayoutFields();return;}
  if(action==='save-layout'){if(!state.isDeveloper)return;const layout=Object.fromEntries(sceneSeatSlots().map(s=>[s.seat_id,{avatar:[...minimalSeatPosition(s,'avatar')],button:[...minimalSeatPosition(s,'button')]}]));localStorage.setItem(sceneLayoutStorageKey(),JSON.stringify(layout));showToast('Layout saved on this browser.');return;}
  if(action==='reset-layout'){if(!state.isDeveloper)return;minimalUi.layout={};localStorage.removeItem(sceneLayoutStorageKey());refreshMinimalSeats();return;}
  if(action==='export-layout'){if(!state.isDeveloper)return;const text=JSON.stringify({sceneId:state.sceneId,layoutVersion:1,viewport:sceneUsesCompactLayout()?'compact':'desktop',designSize:focusSceneDefinition()?.designSize,seats:Object.fromEntries(sceneSeatSlots().map(s=>[s.seat_id,{avatar:minimalSeatPosition(s,'avatar'),button:minimalSeatPosition(s,'button')}]))}),blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`focus-isle-${state.sceneId}-seat-layout.json`;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
  if(action==='save-name'){const n=document.querySelector('[data-minimal-name]');const value=n?.value.trim();if(value){identity.displayName=value.slice(0,24);persistIdentity();showToast('Name saved.');}return;}
  if(action==='mute'){state.sounds={ambient:false,white:false,music:false};muteAllAudioImmediately();saveSoundPreferencesFromState();minimalRenderPanel();return;}
});

function minimalShowPlace(node){const tip=document.querySelector('.minimal-root .map-hint');if(!tip)return;tip.textContent=`${node.dataset.placeName} · ${node.dataset.open==='true'?'Open now':'Coming soon'}`;tip.hidden=false;const a=node.getBoundingClientRect(),r=tip.closest('.world').getBoundingClientRect();tip.style.left=Math.max(12,Math.min(r.width-tip.offsetWidth-12,a.left-r.left+a.width/2-tip.offsetWidth/2))+'px';tip.style.top=Math.max(70,a.top-r.top-tip.offsetHeight-8)+'px';}
document.addEventListener('pointerover',e=>{const n=e.target.closest('[data-place]');if(n)minimalShowPlace(n);});
document.addEventListener('pointerout',e=>{const n=e.target.closest('[data-place]');if(n&&!n.contains(e.relatedTarget)){const t=document.querySelector('.minimal-root .map-hint');if(t)t.hidden=true;}});
document.addEventListener('focusin',e=>{const n=e.target.closest('[data-place]');if(n)minimalShowPlace(n);});
document.addEventListener('focusout',e=>{if(e.target.closest('[data-place]')){const n=document.querySelector('.minimal-root .map-hint');if(n)n.hidden=true;}});
document.addEventListener('pointerdown',e=>{
  if(!window.__FOCUS_ISLAND_CONFIG__?.minimalMvp)return;
  if(state.view==='focus')scheduleHudFade();
  const handle=e.target.closest('[data-layout-panel-handle]');
  if(handle && state.isDeveloper && minimalUi.editing && !e.target.closest('button')) {
    const panel=handle.closest('.minimal-layout-tools'),r=panel.getBoundingClientRect();
    minimalPanelDrag={node:handle,id:e.pointerId,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top};
    handle.setPointerCapture?.(e.pointerId);e.preventDefault();e.stopImmediatePropagation();return;
  }
  const n=e.target.closest('[data-layout-target]');
  if(n&&state.isDeveloper&&minimalUi.editing){e.stopImmediatePropagation();const stage=n.closest('.seat-layer');const r=stage.getBoundingClientRect();minimalUi.seat=Number(n.dataset.layoutSeat);minimalUi.target=n.dataset.layoutTarget;const slot=sceneSeatSlots().find(s=>s.seat_id===minimalUi.seat),p=minimalSeatPosition(slot,minimalUi.target);minimalDrag={node:n,id:e.pointerId,x:e.clientX,y:e.clientY,offsetX:e.clientX-r.left-p[0]*r.width/100,offsetY:e.clientY-r.top-p[1]*r.height/100,moved:false};n.setPointerCapture?.(e.pointerId);minimalUpdateLayoutFields();e.preventDefault();return;}
  if(minimalUi.panel&&!e.target.closest('.floating-panel,[data-minimal="panel"]'))minimalSetPanel(null);
},true);
document.addEventListener('pointermove',e=>{if(minimalPanelDrag && e.pointerId===minimalPanelDrag.id){const r=minimalPanelDrag.node.closest('.world').getBoundingClientRect();minimalPositionLayoutPanel({x:e.clientX-r.left-minimalPanelDrag.offsetX,y:e.clientY-r.top-minimalPanelDrag.offsetY});return;}if(!minimalDrag||e.pointerId!==minimalDrag.id)return;const r=minimalDrag.node.closest('.seat-layer').getBoundingClientRect();minimalDrag.moved ||= Math.hypot(e.clientX-minimalDrag.x,e.clientY-minimalDrag.y)>3;minimalMoveMarker((e.clientX-r.left-minimalDrag.offsetX)/r.width*100,(e.clientY-r.top-minimalDrag.offsetY)/r.height*100);});
function minimalEndDrag(e){if(minimalPanelDrag && e.pointerId===minimalPanelDrag.id){minimalPanelDrag.node.releasePointerCapture?.(e.pointerId);minimalPanelDrag=null;return;}if(!minimalDrag||e.pointerId!==minimalDrag.id)return;if(minimalDrag.moved)minimalIgnoreClick=Date.now()+300;minimalDrag.node.releasePointerCapture?.(e.pointerId);minimalDrag=null;}
document.addEventListener('pointerup',minimalEndDrag);document.addEventListener('pointercancel',minimalEndDrag);
document.addEventListener('change',e=>{
  if(!window.__FOCUS_ISLAND_CONFIG__?.minimalMvp)return;const n=e.target;
  if(n.matches('[data-minimal-sound]')){state.sounds[n.dataset.minimalSound]=n.checked;saveSoundPreferencesFromState();if(state.isRunning)updateAudio();persistActiveSession(true);}
  if(n.matches('[data-minimal-music]')){state.musicTrack=n.value;saveSoundPreferencesFromState();if(state.isRunning)updateAudio();}
  if(n.matches('[data-minimal-motion]')){preferences.reduceMotion=n.checked;savePreferences();document.querySelector(".minimal-root")?.setAttribute("data-reduced",String(n.checked));}
  if(n.matches('[data-layout-select]')&&state.isDeveloper){minimalUi.seat=Number(n.value);minimalUpdateLayoutFields();}
  if(n.matches('[data-layout-x],[data-layout-y]'))minimalMoveMarker(Number(document.querySelector('[data-layout-x]').value),Number(document.querySelector('[data-layout-y]').value));
});
document.addEventListener('input',e=>{const n=e.target;if(!n.matches('[data-minimal-volume]'))return;state.soundVolumes[n.dataset.minimalVolume]=Number(n.value);n.nextElementSibling.textContent=n.value+'%';saveSoundPreferencesFromState();if(state.isRunning)updateAudio();persistActiveSession(true);});
document.addEventListener('keydown',e=>{
  if(!window.__FOCUS_ISLAND_CONFIG__?.minimalMvp)return;
  if(e.key==='Escape'){if(minimalUi.confirm){minimalUi.confirm=null;minimalRenderConfirm();}else minimalSetPanel(null);return;}
  if(minimalUi.confirm&&e.key==='Tab'){const bs=document.querySelectorAll('.minimal-root .confirm-actions button:not(:disabled)');if(!bs.length)return;if(e.shiftKey&&document.activeElement===bs[0]){e.preventDefault();bs[bs.length-1].focus();}else if(!e.shiftKey&&document.activeElement===bs[bs.length-1]){e.preventDefault();bs[0].focus();}return;}
  if(e.target.matches('[data-layout-panel-handle]') && state.isDeveloper && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const p=minimalUi.panelPosition||{x:16,y:84},step=e.shiftKey?20:5;minimalPositionLayoutPanel({x:p.x+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),y:p.y+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)});return;}
  const n=e.target.closest('[data-layout-target]');if(n&&state.isDeveloper&&minimalUi.editing&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();minimalUi.seat=Number(n.dataset.layoutSeat);minimalUi.target=n.dataset.layoutTarget;const p=minimalSeatPosition(sceneSeatSlots().find(s=>s.seat_id===minimalUi.seat),minimalUi.target),step=e.shiftKey?1:.2;minimalMoveMarker(p[0]+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),p[1]+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0));}
});

// Account changes cannot abandon an anonymous focus session mid-flight.
document.addEventListener('submit',event=>{
  if(window.__FOCUS_ISLAND_CONFIG__?.minimalMvp && event.target.matches('[data-auth-form]') && isActiveFocusSession()) {
    event.preventDefault();event.stopImmediatePropagation();showToast('End your session before switching accounts.');
  }
},true);
window.addEventListener('offline',()=>{if(window.__FOCUS_ISLAND_CONFIG__?.minimalMvp&&!state.localRoom){state.presenceUnavailable=true;refreshMinimalSeats();}});

window.addEventListener("resize",()=>{if(window.__FOCUS_ISLAND_CONFIG__?.minimalMvp && document.querySelector(".minimal-layout-tools"))minimalPositionLayoutPanel();});

window.addEventListener("resize", () => { if (PUBLIC_CONFIG.minimalMvp && state.sceneId === "forest" && state.view === "room") refreshMinimalSeats(); });
