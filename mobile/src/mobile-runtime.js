/* Stage A internal alpha only. Never impersonate a server account or online room. */
(function () {
  'use strict';
  if (window.__FOCUS_ISLAND_CONFIG__?.mobile?.channel === 'online-beta') return;
  if (window.__FOCUS_ISLAND_CONFIG__?.mobile?.channel !== 'offline-alpha') {
    throw new Error('This adapter is only valid for offline-alpha. Implement native authentication before enabling networking.');
  }
  const localFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, location.href);
    // URL.origin is "null" for some custom schemes, so compare protocol and host explicitly.
    const local = url.protocol === location.protocol && url.host === location.host;
    if (!local || url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'This internal alpha is offline. Online accounts and rooms are not connected.', code: 'MOBILE_OFFLINE_ALPHA' }), {
        status: 503, headers: { 'Content-Type': 'application/json' }
      });
    }
    return localFetch(input, init);
  };
  function notice(message) {
    const dialog = document.getElementById('mobile-notice');
    document.getElementById('mobile-notice-message').textContent = message;
    if (!dialog.open) dialog.showModal();
  }
  // Keep unavailable account/payment navigation out of the internal preview without changing web source.
  document.addEventListener('click', event => {
    const target = event.target.closest?.('[data-minimal="account"], [data-minimal="sign-in"], [data-analytics-settings], a[href]');
    if (!target) return;
    event.preventDefault(); event.stopImmediatePropagation();
    notice(target.matches('a')
      ? 'This is an internal offline preview. The published website has the current Privacy Policy and Terms. App-specific policies will be provided before release.'
      : 'Scenes, timers and local session saving are available. Sign-in, cloud sync, payments and analytics are not connected in this preview.');
  }, true);
})();
