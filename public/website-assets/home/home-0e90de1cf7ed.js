
(()=>{'use strict';
const menu=document.getElementById('menuToggle'),nav=document.getElementById('navigation');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.classList.toggle('open',open)});
nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation')}});
const scenes=Array.from(document.querySelectorAll('.gallery-tab')).map(b=>({src:b.querySelector('img').src,name:b.querySelector('span').textContent,alt:b.querySelector('span').textContent+' — original app view'}));
document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{const index=Number(b.dataset.scene),s=scenes[index];document.getElementById('galleryImage').src=s.src;document.getElementById('galleryImage').alt=s.alt;document.getElementById('galleryLabel').textContent=s.name;document.querySelectorAll('[data-scene]').forEach(x=>x.setAttribute('aria-pressed',String(Number(x.dataset.scene)===index)))}));

// Verbatim app functions: app.js, minimal-mvp.js, mobile/src/scene-rotation.js
function formatTime() {
  if (state.timerMode === -1) return "专注中";
  const total = state.timerMode === 0 ? state.elapsedSeconds : state.remainingSeconds;
  const minutes = Math.floor(total / 60);
  const seconds = Math.floor(total % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function syncTimerFromClock({ finishOnComplete = true } = {}) {
  if (state.sessionPhase === "rest") return syncRestTimerFromClock();
  if (!state.isRunning || !lastTick) return false;
  const now = Date.now();
  const delta = Math.floor((now - lastTick) / 1000);
  if (delta < 1) return false;
  lastTick += delta * 1000;
  const appliedDelta = state.timerMode > 0 ? Math.min(delta, state.remainingSeconds) : delta;
  state.elapsedSeconds += appliedDelta;
  if (state.timerMode > 0) {
    state.remainingSeconds = Math.max(0, state.remainingSeconds - appliedDelta);
    if (state.remainingSeconds === 0) {
      if (finishOnComplete) finishSession("completed");
      return true;
    }
  }
  return false;
}

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

/* Pure scheduling/gesture rules shared by the mobile UI and deterministic tests. */
const MobileSceneRotation = (() => {
  const interval = 5 * 60 * 1000;
  function swipeDirection(start, end) {
    const dx = end.x - start.x, dy = end.y - start.y;
    const elapsed = end.time - start.time;
    return elapsed >= 0 && elapsed <= 1200 && Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.5
      ? (dx < 0 ? 1 : -1) : 0;
  }
  function create({ read, select, schedule = setTimeout, cancel = clearTimeout }) {
    let timer = null, context = null;
    const choices = s => s.views.filter(v => !v.hidden);
    function stop() { if (timer !== null) cancel(timer); timer = null; context = null; }
    function advance(direction) {
      const s = read(), views = choices(s);
      if (!s.active || views.length < 2) return false;
      const index = views.findIndex(v => v.id === s.current);
      const next = index < 0 ? (direction > 0 ? 0 : views.length - 1) : (index + direction + views.length) % views.length;
      select(views[next].id);
      return true;
    }
    function sync(reset = false) {
      const s = read(), views = choices(s);
      if (!s.active || !s.enabled || views.length < 2) { stop(); return; }
      const key = JSON.stringify([s.sceneId, s.current, views.map(v => v.id)]);
      if (!reset && timer !== null && context === key) return;
      stop(); context = key;
      const { sceneId, current } = s;
      timer = schedule(() => {
        timer = null;
        const now = read();
        // Recheck at firing time: no background catch-up or stale-room switch.
        if (now.active && now.enabled && now.sceneId === sceneId && now.current === current) advance(1);
        sync(true);
      }, interval);
    }
    return { sync, stop, step(direction) { const changed = advance(direction); sync(true); return changed; } };
  }
  return { interval, create, swipeDirection };
})();
// Standalone homepage adapter. App formatTime, syncTimerFromClock,
// minimalIcon and MobileSceneRotation are included verbatim by build.py.
// Preview sessions are isolated from account, billing and session history.
const world=document.querySelector('.app-preview'), hud=world.querySelector('.focus-widget'), panel=world.querySelector('.preview-panel'), live=document.getElementById('timerStatus');
const state={timerMode:25,remainingSeconds:1500,elapsedSeconds:0,isRunning:false,sessionPhase:'focus',sessionStartedAt:null};
let lastTick=null, panelName=null, idleTimer, autoScene=true,currentView='deep',gesture=null,returnFocus=null;
const audioMusic=new Audio('/website-assets/home/f98fc6c6ba5709de.mp3'),audioForest=new Audio('/website-assets/home/d083a5eb42470f4e.wav');
audioMusic.loop=audioForest.loop=true;audioMusic.preload=audioForest.preload='none';
let musicEnabled=true,forestEnabled=false,musicVolume=.35,forestVolume=.3;
const views=[{id:'deep',label:'Deep forest',src:'/website-assets/home/8a4c893df8dde0bb.webp'},{id:'mist',label:'Morning mist',src:'/website-assets/home/380a2cf0bb3695fb.webp'},{id:'root',label:'Among the roots',src:'/website-assets/home/d3dd334bb7bda820.webp'}];
function updateAudio(){for(const [audio,enabled,volume] of [[audioMusic,musicEnabled,musicVolume],[audioForest,forestEnabled,forestVolume]]){audio.volume=volume;if(state.isRunning&&!document.hidden&&enabled){if(audio.paused)audio.play().catch(()=>{world.querySelector('.preview-status').textContent='Tap Start to enable sound.'})}else audio.pause()}}
function announce(message){live.textContent=message;world.querySelector('.preview-status').textContent=message}
function finishSession(){state.isRunning=false;lastTick=null;updateAudio();announce('Session complete. Take a breath.');renderHud()}
function renderHud(){hud.querySelector('[data-session-clock]').textContent=formatTime();const btn=hud.querySelector('[data-action="toggle-timer"]');btn.innerHTML=minimalIcon(state.isRunning?'pause':'play');btn.setAttribute('aria-label',state.isRunning?'Pause':state.sessionStartedAt?'Resume':'Start');}
function wake(){world.classList.remove('hud-idle');clearTimeout(idleTimer);if(!panelName)idleTimer=setTimeout(()=>world.classList.add('hud-idle'),5000)}
function reset(mode=state.timerMode){state.isRunning=false;state.timerMode=mode;state.remainingSeconds=Math.max(0,mode*60);state.elapsedSeconds=0;state.sessionStartedAt=null;lastTick=null;updateAudio();renderHud()}
function toggleTimer(){if(state.isRunning){syncTimerFromClock();state.isRunning=false;lastTick=null;announce('Paused.')}else{if(state.timerMode>0&&state.remainingSeconds===0)reset();state.isRunning=true;state.sessionStartedAt=state.sessionStartedAt||Date.now();lastTick=Date.now();announce('')}updateAudio();renderHud();wake()}
function selectView(id){currentView=id;const v=views.find(x=>x.id===id);const img=world.querySelector('.benefit-image');img.src=v.src;img.alt=v.label+' — original Focus Isle artwork';panel.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===id)))}
const rotation=MobileSceneRotation.create({read:()=>({sceneId:'forest',active:!document.hidden&&!panelName,enabled:autoScene,current:currentView,views}),select:selectView});
function closePanel(){panel.hidden=true;panelName=null;hud.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-expanded','false'));returnFocus?.focus({preventScroll:true});wake();rotation.sync(true)}
function openPanel(name,trigger){if(panelName===name){closePanel();return}panelName=name;returnFocus=trigger;panel.hidden=false;hud.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.panel===name)));let body='',title='';
if(name==='settings'){title='Timer';body='<div class="options">'+[[25,'25 min'],[50,'50 min'],[0,'Free']].map(([v,label])=>`<button data-mode="${v}" aria-pressed="${state.timerMode===v}">${label}</button>`).join('')+'</div><small>Changing mode starts a fresh timer.</small>'}
if(name==='scene'){title='Forest views';body='<div class="options">'+views.map(v=>`<button data-view="${v.id}" aria-pressed="${currentView===v.id}">${v.label}</button>`).join('')+'</div><label>Auto-switch · every 5 min<input id="autoScene" type="checkbox" '+(autoScene?'checked':'')+'></label><small>Swipe the scene to change your view.</small>'}
if(name==='sound'){title='Sound';body=`<label>Soft music<input id="musicEnabled" type="checkbox" ${musicEnabled?'checked':''}></label><label>Music volume<input id="musicVolume" aria-label="Music volume" type="range" min="0" max="100" value="${Math.round(musicVolume*100)}"></label><label>Forest ambience<input id="forestEnabled" type="checkbox" ${forestEnabled?'checked':''}></label><label>Ambience volume<input id="forestVolume" aria-label="Ambience volume" type="range" min="0" max="100" value="${Math.round(forestVolume*100)}"></label><small>Original app audio · music preview excerpt. Plays only while focusing.</small>`}
if(name==='restart'||name==='end'){title=name==='restart'?'Restart this session?':'End this session?';body='<small>This website preview does not save focus history.</small><div class="options"><button data-cancel>Keep focusing</button><button data-confirm="'+name+'">'+(name==='restart'?'Restart':'End session')+'</button></div>'}
panel.innerHTML=`<div class="panel-heading"><strong>${title}</strong><button class="panel-close" aria-label="Close panel">${minimalIcon('close')}</button></div>${body}`;panel.querySelector('button')?.focus({preventScroll:true});wake();rotation.sync();}
hud.innerHTML='<div class="time-readout immersive-timer" role="timer" aria-label="Focus timer"><span data-session-clock>25:00</span></div><nav class="timer-actions" aria-label="Focus controls"><button data-action="toggle-timer" aria-label="Start">'+minimalIcon('play')+'</button><button data-confirm-open="restart" aria-label="Restart">'+minimalIcon('restart')+'</button><button data-confirm-open="end" aria-label="End session">'+minimalIcon('end')+'</button>'+['scene','sound','settings'].map(p=>`<button data-panel="${p}" aria-label="${p[0].toUpperCase()+p.slice(1)}" aria-expanded="false" aria-controls="previewPanel">${minimalIcon(p)}</button>`).join('')+'</nav>';
world.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.matches('[data-action]'))toggleTimer();else if(b.dataset.panel)openPanel(b.dataset.panel,b);else if(b.dataset.confirmOpen)openPanel(b.dataset.confirmOpen,b);else if(b.matches('.panel-close,[data-cancel]'))closePanel();else if(b.hasAttribute('data-mode')){reset(Number(b.dataset.mode));announce('Timer set to '+(Number(b.dataset.mode)||'free')+(Number(b.dataset.mode)?' minutes.':' mode.'));closePanel()}else if(b.dataset.view){selectView(b.dataset.view);rotation.sync(true)}else if(b.dataset.confirm){const action=b.dataset.confirm;reset();closePanel();if(action==='restart')toggleTimer();else announce('Session ended. Ready when you are.')}});
panel.addEventListener('input',e=>{const t=e.target;if(t.id==='autoScene'){autoScene=t.checked;rotation.sync(true)}if(t.id==='musicEnabled')musicEnabled=t.checked;if(t.id==='forestEnabled')forestEnabled=t.checked;if(t.id==='musicVolume')musicVolume=Number(t.value)/100;if(t.id==='forestVolume')forestVolume=Number(t.value)/100;updateAudio()});
world.addEventListener('pointermove',wake);world.addEventListener('pointerdown',e=>{wake();if(!e.target.closest('button,input,.preview-panel'))gesture={x:e.clientX,y:e.clientY,time:e.timeStamp,id:e.pointerId}});
world.addEventListener('pointerup',e=>{if(gesture&&e.pointerId===gesture.id){const dir=MobileSceneRotation.swipeDirection(gesture,{x:e.clientX,y:e.clientY,time:e.timeStamp});if(dir)rotation.step(dir)}gesture=null});world.addEventListener('pointercancel',()=>gesture=null);
world.addEventListener('keydown',e=>{wake();if(e.key==='Escape'&&panelName)closePanel()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){syncTimerFromClock();renderHud()}updateAudio();rotation.sync(true)});
window.addEventListener('pagehide',()=>{audioMusic.pause();audioForest.pause();rotation.stop()});
setInterval(()=>{syncTimerFromClock();renderHud()},250);wake();rotation.sync();

})();
