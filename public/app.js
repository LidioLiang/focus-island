const ASSET_BASE = "./assets/";
// 填入正式问卷地址后，页面底部的反馈入口会自动启用。
const FEEDBACK_FORM_URL = "";

const scenes = {
  cafe: {
    id: "cafe",
    name: "雨巷咖啡馆",
    shortName: "咖啡厅",
    islandLabel: "城市区",
    icon: "city",
    online: 0,
    image: `${ASSET_BASE}20261011-cafe-focus-room.png`,
    focusViews: {
      1: `${ASSET_BASE}20261012-cafe-bar-focus-view.png`,
      2: `${ASSET_BASE}20261012-cafe-bar-focus-view.png`,
      3: `${ASSET_BASE}20261012-cafe-bar-focus-view.png`,
      4: `${ASSET_BASE}20261012-cafe-bar-focus-view.png`,
      5: `${ASSET_BASE}20261012-cafe-window-focus-view.png`,
      6: `${ASSET_BASE}20261012-cafe-window-focus-view.png`,
      7: `${ASSET_BASE}20261012-cafe-window-focus-view.png`,
      8: `${ASSET_BASE}20261012-cafe-window-focus-view.png`,
      9: `${ASSET_BASE}20261012-cafe-lounge-focus-view.png`,
      10: `${ASSET_BASE}20261012-cafe-lounge-focus-view.png`,
    },
    description: "雨落在窗上，咖啡机偶尔轻响。选一张熟悉的桌子，和岛民们安静地做自己的事。",
    sounds: ["细雨", "咖啡馆底噪", "偶尔杯碟声"],
    filter: 620,
    rooms: [
      { id: "cafe-rain", name: "临窗雨声", mood: "雨声更清晰，适合写作与深度工作", occupied: 0 },
      { id: "cafe-morning", name: "晨光吧台", mood: "温暖、明亮，适合开始一天", occupied: 0, locked: true },
      { id: "cafe-night", name: "深夜角落", mood: "灯光更暗，适合晚间学习", occupied: 0, locked: true },
    ],
    seats: [
      [18, 46, false], [28, 40, false], [36, 42, false], [42, 35, false],
      [60, 41, false], [71, 43, false], [80, 43, false], [92, 49, false],
      [37, 66, false], [65, 68, false],
    ],
  },
  library: {
    id: "library",
    name: "穹顶图书馆",
    shortName: "图书馆",
    islandLabel: "学院区",
    icon: "academy",
    online: 45,
    image: `${ASSET_BASE}20261011-library-focus-room.png`,
    description: "高窗把光铺在木桌上，翻页声很轻。这里适合阅读、备考，也适合把难题慢慢做完。",
    sounds: ["静谧室内", "轻微翻页", "壁炉声"],
    filter: 430,
    rooms: [
      { id: "library-sun", name: "高窗阅览室", mood: "自然光充足，适合阅读和整理", occupied: 15 },
      { id: "library-fire", name: "壁炉长桌", mood: "温暖稳定，适合长时间专注", occupied: 17 },
      { id: "library-carrel", name: "独立书阁", mood: "更少视觉干扰，适合备考", occupied: 13 },
    ],
    seats: [
      [29, 43, true], [37, 45, true], [46, 45, false], [54, 44, true],
      [39, 67, false], [48, 67, true], [58, 67, true], [67, 65, false],
      [77, 49, true], [86, 51, false],
    ],
  },
  forest: {
    id: "forest",
    name: "苔溪森林",
    shortName: "森林溪流",
    islandLabel: "森林区",
    icon: "forest",
    online: 39,
    image: `${ASSET_BASE}20261011-forest-creek-focus-room.png`,
    description: "溪流绕过苔石，风穿过树叶。把屏幕变成林间的一张桌子，让呼吸先慢下来。",
    sounds: ["溪流", "林间风", "远处鸟鸣"],
    filter: 820,
    rooms: [
      { id: "forest-creek", name: "溪桥木台", mood: "水声清晰，适合平复情绪后工作", occupied: 14 },
      { id: "forest-canopy", name: "树冠小屋", mood: "遮蔽感更强，适合独处式专注", occupied: 13 },
      { id: "forest-falls", name: "远瀑石阶", mood: "更有自然能量，适合创作", occupied: 12 },
    ],
    seats: [
      [17, 28, true], [30, 37, false], [48, 27, true], [80, 27, true],
      [78, 44, false], [24, 66, true], [57, 62, false], [86, 71, true],
      [67, 78, false], [15, 78, true],
    ],
  },
};

const islandImage = `${ASSET_BASE}20261012-focus-island-map-detailed.png`;
const islandOnlineCount = Object.values(scenes).reduce((total, scene) => total + scene.online, 0);

const STORAGE_KEYS = {
  activeSession: "focusIslandActiveSessionV1",
  history: "focusIslandHistoryV1",
  guestIdentity: "focusIslandGuestIdentityV2",
};

const state = {
  view: "welcome",
  sceneId: null,
  roomId: null,
  selectedSeat: null,
  timerMode: 25,
  durationSeconds: 25 * 60,
  remainingSeconds: 25 * 60,
  elapsedSeconds: 0,
  isRunning: false,
  isTransitioning: false,
  sessionStartedAt: null,
  sessionResult: null,
  companions: 6,
  onlineIslanders: islandOnlineCount,
  focusedIslanders: 116,
  roomPresence: { leases: [], serverNow: Date.now() },
  currentSeatId: null,
  switchingFromSeatId: null,
  feedback: null,
  sounds: { ambient: true, presence: true, white: false },
};

let ticker = null;
let lastTick = null;
let lastPersistAt = 0;
let audioContext = null;
let noiseSource = null;
let noiseGain = null;
let noiseFilter = null;
let populationTimer = null;
let roomSyncTimer = null;
let heartbeatTimer = null;
let roomSyncInFlight = false;

const identity = getOrCreateIdentity();

const app = document.querySelector("#app");

function getOrCreateIdentity() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.guestIdentity) || "null");
    if (saved?.guestId && saved?.sessionId && Number.isInteger(saved?.avatarSkin)) return saved;
  } catch (_) { /* create a new local identity */ }
  const adjectives = ["安静的", "晨光里的", "慢慢来的", "靠窗的", "雨声里的", "专心的", "温柔的", "从容的"];
  const nouns = ["海獭", "知更鸟", "小鹿", "旅人", "松鼠", "云朵", "灯塔", "橡树"];
  const randomId = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const guestId = randomId();
  const value = {
    guestId,
    sessionId: randomId(),
    displayName: `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}`,
    avatarSkin: Math.abs([...guestId].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 4,
  };
  localStorage.setItem(STORAGE_KEYS.guestIdentity, JSON.stringify(value));
  return value;
}

function identityBody(extra = {}) {
  return {
    guestId: identity.guestId,
    sessionId: identity.sessionId,
    displayName: identity.displayName,
    avatarSkin: identity.avatarSkin,
    activity: state.isRunning ? "专注计时中" : "安静专注",
    ...extra,
  };
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "request_failed");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function currentRoomApiId() {
  return state.sceneId === "cafe" ? "cafe-rain" : state.roomId;
}

function leaseForSeat(seatIndex) {
  return state.roomPresence.leases.find((lease) => Number(lease.seatId) === seatIndex + 1) || null;
}

function focusedMinutes(lease) {
  if (!lease.focusStartedAt) return 0;
  return Math.max(0, Math.floor(((state.roomPresence.serverNow || Date.now()) - Number(lease.focusStartedAt)) / 60000));
}

function stopRoomPresence() {
  window.clearInterval(roomSyncTimer);
  window.clearInterval(heartbeatTimer);
  roomSyncTimer = null;
  heartbeatTimer = null;
  roomSyncInFlight = false;
  window.FocusRoomEngine?.destroy();
}

async function syncCafeState({ refreshMarkers = true } = {}) {
  if (roomSyncInFlight || state.sceneId !== "cafe") return;
  roomSyncInFlight = true;
  try {
    const presence = await api(`/api/rooms/${currentRoomApiId()}/state`);
    state.roomPresence = presence;
    const ownLease = presence.leases.find((lease) => lease.sessionId === identity.sessionId && lease.state === "occupied");
    if (ownLease) state.currentSeatId = Number(ownLease.seatId);
    const room = scenes.cafe.rooms.find((item) => item.id === "cafe-rain");
    if (room) room.occupied = presence.leases.length;
    scenes.cafe.online = presence.leases.length;
    window.FocusRoomEngine?.setOccupants(presence.leases);
    if (refreshMarkers && state.view === "room") refreshCafeSeatMarkers();
  } catch (_) {
    const syncLabel = document.querySelector(".room-sync-label");
    if (syncLabel) syncLabel.textContent = "正在重新连接…";
  } finally {
    roomSyncInFlight = false;
  }
}

function refreshCafeSeatMarkers() {
  const markerLayer = document.querySelector(".seat-markers");
  if (!markerLayer || state.sceneId !== "cafe") return;
  markerLayer.innerHTML = scenes.cafe.seats.map((seat, index) => renderSeat(seat, index, "cafe")).join("");
  const openSeats = Math.max(0, 10 - state.roomPresence.leases.length);
  const note = document.querySelector(".room-footer-copy span");
  if (note && state.selectedSeat === null) note.textContent = `所有座位都来自实时状态 · 还剩 ${openSeats} 个空位`;
  const syncLabel = document.querySelector(".room-sync-label");
  if (syncLabel) syncLabel.textContent = `${state.roomPresence.leases.length} 人正在房间里`;
}

function updateCafeSeatSelection() {
  document.querySelectorAll("button[data-seat]").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.seat) === state.selectedSeat);
  });
  const title = document.querySelector(".room-footer-copy strong");
  const note = document.querySelector(".room-footer-copy span");
  const action = document.querySelector('[data-action="sit-down"]');
  if (title) title.textContent = state.selectedSeat === null ? "找一个喜欢的位置坐下" : `已选择 ${state.selectedSeat + 1} 号座位`;
  if (note && state.selectedSeat !== null) note.textContent = state.currentSeatId ? "将从当前座位起身，沿通道走到新位置" : "准备好后，你的角色会从入口沿通道走到这里";
  if (action) {
    action.disabled = state.selectedSeat === null;
    action.textContent = state.currentSeatId ? "起身并换座" : "坐下，准备专注";
  }
}

async function startCafePresence() {
  if (state.sceneId !== "cafe" || state.view !== "room") return;
  stopRoomPresence();
  const layer = document.querySelector(".seat-layer");
  if (!layer) return;
  if (window.FocusRoomEngine) {
    await window.FocusRoomEngine.mount(layer, identity);
  } else {
    await new Promise((resolve) => window.addEventListener("focus-room-engine-ready", resolve, { once: true }));
    if (state.view !== "room") return;
    await window.FocusRoomEngine?.mount(layer, identity);
  }
  await syncCafeState();
  roomSyncTimer = window.setInterval(() => syncCafeState(), 2000);
  heartbeatTimer = window.setInterval(sendHeartbeat, 15000);
}

async function sendHeartbeat() {
  if (!state.currentSeatId || state.sceneId !== "cafe") return;
  try {
    await api(`/api/sessions/${identity.sessionId}/heartbeat`, {
      method: "POST",
      body: JSON.stringify({ activity: state.isRunning ? "专注计时中" : "安静专注" }),
    });
  } catch (error) {
    if (error.status === 404) {
      state.currentSeatId = null;
      showToast("座位连接已过期，请重新选座");
    }
  }
}

async function releaseSeat({ beacon = false } = {}) {
  if (!state.currentSeatId && !state.switchingFromSeatId) return;
  const url = `/api/sessions/${identity.sessionId}/release`;
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob(["{}"], { type: "application/json" }));
  } else {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", keepalive: true }).catch(() => {});
  }
  state.currentSeatId = null;
  state.switchingFromSeatId = null;
}

function brand() {
  return `
    <div class="brand" aria-label="专注岛">
      <span class="brand-mark" aria-hidden="true">
        <svg class="brand-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="7" r="2.2" fill="currentColor" stroke="none" />
          <path d="M4.5 16.2c2.1-3.1 4.6-4.7 7.5-4.7s5.4 1.6 7.5 4.7" />
          <path d="M3.5 18.7c2.7-1.1 5.5-1.1 8.3 0s5.7 1.1 8.7-.1" />
        </svg>
      </span>
      <span class="brand-copy"><strong>专注岛</strong><small>FOCUS ISLE</small></span>
    </div>`;
}

function regionIcon(type, className = "") {
  const icons = {
    city: `<path d="M4 19V9l5-4 5 4v10M14 12l3-2 3 2v7M7 12h4M7 15h4"/>`,
    academy: `<path d="M3.5 6.5c3.6-.9 6.1.1 8.5 2.3v10c-2.4-2.2-4.9-3.2-8.5-2.3zM20.5 6.5c-3.6-.9-6.1.1-8.5 2.3v10c2.4-2.2 4.9-3.2 8.5-2.3z"/>`,
    forest: `<path d="m12 3-5 7h3l-5 7h6v4h2v-4h6l-5-7h3z"/>`,
    lake: `<path d="M3 15c2.2-1.7 4.5-1.7 6.7 0s4.5 1.7 6.7 0 3.7-1.7 4.6-1.2M4 19c2.2-1.7 4.5-1.7 6.7 0s4.5 1.7 6.7 0 2.7-1.4 3.6-1M12 13V5m0 0c-3.2 0-5 1.4-5.7 4.2C9.2 9.4 11 8 12 5Zm0 0c3.2 0 5 1.4 5.7 4.2C14.8 9.4 13 8 12 5Z"/>`,
    coast: `<path d="M4 20h16M7 20l2-9h6l2 9M10 11V5h4v6M11 8h2M5 16c-1.2-.7-2.1-.7-3 0M22 16c-1.2-.7-2.1-.7-3 0"/>`,
    mountain: `<path d="m3 19 6.2-10 2.5 4 2.8-6L21 19zM7.4 12h3.1M13.5 10h2.2"/>`,
  };
  return `<svg class="region-icon ${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[type] || icons.city}</svg>`;
}

function topbar({ back = null, right = true, showPresence = true } = {}) {
  return `
    <header class="topbar">
      ${back ? `<button class="back-button" data-action="${back}" aria-label="返回">←</button>` : brand()}
      ${right ? `<div class="topbar-actions">
        ${showPresence ? `<div class="glass-pill global-presence" title="全岛实时状态">
          <span class="presence-dot"></span>
          <span class="presence-stat"><strong class="global-online-count">${state.onlineIslanders}</strong><small>人在线</small></span>
          <i class="presence-divider" aria-hidden="true"></i>
          <span class="presence-stat"><strong class="global-focus-count">${state.focusedIslanders}</strong><small>人正在专注</small></span>
        </div>` : ""}
        <button class="icon-button profile-button" data-action="profile" aria-label="个人中心，即将开放" title="个人中心 · 即将开放">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.8 19c.7-3.5 2.8-5.3 6.2-5.3s5.5 1.8 6.2 5.3"/></svg>
        </button>
      </div>` : ""}
    </header>`;
}

function render() {
  stopTickerIfNeeded();
  const isLanding = state.view === "welcome";
  document.body.classList.toggle("landing-mode", isLanding);
  app.dataset.view = state.view;
  if (state.view === "welcome") renderWelcome();
  if (state.view === "island") renderIsland();
  if (state.view === "rooms") renderRooms();
  if (state.view === "room") renderRoom();
  if (state.view === "focus") renderFocus();
  if (state.view === "summary") renderSummary();
}

function renderWelcome() {
  const feedbackAction = FEEDBACK_FORM_URL
    ? `<a class="feedback-link" href="${FEEDBACK_FORM_URL}" target="_blank" rel="noopener noreferrer">去填写反馈&nbsp; ↗</a>`
    : `<button class="feedback-link is-disabled" type="button" disabled>反馈通道准备中</button>`;

  app.innerHTML = `
    <div class="landing-page">
      <section class="view welcome welcome-hero" aria-labelledby="welcome-title">
        <img class="scene-image" src="${islandImage}" alt="一座有城市、图书馆、森林、湖泊与雪山的宁静海岛" />
        <div class="welcome-content">
          <div class="welcome-kicker"><span class="presence-dot"></span>此刻，<strong class="global-focus-count">${state.focusedIslanders}</strong> 位岛民正安静地做自己的事</div>
          <h1 id="welcome-title">换一个地方，<br />开始专注。</h1>
          <p class="welcome-subtitle">像进入游戏一样，去咖啡馆、图书馆或森林里找个位置坐下。有人陪伴，互不打扰。</p>
          <div class="welcome-actions">
            <button class="primary-button" data-action="enter-island">进入专注岛&nbsp; →</button>
            <span class="welcome-note">无需摄像头 · 没有聊天 · 一键开始</span>
          </div>
        </div>
        <button class="scroll-cue" data-action="scroll-story" aria-label="向下了解专注岛">
          <span>向下了解专注岛</span><i aria-hidden="true">↓</i>
        </button>
        <span class="prototype-tag">MVP 可交互原型 · v0.6</span>
      </section>

      <section class="landing-section problem-section" id="story" aria-labelledby="problem-title">
        <div class="section-shell problem-grid">
          <div class="section-heading">
            <p class="landing-eyebrow">WHY FOCUS ISLE</p>
            <h2 id="problem-title">你缺少的也许不是<br />另一个计时器。</h2>
          </div>
          <div class="problem-copy">
            <p class="lead-copy">真正困难的，往往不是专注多久，而是如何开始。</p>
            <p>在家工作或独自学习时，生活和任务之间没有清晰的边界。不是你不够自律，只是少了一个让身体和注意力都知道“现在要开始了”的地方。</p>
            <p>专注岛想做的，就是把这段最难的切换，变成一次轻松的出发。</p>
          </div>
        </div>
      </section>

      <section class="landing-section journey-section" aria-labelledby="journey-title">
        <div class="section-shell">
          <div class="center-heading">
            <p class="landing-eyebrow">WHAT IT IS</p>
            <h2 id="journey-title">一个不用开摄像头，<br />也不用和陌生人聊天的虚拟专注空间。</h2>
            <p>从选择一个地方，到真正坐下来开始，只需要跟着感觉往前走。</p>
          </div>
          <div class="journey-track" aria-label="进入专注岛的四个步骤">
            <figure class="journey-shot journey-shot-map">
              <img src="${islandImage}" alt="专注岛地图，可选择不同的专注区域" loading="lazy" />
              <figcaption><span>01</span><strong>选一个地方</strong><small>今天想去咖啡馆、图书馆，还是森林？</small></figcaption>
            </figure>
            <figure class="journey-shot journey-shot-room">
              <img src="${scenes.cafe.image}" alt="雨巷咖啡馆房间内的座位与安静专注的岛民" loading="lazy" />
              <figcaption><span>02</span><strong>走进一间房</strong><small>听听环境声，看看这里是不是今天需要的氛围。</small></figcaption>
            </figure>
            <figure class="journey-shot journey-shot-seat">
              <img src="${ASSET_BASE}20261011-library-focus-room.png" alt="穹顶图书馆里的阅读座位" loading="lazy" />
              <figcaption><span>03</span><strong>找个位置坐下</strong><small>看见有人也在认真做事，但不需要打招呼。</small></figcaption>
            </figure>
            <figure class="journey-shot journey-shot-focus">
              <img src="${ASSET_BASE}20261012-cafe-window-focus-view.png" alt="咖啡馆临窗座位的沉浸式专注近景" loading="lazy" />
              <figcaption><span>04</span><strong>开始专注</strong><small>画面安静下来，只留下计时、声音和正在做的事。</small></figcaption>
            </figure>
          </div>
          <div class="section-action">
            <button class="primary-button" data-action="enter-island">去岛上看看&nbsp; →</button>
            <span>不用注册，先体验一次完整的专注旅程</span>
          </div>
        </div>
      </section>

      <section class="landing-section scenes-section" aria-labelledby="scenes-title">
        <div class="section-shell">
          <div class="section-heading scenes-heading">
            <p class="landing-eyebrow">THREE PLACES, THREE MOODS</p>
            <h2 id="scenes-title">今天的你，<br />适合哪一种地方？</h2>
            <p>场景不是装饰。不同的光线、声音和空间感，会给开始这件事带来不同的阻力与节奏。</p>
          </div>

          <article class="scene-story scene-story-cafe">
            <div class="scene-story-visual">
              <img src="${scenes.cafe.image}" alt="暖色灯光与雨窗环绕的雨巷咖啡馆" loading="lazy" />
              <span class="scene-index">01 / CITY</span>
            </div>
            <div class="scene-story-copy">
              <span class="scene-icon">${regionIcon("city")}</span>
              <p class="landing-eyebrow">雨巷咖啡馆</p>
              <h3>让生活的声音，<br />陪你轻轻开始。</h3>
              <p>窗外下着雨，咖啡机偶尔轻响。这里有一点温度，也有一点日常的流动感，适合写作、邮件和不需要太大启动压力的任务。</p>
              <div class="sound-line"><span>环境声</span><strong>细雨 · 咖啡馆底噪 · 偶尔杯碟声</strong></div>
            </div>
          </article>

          <article class="scene-story scene-story-library">
            <div class="scene-story-visual">
              <img src="${scenes.library.image}" alt="高窗与长桌构成的穹顶图书馆" loading="lazy" />
              <span class="scene-index">02 / ACADEMY</span>
            </div>
            <div class="scene-story-copy">
              <span class="scene-icon">${regionIcon("academy")}</span>
              <p class="landing-eyebrow">穹顶图书馆</p>
              <h3>当你需要秩序，<br />就来一张安静的长桌。</h3>
              <p>高窗把光铺在木桌上，翻页声很轻。明确、克制的空间感，适合阅读、备考、研究和那些需要慢慢做完的难题。</p>
              <div class="sound-line"><span>环境声</span><strong>静谧室内 · 轻微翻页 · 壁炉声</strong></div>
            </div>
          </article>

          <article class="scene-story scene-story-forest">
            <div class="scene-story-visual">
              <img src="${scenes.forest.image}" alt="溪流、苔石与树木环绕的苔溪森林" loading="lazy" />
              <span class="scene-index">03 / FOREST</span>
            </div>
            <div class="scene-story-copy">
              <span class="scene-icon">${regionIcon("forest")}</span>
              <p class="landing-eyebrow">苔溪森林</p>
              <h3>先让呼吸慢下来，<br />再让想法慢慢出现。</h3>
              <p>溪流绕过苔石，风穿过树叶。自然、低压力的氛围，适合创作、思考、复盘和长时间的独立工作。</p>
              <div class="sound-line"><span>环境声</span><strong>溪流 · 林间风 · 远处鸟鸣</strong></div>
            </div>
          </article>

          <p class="future-note">湖畔、海滨与雪山还在岛屿的远处。未来先去哪里，会听取岛民的真实感受。</p>
        </div>
      </section>

      <section class="landing-section philosophy-section" aria-labelledby="philosophy-title">
        <div class="philosophy-glow" aria-hidden="true"></div>
        <div class="section-shell philosophy-shell">
          <div class="philosophy-heading">
            <p class="landing-eyebrow">PRESENCE WITHOUT PRESSURE</p>
            <h2 id="philosophy-title">有人陪伴，<br />互不打扰。</h2>
            <p>我们想保留共同在场的安心感，同时拿走被看见、被回应和必须社交的压力。</p>
          </div>
          <div class="principle-list">
            <article><span>01</span><div><h3>不打开摄像头</h3><p>不用整理自己，也不用承担持续被注视的压力。</p></div></article>
            <article><span>02</span><div><h3>没有聊天与私信</h3><p>不需要认识任何人，也没有必须及时回应的信息。</p></div></article>
            <article><span>03</span><div><h3>少一点设置</h3><p>先选地方、找位置坐下，再让注意力自然安静下来。</p></div></article>
          </div>
          <div class="design-flow" aria-label="专注岛的体验设计逻辑">
            <div><span>进入仪式</span><strong>像进入游戏一样出发</strong></div>
            <i aria-hidden="true">→</i>
            <div><span>共同在场</span><strong>看见大家安静做事</strong></div>
            <i aria-hidden="true">→</i>
            <div><span>沉浸桌面</span><strong>界面主动退到身后</strong></div>
          </div>
        </div>
      </section>

      <section class="landing-section value-section" aria-labelledby="value-title">
        <div class="section-shell value-shell">
          <div class="value-visual">
            <img src="${ASSET_BASE}20261012-cafe-lounge-focus-view.png" alt="咖啡馆安静角落里的沉浸式专注桌面" loading="lazy" />
            <p>“不需要努力变成另一个人。<br />只是换一个地方，重新开始。”</p>
          </div>
          <div class="value-copy">
            <p class="landing-eyebrow">WHAT WE HOPE YOU FEEL</p>
            <h2 id="value-title">我们希望你在这里，<br />获得三件很轻的事。</h2>
            <ol>
              <li><span>01</span><div><strong>开始变得容易一点</strong><p>不用先把一切准备完美，先坐下，再做眼前的一小步。</p></div></li>
              <li><span>02</span><div><strong>独处不再那么空</strong><p>你仍然拥有自己的空间，同时知道此刻有人也在认真生活。</p></div></li>
              <li><span>03</span><div><strong>陪伴不成为打扰</strong><p>没有消息、表演或社交任务，注意力可以留给真正想完成的事。</p></div></li>
            </ol>
          </div>
        </div>
      </section>

      <section class="landing-section final-cta-section" aria-labelledby="final-cta-title">
        <img src="${islandImage}" alt="" aria-hidden="true" loading="lazy" />
        <div class="final-cta-overlay"></div>
        <div class="final-cta-content">
          <span class="free-badge">目前内测完全免费</span>
          <h2 id="final-cta-title">今天，去岛上<br />找个位置坐下。</h2>
          <p>不需要准备好一整天。只要从下一段专注开始。</p>
          <button class="primary-button" data-action="enter-island">免费进入专注岛&nbsp; →</button>
        </div>
      </section>

      <section class="feedback-section" aria-labelledby="feedback-heading">
        <div class="section-shell feedback-shell">
          <div>
            <p class="landing-eyebrow">BUILD THE ISLAND WITH US</p>
            <h2 id="feedback-heading">帮我们把这座岛建得更好。</h2>
            <p>欢迎告诉我们：哪个场景让你更容易进入状态、哪一步还不够顺，以及你还想去怎样的空间。</p>
          </div>
          <div class="feedback-action">
            ${feedbackAction}
            <small>${FEEDBACK_FORM_URL ? "将在新标签页打开反馈表单" : "正式反馈表单正在准备，开放后会在这里出现"}</small>
          </div>
        </div>
      </section>

      <footer class="landing-footer">
        <div class="section-shell">
          ${brand()}
          <p>一个有人陪伴、互不打扰的沉浸式专注空间。</p>
          <button class="footer-enter" data-action="enter-island">进入专注岛&nbsp; →</button>
        </div>
      </footer>
    </div>`;
}

function renderIsland() {
  app.innerHTML = `
    <section class="view island">
      <div class="island-map-frame">
        <img class="scene-image" src="${islandImage}" alt="专注岛地图" />
        ${islandHotspot("cafe", 26, 51)}
        ${islandHotspot("library", 43, 25)}
        ${islandHotspot("forest", 75, 48)}
        ${lockedHotspot("湖畔区", "即将开放", 52, 56, "lake")}
        ${lockedHotspot("海滨区", "即将开放", 72, 75, "coast")}
        ${lockedHotspot("雪山营地", "即将开放", 73, 17, "mountain")}
      </div>
      ${topbar()}

      <aside class="island-card">
        <h2>今天想在哪里专注？</h2>
        <p>每个区域都有不同的空间与环境声。先跟随感觉选择，不需要做复杂设置。</p>
      </aside>
    </section>`;
}

function islandHotspot(sceneId, x, y) {
  const scene = scenes[sceneId];
  return `
    <button class="hotspot" style="left:${x}%; top:${y}%" data-scene="${sceneId}" aria-label="进入${scene.islandLabel}${scene.shortName}">
      <span class="hotspot-pin"><span class="hotspot-symbol">${regionIcon(scene.icon)}</span></span>
      <span class="hotspot-label"><strong>${scene.islandLabel}</strong><small>${scene.shortName} · ${scene.online} 人在线</small></span>
    </button>`;
}

function lockedHotspot(name, note, x, y, icon) {
  return `
    <button class="hotspot locked" style="left:${x}%; top:${y}%" data-action="locked" aria-label="${name}${note}">
      <span class="hotspot-pin"><span class="hotspot-symbol">${regionIcon(icon)}</span></span>
      <span class="hotspot-label"><strong>${name}</strong><small>🔒 ${note}</small></span>
    </button>`;
}

function renderRooms() {
  const scene = scenes[state.sceneId];
  app.innerHTML = `
    <section class="view rooms">
      <img class="scene-image" src="${scene.image}" alt="${scene.name}" />
      ${topbar({ back: "back-island", showPresence: false })}
      <div class="rooms-layout">
        <div class="scene-intro">
          <p class="eyebrow">${scene.islandLabel}</p>
          <h1>${scene.name}</h1>
          <p>${scene.description}</p>
          <div class="scene-soundscape">${scene.sounds.map((sound) => `<span class="sound-tag">♪ ${sound}</span>`).join("")}</div>
        </div>
        <section class="room-panel" aria-label="房间列表">
          <div class="panel-heading"><h2>选择一个房间</h2><small>现在有空位</small></div>
          <div class="room-list">
            ${scene.rooms.map((room) => roomCard(scene, room)).join("")}
          </div>
          <div class="room-guideline"><span>◌</span><span>房间内没有聊天与私信，大家只会安静地陪伴彼此。</span></div>
        </section>
      </div>
    </section>`;
}

function roomCard(scene, room) {
  return `
    <button class="room-card ${room.locked ? "is-locked" : ""}" ${room.locked ? 'data-action="locked-room"' : `data-room="${room.id}"`}>
      <span class="room-card-copy"><strong>${room.name}</strong><span>${room.mood}</span></span>
      <span class="occupancy"><strong>${room.locked ? "稍后" : `${room.occupied}/10`}</strong><small>${room.locked ? "下一阶段" : "实时在线"}</small></span>
    </button>`;
}

function renderRoom() {
  const scene = scenes[state.sceneId];
  const room = scene.rooms.find((item) => item.id === state.roomId) || scene.rooms[0];
  const animatedCafe = scene.id === "cafe";
  const openSeats = animatedCafe ? Math.max(0, 10 - state.roomPresence.leases.length) : scene.seats.filter((seat) => !seat[2]).length;
  app.innerHTML = `
    <section class="view room ${animatedCafe ? "animated-room" : ""}">
      <img class="scene-image" src="${scene.image}" alt="${room.name}房间内部" />
      ${topbar({ back: "back-rooms", showPresence: false })}
      <div class="room-title">${regionIcon(scene.icon, "room-region-icon")}<span>${room.name} · 保持安静</span></div>
      <div class="seat-layer" aria-label="座位区域">
        <div class="seat-markers">${scene.seats.map((seat, index) => renderSeat(seat, index, scene.id)).join("")}</div>
      </div>
      <div class="room-footer">
        <div class="room-footer-copy">
          <strong>${state.selectedSeat === null ? "找一个喜欢的位置坐下" : `已选择 ${state.selectedSeat + 1} 号座位`}</strong>
          <span>${state.selectedSeat === null ? `${animatedCafe ? "所有座位都来自实时状态" : "亮起的座位可选"} · 还剩 ${openSeats} 个空位` : animatedCafe ? (state.currentSeatId ? "将从当前座位起身，沿通道走到新位置" : "准备好后，你的角色会从入口沿通道走到这里") : "坐下后会进入沉浸式桌面，你仍能感受到大家的陪伴"}</span>
        </div>
        ${animatedCafe ? `<span class="room-sync-label">正在同步真实座位…</span>` : ""}
        <button class="primary-button" data-action="sit-down" ${state.selectedSeat === null ? "disabled" : ""}>${state.currentSeatId ? "起身并换座" : "坐下，准备专注"}</button>
      </div>
    </section>`;
  if (animatedCafe) requestAnimationFrame(() => startCafePresence());
}

function renderSeat(seat, index, sceneId) {
  const [x, y, staticOccupied] = seat;
  const lease = sceneId === "cafe" ? leaseForSeat(index) : null;
  const occupied = sceneId === "cafe" ? Boolean(lease) : staticOccupied;
  if (occupied) {
    if (sceneId === "cafe") {
      const mine = lease.sessionId === identity.sessionId;
      const minutes = focusedMinutes(lease);
      const status = lease.state === "occupied" ? (minutes > 0 ? `已专注 ${minutes} 分钟` : "刚刚坐下") : lease.state === "moving" ? "正在换座" : "正在走来";
      return `
        <span class="seat occupied cafe-seat-status ${mine ? "is-mine" : ""}" style="left:${x}%; top:${y}%" tabindex="0" aria-label="${index + 1}号座位已占用，${lease.displayName}${status}">
          <span class="seat-status-dot busy" aria-hidden="true"></span>
          <span class="seat-number">${index + 1}</span>
          <span class="seat-popover" role="tooltip">
            <strong>${mine ? `${identity.displayName}（你）` : lease.displayName}</strong>
            <small>${status} · ${lease.activity || "安静专注"}</small>
            <em><i></i>${lease.state === "occupied" ? "正在专注" : "正在入座"}</em>
          </span>
        </span>`;
    }
    return `<span class="seat occupied" style="left:${x}%; top:${y}%" title="${index + 1}号座位已占用" aria-label="${index + 1}号座位已占用"><span class="seat-status-dot busy" aria-hidden="true"></span><span class="seat-number">${index + 1}</span></span>`;
  }
  return `<button class="seat available ${state.selectedSeat === index ? "selected" : ""}" style="left:${x}%; top:${y}%" data-seat="${index}" aria-label="选择 ${index + 1} 号空位"><span class="seat-status-dot free" aria-hidden="true"></span><span class="seat-number">${index + 1}</span><span class="seat-free-label">空位</span></button>`;
}

function activityLabel(activity) {
  return ({ typing: "敲键盘", reading: "阅读", writing: "写字", sip: "喝咖啡" })[activity] || "专注";
}

function renderAvatarFigure(index, player = false) {
  return `
    <span class="avatar-figure ${player ? "player-figure" : ""}" aria-hidden="true">
      <span class="avatar-head"><span class="avatar-hair hair-${index % 4}"></span></span>
      <span class="avatar-body">
        <span class="avatar-arm arm-left"></span>
        <span class="avatar-arm arm-right"></span>
        <span class="avatar-leg leg-left"></span>
        <span class="avatar-leg leg-right"></span>
      </span>
    </span>`;
}

function renderPlayerAvatar() {
  return `
    <span class="player-avatar facing-up" id="player-avatar" style="left:50%; top:89%; --player-scale:1" aria-label="你的角色正在咖啡厅入口等待">
      <span class="player-sprite" aria-hidden="true"></span>
      <span class="player-badge">你</span>
    </span>`;
}

function setAvatarFacing(avatar, dx, dy) {
  const direction = Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? "right" : "left")
    : (dy > 0 ? "down" : "up");
  avatar.classList.remove("facing-up", "facing-right", "facing-down", "facing-left");
  avatar.classList.add(`facing-${direction}`);
}

function playerScaleForY(y) {
  return Math.max(0.76, Math.min(1.05, 0.7 + y / 285));
}

async function animatePlayerToSeat() {
  if (state.isTransitioning || state.selectedSeat === null) return;
  const scene = scenes[state.sceneId];
  if (scene.id !== "cafe") {
    state.view = "focus";
    render();
    return;
  }

  state.isTransitioning = true;
  const targetSeatId = state.selectedSeat + 1;
  const fromSeatId = state.currentSeatId;
  const footerTitle = document.querySelector(".room-footer-copy strong");
  const footerNote = document.querySelector(".room-footer-copy span");
  const sitButton = document.querySelector('[data-action="sit-down"]');
  const backButton = document.querySelector('[data-action="back-rooms"]');
  document.querySelectorAll("button.seat").forEach((button) => { button.disabled = true; });
  if (sitButton) {
    sitButton.disabled = true;
    sitButton.textContent = "正在走向座位…";
  }
  if (backButton) backButton.disabled = true;
  if (footerTitle) footerTitle.textContent = fromSeatId ? `正在从 ${fromSeatId} 号换到 ${targetSeatId} 号座位` : `正在前往 ${targetSeatId} 号座位`;
  if (footerNote) footerNote.textContent = "路线会沿咖啡厅通道行走，不穿过桌椅";

  try {
    if (fromSeatId) {
      await api(`/api/sessions/${identity.sessionId}/switch-seat`, {
        method: "POST",
        body: JSON.stringify(identityBody({ roomId: currentRoomApiId(), fromSeatId, newSeatId: targetSeatId })),
      });
      state.switchingFromSeatId = fromSeatId;
    } else {
      await api(`/api/rooms/${currentRoomApiId()}/seats/${targetSeatId}/reserve`, {
        method: "POST",
        body: JSON.stringify(identityBody()),
      });
    }
    await syncCafeState();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) await window.FocusRoomEngine?.walkLocal(fromSeatId, targetSeatId);
    await api(`/api/sessions/${identity.sessionId}/occupy`, {
      method: "POST",
      body: JSON.stringify({ roomId: currentRoomApiId(), seatId: targetSeatId }),
    });
    state.currentSeatId = targetSeatId;
    state.switchingFromSeatId = null;
    await syncCafeState({ refreshMarkers: false });
    const roomView = document.querySelector(".view.room");
    roomView?.classList.add("entering-focus");
    await new Promise((resolve) => window.setTimeout(resolve, 760));
    state.view = "focus";
    render();
  } catch (error) {
    state.isTransitioning = false;
    if (error.status === 409) {
      showToast(error.message === "seat_taken" ? "刚刚有人先坐下了，请换一个位置" : "这个座位的预留已过期，请重试");
    } else {
      showToast("座位连接暂时不稳定，请再试一次");
    }
    await syncCafeState();
    renderRoom();
    return;
  }
  state.isTransitioning = false;
}

function renderFocus() {
  window.clearInterval(roomSyncTimer);
  roomSyncTimer = null;
  window.FocusRoomEngine?.destroy();
  const scene = scenes[state.sceneId];
  const room = scene.rooms.find((item) => item.id === state.roomId) || scene.rooms[0];
  const focusImage = scene.focusViews?.[state.selectedSeat + 1] || scene.image;
  app.innerHTML = `
    <section class="view focus">
      <img class="scene-image" src="${focusImage}" alt="坐在${room.name}${state.selectedSeat + 1}号座位看到的沉浸式工作视角" />
      ${topbar({ back: "finish-session", showPresence: false })}
      <section class="focus-stage" aria-label="专注计时器">
        <div class="timer" id="timer">${formatTime()}</div>
        <p class="focus-presence"><span class="presence-dot"></span><span id="presence-copy">${Math.max(0, state.roomPresence.leases.length - 1)} 位真实岛民陪伴中</span></p>
        <div class="focus-label">${scene.name} · ${room.name} · ${state.selectedSeat + 1} 号座位</div>
        <div class="timer-modes" aria-label="专注时长">
          ${modeButton(25, "25 分钟")}${modeButton(50, "50 分钟")}${modeButton(0, "自由专注")}
        </div>
        <div class="focus-controls">
          <button class="primary-button" data-action="toggle-timer">${state.isRunning ? "暂停" : state.elapsedSeconds > 0 ? "继续" : "开始"}</button>
          ${scene.id === "cafe" ? '<button class="secondary-button" data-action="switch-seat">换座</button>' : ""}
          <button class="secondary-button" data-action="finish-session">结束</button>
        </div>
        <div class="sound-controls" aria-label="环境声音">
          ${soundButton("ambient", "♫", "环境声")}
          ${soundButton("presence", "◌", "陪伴感")}
          ${soundButton("white", "≈", "柔和底噪")}
        </div>
        <p class="focus-tip">轻触控制区调整计时与声音</p>
      </section>
    </section>`;
  persistActiveSession();
  if (state.isRunning) startTicker();
  if (scene.id === "cafe") {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = window.setInterval(sendHeartbeat, 15000);
    sendHeartbeat();
  }
}

function modeButton(value, label) {
  return `<button class="mode-button ${state.timerMode === value ? "active" : ""}" data-mode="${value}" ${state.isRunning ? "disabled" : ""}>${label}</button>`;
}

function soundButton(key, icon, label) {
  return `<button class="sound-toggle ${state.sounds[key] ? "on" : ""}" data-sound="${key}"><span>${icon}</span><small>${label}</small></button>`;
}

function renderSummary() {
  const scene = scenes[state.sceneId];
  const result = state.sessionResult || buildSessionResult("ended_early");
  const minutes = Math.floor(result.elapsedSeconds / 60);
  const seconds = result.elapsedSeconds % 60;
  const sessions = readHistory().filter((item) => item.elapsedSeconds > 0).length;
  const summaryCopy = getSummaryCopy(result.status);
  app.innerHTML = `
    <section class="view summary">
      <div class="summary-card">
        <div class="summary-symbol ${result.status === "not_started" ? "quiet" : ""}">${summaryCopy.symbol}</div>
        <p class="eyebrow">${summaryCopy.eyebrow}</p>
        <h1>${summaryCopy.title}</h1>
        <p>${summaryCopy.description.replace("{scene}", scene.name)}</p>
        <div class="summary-stats">
          <div class="summary-stat"><strong>${minutes > 0 ? `${minutes} 分钟` : `${seconds} 秒`}</strong><span>本次专注</span></div>
          <div class="summary-stat"><strong>${scene.shortName}</strong><span>停留场景</span></div>
          <div class="summary-stat"><strong>${sessions} 次</strong><span>已记录专注</span></div>
        </div>
        <div class="feedback-title">刚才的氛围有没有让你更容易专注？</div>
        <div class="feedback-options">
          ${[["no", "😶", "没有"], ["some", "🙂", "有一点"], ["yes", "😌", "很明显"]].map(([value, icon, label]) => `<button class="feedback-button ${state.feedback === value ? "selected" : ""}" data-feedback="${value}" aria-label="${label}">${icon}</button>`).join("")}
        </div>
        <div class="summary-actions">
          <button class="primary-button" data-action="retry-session">再来一次</button>
          <button class="secondary-button" data-action="return-room">返回房间</button>
          <button class="text-button" data-action="return-island">回到海岛</button>
        </div>
      </div>
    </section>`;
}

function getSummaryCopy(status) {
  if (status === "completed") {
    return {
      symbol: "✓",
      eyebrow: "目标完成",
      title: "这一段专注，完成了",
      description: "你在{scene}守住了计划中的时间。休息一下，准备好时再回来。",
    };
  }
  if (status === "free_completed") {
    return {
      symbol: "✓",
      eyebrow: "自由专注完成",
      title: "辛苦了，欢迎回来",
      description: "你在{scene}完成了一段自由专注，每一分钟都已经被记录。",
    };
  }
  if (status === "not_started") {
    return {
      symbol: "·",
      eyebrow: "还没有开始计时",
      title: "没关系，座位还在",
      description: "这次还没有形成专注记录。你可以返回{scene}重新开始。",
    };
  }
  return {
    symbol: "↗",
    eyebrow: "本次先到这里",
    title: "已经专注了一会儿",
    description: "你在{scene}停留的时间已经保存。提前结束也不等于没有收获。",
  };
}

function formatTime() {
  const total = state.timerMode === 0 ? state.elapsedSeconds : state.remainingSeconds;
  const minutes = Math.floor(total / 60);
  const seconds = Math.floor(total % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function setTimerMode(mode) {
  if (state.isRunning) return;
  state.timerMode = mode;
  state.durationSeconds = mode * 60;
  state.remainingSeconds = mode * 60;
  state.elapsedSeconds = 0;
  state.sessionStartedAt = null;
  state.sessionResult = null;
  renderFocus();
}

function toggleTimer() {
  if (state.isRunning) {
    syncTimerFromClock();
    state.isRunning = false;
    stopTicker();
    suspendAudio();
    persistActiveSession(true);
  } else {
    state.isRunning = true;
    state.sessionStartedAt = state.sessionStartedAt || Date.now();
    lastTick = Date.now();
    startTicker();
    updateAudio();
    persistActiveSession(true);
  }
  const button = document.querySelector('[data-action="toggle-timer"]');
  if (button) button.textContent = state.isRunning ? "暂停" : "继续";
  document.querySelectorAll("[data-mode]").forEach((element) => { element.disabled = state.isRunning; });
}

function startTicker() {
  if (ticker) return;
  lastTick = lastTick || Date.now();
  ticker = window.setInterval(() => {
    if (syncTimerFromClock()) return;
    const timerElement = document.querySelector("#timer");
    if (timerElement) timerElement.textContent = formatTime();
    if (Date.now() - lastPersistAt >= 5000) persistActiveSession();
  }, 1000);
}

function syncTimerFromClock() {
  if (!state.isRunning || !lastTick) return false;
  const now = Date.now();
  const delta = Math.floor((now - lastTick) / 1000);
  if (delta < 1) return false;
  lastTick += delta * 1000;
  const appliedDelta = state.timerMode > 0 ? Math.min(delta, state.remainingSeconds) : delta;
  state.elapsedSeconds += appliedDelta;
  if (state.timerMode > 0) {
    state.remainingSeconds = Math.max(0, state.remainingSeconds - appliedDelta);
    if (state.remainingSeconds === 0) {
      finishSession("completed");
      return true;
    }
  }
  return false;
}

function stopTicker() {
  if (ticker) window.clearInterval(ticker);
  ticker = null;
}

function stopTickerIfNeeded() {
  if (state.view !== "focus") stopTicker();
}

async function finishSession(forcedStatus = null) {
  if (state.isRunning && !forcedStatus && syncTimerFromClock()) return;
  state.isRunning = false;
  stopTicker();
  stopAudio();
  const status = forcedStatus || (state.elapsedSeconds === 0 ? "not_started" : state.timerMode === 0 ? "free_completed" : "ended_early");
  state.sessionResult = buildSessionResult(status);
  if (state.elapsedSeconds > 0) saveSessionResult(state.sessionResult);
  localStorage.removeItem(STORAGE_KEYS.activeSession);
  await releaseSeat();
  window.clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  state.view = "summary";
  render();
}

function buildSessionResult(status) {
  return {
    id: `${state.sessionStartedAt || Date.now()}-${state.sceneId}-${state.roomId}`,
    sceneId: state.sceneId,
    roomId: state.roomId,
    seat: state.selectedSeat,
    timerMode: state.timerMode,
    targetSeconds: state.durationSeconds,
    elapsedSeconds: state.elapsedSeconds,
    remainingSeconds: state.remainingSeconds,
    startedAt: state.sessionStartedAt,
    endedAt: Date.now(),
    status,
    sounds: { ...state.sounds },
    feedback: state.feedback,
  };
}

function saveSessionResult(result) {
  const history = readHistory().filter((item) => item.id !== result.id);
  history.unshift(result);
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history.slice(0, 100)));
}

function readHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || "[]");
    return Array.isArray(history) ? history : [];
  } catch (_) {
    return [];
  }
}

function persistActiveSession(force = false) {
  if (state.view !== "focus" || !state.sceneId || state.selectedSeat === null) return;
  const now = Date.now();
  if (!force && now - lastPersistAt < 1000) return;
  localStorage.setItem(STORAGE_KEYS.activeSession, JSON.stringify({
    sceneId: state.sceneId,
    roomId: state.roomId,
    selectedSeat: state.selectedSeat,
    timerMode: state.timerMode,
    durationSeconds: state.durationSeconds,
    remainingSeconds: state.remainingSeconds,
    elapsedSeconds: state.elapsedSeconds,
    isRunning: state.isRunning,
    sessionStartedAt: state.sessionStartedAt,
    companions: state.companions,
    sounds: state.sounds,
    savedAt: now,
  }));
  lastPersistAt = now;
}

function restoreActiveSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.activeSession) || "null");
    if (!saved || !scenes[saved.sceneId] || saved.selectedSeat === null) return;
    Object.assign(state, {
      view: "focus",
      sceneId: saved.sceneId,
      roomId: saved.roomId,
      selectedSeat: saved.selectedSeat,
      timerMode: saved.timerMode,
      durationSeconds: saved.durationSeconds,
      remainingSeconds: saved.remainingSeconds,
      elapsedSeconds: saved.elapsedSeconds,
      isRunning: Boolean(saved.isRunning),
      sessionStartedAt: saved.sessionStartedAt,
      companions: saved.companions || 6,
      sounds: { ...state.sounds, ...saved.sounds },
    });
    if (state.isRunning) {
      const offlineSeconds = Math.max(0, Math.floor((Date.now() - saved.savedAt) / 1000));
      const appliedOfflineSeconds = state.timerMode > 0 ? Math.min(offlineSeconds, state.remainingSeconds) : offlineSeconds;
      state.elapsedSeconds += appliedOfflineSeconds;
      if (state.timerMode > 0) {
        state.remainingSeconds = Math.max(0, state.remainingSeconds - appliedOfflineSeconds);
        if (state.remainingSeconds === 0) {
          state.isRunning = false;
          state.sessionResult = buildSessionResult("completed");
          saveSessionResult(state.sessionResult);
          localStorage.removeItem(STORAGE_KEYS.activeSession);
          state.view = "summary";
        }
      }
    }
  } catch (_) {
    localStorage.removeItem(STORAGE_KEYS.activeSession);
  }
}

function resetTimerState({ keepMode = true } = {}) {
  state.isRunning = false;
  state.timerMode = keepMode ? state.timerMode : 25;
  state.durationSeconds = state.timerMode * 60;
  state.remainingSeconds = state.timerMode * 60;
  state.elapsedSeconds = 0;
  state.sessionStartedAt = null;
  state.sessionResult = null;
  state.feedback = null;
  lastTick = null;
  localStorage.removeItem(STORAGE_KEYS.activeSession);
}

function retrySession() {
  resetTimerState();
  state.selectedSeat = null;
  state.view = "room";
  render();
}

function returnRoom() {
  resetTimerState();
  state.selectedSeat = null;
  state.view = "room";
  render();
}

function returnIsland() {
  resetTimerState({ keepMode: false });
  releaseSeat();
  stopRoomPresence();
  state.view = "island";
  state.roomId = null;
  state.selectedSeat = null;
  render();
}

function initAudio() {
  if (audioContext) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  audioContext = new AudioCtor();
  const bufferSize = audioContext.sampleRate * 2;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let index = 0; index < bufferSize; index += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.018 * white) / 1.018;
    data[index] = last * 3.4;
  }
  noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;
  noiseFilter = audioContext.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = scenes[state.sceneId]?.filter || 600;
  noiseGain = audioContext.createGain();
  noiseGain.gain.value = 0;
  noiseSource.connect(noiseFilter).connect(noiseGain).connect(audioContext.destination);
  noiseSource.start();
}

function updateAudio() {
  initAudio();
  if (!audioContext || !noiseGain) return;
  audioContext.resume();
  const base = state.sounds.ambient ? 0.025 : 0;
  const white = state.sounds.white ? 0.012 : 0;
  noiseGain.gain.setTargetAtTime(base + white, audioContext.currentTime, 0.5);
  if (noiseFilter) noiseFilter.frequency.setTargetAtTime(state.sounds.white ? 1400 : scenes[state.sceneId].filter, audioContext.currentTime, 0.6);
}

function suspendAudio() {
  if (!audioContext || !noiseGain) return;
  noiseGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.25);
}

function stopAudio() {
  if (noiseSource) {
    try { noiseSource.stop(); } catch (_) { /* already stopped */ }
  }
  if (audioContext) audioContext.close();
  audioContext = null;
  noiseSource = null;
  noiseGain = null;
  noiseFilter = null;
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  requestAnimationFrame(() => toast.classList.add("show"));
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function refreshPopulationDisplay() {
  document.querySelectorAll(".global-online-count").forEach((element) => {
    element.textContent = state.onlineIslanders;
    element.classList.remove("count-updated");
    requestAnimationFrame(() => element.classList.add("count-updated"));
  });
  document.querySelectorAll(".global-focus-count").forEach((element) => {
    element.textContent = state.focusedIslanders;
    element.classList.remove("count-updated");
    requestAnimationFrame(() => element.classList.add("count-updated"));
  });
}

function schedulePopulationChange() {
  window.clearTimeout(populationTimer);
  const delay = 4500 + Math.random() * 3000;
  populationTimer = window.setTimeout(() => {
    const focusChanges = [-3, -2, -1, 1, 2, 3];
    const onlineChanges = [-3, -2, -1, 1, 2, 3];
    const focusDelta = focusChanges[Math.floor(Math.random() * focusChanges.length)];
    const onlineDelta = onlineChanges[Math.floor(Math.random() * onlineChanges.length)];
    state.onlineIslanders = Math.max(124, Math.min(152, state.onlineIslanders + onlineDelta));
    state.focusedIslanders = Math.max(106, Math.min(138, state.focusedIslanders + focusDelta));
    state.focusedIslanders = Math.min(state.focusedIslanders, state.onlineIslanders - 8);
    refreshPopulationDisplay();
    schedulePopulationChange();
  }, delay);
}

document.addEventListener("click", (event) => {
  const sceneButton = event.target.closest("[data-scene]");
  if (sceneButton) {
    state.sceneId = sceneButton.dataset.scene;
    state.roomId = null;
    state.view = "rooms";
    render();
    return;
  }

  const roomButton = event.target.closest("[data-room]");
  if (roomButton) {
    state.roomId = roomButton.dataset.room;
    state.selectedSeat = null;
    state.view = "room";
    render();
    return;
  }

  const seatButton = event.target.closest("[data-seat]");
  if (seatButton) {
    state.selectedSeat = Number(seatButton.dataset.seat);
    if (state.sceneId === "cafe") updateCafeSeatSelection();
    else renderRoom();
    return;
  }

  const modeButtonElement = event.target.closest("[data-mode]");
  if (modeButtonElement) {
    setTimerMode(Number(modeButtonElement.dataset.mode));
    return;
  }

  const soundButtonElement = event.target.closest("[data-sound]");
  if (soundButtonElement) {
    const key = soundButtonElement.dataset.sound;
    state.sounds[key] = !state.sounds[key];
    soundButtonElement.classList.toggle("on", state.sounds[key]);
    if (state.isRunning) updateAudio();
    persistActiveSession(true);
    return;
  }

  const feedbackButton = event.target.closest("[data-feedback]");
  if (feedbackButton) {
    state.feedback = feedbackButton.dataset.feedback;
    if (state.sessionResult && state.sessionResult.elapsedSeconds > 0) {
      state.sessionResult.feedback = state.feedback;
      saveSessionResult(state.sessionResult);
    }
    document.querySelectorAll("[data-feedback]").forEach((button) => button.classList.toggle("selected", button === feedbackButton));
    showToast("谢谢，你的感受已经记下了");
    return;
  }

  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  const action = actionElement.dataset.action;

  if (action === "enter-island") {
    window.scrollTo({ top: 0, behavior: "auto" });
    state.view = "island";
    render();
  }
  if (action === "scroll-story") {
    document.querySelector("#story")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (action === "back-island") {
    state.view = "island";
    render();
  }
  if (action === "back-rooms") {
    state.isTransitioning = false;
    releaseSeat();
    stopRoomPresence();
    state.view = "rooms";
    state.selectedSeat = null;
    render();
  }
  if (action === "sit-down" && state.selectedSeat !== null) {
    animatePlayerToSeat();
  }
  if (action === "toggle-timer") toggleTimer();
  if (action === "switch-seat") {
    syncTimerFromClock();
    state.isRunning = false;
    stopTicker();
    suspendAudio();
    state.selectedSeat = null;
    state.view = "room";
    render();
  }
  if (action === "finish-session") finishSession();
  if (action === "retry-session") retrySession();
  if (action === "return-room") returnRoom();
  if (action === "return-island") returnIsland();
  if (action === "profile") showToast("个人中心将用于设置、偏好与语言切换，后续开放");
  if (action === "locked-room") showToast("首期先把临窗雨声做完整，另外两个房间会沿用同一套引擎");
  if (action === "locked") showToast("这个区域还在建设中，内测后会根据投票决定优先开放顺序");
});

document.addEventListener("visibilitychange", () => {
  if (state.view !== "focus" || !state.isRunning) return;
  if (syncTimerFromClock()) return;
  persistActiveSession(true);
  if (!document.hidden) {
    const timerElement = document.querySelector("#timer");
    if (timerElement) timerElement.textContent = formatTime();
  }
});

window.addEventListener("pagehide", () => {
  if (state.view === "focus" && state.isRunning) syncTimerFromClock();
  persistActiveSession(true);
  releaseSeat({ beacon: true });
});
window.addEventListener("beforeunload", () => {
  window.clearTimeout(populationTimer);
  persistActiveSession(true);
  stopAudio();
});

restoreActiveSession();
render();
schedulePopulationChange();
