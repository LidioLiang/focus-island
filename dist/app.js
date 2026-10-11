const ASSET_BASE = "./assets/";

const scenes = {
  cafe: {
    id: "cafe",
    name: "雨巷咖啡馆",
    shortName: "咖啡厅",
    islandLabel: "城市区",
    icon: "☕",
    image: `${ASSET_BASE}20261011-cafe-focus-room.png`,
    description: "雨落在窗上，咖啡机偶尔轻响。选一张熟悉的桌子，和岛民们安静地做自己的事。",
    sounds: ["细雨", "咖啡馆底噪", "偶尔杯碟声"],
    filter: 620,
    rooms: [
      { id: "cafe-rain", name: "临窗雨声", mood: "雨声更清晰，适合写作与深度工作", occupied: 7 },
      { id: "cafe-morning", name: "晨光吧台", mood: "温暖、明亮，适合开始一天", occupied: 5 },
      { id: "cafe-night", name: "深夜角落", mood: "灯光更暗，适合晚间学习", occupied: 8 },
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
    icon: "⌂",
    image: `${ASSET_BASE}20261011-library-focus-room.png`,
    description: "高窗把光铺在木桌上，翻页声很轻。这里适合阅读、备考，也适合把难题慢慢做完。",
    sounds: ["静谧室内", "轻微翻页", "壁炉声"],
    filter: 430,
    rooms: [
      { id: "library-sun", name: "高窗阅览室", mood: "自然光充足，适合阅读和整理", occupied: 6 },
      { id: "library-fire", name: "壁炉长桌", mood: "温暖稳定，适合长时间专注", occupied: 8 },
      { id: "library-carrel", name: "独立书阁", mood: "更少视觉干扰，适合备考", occupied: 4 },
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
    icon: "♧",
    image: `${ASSET_BASE}20261011-forest-creek-focus-room.png`,
    description: "溪流绕过苔石，风穿过树叶。把屏幕变成林间的一张桌子，让呼吸先慢下来。",
    sounds: ["溪流", "林间风", "远处鸟鸣"],
    filter: 820,
    rooms: [
      { id: "forest-creek", name: "溪桥木台", mood: "水声清晰，适合平复情绪后工作", occupied: 6 },
      { id: "forest-canopy", name: "树冠小屋", mood: "遮蔽感更强，适合独处式专注", occupied: 5 },
      { id: "forest-falls", name: "远瀑石阶", mood: "更有自然能量，适合创作", occupied: 7 },
    ],
    seats: [
      [17, 28, true], [30, 37, false], [48, 27, true], [80, 27, true],
      [78, 44, false], [24, 66, true], [57, 62, false], [86, 71, true],
      [67, 78, false], [15, 78, true],
    ],
  },
};

const islandImage = `${ASSET_BASE}20261011-focus-island-map.png`;

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
  companions: 6,
  feedback: null,
  sounds: { ambient: true, presence: true, white: false },
};

let ticker = null;
let lastTick = null;
let audioContext = null;
let noiseSource = null;
let noiseGain = null;
let noiseFilter = null;

const app = document.querySelector("#app");

function brand() {
  return `
    <div class="brand" aria-label="专注岛">
      <span class="brand-mark" aria-hidden="true">◒</span>
      <span class="brand-copy"><strong>专注岛</strong><small>FOCUS ISLE</small></span>
    </div>`;
}

function topbar({ back = null, right = true } = {}) {
  return `
    <header class="topbar">
      ${back ? `<button class="back-button" data-action="${back}" aria-label="返回">←</button>` : brand()}
      ${right ? `<div class="glass-pill"><span class="presence-dot"></span><span>28 位岛民正在专注</span></div>` : ""}
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
        <div class="welcome-kicker"><span class="presence-dot"></span>此刻，28 位岛民正安静地做自己的事</div>
        <h1>换一个地方，<br />开始专注。</h1>
        <p class="welcome-subtitle">像进入游戏一样，去咖啡馆、图书馆或森林里找个位置坐下。有人陪伴，互不打扰。</p>
        <div class="welcome-actions">
          <button class="primary-button" data-action="enter-island">进入专注岛&nbsp; →</button>
          <span class="welcome-note">无需摄像头 · 没有聊天 · 一键开始</span>
        </div>
      </div>
      <span class="prototype-tag">MVP 可交互原型 · v0.2</span>
    </section>`;
}

function renderIsland() {
  app.innerHTML = `
    <section class="view island">
      <img class="scene-image" src="${islandImage}" alt="专注岛地图" />
      ${topbar()}
      <div class="island-hint">选择今天想去的地方</div>

      ${islandHotspot("cafe", 26, 51)}
      ${islandHotspot("library", 43, 25)}
      ${islandHotspot("forest", 75, 48)}
      ${lockedHotspot("湖畔区", "即将开放", 52, 56, "≈")}
      ${lockedHotspot("海滨区", "即将开放", 72, 75, "⌁")}
      ${lockedHotspot("雪山营地", "即将开放", 71, 18, "△")}

      <aside class="island-card">
        <h2>今天想在哪里专注？</h2>
        <p>每个区域都有不同的空间与环境声。先跟随感觉选择，不需要做复杂设置。</p>
        <div class="island-card-meta"><span>3 个区域开放</span><span>9 个安静房间</span></div>
      </aside>
    </section>`;
}

function islandHotspot(sceneId, x, y) {
  const scene = scenes[sceneId];
  return `
    <button class="hotspot" style="left:${x}%; top:${y}%" data-scene="${sceneId}" aria-label="进入${scene.islandLabel}${scene.shortName}">
      <span class="hotspot-pin"><span>${scene.icon}</span></span>
      <span class="hotspot-label"><strong>${scene.islandLabel}</strong><small>${scene.shortName} · ${scene.rooms[0].occupied} 人在线</small></span>
    </button>`;
}

function lockedHotspot(name, note, x, y, icon) {
  return `
    <button class="hotspot locked" style="left:${x}%; top:${y}%" data-action="locked" aria-label="${name}${note}">
      <span class="hotspot-pin"><span>${icon}</span></span>
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
      <span class="occupancy"><strong>${room.occupied}/10</strong><small>正在专注</small></span>
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
      <div class="room-title">${scene.icon} ${room.name} · 保持安静</div>
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
          ${renderAvatarFigure(index)}
          <span class="work-prop" aria-hidden="true"></span>
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
    <span class="player-avatar" id="player-avatar" style="left:7%; top:79%; --avatar:#c98658" aria-label="你的角色正在咖啡厅入口等待">
      ${renderAvatarFigure(2, true)}
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
    const routeY = targetY > 61 ? 76 : 69;
    const approachX = targetX > 55 ? Math.max(39, targetX - 16) : Math.min(24, targetX + 4);
    avatar.classList.add("walking");
    const journey = avatar.animate([
      { left: "7%", top: "79%", offset: 0 },
      { left: "18%", top: `${routeY}%`, offset: 0.3 },
      { left: `${approachX}%`, top: `${routeY}%`, offset: 0.68 },
      { left: `${targetX}%`, top: `${targetY + 2}%`, offset: 1 },
    ], {
      duration: 2500,
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
  app.innerHTML = `
    <section class="view focus">
      <img class="scene-image" src="${scene.image}" alt="虚化的${scene.name}背景" />
      ${topbar({ back: "finish-session", right: false })}
      <section class="focus-stage" aria-label="专注计时器">
        <p class="focus-presence"><span class="presence-dot"></span><span id="presence-copy">还有 ${state.companions} 个位置正在专注</span></p>
        <div class="timer" id="timer">${formatTime()}</div>
        <div class="focus-label">${scene.name} · ${room.name} · ${state.selectedSeat + 1} 号座位</div>
        <div class="timer-modes" aria-label="专注时长">
          ${modeButton(25, "25 分钟")}${modeButton(50, "50 分钟")}${modeButton(0, "自由专注")}
        </div>
        <div class="focus-controls">
          <button class="primary-button" data-action="toggle-timer">${state.isRunning ? "暂停一下" : state.elapsedSeconds > 0 ? "继续专注" : "开始专注"}</button>
          <button class="secondary-button" data-action="finish-session">结束本次</button>
        </div>
        <div class="sound-controls" aria-label="环境声音">
          ${soundButton("ambient", "♫", "环境声")}
          ${soundButton("presence", "◌", "陪伴感")}
          ${soundButton("white", "≈", "柔和底噪")}
        </div>
        <p class="focus-tip">这里没有消息，也不需要回应任何人。</p>
      </section>
    </section>`;
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
  const minutes = Math.max(1, Math.round(state.elapsedSeconds / 60));
  const sessions = Number(localStorage.getItem("focusIslandSessions") || 0) + 1;
  localStorage.setItem("focusIslandSessions", String(sessions));
  app.innerHTML = `
    <section class="view summary">
      <div class="summary-card">
        <div class="summary-symbol">✓</div>
        <p class="eyebrow">一次安静的停留</p>
        <h1>辛苦了，欢迎回来</h1>
        <p>你在${scene.name}完成了一段专注。哪怕只有几分钟，也是在为自己守住注意力。</p>
        <div class="summary-stats">
          <div class="summary-stat"><strong>${minutes} 分钟</strong><span>本次专注</span></div>
          <div class="summary-stat"><strong>${scene.shortName}</strong><span>停留场景</span></div>
          <div class="summary-stat"><strong>${sessions} 次</strong><span>累计上岛</span></div>
        </div>
        <div class="feedback-title">刚才的氛围有没有让你更容易专注？</div>
        <div class="feedback-options">
          ${[["no", "😶", "没有"], ["some", "🙂", "有一点"], ["yes", "😌", "很明显"]].map(([value, icon, label]) => `<button class="feedback-button ${state.feedback === value ? "selected" : ""}" data-feedback="${value}" aria-label="${label}">${icon}</button>`).join("")}
        </div>
        <button class="primary-button" data-action="return-island">回到海岛</button>
      </div>
    </section>`;
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
  renderFocus();
}

function toggleTimer() {
  state.isRunning = !state.isRunning;
  if (state.isRunning) {
    lastTick = Date.now();
    startTicker();
    updateAudio();
  } else {
    stopTicker();
    suspendAudio();
  }
  const button = document.querySelector('[data-action="toggle-timer"]');
  if (button) button.textContent = state.isRunning ? "暂停一下" : "继续专注";
  document.querySelectorAll("[data-mode]").forEach((element) => { element.disabled = state.isRunning; });
}

function startTicker() {
  if (ticker) return;
  lastTick = Date.now();
  ticker = window.setInterval(() => {
    const now = Date.now();
    const delta = Math.max(1, Math.round((now - lastTick) / 1000));
    lastTick = now;
    state.elapsedSeconds += delta;
    if (state.timerMode > 0) {
      state.remainingSeconds = Math.max(0, state.remainingSeconds - delta);
      if (state.remainingSeconds === 0) {
        finishSession();
        return;
      }
    }
    const timerElement = document.querySelector("#timer");
    if (timerElement) timerElement.textContent = formatTime();
    if (state.elapsedSeconds > 0 && state.elapsedSeconds % 17 === 0) {
      state.companions = Math.max(4, Math.min(8, state.companions + (Math.random() > 0.5 ? 1 : -1)));
      const presence = document.querySelector("#presence-copy");
      if (presence) presence.textContent = `还有 ${state.companions} 个位置正在专注`;
    }
  }, 1000);
}

function stopTicker() {
  if (ticker) window.clearInterval(ticker);
  ticker = null;
}

function stopTickerIfNeeded() {
  if (state.view !== "focus") stopTicker();
}

function finishSession() {
  state.isRunning = false;
  stopTicker();
  stopAudio();
  state.view = "summary";
  render();
}

function returnIsland() {
  state.view = "island";
  state.roomId = null;
  state.selectedSeat = null;
  state.feedback = null;
  state.isRunning = false;
  state.timerMode = 25;
  state.durationSeconds = 25 * 60;
  state.remainingSeconds = 25 * 60;
  state.elapsedSeconds = 0;
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
    return;
  }

  const feedbackButton = event.target.closest("[data-feedback]");
  if (feedbackButton) {
    state.feedback = feedbackButton.dataset.feedback;
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
  if (action === "return-island") returnIsland();
  if (action === "locked") showToast("这个区域还在建设中，内测后会根据投票决定优先开放顺序");
});

window.addEventListener("beforeunload", stopAudio);

render();
