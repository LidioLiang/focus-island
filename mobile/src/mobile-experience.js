/* Mobile-only extensions to the pinned web baseline. Loaded after app.js. */
(() => {
  'use strict';
  const originalDefaults = defaultPreferences;
  defaultPreferences = function () {
    const defaults = originalDefaults();
    defaults.sounds.music = true;
    return defaults;
  };
  // One-time upgrade from the old alpha's default-off music. Later choices persist.
  if (preferences.mobileExperienceVersion !== 1) {
    preferences.sounds.music = true;
    state.sounds.music = true;
    for (const audio of Object.values(preferences.sceneAudio || {})) {
      audio.sounds = { ...audio.sounds, music: true };
    }
    preferences.mobileExperienceVersion = 1;
  }
  if (typeof preferences.autoSceneSwitch !== 'boolean') preferences.autoSceneSwitch = true;
  savePreferences();

  let pageSuspended = false, gesture = null, suppressClickUntil = 0;
  const pointers = new Set();
  function foreground() { return !document.hidden && !pageSuspended; }
  function available() {
    return foreground() && state.view === 'focus' && !state.isStartingFocus &&
      !minimalUi.panel && !minimalUi.confirm && !minimalUi.busy && !state.personalCenter.open;
  }
  function selectScene(id) {
    if (state.view !== 'focus' || state.isStartingFocus) return;
    if (!focusSceneDefinition()?.focusViews.some(v => v.id === id && !v.hidden)) return;
    state.focusImageChoice = id;
    rememberSceneFocusView(); savePreferences();
    const image = document.querySelector('[data-focus-scene-image]');
    if (image) {
      image.src = selectedFocusImage();
      if (!preferences.reduceMotion) {
        image.getAnimations?.().forEach(animation => animation.cancel());
        image.animate?.([{ opacity: .55 }, { opacity: 1 }], { duration: 650, easing: 'ease-out' });
      }
    }
    persistActiveSession(true);
    minimalRenderPanel();
  }
  const rotation = MobileSceneRotation.create({
    read: () => ({ sceneId: state.sceneId, active: available(), enabled: preferences.autoSceneSwitch,
      current: state.focusImageChoice, views: focusSceneDefinition()?.focusViews || [] }),
    select: selectScene
  });

  // A room and its immersive view share one session and one audio player.
  function hasRoomSession() {
    return state.view === 'room' && (Boolean(state.sessionStartedAt) || state.sessionPhase === 'rest');
  }
  function shouldPlayAudio() {
    return foreground() && ['focus', 'room'].includes(state.view) && state.isRunning && state.sessionPhase !== 'rest';
  }
  const originalUpdateAudio = updateAudio;
  updateAudio = function () {
    if (!shouldPlayAudio()) { suspendAudio(); return; }
    originalUpdateAudio();
  };
  const originalSyncAmbience = syncSceneAmbience;
  syncSceneAmbience = async function () {
    if (!shouldPlayAudio()) { silenceSceneAmbience(); return; }
    await originalSyncAmbience();
    // A delayed ambient decode must not become audible after leaving the session.
    if (!shouldPlayAudio()) silenceSceneAmbience();
  };
  updateMusicAudio = function () {
    const track = FOCUS_MUSIC_TRACKS[state.musicTrack];
    if (!shouldPlayAudio() || !state.sounds.music || !track) {
      musicAudio?.pause(); return;
    }
    if (!musicAudio || loadedMusicTrack !== state.musicTrack) {
      musicAudio?.pause(); musicAudio?.remove();
      musicAudio = new Audio(track.src);
      musicAudio.loop = true; musicAudio.preload = 'auto';
      musicAudio.hidden = true; musicAudio.dataset.mobileMusic = '';
      document.body.appendChild(musicAudio);
      loadedMusicTrack = state.musicTrack;
    }
    musicAudio.volume = Math.min(.9, Math.max(0, state.soundVolumes.music / 100 * MUSIC_VOLUME_BOOST));
    if (musicAudio.paused) void musicAudio.play().catch(() => {});
  };
  const originalStopAudio = stopAudio;
  stopAudio = function () { const element = musicAudio; originalStopAudio(); element?.remove(); };
  const originalSaveSound = saveSoundPreferencesFromState;
  saveSoundPreferencesFromState = function () { originalSaveSound(); updateMusicAudio(); };

  const originalHeader = minimalHeader;
  minimalHeader = function (view) {
    const html = originalHeader(view);
    return view === 'focus' || hasRoomSession() ? html.replace(/<nav class="scene-tools"[\s\S]*?<\/nav>/,
      `<nav class="scene-tools" aria-label="Profile">${minimalTool('avatar', 'Your avatar', true)}</nav>`) : html;
  };
  minimalTimerMarkup = function () {
    const resting = state.sessionPhase === 'rest';
    const label = state.isRunning ? 'Pause' : state.sessionStartedAt ? 'Resume' : 'Start';
    const local = state.offlineStartAvailable && !state.sessionStartedAt;
    const panelButton = (panel, name) => `<button type="button" data-minimal="panel" data-panel="${panel}" aria-label="${name}" aria-expanded="${minimalUi.panel === panel}" aria-controls="minimal-panel">${minimalIcon(panel)}</button>`;
    return `<aside class="focus-widget mobile-focus-widget" aria-label="Focus timer">
      <div class="time-readout immersive-timer" role="timer" tabindex="-1" aria-label="${resting ? 'Break timer' : 'Focus timer'}"><span ${resting ? 'data-rest-clock' : 'data-session-clock'}>${resting ? formatRestTime() : formatTime()}</span></div>
      <nav class="timer-actions" id="minimal-timer-actions" aria-label="Focus controls">
        <button type="button" ${local ? 'data-minimal="start-local"' : 'data-action="toggle-timer"'} aria-label="${local ? 'Continue locally' : label}" ${resting ? 'disabled' : ''}>${minimalIcon(state.isRunning ? 'pause' : 'play')}</button>
        <button type="button" data-minimal="restart" aria-label="Restart" ${resting ? 'disabled' : ''}>${minimalIcon('restart')}</button>
        <button type="button" data-minimal="${resting ? 'end-break' : 'end'}" aria-label="${resting ? 'End break' : 'End session'}">${minimalIcon('end')}</button>
        ${hasRoomSession() ? `<button type="button" data-minimal="focus-view" aria-label="Return to focus">${minimalIcon('scene')}</button>` : panelButton('scene', 'Scene')}${panelButton('sound', 'Sound')}${panelButton('settings', 'Settings')}
      </nav></aside>`;
  };
  const originalPanel = minimalRenderPanel;
  minimalRenderPanel = function () {
    originalPanel();
    const box = document.getElementById('minimal-panel');
    if (box && minimalUi.panel === 'scene') {
      box.querySelector('.panel-heading').insertAdjacentHTML('afterend',
        `<label class="setting-row mobile-auto-scene"><span>Auto-switch scenes<small>Every 5 minutes · Swipe to change</small></span><input type="checkbox" class="switch" data-mobile-auto-scene aria-label="Auto-switch scenes" ${preferences.autoSceneSwitch ? 'checked' : ''}></label>`);
    }
    if (box && minimalUi.panel && (state.view === 'focus' || hasRoomSession())) {
      const anchor = document.querySelector(`.mobile-focus-widget [data-panel="${minimalUi.panel}"]`);
      if (anchor) {
        const a = anchor.getBoundingClientRect(), world = box.closest('.world').getBoundingClientRect();
        const above = a.top - world.top - 24;
        const below = world.bottom - a.bottom - 24;
        const openAbove = above >= below;
        box.style.maxHeight = `${Math.max(100, openAbove ? above : below)}px`;
        box.style.left = `${Math.max(12, Math.min(world.width - box.offsetWidth - 12, a.left - world.left + a.width / 2 - box.offsetWidth / 2))}px`;
        box.style.top = `${Math.max(12, openAbove ? a.top - world.top - box.offsetHeight - 12 : a.bottom - world.top + 12)}px`;
      }
    }
    rotation.sync();
  };
  const originalShell = minimalShell;
  minimalShell = function (view, content) {
    if (view === 'room') {
      content = content.replace('<span class="minimal-room-mode">Solo room</span>', '');
      if (hasRoomSession()) {
        content = content.replace(/<button\b[^>]*data-minimal="focus-view"[^>]*>[\s\S]*?<\/button>/, '');
        content += minimalTimerMarkup();
      }
    }
    originalShell(view, content);
    gesture = null;
    rotation.sync();
    if (hasRoomSession()) {
      if (state.isRunning || state.sessionPhase === 'rest') startTicker();
      persistActiveSession(true);
    }
    updateAudio();
  };
  const originalConfirm = minimalRenderConfirm;
  minimalRenderConfirm = function () { originalConfirm(); rotation.sync(); };

  document.addEventListener('change', event => {
    if (!event.target.matches('[data-mobile-auto-scene]')) return;
    preferences.autoSceneSwitch = event.target.checked;
    savePreferences(); rotation.sync(true);
  });
  document.addEventListener('click', event => {
    if (Date.now() < suppressClickUntil && !event.target.closest(controls)) {
      event.preventDefault(); event.stopImmediatePropagation(); return;
    }
    const choice = event.target.closest('[data-minimal-scene]');
    if (!choice) return;
    event.preventDefault(); event.stopImmediatePropagation();
    selectScene(choice.dataset.minimalScene); rotation.sync(true);
  }, true);
  const controls = 'button,input,select,textarea,a,[role="button"],.floating-panel,.focus-widget,.confirm-layer,.scene-header';
  document.addEventListener('pointerdown', event => {
    pointers.add(event.pointerId);
    if (pointers.size !== 1) { gesture = null; return; }
    if (!available() || event.button !== 0 || event.target.closest(controls) || !event.target.closest('.minimal-root[data-view=focus] .world')) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, scene: state.sceneId, choice: state.focusImageChoice };
  });
  document.addEventListener('pointerup', event => {
    pointers.delete(event.pointerId);
    const start = gesture; gesture = null;
    if (start && start.id === event.pointerId && start.scene === state.sceneId && start.choice === state.focusImageChoice && available()) {
      const direction = MobileSceneRotation.swipeDirection(start, { x: event.clientX, y: event.clientY, time: event.timeStamp });
      if (direction && rotation.step(direction)) suppressClickUntil = Date.now() + 350;
    }
    // Retry autoplay in the user's gesture if a browser preview blocked it.
    updateMusicAudio();
  });
  document.addEventListener('pointercancel', event => { pointers.delete(event.pointerId); gesture = null; });
  document.addEventListener('keydown', event => {
    if (!available() || event.target.closest(controls) || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); rotation.step(event.key === 'ArrowLeft' ? -1 : 1);
  });
  function visibilityChanged() { gesture = null; pointers.clear(); rotation.sync(true); updateAudio(); }
  document.addEventListener('visibilitychange', visibilityChanged);
  window.addEventListener('pagehide', () => { pageSuspended = true; visibilityChanged(); });
  window.addEventListener('pageshow', () => { pageSuspended = false; visibilityChanged(); });
  // The baseline renders once before this extension is loaded.
  render();
})();
