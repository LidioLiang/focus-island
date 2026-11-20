/* Native API transport. Tokens never cross the bridge into the web view. */
(function () {
  'use strict';
  if (window.__FOCUS_ISLAND_CONFIG__?.mobile?.channel !== 'online-beta') return;
  const native = window.Capacitor?.registerPlugin?.('FocusOnline');
  const localFetch = window.fetch.bind(window);
  const auth = new Set(['sign-in', 'sign-up', 'anonymous', 'sign-out', 'verify-email', 'resend-email']);
  window.fetch = async function (input, init = {}) {
    const request = new Request(input instanceof Request ? input : new URL(typeof input === 'string' ? input : input.href, location.href), init);
    const url = new URL(request.url);
    if (url.protocol !== location.protocol || url.host !== location.host) throw new TypeError('External requests are not allowed');
    if (!url.pathname.startsWith('/api/')) return localFetch(input, init);
    if (!native || !window.Capacitor.isNativePlatform()) throw new TypeError('Native networking is required');
    if (request.signal.aborted) throw new DOMException('Request aborted', 'AbortError');
    // OAuth gets a native ASWebAuthenticationSession/Apple adapter in the next integration step.
    if (url.pathname === '/api/auth/providers') {
      const config = await native.request({ path: '/api/mobile/auth/config', method: 'GET' });
      return new Response(JSON.stringify(config.body), { status: config.status, headers: { 'Content-Type': 'application/json' } });
    }
    const action = url.pathname.replace('/api/auth/', '');
    const path = auth.has(action) ? '/api/mobile/auth/' + action : action === 'password/reset' ? '/api/mobile/auth/password-reset' : action === 'password/update' ? '/api/mobile/auth/password-update' : url.pathname + url.search;
    const headers = request.headers;
    const payload = { path, method: request.method, owner: headers.get('X-Focus-User') || undefined };
    if (!['GET', 'HEAD'].includes(request.method)) {
      if (path === '/api/profile/avatar' && headers.get('Content-Type')?.startsWith('multipart/form-data;')) {
        const bytes = new Uint8Array(await request.arrayBuffer());
        if (bytes.length > 4_300_000) throw new Error('image_too_large');
        let raw = '';
        for (let i = 0; i < bytes.length; i += 8192) raw += String.fromCharCode(...bytes.subarray(i, i + 8192));
        payload.bodyBase64 = btoa(raw); payload.contentType = headers.get('Content-Type');
      } else payload.body = await request.text();
    }
    const result = await native.request(payload);
    if (request.signal.aborted) throw new DOMException('Request aborted', 'AbortError');
    return new Response(JSON.stringify(result.body), { status: result.status, headers: { 'Content-Type': 'application/json' } });
  };
})();
