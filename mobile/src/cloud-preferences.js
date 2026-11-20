(() => {
  if (PUBLIC_CONFIG.mobile?.channel !== 'online-beta') return;
  let applying = false, timer;
  const originalSave = savePreferences;
  const manager = MobilePreferenceSync.create({ storage: localStorage,
    fetchSettings: owner => api('/api/profile/preferences', { headers: { 'X-Focus-User': owner } }),
    saveSettings: (owner, settings, expectedVersion) => api('/api/profile/preferences', { method: 'PUT', headers: { 'X-Focus-User': owner }, body: JSON.stringify({ settings, expectedVersion }) }),
    apply: settings => {
      applying = true;
      const deviceNotifications = preferences.desktopNotifications;
      preferences = { ...defaultPreferences(), mobileExperienceVersion: 1, autoSceneSwitch: true, ...settings, desktopNotifications: deviceNotifications };
      originalSave();
      if (!state.sessionStartedAt) applyPreferencesToState({ includeTimer: true });
      applying = false;
    },
    status: value => { window.FocusPreferenceStatus = value; document.querySelectorAll('[data-mobile-sync-status]').forEach(node => { node.textContent = ({ synced: 'Settings synced', syncing: 'Syncing settings…', pending: 'Saved on this device · waiting to sync', local: 'Saved on this device' })[value]; }); }
  });
  savePreferences = function () {
    originalSave();
    if (applying) return;
    manager.edit(preferences);
    clearTimeout(timer); timer = setTimeout(() => manager.sync(), 750);
  };
  const identitySetter = setHistoryIdentity;
  setHistoryIdentity = function (...args) {
    const oldOwner = focusHistory.owner(); identitySetter(...args);
    if (focusHistory.owner() !== oldOwner) void manager.select(focusHistory.owner(), !historyAnonymous, {});
  };
  const clear = clearSignedInHistory;
  clearSignedInHistory = function () { clear(); void manager.select(focusHistory.owner(), false, {}); };
  window.addEventListener('online', () => manager.sync());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void manager.sync(); });
  window.FocusCloudPreferences = manager;
  void manager.select(focusHistory.owner(), Boolean(onlineUserId) && !historyAnonymous, preferences);
})();
