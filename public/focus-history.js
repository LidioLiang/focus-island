/* Identity-scoped history. Legacy unowned records are never silently claimed. */
(function (root) {
  function createStore(storage, randomId) {
    const prefix = 'focusIslandHistoryV2:';
    const guestKey = 'focusIslandHistoryGuestV2';
    const read = key => { try { const value = JSON.parse(storage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
    const write = (owner, rows) => storage.setItem(prefix + owner, JSON.stringify(rows));
    let guest = storage.getItem(guestKey);
    if (!guest) { guest = 'local:' + randomId(); storage.setItem(guestKey, guest); }
    let owner = guest;
    function records() { return read(prefix + owner).filter(row => row.ownerUserId === owner); }
    function put(row) {
      const key = row.clientSessionId || row.id;
      const rows = records().filter(item => (item.clientSessionId || item.id) !== key);
      rows.unshift({ ...row, id: row.id || key, ownerUserId: owner });
      // Never discard pending records. Cloud history is fetched in pages.
      const pending = rows.filter(item => !item.synced);
      const cached = rows.filter(item => item.synced);
      write(owner, [...pending, ...cached].sort((a,b) => Number(b.endedAt || b.startedAt) - Number(a.endedAt || a.startedAt)));
    }
    return {
      owner: () => owner,
      select: id => { if(!id)guest=storage.getItem(guestKey) || guest; owner = id || guest; },
      records,
      put,
      clear: () => write(owner, []),
      pending: () => records().filter(row => !row.synced),
      markSynced: (id, keys) => {
        write(id, read(prefix + id).map(row => keys.includes(row.clientSessionId || row.id) ? { ...row, synced: true } : row));
      },
      transfer: (source, target) => {
        if (!source || source === target) return;
        const claimKey='focusIslandHistoryClaimV2:'+source;
        const claimed=storage.getItem(claimKey);
        if(claimed && claimed!==target)return;
        const previous = owner;
        owner = target;
        for (const row of read(prefix + source).filter(row => row.ownerUserId === source)) {
          if (!records().some(item => (item.clientSessionId || item.id) === (row.clientSessionId || row.id))) put({ ...row, synced: false });
        }
        storage.setItem(claimKey,target);
        // Keep a source copy for safe retry; ownership is never inferred from V1.
        owner = previous;
      },
      newGuest: () => { guest = 'local:' + randomId(); storage.setItem(guestKey, guest); owner = guest; },
      legacyCount: () => read('focusIslandHistoryV1').length,
    };
  }
  root.FocusHistory = { createStore };
})(typeof window === 'undefined' ? globalThis : window);
