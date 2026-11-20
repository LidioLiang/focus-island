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
