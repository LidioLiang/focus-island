const ASSET_BASE = "./assets/";

const scenes = {
  cafe: {
    id: "cafe",
    name: "雨巷咖啡馆",
    shortName: "咖啡厅",
    islandLabel: "城市区",
    icon: "city",
    online: 49,
    image: `${ASSET_BASE}20261011-cafe-focus-room.png`,
    focusViews: {
      1: `${ASSET_BASE}20261012-cafe-bar-focus-view.png`,
      3: `${ASSET_BASE}20261012-cafe-bar-focus-view.png`,
      6: `${ASSET_BASE}20261012-cafe-window-focus-view.png`,
      9: `${ASSET_BASE}20261012-cafe-lounge-focus-view.png`,
    },
    description: "雨落在窗上，咖啡机偶尔轻响。选一张熟悉的桌子，和岛民们安静地做自己的事。",
    sounds: ["细雨", "咖啡馆底噪", "偶尔杯碟声"],
    filter: 620,
    rooms: [
      { id: "cafe-rain", name: "临窗雨声", mood: "雨声更清晰，适合写作与深度工作", occupied: 18 },
      { id: "cafe-morning", name: "晨光吧台", mood: "温暖、明亮，适合开始一天", occupied: 16 },
      { id: "cafe-night", name: "深夜角落", mood: "灯光更暗，适合晚间学习", occupied: 15 },
    ],
    seats: [
      [20, 43, true], [28, 40, false], [37, 37, true], [46, 34, false],
      [59, 35, true], [68, 38, true], [78, 42, false], [88, 47, true],
      [35, 65, true], [72, 68, false],
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

const app = document.querySelector("#app");

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

function topbar({ back = null, right = true } = {}) {
  return `
    <header class="topbar">
      ${back ? `<button class="back-button" data-action="${back}" aria-label="返回">←</button>` : brand()}
      ${right ? `<div class="topbar-actions">
        <div class="glass-pill global-presence" title="全岛实时状态">
          <span class="presence-dot"></span>
          <span class="presence-stat"><strong class="global-online-count">${state.onlineIslanders}</strong><small>人在线</small></span>
          <i class="presence-divider" aria-hidden="true"></i>
          <span class="presence-stat"><strong class="global-focus-count">${state.focusedIslanders}</strong><small>人正在专注</small></span>
        </div>
        <button class="icon-button profile-button" data-action="profile" aria-label="个人中心，即将开放" title="个人中心 · 即将开放">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"/><path d="M5.8 19c.7-3.5 2.8-5.3 6.2-5.3s5.5 1.8 6.2 5.3"/></svg>
        </button>
      </div>` : ""}
    </header>`;
}

function render() {
  stopTickerIfNeeded();
  if (state.view === "welcome") renderWelcome();
  if (state.view === "island") renderIsland();
  if (state.view === "rooms") renderRooms();
  if (state.view === "room") renderRoom();
  if (state.view === "focus") renderFocus();
  if (state.view === "summary") renderSummary();
}

function renderWelcome() {
  app.innerHTML = `
    <section class="view welcome">
      <img class="scene-image" src="${islandImage}" alt="一座有城市、图书馆、森林、湖泊与雪山的宁静海岛" />
      <div class="welcome-content">
        <div class="welcome-kicker"><span class="presence-dot"></span>此刻，<strong class="global-focus-count">${state.focusedIslanders}</strong> 位岛民正安静地做自己的事</div>
        <h1>换一个地方，<br />开始专注。</h1>
        <p class="welcome-subtitle">像进入游戏一样，去咖啡馆、图书馆或森林里找个位置坐下。有人陪伴，互不打扰。</p>
        <div class="welcome-actions">
          <button class="primary-button" data-action="enter-island">进入专注岛&nbsp; →</button>
          <span class="welcome-note">无需摄像头 · 没有聊天 · 一键开始</span>
        </div>
      </div>
      <span class="prototype-tag">MVP 可交互原型 · v0.4</span>
    </section>`;
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
      ${topbar({ back: "back-island" })}
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
    <button class="room-card" data-room="${room.id}">
      <span class="room-card-copy"><strong>${room.name}</strong><span>${room.mood}</span></span>
      <span class="occupancy"><strong>${room.occupied}/24</strong><small>当前在线</small></span>
    </button>`;
}

function renderRoom() {
  const scene = scenes[state.sceneId];
  const room = scene.rooms.find((item) => item.id === state.roomId) || scene.rooms[0];
  const openSeats = scene.seats.filter((seat) => !seat[2]).length;
  const animatedCafe = scene.id === "cafe";
  app.innerHTML = `
    <section class="view room ${animatedCafe ? "animated-room" : ""}">
      <img class="scene-image" src="${scene.image}" alt="${room.name}房间内部" />
      ${topbar({ back: "back-rooms" })}
      <div class="room-title">${regionIcon(scene.icon, "room-region-icon")}<span>${room.name} · 保持安静</span></div>
      <div class="seat-layer" aria-label="座位区域">
        ${scene.seats.map((seat, index) => renderSeat(seat, index, scene.id)).join("")}
        ${animatedCafe ? renderPlayerAvatar() : ""}
      </div>
      <div class="room-footer">
        <div class="room-footer-copy">
          <strong>${state.selectedSeat === null ? "找一个喜欢的位置坐下" : `已选择 ${state.selectedSeat + 1} 号座位`}</strong>
          <span>${state.selectedSeat === null ? `亮起的座位可选 · 还剩 ${openSeats} 个空位` : animatedCafe ? "准备好后，你的角色会从入口走到这里坐下" : "坐下后会进入沉浸式桌面，你仍能感受到大家的陪伴"}</span>
        </div>
        <button class="primary-button" data-action="sit-down" ${state.selectedSeat === null ? "disabled" : ""}>坐下，准备专注</button>
      </div>
    </section>`;
}

function renderSeat(seat, index, sceneId) {
  const [x, y, occupied] = seat;
  if (occupied) {
    const colors = ["#708b7d", "#a4755b", "#7b7f9b", "#9a855c", "#6a8f96", "#967078"];
    if (sceneId === "cafe") {
      const activities = ["typing", "reading", "writing", "sip"];
      const activity = activities[index % activities.length];
      return `
        <span class="seat occupied animated-npc activity-${activity}" style="left:${x}%; top:${y}%; --avatar:${colors[index % colors.length]}; --delay:-${index * 1.7}s" title="这位岛民正在${activityLabel(activity)}" aria-label="一位正在${activityLabel(activity)}的岛民">
          <span class="patron-sprite patron-${index % 4}" aria-hidden="true"></span>
        </span>`;
    }
    return `<span class="seat occupied" style="left:${x}%; top:${y}%; --avatar:${colors[index % colors.length]}" title="这个位置上的岛民正在专注" aria-label="已有人专注的位置">${["⌁", "◒", "△", "◇"][index % 4]}</span>`;
  }
  return `<button class="seat ${state.selectedSeat === index ? "selected" : ""}" style="left:${x}%; top:${y}%" data-seat="${index}" aria-label="选择 ${index + 1} 号空位"><span class="seat-number">${index + 1}</span></button>`;
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
    <span class="player-avatar" id="player-avatar" style="left:50%; top:89%" aria-label="你的角色正在咖啡厅入口等待">
      <img class="walking-avatar-image" src="${ASSET_BASE}20261012-cafe-walking-avatar.png" alt="" />
      <span class="player-badge">你</span>
    </span>`;
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
  const selected = scene.seats[state.selectedSeat];
  const avatar = document.querySelector("#player-avatar");
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
  if (footerTitle) footerTitle.textContent = `正在前往 ${state.selectedSeat + 1} 号座位`;
  if (footerNote) footerNote.textContent = "不用着急，其他岛民仍在安静地做自己的事";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (avatar && !reduceMotion) {
    const [targetX, targetY] = selected;
    const routes = {
      1: [[50, 89], [51, 75], [52, 60], [48, 49], [36, 47], [28, 43]],
      3: [[50, 89], [51, 74], [52, 60], [51, 48], [46, 37]],
      6: [[50, 89], [54, 77], [64, 69], [72, 59], [76, 49], [78, 44]],
      9: [[50, 89], [55, 82], [63, 77], [68, 72], [72, 70]],
    };
    const route = routes[state.selectedSeat] || [[50, 89], [52, 72], [targetX, targetY + 2]];
    const keyframes = route.map(([left, top], index) => ({
      left: `${left}%`,
      top: `${top}%`,
      offset: index / (route.length - 1),
    }));
    avatar.classList.add("walking");
    const journey = avatar.animate(keyframes, {
      duration: 3900,
      easing: "cubic-bezier(.42,0,.2,1)",
      fill: "forwards",
    });
    try { await journey.finished; } catch (_) { /* animation cancelled by navigation */ }
    avatar.style.left = `${targetX}%`;
    avatar.style.top = `${targetY + 2}%`;
    avatar.classList.remove("walking");
    avatar.classList.add("sitting");
    await new Promise((resolve) => window.setTimeout(resolve, 720));
  } else {
    await new Promise((resolve) => window.setTimeout(resolve, 180));
  }

  state.isTransitioning = false;
  state.view = "focus";
  render();
}

function renderFocus() {
  const scene = scenes[state.sceneId];
  const room = scene.rooms.find((item) => item.id === state.roomId) || scene.rooms[0];
  const focusImage = scene.focusViews?.[state.selectedSeat] || scene.image;
  app.innerHTML = `
    <section class="view focus">
      <img class="scene-image" src="${focusImage}" alt="坐在${room.name}${state.selectedSeat + 1}号座位看到的沉浸式工作视角" />
      ${topbar({ back: "finish-session", right: false })}
      <section class="focus-stage" aria-label="专注计时器">
        <div class="timer" id="timer">${formatTime()}</div>
        <p class="focus-presence"><span class="presence-dot"></span><span id="presence-copy">${state.companions} 位岛民陪伴中</span></p>
        <div class="focus-label">${scene.name} · ${room.name} · ${state.selectedSeat + 1} 号座位</div>
        <div class="timer-modes" aria-label="专注时长">
          ${modeButton(25, "25 分钟")}${modeButton(50, "50 分钟")}${modeButton(0, "自由专注")}
        </div>
        <div class="focus-controls">
          <button class="primary-button" data-action="toggle-timer">${state.isRunning ? "暂停" : state.elapsedSeconds > 0 ? "继续" : "开始"}</button>
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
    if (state.elapsedSeconds > 0 && state.elapsedSeconds % 17 === 0) {
      state.companions = Math.max(4, Math.min(8, state.companions + (Math.random() > 0.5 ? 1 : -1)));
      const presence = document.querySelector("#presence-copy");
      if (presence) presence.textContent = `还有 ${state.companions} 个位置正在专注`;
    }
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

function finishSession(forcedStatus = null) {
  if (state.isRunning && !forcedStatus && syncTimerFromClock()) return;
  state.isRunning = false;
  stopTicker();
  stopAudio();
  const status = forcedStatus || (state.elapsedSeconds === 0 ? "not_started" : state.timerMode === 0 ? "free_completed" : "ended_early");
  state.sessionResult = buildSessionResult(status);
  if (state.elapsedSeconds > 0) saveSessionResult(state.sessionResult);
  localStorage.removeItem(STORAGE_KEYS.activeSession);
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
  state.view = "focus";
  render();
}

function returnRoom() {
  resetTimerState();
  state.view = "room";
  render();
}

function returnIsland() {
  resetTimerState({ keepMode: false });
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
    renderRoom();
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
    state.view = "island";
    render();
  }
  if (action === "back-island") {
    state.view = "island";
    render();
  }
  if (action === "back-rooms") {
    state.isTransitioning = false;
    state.view = "rooms";
    state.selectedSeat = null;
    render();
  }
  if (action === "sit-down" && state.selectedSeat !== null) {
    animatePlayerToSeat();
  }
  if (action === "toggle-timer") toggleTimer();
  if (action === "finish-session") finishSession();
  if (action === "retry-session") retrySession();
  if (action === "return-room") returnRoom();
  if (action === "return-island") returnIsland();
  if (action === "profile") showToast("个人中心将用于设置、偏好与语言切换，后续开放");
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
});
window.addEventListener("beforeunload", () => {
  window.clearTimeout(populationTimer);
  persistActiveSession(true);
  stopAudio();
});

restoreActiveSession();
render();
schedulePopulationChange();
