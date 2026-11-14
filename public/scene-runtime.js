/* Shared static-scene capabilities. Database leases remain the room truth. */
function focusSceneDefinition(sceneId = state.sceneId || 'cafe') {
  return PUBLIC_CONFIG.sceneCatalog?.[sceneId] || null;
}
function sharedFocusScene() { return state.sceneId === 'cafe' || Boolean(PUBLIC_CONFIG.minimalMvp && focusSceneDefinition()?.enabled); }
function sceneSeatSlots() { return focusSceneDefinition()?.seats || staticSeatSlots; }
function sceneLabel(sceneId = state.sceneId) { return PUBLIC_CONFIG.sceneCatalog?.[sceneId]?.label || (sceneId === 'library' ? 'Academy Library' : 'Four Seasons Café'); }
function sceneUsesCompactLayout() {
  if (state.sceneId !== 'forest' || typeof window === 'undefined') return false;
  const size = focusSceneDefinition()?.designSize || [1672,941];
  const width = Math.min(window.innerWidth, (window.innerHeight || Infinity) * size[0] / size[1]);
  return width < 700;
}
function sceneLayoutStorageKey() {
  // Keep old independent café/library positions intact, but do not apply them to unified markers.
  if (state.sceneId === 'cafe' || state.sceneId === 'library') return MINIMAL_LAYOUT_KEY + ':' + state.sceneId + ':unified';
  const key = state.sceneId && state.sceneId !== 'cafe' ? MINIMAL_LAYOUT_KEY + ':' + state.sceneId : MINIMAL_LAYOUT_KEY;
  return sceneUsesCompactLayout() ? key + ':compact' : key;
}
function sceneDefaultFocusView(seatId) {
  const definition = focusSceneDefinition();
  const saved = preferences.sceneViews?.[state.sceneId] || (state.sceneId === 'cafe' && preferences.rememberLastFocusView ? preferences.lastFocusView : null);
  if (preferences.rememberLastFocusView && definition?.focusViews.some(v=>v.id===saved)) return saved;
  const zone = definition?.seats.find(s=>s.seat_id===seatId)?.desk_zone_id;
  return definition?.focusViews.some(v=>v.id===zone) ? zone : definition?.focusViews[0]?.id || 'window';
}
function rememberSceneFocusView() {
  preferences.sceneViews = {...preferences.sceneViews,[state.sceneId]:state.focusImageChoice};
  if (state.sceneId === 'cafe') preferences.lastFocusView = state.focusImageChoice;
}
function rememberSceneAudio() {
  if (!PUBLIC_CONFIG.minimalMvp || !focusSceneDefinition()) return;
  preferences.sceneAudio = {...preferences.sceneAudio,[state.sceneId]:{sounds:{...state.sounds},soundVolumes:{...state.soundVolumes},musicTrack:state.musicTrack}};
}
function applySceneAudioPreferences(sceneId) {
  const muted=Object.values(state.sounds).every(v=>!v);
  // Migrate the old global cafe preference before library changes can overwrite it.
  if(!preferences.sceneAudio?.cafe){preferences.sceneAudio={...preferences.sceneAudio,cafe:{sounds:{...preferences.sounds},soundVolumes:{...preferences.soundVolumes},musicTrack:preferences.musicTrack}};savePreferences();}
  const saved=preferences.rememberLastSound ? preferences.sceneAudio?.[sceneId] : null;
  const defaults=defaultPreferences();
  state.sounds={...defaults.sounds,...saved?.sounds};
  state.soundVolumes={ambient:clampVolume(saved?.soundVolumes?.ambient,focusSceneDefinition(sceneId)?.ambientVolume ?? (sceneId==='library'?25:defaults.soundVolumes.ambient)),white:clampVolume(saved?.soundVolumes?.white,30),music:clampVolume(saved?.soundVolumes?.music,24)};
  state.musicTrack=FOCUS_MUSIC_TRACKS[saved?.musicTrack]?saved.musicTrack:defaults.musicTrack;
  if(muted)state.sounds={ambient:false,white:false,music:false};
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
  applySceneAudioPreferences(sceneId);
  state.focusImageChoice=sceneDefaultFocusView(1);
  minimalUi.layout=null;minimalUi.layoutScene=null;minimalUi.panel=null;
  await enterCafeRoom();
  if(state.view==='room' && state.sceneId===sceneId)localStorage.setItem('focusIslandLastPlaceV1',sceneId);
}
let sceneAmbience = {context:null,source:null,gain:null,url:null,loading:new Map(),buffers:new Map()};
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
    if(!sceneAmbience.loading.has(url)) {
      const pending=(async()=>{const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw new Error('ambience_unavailable');const buffer=await context.decodeAudioData(await response.arrayBuffer());sceneAmbience.buffers.set(url,buffer);})().catch(()=>{}).finally(()=>{sceneAmbience.loading.delete(url);});
      sceneAmbience.loading.set(url,pending);
    }
    await sceneAmbience.loading.get(url);
  }
  // A late decode must not start audio after pause, mute or a scene change.
  if(context!==audioContext || context.state==='closed' || !state.isRunning || !state.sounds.ambient || focusSceneDefinition()?.ambientAsset!==url || !sceneAmbience.buffers.has(url))return;
  if(!sceneAmbience.source){const source=context.createBufferSource();source.buffer=sceneAmbience.buffers.get(url);source.loop=true;source.connect(sceneAmbience.gain);source.start();sceneAmbience.source=source;}
  sceneAmbience.gain.gain.setTargetAtTime(definition.ambientGain*state.soundVolumes.ambient/100,context.currentTime,.35);
}

// Recover the exact cloud session in its own place; commit the location only after
// the owned lease is confirmed. No old clock is ever applied to a new scene.
async function restoreCloudFocusPlace(session) {
  const sceneId=session.scene_id,definition=focusSceneDefinition(sceneId),seat=Number(session.seat_id);
  const local=session.room_id===`${sceneId}-local`;
  if(!definition?.enabled || !Number.isInteger(seat) || seat<1 || seat>6 || (!local && !definition.onlineRooms.includes(session.room_id)))throw new Error('focus_place_unavailable');
  if(state.sceneId===sceneId && state.roomId===session.room_id && state.currentSeatId===seat)return;
  const originScene=state.sceneId, originView=state.view, originIdentity=identity.sessionId;
  await releaseSeat({force:true});
  if(state.sceneId!==originScene || state.view!==originView || identity.sessionId!==originIdentity)throw new Error('focus_place_unavailable');
  identity.sessionId=crypto.randomUUID();persistIdentity();
  const recoveringSession=identity.sessionId, recoveryRevision=seatReleaseRevision;
  const operation=(async()=>{
  const resumed=local ? {roomId:session.room_id,seatId:seat} : await api(`/api/sessions/${identity.sessionId}/resume`,{method:'POST',body:JSON.stringify({preferredRoomId:session.room_id,preferredSeatId:seat,displayName:identity.displayName,avatarSkin:identity.avatarSkin,activity:session.status==='running'?'Focusing':'Seated',focusing:session.status==='running',focusStartedAt:Date.parse(session.started_at)})});
  if(identity.sessionId!==recoveringSession || seatReleaseRevision!==recoveryRevision || state.sceneId!==originScene || state.view!==originView){if(!local)void api(`/api/sessions/${recoveringSession}/release`,{method:'POST',body:'{}'}).catch(()=>{});throw new Error('focus_place_unavailable');}
  if((!local && !definition.onlineRooms.includes(resumed.roomId)) || !Number.isInteger(Number(resumed.seatId)) || Number(resumed.seatId)<1 || Number(resumed.seatId)>6)throw new Error('focus_place_unavailable');
  suspendAudio();
  state.sceneId=sceneId;state.roomId=resumed.roomId;state.currentSeatId=Number(resumed.seatId);state.selectedSeat=state.currentSeatId-1;
  state.localRoom=local;state.offlineFocus=false;state.presenceUnavailable=false;state.localNpcRoster=[];state.presenceFetchedAt=0;
  state.roomPresence={leases:local?[{roomId:state.roomId,seatId:state.currentSeatId,sessionId:identity.sessionId,displayName:identity.displayName,avatarSkin:identity.avatarSkin,avatarUrl:identity.avatarUrl,memberType:'human',state:'occupied',activity:session.status==='running'?'Focusing':'Seated',focusStartedAt:Date.parse(session.started_at)}]:[],serverNow:Date.now()};
  state.focusImageChoice=sceneDefaultFocusView(state.currentSeatId);applySceneAudioPreferences(sceneId);
  minimalUi.layout=null;minimalUi.layoutScene=null;minimalUi.panel=null;
  localStorage.setItem('focusIslandLastPlaceV1',sceneId);
  })();
  // releaseSeat must drain this RPC before deleting its lease. Keep the shared
  // drain non-rejecting, while the caller still receives the restoration error.
  const drain=operation.catch(()=>false);
  seatRecoveryPromise=drain;
  try { await operation; }
  finally { if(seatRecoveryPromise===drain)seatRecoveryPromise=null; }
}
