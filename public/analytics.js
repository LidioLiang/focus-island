/* Focus Isle product analytics: explicit consent, allowlisted events, no replay/autocapture. */
(function initializeFocusAnalytics() {
  "use strict";

  const config = window.__FOCUS_ANALYTICS_CONFIG__ || {};
  const token = String(config.projectToken || "").trim();
  const host = String(config.apiHost || "").replace(/\/$/, "");
  const consentKey = "focusIsleAnalyticsConsentV1";
  const anonymousIdKey = "focusIsleAnalyticsAnonymousIdV1";
  const developerKey = "focusIsleAnalyticsDeveloperV1";
  const allowedProperties = {
    landing_viewed: new Set(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]),
    scene_selected: new Set(["scene_id"]),
    seat_confirmed: new Set(["scene_id", "seat_id", "room_type"]),
    focus_started: new Set(["scene_id", "seat_id", "room_type", "timer_mode"]),
    focus_finished: new Set(["scene_id", "seat_id", "room_type", "timer_mode", "actual_seconds", "result"]),
  };
  const state = {
    distinctId: "",
    isAnonymous: true,
    isDeveloper: localStorage.getItem(developerKey) === "true",
    landingCaptured: false,
    landingTimer: null,
  };

  function randomId() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function anonymousId() {
    let value = localStorage.getItem(anonymousIdKey);
    if (!value) {
      value = randomId();
      localStorage.setItem(anonymousIdKey, value);
    }
    return value;
  }

  state.distinctId = anonymousId();

  function consent() {
    return localStorage.getItem(consentKey);
  }

  function respectsDoNotTrack() {
    return navigator.doNotTrack === "1" || window.doNotTrack === "1";
  }

  function canCapture() {
    return Boolean(token && host && consent() === "granted" && !state.isDeveloper && !respectsDoNotTrack());
  }

  function safeLocation() {
    return `${location.origin}${location.pathname}`;
  }

  function cleanValue(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") return value.slice(0, 200);
    return undefined;
  }

  function cleanProperties(eventName, properties) {
    const allowlist = allowedProperties[eventName];
    if (!allowlist) return null;
    const clean = {};
    for (const key of allowlist) {
      const value = cleanValue(properties?.[key]);
      if (value !== undefined && value !== "") clean[key] = value;
    }
    return clean;
  }

  function send(eventName, properties, { identify = false, anonymousDistinctId = "" } = {}) {
    if (!canCapture()) return false;
    const eventProperties = {
      distinct_id: state.distinctId,
      $current_url: safeLocation(),
      $host: location.host,
      $pathname: location.pathname,
      $lib: "focus-isle-web",
      $lib_version: "1.0.0",
      $insert_id: randomId(),
      app_version: String(config.appVersion || "unknown").slice(0, 32),
      environment: String(config.environment || "unknown").slice(0, 32),
      is_anonymous: state.isAnonymous,
      is_developer: state.isDeveloper,
      ...properties,
    };
    if (state.isAnonymous && !identify) eventProperties.$process_person_profile = false;
    if (anonymousDistinctId) eventProperties.$anon_distinct_id = anonymousDistinctId;
    void fetch(`${host}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: token, event: eventName, properties: eventProperties, timestamp: new Date().toISOString() }),
      keepalive: true,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    }).catch(() => {});
    return true;
  }

  function landingProperties() {
    const query = new URLSearchParams(location.search);
    return Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
      .map((key) => [key, query.get(key)])
      .filter(([, value]) => value));
  }

  function captureLanding() {
    if (state.landingCaptured || !canCapture()) return;
    state.landingCaptured = send("landing_viewed", cleanProperties("landing_viewed", landingProperties()));
  }

  function scheduleLanding() {
    if (state.landingTimer || state.landingCaptured) return;
    state.landingTimer = window.setTimeout(() => {
      state.landingTimer = null;
      captureLanding();
    }, 1200);
  }

  function capture(eventName, properties = {}) {
    const clean = cleanProperties(eventName, properties);
    if (!clean) return false;
    return send(eventName, clean);
  }

  function identify(userId, properties = {}) {
    const nextId = String(userId || "").trim();
    if (!nextId) return false;
    const developer = properties.is_developer === true;
    state.isDeveloper = developer;
    state.isAnonymous = properties.is_anonymous !== false;
    localStorage.setItem(developerKey, String(developer));
    if (developer) return false;
    const previousId = state.distinctId;
    state.distinctId = nextId;
    if (!canCapture()) return false;
    const personProperties = {
      account_type: state.isAnonymous ? "anonymous" : "permanent",
      is_developer: false,
    };
    const sent = send("$identify", { $set: personProperties }, {
      identify: true,
      anonymousDistinctId: previousId !== nextId ? previousId : "",
    });
    scheduleLanding();
    return sent;
  }

  function reset() {
    localStorage.removeItem(anonymousIdKey);
    localStorage.removeItem(developerKey);
    state.distinctId = anonymousId();
    state.isAnonymous = true;
    state.isDeveloper = false;
  }

  function removeConsentPanel() {
    document.querySelector(".analytics-consent")?.remove();
  }

  function setConsent(value) {
    localStorage.setItem(consentKey, value === "granted" ? "granted" : "denied");
    removeConsentPanel();
    if (value === "granted") scheduleLanding();
  }

  function showConsentPanel(force = false) {
    if (!token || !host || respectsDoNotTrack() || (!force && consent())) return;
    removeConsentPanel();
    const panel = document.createElement("section");
    panel.className = "analytics-consent";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Analytics choices");
    panel.innerHTML = `<div><strong>Help improve Focus Isle</strong><p>Allow anonymous product analytics so we can learn which parts help people begin and finish a focus session. No session recording or advertising.</p><a href="/privacy">Privacy policy</a></div><div class="analytics-consent-actions"><button type="button" data-analytics-consent="denied">No thanks</button><button type="button" data-analytics-consent="granted">Allow analytics</button></div>`;
    document.body.appendChild(panel);
  }

  document.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-analytics-consent]");
    if (choice) {
      event.preventDefault();
      setConsent(choice.dataset.analyticsConsent);
      return;
    }
    if (event.target.closest("[data-analytics-settings]")) {
      event.preventDefault();
      showConsentPanel(true);
    }
  }, true);

  window.FocusAnalytics = Object.freeze({ capture, identify, reset, setConsent, showConsentPanel });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => showConsentPanel(), { once: true });
  else showConsentPanel();
  if (consent() === "granted") scheduleLanding();
})();
