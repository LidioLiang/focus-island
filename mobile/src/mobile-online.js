/* Native API transport. Tokens never cross the bridge into the web view. */
(function () {
  'use strict';
  if (window.__FOCUS_ISLAND_CONFIG__?.mobile?.channel !== 'online-beta') return;
  const native = window.Capacitor?.registerPlugin?.('FocusOnline');
  const localFetch = window.fetch.bind(window);
  const auth = new Set(['sign-in', 'sign-up', 'anonymous', 'sign-out']);
  window.fetch = async function (input, init = {}) {
    const request = new Request(input instanceof Request ? input : new URL(typeof input === 'string' ? input : input.href, location.href), init);
    const url = new URL(request.url);
    if (url.protocol !== location.protocol || url.host !== location.host) throw new TypeError('External requests are not allowed');
    if (!url.pathname.startsWith('/api/')) return localFetch(input, init);
    if (!native || !window.Capacitor.isNativePlatform()) throw new TypeError('Native networking is required');
    if (request.signal.aborted) throw new DOMException('Request aborted', 'AbortError');
    // OAuth gets a native ASWebAuthenticationSession/Apple adapter in the next integration step.
    if (url.pathname === '/api/auth/providers') return new Response(JSON.stringify({ providers: { email: true, google: false, apple: false, github: false } }), { headers: { 'Content-Type': 'application/json' } });
    const action = url.pathname.replace('/api/auth/', '');
    const path = auth.has(action) ? '/api/mobile/auth/' + action : url.pathname + url.search;
    const headers = request.headers;
    const result = await native.request({ path, method: request.method,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
      owner: headers.get('X-Focus-User') || undefined });
    if (request.signal.aborted) throw new DOMException('Request aborted', 'AbortError');
    return new Response(JSON.stringify(result.body), { status: result.status, headers: { 'Content-Type': 'application/json' } });
  };
})();
