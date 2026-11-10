/* Shared static-scene capabilities. Database leases remain the room truth. */
function focusSceneDefinition(sceneId = state.sceneId || 'cafe') {
  return PUBLIC_CONFIG.sceneCatalog?.[sceneId] || null;
}
function sharedFocusScene() { return state.sceneId === 'cafe' || Boolean(PUBLIC_CONFIG.minimalMvp && state.sceneId === 'library'); }
function sceneSeatSlots() { return focusSceneDefinition()?.seats || staticSeatSlots; }
function sceneLabel(sceneId = state.sceneId) { return PUBLIC_CONFIG.sceneCatalog?.[sceneId]?.label || (sceneId === 'library' ? 'Academy Library' : 'Four Seasons Café'); }
function sceneLayoutStorageKey() { return state.sceneId === 'library' ? MINIMAL_LAYOUT_KEY + ':library' : MINIMAL_LAYOUT_KEY; }
function sceneDefaultFocusView(seatId) {
  const definition = focusSceneDefinition();
  const saved = preferences.sceneViews?.[state.sceneId] || (state.sceneId === 'cafe' && preferences.rememberLastFocusView ? preferences.lastFocusView : null);
  if (preferences.rememberLastFocusView && definition?.focusViews.some(v=>v.id===saved)) return saved;
  const zone = definition?.seats.find(s=>s.seat_id===seatId)?.desk_zone_id;
  return definition?.focusViews.some(v=>v.id===zone) ? zone : 'window';
}
function rememberSceneFocusView() {
  preferences.sceneViews = {...preferences.sceneViews,[state.sceneId]:state.focusImageChoice};
  if (state.sceneId === 'cafe') preferences.lastFocusView = state.focusImageChoice;
}
function rememberSceneAudio() {
  if (!PUBLIC_CONFIG.minimalMvp || !focusSceneDefinition()) return;
  preferences.sceneAudio = {...preferences.sceneAudio,[state.sceneId]:{sounds:{...state.sounds},soundVolumes:{...state.soundVolumes},musicTrack:state.musicTrack}};
}
function initializeSharedScenes() {
  if (!PUBLIC_CONFIG.minimalMvp || !PUBLIC_CONFIG.sceneCatalog) return;
  for (const definition of Object.values(PUBLIC_CONFIG.sceneCatalog)) {
    const scene=scenes[definition.id];if(!scene)continue;
    scene.image=definition.roomImage;scene.filter=definition.filter;
    scene.rooms=definition.onlineRooms.map(id=>({id,name:definition.label,occupied:0}));
    scene.seats=definition.seats.map(s=>({id:s.seat_id,name:`Seat ${s.seat_id}`,occupied:false}));
  }
}
async function enterMinimalScene(sceneId) {
  if(seatReleasePromise) await seatReleasePromise;
  const definition=PUBLIC_CONFIG.sceneCatalog?.[sceneId];
  if (!definition?.enabled || state.isAllocatingRoom || state.isTransitioning) return;
  if (hasActiveSeatSession()) {showToast('End your session before changing places.');return;}
  stopRoomPresence();suspendAudio();resetTimerState();
  state.sceneId=sceneId;state.roomId=null;state.selectedSeat=null;state.currentSeatId=null;state.offlineFocus=false;state.localRoom=false;
  state.roomPresence={leases:[],serverNow:Date.now()};state.localNpcRoster=[];state.presenceFetchedAt=0;
  identity.sessionId=crypto.randomUUID();persistIdentity();
  // Migrate the old global cafe preference before library changes can overwrite it.
  if(!preferences.sceneAudio?.cafe){preferences.sceneAudio={...preferences.sceneAudio,cafe:{sounds:{...preferences.sounds},soundVolumes:{...preferences.soundVolumes},musicTrack:preferences.musicTrack}};savePreferences();}
  const saved=preferences.rememberLastSound ? preferences.sceneAudio?.[sceneId] : null;
  const muted=Object.values(state.sounds).every(v=>!v);
  const defaults=defaultPreferences();
  state.sounds={...defaults.sounds,...saved?.sounds};
  state.soundVolumes={ambient:clampVolume(saved?.soundVolumes?.ambient,sceneId==='library'?25:defaults.soundVolumes.ambient),white:clampVolume(saved?.soundVolumes?.white,30),music:clampVolume(saved?.soundVolumes?.music,24)};
  state.musicTrack=FOCUS_MUSIC_TRACKS[saved?.musicTrack]?saved.musicTrack:defaults.musicTrack;
  if(muted)state.sounds={ambient:false,white:false,music:false};
  state.focusImageChoice=sceneDefaultFocusView(1);
  minimalUi.layout=null;minimalUi.layoutScene=null;minimalUi.panel=null;
  await enterCafeRoom();
  if(state.view==='room' && state.sceneId===sceneId)localStorage.setItem('focusIslandLastPlaceV1',sceneId);
}
let sceneAmbience = {context:null,source:null,gain:null,url:null,loading:null,buffers:new Map()};
function silenceSceneAmbience() {
  if(!sceneAmbience.gain || !sceneAmbience.context || sceneAmbience.context.state==='closed')return;
  const t=sceneAmbience.context.currentTime;sceneAmbience.gain.gain.cancelScheduledValues(t);sceneAmbience.gain.gain.setValueAtTime(0,t);
}
async function syncSceneAmbience() {
  const definition=focusSceneDefinition();
  const wanted=Boolean(state.isRunning && state.sounds.ambient && definition?.ambientAsset && audioContext);
  if(!wanted){silenceSceneAmbience();return;}
  const context=audioContext,url=definition.ambientAsset;
  if(sceneAmbience.context!==context || sceneAmbience.url!==url){
    try{sceneAmbience.source?.stop();}catch(_){}
    sceneAmbience.source=null;sceneAmbience.context=context;sceneAmbience.url=url;sceneAmbience.gain=context.createGain();sceneAmbience.gain.gain.value=0;sceneAmbience.gain.connect(context.destination);
  }
  if(!sceneAmbience.buffers.has(url)){
    if(!sceneAmbience.loading)sceneAmbience.loading=(async()=>{const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw new Error('ambience_unavailable');const buffer=await context.decodeAudioData(await response.arrayBuffer());sceneAmbience.buffers.set(url,buffer);})().catch(()=>{}).finally(()=>{sceneAmbience.loading=null;});
    await sceneAmbience.loading;
  }
  // A late decode must not start audio after pause, mute or a scene change.
  if(context!==audioContext || context.state==='closed' || !state.isRunning || !state.sounds.ambient || focusSceneDefinition()?.ambientAsset!==url || !sceneAmbience.buffers.has(url))return;
  if(!sceneAmbience.source){const source=context.createBufferSource();source.buffer=sceneAmbience.buffers.get(url);source.loop=true;source.connect(sceneAmbience.gain);source.start();sceneAmbience.source=source;}
  sceneAmbience.gain.gain.setTargetAtTime(definition.ambientGain*state.soundVolumes.ambient/100,context.currentTime,.35);
}
