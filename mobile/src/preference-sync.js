(function (root) {
  'use strict';
  const keys = ['defaultTimerMode','reduceMotion','motionEffects','hudAutoHide','autoSceneSwitch','completionSound','rememberLastSound','rememberLastFocusView','sounds','soundVolumes','musicTrack','lastFocusView','sceneViews','sceneAudio'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const pick = source => Object.fromEntries(keys.filter(key => Object.hasOwn(source || {}, key)).map(key => [key, clone(source[key])]));
  function difference(base, desired) {
    const changes = [];
    for (const key of keys) {
      if (!Object.hasOwn(desired, key)) continue;
      if (key === 'sounds' || key === 'soundVolumes') {
        for (const channel of ['ambient','white','music']) if (desired[key]?.[channel] !== base[key]?.[channel]) changes.push([[key, channel], desired[key]?.[channel]]);
      } else if (key === 'sceneViews' || key === 'sceneAudio') {
        for (const scene of ['cafe','library','forest']) if (JSON.stringify(desired[key]?.[scene]) !== JSON.stringify(base[key]?.[scene])) changes.push([[key, scene], desired[key]?.[scene]]);
      } else if (desired[key] !== base[key]) changes.push([[key], desired[key]]);
    }
    return changes;
  }
  function rebase(remote, changes) {
    const result = pick(remote);
    for (const [path, value] of changes) {
      if (value === undefined || !keys.includes(path[0])) continue;
      if (path.length === 2 && ['ambient','white','music','cafe','library','forest'].includes(path[1])) { result[path[0]] ||= {}; result[path[0]][path[1]] = clone(value); }
      else if (path.length === 1) result[path[0]] = value;
    }
    return result;
  }
  function create({ storage, fetchSettings, saveSettings, apply, status = () => {} }) {
    let owner = null, eligible = false, epoch = 0, entry = null, busy = null;
    const store = () => { if (owner && entry) storage.setItem('focusMobilePreferencesV1:' + owner, JSON.stringify(entry)); };
    async function sync() {
      if (!eligible || !entry) { status('local'); return; }
      if (busy?.epoch === epoch) return busy.promise;
      const who = owner, revision = epoch, current = () => who === owner && revision === epoch;
      const promise = (async () => {
        status('syncing');
        try {
          for (let attempt = 0; attempt < 3; attempt++) {
            const cloud = await fetchSettings(who);
            if (!current() || cloud.userId !== who) return;
            const changes = difference(entry.base, entry.desired);
            entry.base = pick(cloud.settings); entry.version = cloud.version;
            entry.desired = rebase(entry.base, changes);
            apply(clone(entry.desired)); store();
            if (!difference(entry.base, entry.desired).length) { status('synced'); return; }
            const submitted = clone(entry.desired);
            try {
              const result = await saveSettings(who, submitted, entry.version);
              if (!current() || result.userId !== who) return;
              entry.base = submitted; entry.version = result.version; store();
              if (!difference(entry.base, entry.desired).length) { status('synced'); return; }
            } catch (error) { if (error.message !== 'preferences_conflict') throw error; }
          }
          if (current()) status('pending');
        } catch { if (current()) status('pending'); }
      })();
      busy = { epoch: revision, promise };
      try { await promise; } finally { if (busy?.epoch === revision) busy = null; }
    }
    return {
      select(nextOwner, canSync, seed = {}) {
        store(); owner = nextOwner; eligible = canSync; epoch++;
        try { entry = JSON.parse(storage.getItem('focusMobilePreferencesV1:' + owner) || 'null'); } catch { entry = null; }
        if (!entry || !Number.isSafeInteger(entry.version) || entry.version < 0 || !entry.base || !entry.desired) entry = { base: pick(seed), desired: pick(seed), version: 0 };
        else entry = { base: pick(entry.base), desired: pick(entry.desired), version: entry.version };
        apply(clone(entry.desired)); status(eligible ? 'pending' : 'local');
        return sync();
      },
      edit(settings) { if (!entry) return; entry.desired = pick(settings); store(); status(eligible ? 'pending' : 'local'); },
      sync,
    };
  }
  root.MobilePreferenceSync = { create, pick, difference, rebase };
})(globalThis);
