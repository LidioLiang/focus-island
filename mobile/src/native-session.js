/* Native lifecycle adapter; the web preview keeps the existing audio implementation. */
(() => {
  if (!window.Capacitor?.isNativePlatform?.()) return;
  const native = window.Capacitor.registerPlugin('FocusSession');
  let sequence = Promise.resolve(), lastPayload = '', failed = false, ready = false, pendingJournal = null;
  function payload(resumeAudio = false) {
    const running = ['room', 'focus'].includes(state.view) && state.isRunning && state.sessionPhase !== 'rest';
    const channels = [];
    const add = (id, path, volume) => { if (state.sounds[id] && path) channels.push({ id, path: path.replace(/^\//, ''), volume }); };
    if (running) {
      add('music', FOCUS_MUSIC_TRACKS[state.musicTrack]?.src, state.soundVolumes.music / 100 * MUSIC_VOLUME_BOOST);
      add('ambient', focusSceneDefinition()?.ambientAsset || '/assets/audio/native-cafe.wav', state.soundVolumes.ambient / 100 * .35);
      add('white', '/assets/audio/native-white.wav', state.soundVolumes.white / 100 * .2);
    }
    return { running, deadline: running && state.timerMode > 0 ? (lastTick || Date.now()) + state.remainingSeconds * 1000 : null,
      channels, notify: preferences.desktopNotifications === true, completionSound: preferences.completionSound !== false,
      journal: ['room', 'focus'].includes(state.view) && state.sessionStartedAt ? localStorage.getItem(STORAGE_KEYS.activeSession) : pendingJournal, resumeAudio };
  }
  function sync(resume = false) {
    if (!ready) return;
    const data = payload(resume), fingerprint = JSON.stringify(data);
    if (fingerprint === lastPayload && !failed) return;
    lastPayload = fingerprint;
    // Send in order: a delayed pause/end cannot be overwritten by an earlier running snapshot.
    sequence = sequence.catch(() => {}).then(() => native.sync({ state: data })).then(() => { failed = false; }).catch(() => {
      if (!failed) showToast('Audio could not update. Tap a sound control to retry.');
      failed = true;
    });
  }
  const webStop = stopAudio;
  webStop();
  updateAudio = function () { sync(); };
  updateMusicAudio = function () { sync(); };
  syncSceneAmbience = async function () { sync(); };
  // Pause follows the logical clock, not document visibility. Room/focus transitions do not stop playback.
  suspendAudio = function () { sync(); };
  stopAudio = function () {
    webStop(); lastPayload = '';
    const data = { ...payload(), running: false, channels: [], deadline: null, journal: state.isRunning ? localStorage.getItem(STORAGE_KEYS.activeSession) : null };
    sequence = sequence.catch(() => {}).then(() => native.sync({ state: data })).catch(() => { failed = true; });
  };
  const save = persistActiveSession;
  persistActiveSession = function (force) { save(force); sync(); };
  const reset = resetTimerState;
  resetTimerState = function (options) { reset(options); sync(); };
  native.addListener('completed', () => { syncTimerFromClock(); persistActiveSession(true); });
  native.addListener('foreground', () => { syncTimerFromClock(); persistActiveSession(true); void recoverCafeSeat('native-foreground'); });
  native.addListener('audioReset', () => { lastPayload = ''; sync(); });
  native.addListener('audioPaused', () => showToast('Audio paused. Tap a sound control to resume; your timer is still running.'));
  document.addEventListener('change', event => { if (event.target.closest('[data-minimal-sound], [data-minimal-volume], [data-minimal-music]')) sync(true); });
  document.addEventListener('input', event => { if (event.target.closest('[data-minimal-volume]')) sync(true); });
  document.addEventListener('visibilitychange', () => { syncTimerFromClock(); persistActiveSession(true); });
  window.FocusNativeSession = { sync, native };
  function recoverJournal(identityKnown = false) {
    if (!pendingJournal) return;
    try {
      const saved = JSON.parse(pendingJournal);
      if (saved.ownerUserId !== focusHistory.owner()) { if (identityKnown) pendingJournal = null; return; }
      if (!localStorage.getItem(STORAGE_KEYS.activeSession) && !state.sessionStartedAt) {
        localStorage.setItem(STORAGE_KEYS.activeSession, pendingJournal); restoreActiveSession(); render();
      }
      pendingJournal = null;
    } catch { pendingJournal = null; }
  }
  const setIdentity = setHistoryIdentity;
  setHistoryIdentity = function (...args) { setIdentity(...args); recoverJournal(true); sync(); };
  const clearIdentity = clearSignedInHistory;
  clearSignedInHistory = function () { pendingJournal = null; clearIdentity(); sync(); };
  void native.restore().then(({ journal }) => {
    pendingJournal = typeof journal === 'string' ? journal : null;
    recoverJournal(Boolean(onlineUserId));
  }).catch(() => {}).finally(() => { ready = true; sync(); });
})();
