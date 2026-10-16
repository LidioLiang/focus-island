const ASSET_BASE = "./assets/";
// 填入正式问卷地址后，页面底部的反馈入口会自动启用。
const FEEDBACK_FORM_URL = "";
const CAFE_STATE_LAYER_SETTLE_MS = 800;
const CAFE_IMMERSIVE_AUTO_ENTER_MS = 30000;
const scenes = {
  cafe: {
    id: "cafe",
    name: "四时咖啡馆",
    shortName: "咖啡厅",
    islandLabel: "四时咖啡厅",
    icon: "city",
    online: 0,
    image: `${ASSET_BASE}20261015-cafe-room-aligned-sun.png`,
    debugImage: `${ASSET_BASE}20261015-cafe-room-empty-stage-wide.png`,
    focusViews: {
      1: `${ASSET_BASE}20261013-cafe-bar-real-focus-view.png`,
      2: `${ASSET_BASE}20261013-cafe-bar-real-focus-view.png`,
      3: `${ASSET_BASE}20261013-cafe-window-real-focus-view.png`,
      4: `${ASSET_BASE}20261013-cafe-window-real-focus-view.png`,
      5: `${ASSET_BASE}20261013-cafe-sofa-real-focus-view.png`,
      6: `${ASSET_BASE}20261013-cafe-sofa-real-focus-view.png`,
    },
    description: "从晴日、雨雾到黄昏与月夜，选一种今天需要的光线，和岛民们安静地做自己的事。",
    sounds: ["咖啡馆底噪", "窗外环境声", "偶尔杯碟声"],
    filter: 620,
    rooms: [
      { id: "cafe-sun", name: "晴日花房", mood: "明亮日光 · 适合开始与轻任务", description: "让充足的自然光，陪你轻轻开始今天的任务。", occupied: 0, image: `${ASSET_BASE}20261015-cafe-room-aligned-sun.png`, selectorImage: `${ASSET_BASE}20261015-晴天阳光场景.png`, sounds: ["晴朗日光", "咖啡馆底噪", "轻松开始"] },
      { id: "cafe-rain", name: "雨雾清晨", mood: "柔和雨声 · 适合写作与深度工作", description: "雨雾收住了城市的喧闹，适合把注意力留给一件事。", occupied: 0, image: `${ASSET_BASE}20261015-cafe-room-empty-stage-wide.png`, selectorImage: `${ASSET_BASE}20261015-雨雾清晨学习场景.png`, sounds: ["细雨", "窗上雨声", "深度工作"] },
      { id: "cafe-sunset", name: "金色黄昏", mood: "温暖夕照 · 适合整理与复盘", description: "金色的光落在木地板上，适合把今天慢慢收好。", occupied: 0, image: `${ASSET_BASE}20261015-cafe-room-aligned-sunset.png`, selectorImage: `${ASSET_BASE}20261015-金色黄昏学习场景.png`, sounds: ["黄昏街声", "杯碟轻响", "整理复盘"] },
      { id: "cafe-night", name: "月夜书室", mood: "安静月色 · 适合夜间学习", description: "月光与室内暖灯一起亮着，陪你完成今天最后一段专注。", occupied: 0, image: `${ASSET_BASE}20261015-cafe-room-aligned-night.png`, selectorImage: `${ASSET_BASE}20261015-晴朗月夜学习场景.png`, sounds: ["安静月色", "远处城市", "夜间学习"] },
    ],
    seats: [
      [32, 49, false], [37, 49, false],
      [71, 50, false], [80, 51, false],
      [15.5, 67, false], [66, 72, false],
    ],
    // One authoritative mapping for UI marker -> API seatId -> chair -> avatar.
    // The array index above is always seatId - 1.
    seatBindings: {
      1: { chairObjectId: "seat-01-chair", avatarObjectId: "seat-01-avatar" },
      2: { chairObjectId: "seat-02-chair", avatarObjectId: "seat-02-avatar" },
      3: { chairObjectId: "seat-03-chair", avatarObjectId: "seat-03-avatar" },
      4: { chairObjectId: "seat-04-chair", avatarObjectId: "seat-04-avatar" },
      5: { chairObjectId: "seat-05-chair", avatarObjectId: "seat-05-avatar", oppositeChairObjectId: "seat-05-opposite-chair", tableObjectId: "sofa-red-table", rugObjectId: "sofa-red-rug" },
      6: { chairObjectId: "seat-06-chair", avatarObjectId: "seat-06-avatar", oppositeChairObjectId: "seat-06-opposite-chair", tableObjectId: "sofa-green-table", rugObjectId: "sofa-green-rug" },
    },
    seatActors: {
      3: {
        idleSheet: `${ASSET_BASE}20261014-cafe-avatar-window-idle-sheet.png`,
        frameCount: 8,
        left: 63.68,
        top: 23.69,
        width: 14.56,
        height: 28.23,
        scale: 1,
        rotate: 0,
        flipX: false,
        zIndex: 24,
      },
    },
    cafeSceneObjects: [
      { id: "seat-01-chair", name: "1号吧台高脚凳", type: "chair", src: `${ASSET_BASE}20261015-cafe-chair-bar-tall-left.png`, left: 27.2, top: 40.3, width: 7.1, height: 16.5, scale: 1, rotate: 0, flipX: false, zIndex: 18, visible: true },
      { id: "seat-02-chair", name: "2号吧台高脚凳", type: "chair", src: `${ASSET_BASE}20261015-cafe-chair-bar-tall-right.png`, left: 34.6, top: 39.4, width: 7.1, height: 16.5, scale: 1, rotate: 0, flipX: false, zIndex: 18, visible: true },
      { id: "seat-01-avatar", name: "1号人物", type: "avatar", idleSheet: `${ASSET_BASE}20261014-cafe-avatar-seat-01-idle-sheet.png`, frameCount: 8, left: 24.8, top: 23.8, width: 13.2, height: 31.2, scale: 1, rotate: 0, flipX: false, zIndex: 28, visible: true },
      { id: "seat-02-avatar", name: "2号人物", type: "avatar", idleSheet: `${ASSET_BASE}20261014-cafe-avatar-seat-02-idle-sheet.png`, frameCount: 8, left: 32.1, top: 23.6, width: 13.2, height: 31.2, scale: 1, rotate: 0, flipX: false, zIndex: 28, visible: true },
      { id: "seat-03-chair", name: "3号窗边椅", type: "chair", src: `${ASSET_BASE}20261014-cafe-chair-window-left.png`, left: 66.1, top: 42.6, width: 9.5, height: 18.1, scale: 1, rotate: 0, flipX: false, zIndex: 16, visible: true },
      { id: "seat-04-chair", name: "4号窗边椅", type: "chair", src: `${ASSET_BASE}20261014-cafe-chair-window-right.png`, left: 76.5, top: 43.5, width: 9.5, height: 18.1, scale: 1, rotate: 0, flipX: true, zIndex: 16, visible: true },
      { id: "seat-03-avatar", name: "3号人物", type: "avatar", idleSheet: `${ASSET_BASE}20261014-cafe-avatar-window-idle-sheet.png`, frameCount: 8, left: 63.68, top: 23.69, width: 14.56, height: 28.23, scale: 1, rotate: 0, flipX: false, zIndex: 24, visible: true },
      { id: "seat-04-avatar", name: "4号人物", type: "avatar", idleSheet: `${ASSET_BASE}20261014-cafe-avatar-seat-04-idle-sheet.png`, frameCount: 8, left: 74.2, top: 24.1, width: 14.56, height: 28.23, scale: 1, rotate: 0, flipX: true, zIndex: 24, visible: true },
      { id: "sofa-red-rug", name: "红色地毯", type: "rug", src: `${ASSET_BASE}20261014-cafe-sofa-rug.png`, left: 7.5, top: 54.8, width: 37.8, height: 23.8, scale: 1, rotate: 0, flipX: false, zIndex: 9, visible: true },
      { id: "sofa-red-table", name: "红色地毯桌子", type: "table", src: `${ASSET_BASE}20261014-cafe-sofa-table.png`, left: 18.2, top: 49.8, width: 15.8, height: 22.8, scale: 1, rotate: 0, flipX: false, zIndex: 20, visible: true },
      { id: "sofa-green-rug", name: "绿色地毯", type: "rug", src: `${ASSET_BASE}20261014-cafe-sofa-green-rug.png`, left: 55.1, top: 62.2, width: 37.8, height: 23.8, scale: 1, rotate: 0, flipX: false, zIndex: 9, visible: true },
      { id: "sofa-green-table", name: "绿色地毯桌子", type: "table", src: `${ASSET_BASE}20261014-cafe-sofa-table.png`, left: 64.6, top: 58.2, width: 15.8, height: 22.8, scale: 1, rotate: 0, flipX: false, zIndex: 20, visible: true },
      { id: "seat-05-chair", name: "5号座椅（红色地毯）", type: "chair", src: `${ASSET_BASE}20261014-cafe-chair-sofa-left.png`, left: 7.5, top: 50.5, width: 12.5, height: 20.3, scale: 1, rotate: 0, flipX: false, zIndex: 17, visible: true },
      { id: "seat-06-chair", name: "6号座椅（绿色地毯）", type: "chair", src: `${ASSET_BASE}20261014-cafe-chair-sofa-right.png`, left: 61.2, top: 58.2, width: 12.5, height: 20.3, scale: 1, rotate: 0, flipX: false, zIndex: 17, visible: true },
      { id: "seat-05-avatar", name: "5号人物", type: "avatar", idleSheet: `${ASSET_BASE}20261014-cafe-avatar-seat-05-idle-sheet.png`, frameCount: 8, left: 5.1, top: 40.7, width: 14.1, height: 28.4, scale: 1, rotate: 0, flipX: false, zIndex: 29, visible: true },
      { id: "seat-06-avatar", name: "6号人物", type: "avatar", idleSheet: `${ASSET_BASE}20261014-cafe-avatar-seat-06-idle-sheet.png`, frameCount: 8, left: 58.8, top: 48.4, width: 14.1, height: 28.4, scale: 1, rotate: 0, flipX: false, zIndex: 29, visible: true },
      { id: "seat-05-opposite-chair", name: "5号对面椅（红色地毯）", type: "chair", src: `${ASSET_BASE}20261014-cafe-chair-sofa-opposite-left.png`, left: 31.5, top: 54.5, width: 13.8, height: 19.6, scale: 1, rotate: 0, flipX: false, zIndex: 26, visible: true },
      { id: "seat-06-opposite-chair", name: "6号对面椅（绿色地毯）", type: "chair", src: `${ASSET_BASE}20261014-cafe-chair-sofa-opposite-right.png`, left: 80.2, top: 62.5, width: 13.8, height: 19.6, scale: 1, rotate: 0, flipX: true, zIndex: 26, visible: true },
    ],
  },
  library: {
    id: "library",
    name: "穹顶图书馆",
    shortName: "图书馆",
    islandLabel: "学院区",
    icon: "academy",
    online: 45,
    image: `${ASSET_BASE}20261015-library-template-stage-wide.png`,
    debugImage: `${ASSET_BASE}20261015-library-template-stage-wide.png`,
    description: "高窗把光铺在木桌上，翻页声很轻。这里适合阅读、备考，也适合把难题慢慢做完。",
    sounds: ["静谧室内", "轻微翻页", "壁炉声"],
    filter: 430,
    rooms: [
      { id: "library-sun", name: "高窗阅览室", mood: "自然光充足，适合阅读和整理", occupied: 0 },
      { id: "library-fire", name: "壁炉长桌", mood: "温暖稳定，适合长时间专注", occupied: 0 },
      { id: "library-carrel", name: "独立书阁", mood: "更少视觉干扰，适合备考", occupied: 0 },
    ],
    seatBindings: {
      1: { chairObjectId: "library-seat-01-chair", avatarObjectId: "library-seat-01-avatar", occupiedIncludesChair: true },
      2: { chairObjectId: "library-seat-02-chair", avatarObjectId: "library-seat-02-avatar", occupiedIncludesChair: true },
      3: { chairObjectId: "library-seat-03-chair", avatarObjectId: "library-seat-03-avatar" },
      4: { chairObjectId: "library-seat-04-chair", avatarObjectId: "library-seat-04-avatar" },
    },
    sceneObjects: [
      { id: "library-background-study-group", name: "背景四人学习区（不可选座）", type: "background-ambience", src: `${ASSET_BASE}20261016-library-background-four-student-study-group.png`, left: 14, top: 32, width: 36, height: 29, scale: 1, rotate: 0, flipX: false, zIndex: 12, visible: true },
      { id: "library-four-seat-table", name: "四人长桌", type: "table", src: `${ASSET_BASE}20261016-library-four-seat-table-no-stretcher.png`, left: 22, top: 39, width: 56, height: 46, scale: 1, rotate: 5, flipX: true, zIndex: 18, visible: true },
      { id: "library-seat-01-chair", name: "1号座椅", type: "chair", seatId: 1, src: `${ASSET_BASE}20261016-library-seat-01-chair-cropped.png`, left: 55, top: 53, width: 12, height: 28, scale: 1, rotate: 5, flipX: true, zIndex: 16, visible: true },
      { id: "library-seat-02-chair", name: "2号座椅", type: "chair", seatId: 2, src: `${ASSET_BASE}20261016-library-seat-02-chair-cropped.png`, left: 37, top: 54, width: 12, height: 28, scale: 1, rotate: 5, flipX: true, zIndex: 16, visible: true },
      { id: "library-seat-03-chair", name: "3号座椅", type: "chair", seatId: 3, src: `${ASSET_BASE}20261016-library-seat-03-chair-cropped.png`, left: 55, top: 39, width: 10.5, height: 23, scale: 1, rotate: 5, flipX: true, zIndex: 16, visible: true },
      { id: "library-seat-04-chair", name: "4号座椅", type: "chair", seatId: 4, src: `${ASSET_BASE}20261016-library-seat-04-chair-cropped.png`, left: 39, top: 40, width: 10.5, height: 23, scale: 1, rotate: 5, flipX: true, zIndex: 16, visible: true },
      { id: "library-four-seat-lamps", name: "长桌台灯", type: "lamp", src: `${ASSET_BASE}20261015-library-four-seat-lamps-layer.png`, left: 22, top: 39, width: 56, height: 46, scale: 1, rotate: 5, flipX: true, zIndex: 34, visible: true },
      { id: "library-seat-01-avatar", name: "1号占座整体 · 绿背心女生+椅子", type: "avatar", seatId: 1, idleSheet: `${ASSET_BASE}20261016-library-seat-01-occupied-idle-sheet.png`, frameCount: 8, left: 53.5, top: 51, width: 18, height: 38, scale: 1, rotate: 0, flipX: true, zIndex: 26, visible: true },
      { id: "library-seat-02-avatar", name: "2号占座整体 · 蓝毛衣男生+椅子", type: "avatar", seatId: 2, idleSheet: `${ASSET_BASE}20261016-library-seat-02-occupied-idle-sheet.png`, frameCount: 8, left: 29.5, top: 50.5, width: 21, height: 38, scale: 1, rotate: 0, flipX: true, zIndex: 27, visible: true },
      { id: "library-seat-03-avatar", name: "3号人物 · 红毛衣办公", type: "avatar", seatId: 3, idleSheet: `${ASSET_BASE}20261016-library-seat-03-idle-sheet.png`, frameCount: 8, left: 46, top: 42, width: 18, height: 21, scale: 1, rotate: 0, flipX: true, zIndex: 24, visible: true },
      { id: "library-seat-04-avatar", name: "4号人物 · 酒红毛衣学习", type: "avatar", seatId: 4, idleSheet: `${ASSET_BASE}20261016-library-seat-04-idle-sheet.png`, frameCount: 8, left: 25, top: 42.5, width: 19, height: 23, scale: 1, rotate: 0, flipX: true, zIndex: 24, visible: true },
    ],
    seats: [
      [64, 75, false], [37, 74, false],
      [57, 51, false], [35, 52, false],
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
  cafeSpriteTuning: "focusIslandCafeSpriteTuningV2",
  // V5 resets stale editor drafts that were created before the scene layout
  // was fixed. Older drafts can otherwise override the restored coordinates.
  cafeSceneEditor: "focusIslandCafeSceneEditorV6",
  cafeScenePublished: "focusIslandCafeScenePublishedV1",
  librarySceneEditor: "focusIslandLibrarySceneEditorV1",
  libraryScenePublished: "focusIslandLibraryScenePublishedV1",
};

const initialCafeSceneEditor = loadCafeSceneEditorState();
const initialCafeScenePublished = loadCafeScenePublishedState() || cloneCafeSceneLayout(initialCafeSceneEditor);
if (!localStorage.getItem(STORAGE_KEYS.cafeScenePublished)) {
  localStorage.setItem(STORAGE_KEYS.cafeScenePublished, JSON.stringify(initialCafeScenePublished));
}
const initialLibrarySceneEditor = loadLibrarySceneLayout(STORAGE_KEYS.librarySceneEditor) || emptySceneLayout();
const initialLibraryScenePublished = loadLibrarySceneLayout(STORAGE_KEYS.libraryScenePublished) || cloneCafeSceneLayout(initialLibrarySceneEditor);
if (!localStorage.getItem(STORAGE_KEYS.libraryScenePublished)) {
  localStorage.setItem(STORAGE_KEYS.libraryScenePublished, JSON.stringify(initialLibraryScenePublished));
}

const state = {
  view: "welcome",
  sceneId: null,
  roomId: null,
  roomPreviewId: null,
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
  awaitingImmersiveFocus: false,
  immersiveAutoEnterAt: null,
  sessionPanelOpen: false,
  focusImageChoice: "seat",
  cafeSpriteTuning: {
    enabled: false,
    activeSeatId: 3,
    draftBySeatId: loadCafeSpriteTuningDrafts(),
  },
  cafeDebugMode: {
    enabled: false,
    previewOccupiedSeatId: 3,
    disableAutoImmersive: true,
  },
  cafeSceneEditor: {
    activeObjectId: "seat-03-avatar",
    draftByObjectId: initialCafeSceneEditor.draftByObjectId,
    customObjects: initialCafeSceneEditor.customObjects,
    deletedObjectIds: initialCafeSceneEditor.deletedObjectIds,
  },
  cafeScenePublished: initialCafeScenePublished,
  libraryDebugMode: { enabled: false },
  libraryCurrentSeatId: null,
  librarySceneEditor: {
    activeObjectId: "",
    draftByObjectId: initialLibrarySceneEditor.draftByObjectId,
    customObjects: initialLibrarySceneEditor.customObjects,
    deletedObjectIds: initialLibrarySceneEditor.deletedObjectIds,
  },
  libraryScenePublished: initialLibraryScenePublished,
  feedback: null,
  sounds: { ambient: true, presence: true, white: false, music: false },
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
let immersiveAutoTimer = null;
let roomSyncInFlight = false;
let cafeSceneObjectDrag = null;

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
  return state.roomId || (state.sceneId === "cafe" ? scenes.cafe.rooms[0].id : null);
}

function leaseForSeat(seatIndex) {
  return state.roomPresence.leases.find((lease) => Number(lease.seatId) === seatIndex + 1 && lease.state === "occupied") || null;
}

function focusedMinutes(lease) {
  if (!lease.focusStartedAt) return 0;
  return Math.max(0, Math.floor(((state.roomPresence.serverNow || Date.now()) - Number(lease.focusStartedAt)) / 60000));
}

function immersiveCountdownSeconds() {
  if (!state.immersiveAutoEnterAt) return Math.ceil(CAFE_IMMERSIVE_AUTO_ENTER_MS / 1000);
  return Math.max(0, Math.ceil((state.immersiveAutoEnterAt - Date.now()) / 1000));
}

function updateImmersiveCountdownCopy() {
  const note = document.querySelector("[data-immersive-countdown]");
  if (note) note.textContent = `已坐下，专注已开始 · ${immersiveCountdownSeconds()} 秒后自动进入沉浸式专注`;
}

function clearImmersiveAutoEnter({ resetState = true } = {}) {
  if (immersiveAutoTimer) window.clearInterval(immersiveAutoTimer);
  immersiveAutoTimer = null;
  if (resetState) {
    state.awaitingImmersiveFocus = false;
    state.immersiveAutoEnterAt = null;
  }
}

function startFocusFromSeat() {
  state.isRunning = true;
  state.sessionStartedAt = state.sessionStartedAt || Date.now();
  lastTick = Date.now();
  startTicker();
  updateAudio();
}

function beginImmersiveAutoEnter() {
  if (state.cafeDebugMode.enabled && state.cafeDebugMode.disableAutoImmersive) {
    clearImmersiveAutoEnter();
    return;
  }
  clearImmersiveAutoEnter({ resetState: false });
  state.awaitingImmersiveFocus = true;
  state.immersiveAutoEnterAt = Date.now() + CAFE_IMMERSIVE_AUTO_ENTER_MS;
  immersiveAutoTimer = window.setInterval(() => {
    if (state.view !== "room" || !state.awaitingImmersiveFocus) {
      clearImmersiveAutoEnter();
      return;
    }
    updateImmersiveCountdownCopy();
    if (immersiveCountdownSeconds() <= 0) enterImmersiveFocus();
  }, 250);
}

function enterImmersiveFocus() {
  if (state.sceneId !== "cafe" || state.selectedSeat === null) return;
  clearImmersiveAutoEnter();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const roomView = document.querySelector(".view.room");
  roomView?.classList.add("entering-focus");
  window.setTimeout(() => {
    state.view = "focus";
    render();
  }, reduceMotion ? 0 : 760);
}

function stopRoomPresence() {
  window.clearInterval(roomSyncTimer);
  window.clearInterval(heartbeatTimer);
  roomSyncTimer = null;
  heartbeatTimer = null;
  roomSyncInFlight = false;
}

function cafeVisibleSeats() {
  return cafeVisibleSeatEntries().map((entry) => entry.seat);
}

function cafeVisibleSeatEntries() {
  return scenes.cafe.seats.map((seat, index) => ({ seat, index }));
}

function cafeVisibleLeases(leases = state.roomPresence.leases) {
  const visibleSeatIds = new Set(cafeVisibleSeatEntries().map((entry) => entry.index + 1));
  return leases.filter((lease) => visibleSeatIds.has(Number(lease.seatId)));
}

function loadCafeSpriteTuningDrafts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.cafeSpriteTuning) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch (_) {
    return {};
  }
}

function saveCafeSpriteTuningDrafts() {
  localStorage.setItem(STORAGE_KEYS.cafeSpriteTuning, JSON.stringify(state.cafeSpriteTuning.draftBySeatId));
}

function roundTuningNumber(value, digits = 2) {
  return Number(Number(value).toFixed(digits));
}

function defaultCafeSpriteTuning(seatId) {
  const actor = scenes.cafe.seatActors[seatId] || {};
  return {
    left: Number(actor.left || 0),
    top: Number(actor.top || 0),
    width: Number(actor.width || 10),
    height: Number(actor.height || 10),
    scale: Number(actor.scale || 1),
    rotate: Number(actor.rotate || 0),
    flipX: Boolean(actor.flipX),
    zIndex: Number(actor.zIndex || 24),
  };
}

function cafeSpriteTuningForSeat(seatId) {
  const draft = state.cafeSpriteTuning.draftBySeatId[seatId] || {};
  return { ...defaultCafeSpriteTuning(seatId), ...draft };
}

function loadCafeSceneEditorState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.cafeSceneEditor) || "{}");
    if (!saved || typeof saved !== "object") {
      return { draftByObjectId: {}, customObjects: [], deletedObjectIds: [] };
    }
    if (saved.draftByObjectId || saved.customObjects || saved.deletedObjectIds) {
      return {
        draftByObjectId: saved.draftByObjectId && typeof saved.draftByObjectId === "object" ? saved.draftByObjectId : {},
        customObjects: Array.isArray(saved.customObjects) ? saved.customObjects : [],
        deletedObjectIds: Array.isArray(saved.deletedObjectIds) ? saved.deletedObjectIds : [],
      };
    }
    return { draftByObjectId: saved, customObjects: [], deletedObjectIds: [] };
  } catch (_) {
    return { draftByObjectId: {}, customObjects: [], deletedObjectIds: [] };
  }
}

function saveCafeSceneEditorDrafts() {
  localStorage.setItem(STORAGE_KEYS.cafeSceneEditor, JSON.stringify({
    draftByObjectId: state.cafeSceneEditor.draftByObjectId,
    customObjects: state.cafeSceneEditor.customObjects,
    deletedObjectIds: state.cafeSceneEditor.deletedObjectIds,
  }));
}

function cloneCafeSceneLayout(layout) {
  return {
    draftByObjectId: JSON.parse(JSON.stringify(layout?.draftByObjectId || {})),
    customObjects: JSON.parse(JSON.stringify(layout?.customObjects || [])),
    deletedObjectIds: [...(layout?.deletedObjectIds || [])],
  };
}

function emptySceneLayout() {
  return { draftByObjectId: {}, customObjects: [], deletedObjectIds: [] };
}

function loadLibrarySceneLayout(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return null;
    return cloneCafeSceneLayout(saved);
  } catch (_) {
    return null;
  }
}

function saveLibrarySceneEditorDrafts() {
  localStorage.setItem(STORAGE_KEYS.librarySceneEditor, JSON.stringify(cloneCafeSceneLayout(state.librarySceneEditor)));
}

function publishLibrarySceneLayout() {
  state.libraryScenePublished = cloneCafeSceneLayout(state.librarySceneEditor);
  localStorage.setItem(STORAGE_KEYS.libraryScenePublished, JSON.stringify(state.libraryScenePublished));
}

function librarySceneObjects({ includeEditorState = state.libraryDebugMode.enabled } = {}) {
  const layout = includeEditorState ? state.librarySceneEditor : state.libraryScenePublished;
  const deleted = new Set(layout?.deletedObjectIds || []);
  return [...(scenes.library.sceneObjects || []), ...(layout?.customObjects || [])].filter((object) => !deleted.has(object.id));
}

function librarySceneObjectById(objectId) {
  return librarySceneObjects().find((object) => object.id === objectId) || null;
}

function librarySeatMarkerObjectId(index) {
  return `library-seat-marker-${String(index + 1).padStart(2, "0")}`;
}

function librarySeatMarkerIndex(objectId) {
  const match = objectId.match(/^library-seat-marker-(\d{2})$/);
  if (!match) return null;
  const index = Number(match[1]) - 1;
  return index >= 0 && index < scenes.library.seats.length ? index : null;
}

function librarySeatMarkerObjectById(objectId) {
  const index = librarySeatMarkerIndex(objectId);
  if (index === null) return null;
  const [left, top] = scenes.library.seats[index];
  return {
    id: objectId,
    name: `${index + 1}号座位编号`,
    type: "seat-marker",
    left,
    top,
    width: 10,
    height: 5,
    scale: 1,
    rotate: 0,
    flipX: false,
    zIndex: 60,
    visible: true,
  };
}

function libraryEditorObjects() {
  const markers = scenes.library.seats.map((_, index) => librarySeatMarkerObjectById(librarySeatMarkerObjectId(index)));
  return [...librarySceneObjects(), ...markers];
}

function libraryEditorObjectById(objectId) {
  return librarySceneObjectById(objectId) || librarySeatMarkerObjectById(objectId);
}

function isLibrarySeatMarkerObject(objectId) {
  return librarySeatMarkerIndex(objectId) !== null;
}

function defaultLibrarySceneObjectConfig(objectId) {
  const object = libraryEditorObjectById(objectId) || {};
  return {
    left: Number(object.left || 0),
    top: Number(object.top || 0),
    width: Number(object.width || 10),
    height: Number(object.height || 10),
    scale: Number(object.scale || 1),
    rotate: Number(object.rotate || 0),
    flipX: Boolean(object.flipX),
    zIndex: Number(object.zIndex || 20),
    visible: object.visible !== false,
  };
}

function librarySceneObjectConfig(objectId, { includeEditorDraft = state.libraryDebugMode.enabled } = {}) {
  const layout = includeEditorDraft ? state.librarySceneEditor : state.libraryScenePublished;
  return { ...defaultLibrarySceneObjectConfig(objectId), ...(layout?.draftByObjectId?.[objectId] || {}) };
}

function updateLibrarySceneObject(objectId, patch) {
  if (!libraryEditorObjectById(objectId)) return;
  const current = librarySceneObjectConfig(objectId);
  state.librarySceneEditor.draftByObjectId[objectId] = normalizeCafeSceneObjectConfig({ ...current, ...patch });
  saveLibrarySceneEditorDrafts();
  applyLibrarySceneObjectToDom(objectId);
}

function resetLibrarySceneObject(objectId) {
  delete state.librarySceneEditor.draftByObjectId[objectId];
  saveLibrarySceneEditorDrafts();
  applyLibrarySceneObjectToDom(objectId);
}

function duplicateLibrarySceneObject(objectId) {
  if (isLibrarySeatMarkerObject(objectId)) return null;
  const sourceObject = librarySceneObjectById(objectId);
  if (!sourceObject) return null;
  const sourceConfig = librarySceneObjectConfig(objectId);
  const copyId = `${objectId}-copy-${Date.now().toString(36).slice(-5)}`;
  state.librarySceneEditor.customObjects.push({
    ...sourceObject,
    ...sourceConfig,
    id: copyId,
    name: `${sourceObject.name || objectId} 副本`,
    left: clampScenePercent(sourceConfig.left + 2),
    top: clampScenePercent(sourceConfig.top + 2),
    zIndex: sourceConfig.zIndex + 1,
  });
  state.librarySceneEditor.activeObjectId = copyId;
  saveLibrarySceneEditorDrafts();
  return copyId;
}

function deleteLibrarySceneObject(objectId) {
  if (isLibrarySeatMarkerObject(objectId)) return false;
  const object = librarySceneObjectById(objectId);
  if (!object) return false;
  state.librarySceneEditor.customObjects = state.librarySceneEditor.customObjects.filter((item) => item.id !== objectId);
  if ((scenes.library.sceneObjects || []).some((item) => item.id === objectId) && !state.librarySceneEditor.deletedObjectIds.includes(objectId)) {
    state.librarySceneEditor.deletedObjectIds.push(objectId);
  }
  delete state.librarySceneEditor.draftByObjectId[objectId];
  state.librarySceneEditor.activeObjectId = librarySceneObjects().find((item) => item.id !== objectId)?.id || "";
  saveLibrarySceneEditorDrafts();
  return true;
}

function allLibrarySceneObjectConfigs() {
  return Object.fromEntries(libraryEditorObjects().map((object) => [object.id, { ...object, ...librarySceneObjectConfig(object.id) }]));
}

function applyLibrarySceneObjectToDom(objectId) {
  const config = librarySceneObjectConfig(objectId);
  const element = document.querySelector(`[data-library-scene-object="${objectId}"], [data-library-seat-marker-object="${objectId}"]`);
  if (element) {
    element.style.setProperty("--object-left", `${config.left}%`);
    element.style.setProperty("--object-top", `${config.top}%`);
    element.style.setProperty("--object-width", `${config.width}%`);
    element.style.setProperty("--object-height", `${config.height}%`);
    element.style.setProperty("--object-scale", config.scale);
    element.style.setProperty("--object-rotate", `${config.rotate}deg`);
    element.style.setProperty("--object-flip", config.flipX ? -1 : 1);
    element.style.setProperty("--object-z-index", config.zIndex);
    element.classList.toggle("is-hidden", !config.visible);
    if (element.matches("[data-library-seat-marker-object]")) {
      element.style.left = `${config.left}%`;
      element.style.top = `${config.top}%`;
    }
  }
  document.querySelectorAll("[data-library-object-value]").forEach((output) => {
    const field = output.dataset.libraryObjectValue;
    output.textContent = field === "flipX" || field === "visible" ? (config[field] ? "开启" : "关闭") : config[field];
  });
  document.querySelectorAll("[data-library-object-option]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.libraryObjectOption === objectId);
  });
  document.querySelectorAll("[data-library-scene-object]").forEach((sceneObject) => {
    sceneObject.classList.toggle("is-selected", sceneObject.dataset.librarySceneObject === objectId);
  });
  document.querySelectorAll("[data-library-seat-marker-object]").forEach((marker) => {
    marker.classList.toggle("is-selected", marker.dataset.librarySeatMarkerObject === objectId);
  });
}

function loadCafeScenePublishedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.cafeScenePublished);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return null;
    return cloneCafeSceneLayout(saved);
  } catch (_) {
    return null;
  }
}

function publishCafeSceneLayout() {
  state.cafeScenePublished = cloneCafeSceneLayout(state.cafeSceneEditor);
  localStorage.setItem(STORAGE_KEYS.cafeScenePublished, JSON.stringify(state.cafeScenePublished));
}

function cafeSceneObjects({ includeEditorState = state.cafeDebugMode.enabled } = {}) {
  const layout = includeEditorState ? state.cafeSceneEditor : state.cafeScenePublished;
  const deleted = new Set(layout?.deletedObjectIds || []);
  return [...scenes.cafe.cafeSceneObjects, ...(layout?.customObjects || [])].filter((object) => !deleted.has(object.id));
}

function cafeSceneObjectById(objectId) {
  return cafeSceneObjects().find((object) => object.id === objectId) || null;
}

function cafeSeatMarkerObjectId(index) {
  return `seat-marker-${String(index + 1).padStart(2, "0")}`;
}

function cafeSeatMarkerIndex(objectId) {
  const match = objectId.match(/^seat-marker-(\d{2})$/);
  if (!match) return null;
  const index = Number(match[1]) - 1;
  return index >= 0 && index < scenes.cafe.seats.length ? index : null;
}

function cafeSeatMarkerObjectById(objectId) {
  const index = cafeSeatMarkerIndex(objectId);
  if (index === null) return null;
  const [left, top] = scenes.cafe.seats[index];
  return {
    id: objectId,
    name: `${index + 1}号座位标记`,
    type: "seat-marker",
    left,
    top,
    width: 10,
    height: 5,
    scale: 1,
    rotate: 0,
    flipX: false,
    zIndex: 60,
    visible: true,
  };
}

function cafeEditorObjects() {
  const markerObjects = scenes.cafe.seats.map((_, index) => cafeSeatMarkerObjectById(cafeSeatMarkerObjectId(index)));
  return [...cafeSceneObjects(), ...markerObjects];
}

function cafeEditorObjectById(objectId) {
  return cafeSceneObjectById(objectId) || cafeSeatMarkerObjectById(objectId);
}

function isCafeSeatMarkerObject(objectId) {
  return cafeSeatMarkerIndex(objectId) !== null;
}

function defaultCafeSceneObjectConfig(objectId) {
  const object = cafeEditorObjectById(objectId) || {};
  return {
    left: Number(object.left || 0),
    top: Number(object.top || 0),
    width: Number(object.width || 10),
    height: Number(object.height || 10),
    scale: Number(object.scale || 1),
    rotate: Number(object.rotate || 0),
    flipX: Boolean(object.flipX),
    zIndex: Number(object.zIndex || 20),
    visible: object.visible !== false,
  };
}

function cafeSceneObjectConfig(objectId, { includeEditorDraft = state.cafeDebugMode.enabled } = {}) {
  const layout = includeEditorDraft ? state.cafeSceneEditor : state.cafeScenePublished;
  const draft = layout?.draftByObjectId?.[objectId] || {};
  return { ...defaultCafeSceneObjectConfig(objectId), ...draft };
}

function normalizeCafeSceneObjectConfig(next) {
  return {
    left: roundTuningNumber(next.left),
    top: roundTuningNumber(next.top),
    width: roundTuningNumber(Math.max(1, Math.min(80, next.width))),
    height: roundTuningNumber(Math.max(1, Math.min(80, next.height))),
    scale: roundTuningNumber(Math.max(0.1, Math.min(3, next.scale))),
    rotate: roundTuningNumber(Math.max(-45, Math.min(45, next.rotate))),
    flipX: Boolean(next.flipX),
    zIndex: Math.round(Math.max(1, Math.min(120, next.zIndex))),
    visible: next.visible !== false,
  };
}

function updateCafeSceneObject(objectId, patch) {
  if (!cafeEditorObjectById(objectId)) return;
  const current = cafeSceneObjectConfig(objectId);
  state.cafeSceneEditor.draftByObjectId[objectId] = normalizeCafeSceneObjectConfig({ ...current, ...patch });
  saveCafeSceneEditorDrafts();
  applyCafeSceneObjectToDom(objectId);
}

function clampScenePercent(value) {
  return roundTuningNumber(Math.max(-20, Math.min(120, value)));
}

function cafeScenePointerPosition(event, stageElement) {
  const rect = stageElement.getBoundingClientRect();
  return {
    left: ((event.clientX - rect.left) / rect.width) * 100,
    top: ((event.clientY - rect.top) / rect.height) * 100,
  };
}

function resetCafeSceneObject(objectId) {
  delete state.cafeSceneEditor.draftByObjectId[objectId];
  saveCafeSceneEditorDrafts();
  applyCafeSceneObjectToDom(objectId);
}

function allCafeSceneObjectConfigs() {
  return Object.fromEntries(cafeEditorObjects().map((object) => [object.id, { ...object, ...cafeSceneObjectConfig(object.id) }]));
}

function cafeSceneAvatarSeatId(object) {
  const binding = Object.entries(scenes.cafe.seatBindings).find(([, value]) => value.avatarObjectId === object.id);
  return binding ? Number(binding[0]) : null;
}

function isCafeAvatarObject(object) {
  return object.type === "avatar" || Boolean(object.idleSheet);
}

function shouldRenderCafeSceneObject(object, config, { editor = false } = {}) {
  if (editor) return true;
  if (!config.visible) return false;
  const avatarSeatId = cafeSceneAvatarSeatId(object);
  if (!avatarSeatId) return !isCafeAvatarObject(object);
  return state.roomPresence.leases.some((lease) => Number(lease.seatId) === avatarSeatId && lease.state === "occupied");
}

function duplicateCafeSceneObject(objectId) {
  if (isCafeSeatMarkerObject(objectId)) return null;
  const sourceObject = cafeSceneObjectById(objectId);
  if (!sourceObject) return null;
  const sourceConfig = cafeSceneObjectConfig(objectId);
  const copyId = `${objectId}-copy-${Date.now().toString(36).slice(-5)}`;
  const copyObject = {
    ...sourceObject,
    id: copyId,
    name: `${sourceObject.name || objectId} 副本`,
    left: clampScenePercent(sourceConfig.left + 2),
    top: clampScenePercent(sourceConfig.top + 2),
    width: sourceConfig.width,
    height: sourceConfig.height,
    scale: sourceConfig.scale,
    rotate: sourceConfig.rotate,
    flipX: sourceConfig.flipX,
    zIndex: sourceConfig.zIndex + 1,
    visible: true,
  };
  state.cafeSceneEditor.customObjects.push(copyObject);
  state.cafeSceneEditor.activeObjectId = copyId;
  saveCafeSceneEditorDrafts();
  return copyId;
}

function deleteCafeSceneObject(objectId) {
  if (isCafeSeatMarkerObject(objectId)) return false;
  const object = cafeSceneObjectById(objectId);
  if (!object) return false;
  state.cafeSceneEditor.customObjects = state.cafeSceneEditor.customObjects.filter((item) => item.id !== objectId);
  if (scenes.cafe.cafeSceneObjects.some((item) => item.id === objectId) && !state.cafeSceneEditor.deletedObjectIds.includes(objectId)) {
    state.cafeSceneEditor.deletedObjectIds.push(objectId);
  }
  delete state.cafeSceneEditor.draftByObjectId[objectId];
  const nextObject = cafeSceneObjects().find((item) => item.id !== objectId) || null;
  state.cafeSceneEditor.activeObjectId = nextObject?.id || "";
  saveCafeSceneEditorDrafts();
  return true;
}

function applyCafeSceneObjectToDom(objectId) {
  const config = cafeSceneObjectConfig(objectId);
  const objectElement = document.querySelector(`[data-cafe-scene-object="${objectId}"], [data-cafe-seat-marker-object="${objectId}"]`);
  if (objectElement) {
    objectElement.style.setProperty("--object-left", `${config.left}%`);
    objectElement.style.setProperty("--object-top", `${config.top}%`);
    objectElement.style.setProperty("--object-width", `${config.width}%`);
    objectElement.style.setProperty("--object-height", `${config.height}%`);
    objectElement.style.setProperty("--object-scale", config.scale);
    objectElement.style.setProperty("--object-rotate", `${config.rotate}deg`);
    objectElement.style.setProperty("--object-flip", config.flipX ? -1 : 1);
    objectElement.style.setProperty("--object-z-index", config.zIndex);
    objectElement.classList.toggle("is-hidden", !config.visible);
    if (objectElement.matches("[data-cafe-seat-marker-object]")) {
      objectElement.style.left = `${config.left}%`;
      objectElement.style.top = `${config.top}%`;
    }
  }
  document.querySelectorAll("[data-object-value]").forEach((element) => {
    const field = element.dataset.objectValue;
    element.textContent = field === "flipX" || field === "visible" ? (config[field] ? "开启" : "关闭") : config[field];
  });
  document.querySelectorAll("[data-object-input]").forEach((input) => {
    const field = input.dataset.objectInput;
    const value = config[field];
    if (String(input.value) !== String(value)) input.value = value;
  });
  document.querySelectorAll("[data-cafe-object-option]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.cafeObjectOption === objectId);
  });
  document.querySelectorAll("[data-cafe-scene-object]").forEach((element) => {
    element.classList.toggle("is-selected", element.dataset.cafeSceneObject === objectId);
  });
  document.querySelectorAll("[data-cafe-seat-marker-object]").forEach((element) => {
    element.classList.toggle("is-selected", element.dataset.cafeSeatMarkerObject === objectId);
  });
}

function updateCafeSpriteTuning(seatId, patch) {
  const current = cafeSpriteTuningForSeat(seatId);
  const next = { ...current, ...patch };
  const normalized = {
    left: roundTuningNumber(next.left),
    top: roundTuningNumber(next.top),
    width: roundTuningNumber(next.width),
    height: roundTuningNumber(next.height),
    scale: roundTuningNumber(Math.max(0.5, Math.min(1.8, next.scale))),
    rotate: roundTuningNumber(Math.max(-20, Math.min(20, next.rotate))),
    flipX: Boolean(next.flipX),
    zIndex: Math.round(Math.max(1, Math.min(99, next.zIndex))),
  };
  state.cafeSpriteTuning.draftBySeatId[seatId] = normalized;
  saveCafeSpriteTuningDrafts();
  applyCafeSpriteTuningToDom(seatId);
}

function resetCafeSpriteTuning(seatId) {
  delete state.cafeSpriteTuning.draftBySeatId[seatId];
  saveCafeSpriteTuningDrafts();
  applyCafeSpriteTuningToDom(seatId);
}

function applyCafeSpriteTuningToDom(seatId) {
  const config = cafeSpriteTuningForSeat(seatId);
  const sprite = document.querySelector(`[data-cafe-seat-actor="${seatId}"]`);
  if (sprite) {
    sprite.style.setProperty("--sprite-left", `${config.left}%`);
    sprite.style.setProperty("--sprite-top", `${config.top}%`);
    sprite.style.setProperty("--sprite-width", `${config.width}%`);
    sprite.style.setProperty("--sprite-height", `${config.height}%`);
    sprite.style.setProperty("--sprite-scale", config.scale);
    sprite.style.setProperty("--sprite-rotate", `${config.rotate}deg`);
    sprite.style.setProperty("--sprite-flip", config.flipX ? -1 : 1);
    sprite.style.setProperty("--sprite-z-index", config.zIndex);
  }
  document.querySelectorAll("[data-tune-value]").forEach((element) => {
    const field = element.dataset.tuneValue;
    element.textContent = field === "flipX" ? (config.flipX ? "开启" : "关闭") : config[field];
  });
  document.querySelectorAll("[data-tune-input]").forEach((input) => {
    const field = input.dataset.tuneInput;
    const value = config[field];
    if (String(input.value) !== String(value)) input.value = value;
  });
}

function renderCafeSpriteTuningPanel() {
  if (!state.cafeDebugMode.enabled) {
    return `<button class="sprite-tuning-toggle" data-action="toggle-cafe-debug-mode">开发者调试模式</button>`;
  }
  const objectId = state.cafeSceneEditor.activeObjectId;
  const objects = cafeEditorObjects();
  const activeObject = cafeEditorObjectById(objectId) || objects[0];
  if (!activeObject) {
    return `
      <aside class="sprite-tuning-panel" aria-label="角色位置调试面板">
        <div class="sprite-tuning-head">
          <strong>咖啡厅场景编辑器</strong>
          <button type="button" data-action="toggle-cafe-debug-mode">关闭调试</button>
        </div>
        <p class="sprite-tuning-note">当前没有可编辑物件。刷新页面或清空浏览器本地缓存可以恢复默认物件。</p>
      </aside>`;
  }
  const config = cafeSceneObjectConfig(activeObject.id);
  return `
    <aside class="sprite-tuning-panel" aria-label="角色位置调试面板">
      <div class="sprite-tuning-head">
        <strong>咖啡厅场景编辑器</strong>
        <button type="button" data-action="toggle-cafe-debug-mode">关闭调试</button>
      </div>
      <p class="sprite-tuning-note">调试模式不会自动进入沉浸视角，也不会占用真实座位。先选择物件，再调整位置和层级。</p>
      <div class="scene-object-list" aria-label="场景物件列表">
        ${objects.map((object) => `
          <button
            type="button"
            class="${object.id === activeObject.id ? "is-active" : ""}"
            data-action="select-cafe-scene-object"
            data-cafe-object-option="${object.id}"
          >
            <span>${object.name}</span>
            <small>${object.type}</small>
          </button>
        `).join("")}
      </div>
      <div class="sprite-tuning-grid">
        <label>X <output data-object-value="left">${config.left}</output>%</label>
        <div class="sprite-tuning-buttons">
          <button type="button" data-action="nudge-cafe-scene-object" data-object-field="left" data-object-delta="-0.2">−</button>
          <button type="button" data-action="nudge-cafe-scene-object" data-object-field="left" data-object-delta="0.2">+</button>
        </div>
        <label>Y <output data-object-value="top">${config.top}</output>%</label>
        <div class="sprite-tuning-buttons">
          <button type="button" data-action="nudge-cafe-scene-object" data-object-field="top" data-object-delta="-0.2">−</button>
          <button type="button" data-action="nudge-cafe-scene-object" data-object-field="top" data-object-delta="0.2">+</button>
        </div>
      </div>
      <label class="sprite-tuning-slider">
        宽度 <output data-object-value="width">${config.width}</output>%
        <input data-object-input="width" type="range" min="1" max="80" step="0.1" value="${config.width}">
      </label>
      <label class="sprite-tuning-slider">
        高度 <output data-object-value="height">${config.height}</output>%
        <input data-object-input="height" type="range" min="1" max="80" step="0.1" value="${config.height}">
      </label>
      <label class="sprite-tuning-slider">
        缩放 <output data-object-value="scale">${config.scale}</output>
        <input data-object-input="scale" type="range" min="0.1" max="3" step="0.01" value="${config.scale}">
      </label>
      <label class="sprite-tuning-slider">
        旋转 <output data-object-value="rotate">${config.rotate}</output>°
        <input data-object-input="rotate" type="range" min="-45" max="45" step="0.5" value="${config.rotate}">
      </label>
      <label class="sprite-tuning-slider">
        层级 <output data-object-value="zIndex">${config.zIndex}</output>
        <input data-object-input="zIndex" type="range" min="1" max="120" step="1" value="${config.zIndex}">
      </label>
      <div class="sprite-tuning-actions">
        <button type="button" class="publish-layout" data-action="publish-cafe-scene-layout">固定到普通模式</button>
        <button type="button" data-action="flip-cafe-scene-object">水平翻转：<span data-object-value="flipX">${config.flipX ? "开启" : "关闭"}</span></button>
        <button type="button" data-action="toggle-cafe-scene-object-visible">显示：<span data-object-value="visible">${config.visible ? "开启" : "关闭"}</span></button>
        ${isCafeSeatMarkerObject(activeObject.id) ? "" : `
          <button type="button" data-action="duplicate-cafe-scene-object">复制当前</button>
          <button type="button" class="danger" data-action="delete-cafe-scene-object">删除当前</button>
        `}
        <button type="button" data-action="reset-cafe-scene-object">重置当前</button>
        <button type="button" data-action="release-cafe-seat-now">释放我的座位</button>
        <button type="button" data-action="copy-cafe-scene-objects">复制全部 JSON</button>
      </div>
      <small>提示：打开面板后也可以用方向键移动，Shift + 方向键加大步长。</small>
    </aside>`;
}

function renderCafeSceneObjectLayers(options = {}) {
  const editor = Boolean(options.editor);
  return `
    <div class="cafe-scene-object-layer" aria-hidden="true">
      ${cafeSceneObjects().map((object) => {
        const config = cafeSceneObjectConfig(object.id);
        if (!shouldRenderCafeSceneObject(object, config, { editor })) return "";
        const isSelected = editor && object.id === state.cafeSceneEditor.activeObjectId;
        const className = `cafe-scene-object ${config.visible ? "" : "is-hidden"} ${isSelected ? "is-selected" : ""}`;
        const style = `--object-left:${config.left}%; --object-top:${config.top}%; --object-width:${config.width}%; --object-height:${config.height}%; --object-scale:${config.scale}; --object-rotate:${config.rotate}deg; --object-flip:${config.flipX ? -1 : 1}; --object-z-index:${config.zIndex}; --object-track-width:${(object.frameCount || 1) * 100}%;`;
        if (object.idleSheet) {
          return `
            <div class="${className} cafe-scene-object-sprite" data-cafe-scene-object="${object.id}" data-frame-count="${object.frameCount || 8}" style="${style}">
              <img class="cafe-scene-object-track" src="${object.idleSheet}" alt="" draggable="false" />
            </div>`;
        }
        return `<img class="${className}" data-cafe-scene-object="${object.id}" src="${object.src}" alt="" draggable="false" style="${style}" />`;
      }).join("")}
    </div>`;
}

function renderLibrarySceneObjectLayers({ editor = false } = {}) {
  return `
    <div class="cafe-scene-object-layer library-scene-object-layer" aria-hidden="true">
      ${librarySceneObjects().map((object) => {
        const config = librarySceneObjectConfig(object.id);
        if (!editor && !config.visible) return "";
        if (!editor && object.type === "avatar" && Number(object.seatId) !== Number(state.libraryCurrentSeatId)) return "";
        if (!editor && object.type === "chair" && Number(object.seatId) === Number(state.libraryCurrentSeatId)) {
          const binding = scenes.library.seatBindings?.[Number(object.seatId)];
          if (binding?.occupiedIncludesChair) return "";
        }
        const selected = editor && object.id === state.librarySceneEditor.activeObjectId;
        const className = `cafe-scene-object ${config.visible ? "" : "is-hidden"} ${selected ? "is-selected" : ""}`;
        const style = `--object-left:${config.left}%; --object-top:${config.top}%; --object-width:${config.width}%; --object-height:${config.height}%; --object-scale:${config.scale}; --object-rotate:${config.rotate}deg; --object-flip:${config.flipX ? -1 : 1}; --object-z-index:${config.zIndex}; --object-track-width:${(object.frameCount || 1) * 100}%;`;
        if (object.idleSheet) {
          return `<div class="${className} cafe-scene-object-sprite" data-library-scene-object="${object.id}" data-frame-count="${object.frameCount || 8}" style="${style}"><img class="cafe-scene-object-track" src="${object.idleSheet}" alt="" draggable="false" /></div>`;
        }
        return `<img class="${className}" data-library-scene-object="${object.id}" src="${object.src}" alt="" draggable="false" style="${style}" />`;
      }).join("")}
    </div>`;
}

function renderLibrarySceneEditorPanel() {
  if (!state.libraryDebugMode.enabled) {
    return `<button class="sprite-tuning-toggle" data-action="toggle-library-debug-mode">开发者调试模式</button>`;
  }
  const objects = libraryEditorObjects();
  const activeObject = libraryEditorObjectById(state.librarySceneEditor.activeObjectId) || objects[0];
  if (!activeObject) {
    return `
      <aside class="sprite-tuning-panel" aria-label="学院区场景编辑器">
        <div class="sprite-tuning-head">
          <strong>学院区场景编辑器</strong>
          <button type="button" data-action="toggle-library-debug-mode">关闭调试</button>
        </div>
        <p class="sprite-tuning-note">模板母图已经接入并统一为 1764×992。桌椅和人物素材加入配置后，会自动出现在这里并支持拖动、缩放、旋转、翻转、复制、删除和固定。</p>
        <div class="sprite-tuning-actions">
          <button type="button" class="publish-layout" data-action="publish-library-scene-layout">固定到普通模式</button>
          <button type="button" data-action="copy-library-scene-objects">复制全部 JSON</button>
        </div>
      </aside>`;
  }
  state.librarySceneEditor.activeObjectId = activeObject.id;
  const config = librarySceneObjectConfig(activeObject.id);
  return `
    <aside class="sprite-tuning-panel" aria-label="学院区场景编辑器">
      <div class="sprite-tuning-head">
        <strong>学院区场景编辑器</strong>
        <button type="button" data-action="toggle-library-debug-mode">关闭调试</button>
      </div>
      <p class="sprite-tuning-note">选择或直接拖动物件；所有修改只保存在本机，点击“固定到普通模式”后正式生效。</p>
      <div class="scene-object-list">
        ${objects.map((object) => `<button type="button" class="${object.id === activeObject.id ? "is-active" : ""}" data-action="select-library-scene-object" data-library-object-option="${object.id}"><span>${object.name}</span><small>${object.type}</small></button>`).join("")}
      </div>
      <div class="sprite-tuning-grid">
        <label>X <output data-library-object-value="left">${config.left}</output>%</label>
        <div class="sprite-tuning-buttons"><button type="button" data-action="nudge-library-scene-object" data-object-field="left" data-object-delta="-0.2">−</button><button type="button" data-action="nudge-library-scene-object" data-object-field="left" data-object-delta="0.2">+</button></div>
        <label>Y <output data-library-object-value="top">${config.top}</output>%</label>
        <div class="sprite-tuning-buttons"><button type="button" data-action="nudge-library-scene-object" data-object-field="top" data-object-delta="-0.2">−</button><button type="button" data-action="nudge-library-scene-object" data-object-field="top" data-object-delta="0.2">+</button></div>
      </div>
      ${[["width", "宽度", 1, 80, .1], ["height", "高度", 1, 80, .1], ["scale", "缩放", .1, 3, .01], ["rotate", "旋转", -45, 45, .5], ["zIndex", "层级", 1, 120, 1]].map(([field, label, min, max, step]) => `<label class="sprite-tuning-slider">${label} <output data-library-object-value="${field}">${config[field]}</output><input data-library-object-input="${field}" type="range" min="${min}" max="${max}" step="${step}" value="${config[field]}"></label>`).join("")}
      <div class="sprite-tuning-actions">
        <button type="button" class="publish-layout" data-action="publish-library-scene-layout">固定到普通模式</button>
        <button type="button" data-action="flip-library-scene-object">水平翻转：<span data-library-object-value="flipX">${config.flipX ? "开启" : "关闭"}</span></button>
        <button type="button" data-action="toggle-library-scene-object-visible">显示：<span data-library-object-value="visible">${config.visible ? "开启" : "关闭"}</span></button>
        <button type="button" data-action="duplicate-library-scene-object">复制当前</button>
        <button type="button" class="danger" data-action="delete-library-scene-object">删除当前</button>
        <button type="button" data-action="reset-library-scene-object">重置当前</button>
        <button type="button" data-action="copy-library-scene-objects">复制全部 JSON</button>
      </div>
      <small>方向键微调位置，Shift + 方向键加大步长。</small>
    </aside>`;
}

function syncCafeSceneObjectLayers() {
  const layer = document.querySelector(".cafe-scene-object-layer");
  if (!layer || state.sceneId !== "cafe") return;
  const template = document.createElement("template");
  template.innerHTML = renderCafeSceneObjectLayers({ editor: state.cafeDebugMode.enabled }).trim();
  layer.replaceWith(template.content.firstElementChild);
}

function renderCafeSeatActorLayers() {
  const occupiedSeats = new Set(state.roomPresence.leases.map((lease) => Number(lease.seatId)));
  const layers = Object.entries(scenes.cafe.seatActors).map(([seatId, actor]) => {
    const tuning = cafeSpriteTuningForSeat(seatId);
    const debugVisible = state.cafeDebugMode.enabled && Number(seatId) === state.cafeDebugMode.previewOccupiedSeatId;
    const visible = occupiedSeats.has(Number(seatId)) || debugVisible;
    const emptyLayer = actor.empty
      ? `<img class="cafe-seat-empty ${visible ? "" : "is-visible"}" data-cafe-seat-empty="${seatId}" src="${actor.empty}" alt="" draggable="false" />`
      : "";
    return `
      <div class="cafe-seat-actor-layer ${visible ? "is-occupied" : ""}" aria-hidden="true">
        ${emptyLayer}
        <div
          class="cafe-seat-sprite ${visible ? "is-visible" : ""}"
          data-cafe-seat-actor="${seatId}"
          data-frame-count="${actor.frameCount || 8}"
          style="--sprite-left:${tuning.left}%; --sprite-top:${tuning.top}%; --sprite-width:${tuning.width}%; --sprite-height:${tuning.height}%; --sprite-scale:${tuning.scale}; --sprite-rotate:${tuning.rotate}deg; --sprite-flip:${tuning.flipX ? -1 : 1}; --sprite-z-index:${tuning.zIndex}; --sprite-track-width:${(actor.frameCount || 8) * 100}%;"
        >
          <img class="cafe-seat-sprite-track" src="${actor.idleSheet}" alt="" draggable="false" />
        </div>
      </div>`;
  }).join("");
  return layers;
}

function syncCafeSeatActorLayers(leases = state.roomPresence.leases) {
  const occupiedSeats = new Set(leases.map((lease) => Number(lease.seatId)));
  document.querySelectorAll("[data-cafe-seat-actor]").forEach((layer) => {
    const seatId = Number(layer.dataset.cafeSeatActor);
    const debugVisible = state.cafeDebugMode.enabled && seatId === state.cafeDebugMode.previewOccupiedSeatId;
    const visible = occupiedSeats.has(seatId) || debugVisible;
    layer.classList.toggle("is-visible", visible);
    layer.closest(".cafe-seat-actor-layer")?.classList.toggle("is-occupied", visible);
  });
  document.querySelectorAll("[data-cafe-seat-empty]").forEach((layer) => {
    const seatId = Number(layer.dataset.cafeSeatEmpty);
    const debugVisible = state.cafeDebugMode.enabled && seatId === state.cafeDebugMode.previewOccupiedSeatId;
    layer.classList.toggle("is-visible", !occupiedSeats.has(seatId) && !debugVisible);
  });
}

async function syncCafeState({ refreshMarkers = true } = {}) {
  if (roomSyncInFlight || state.sceneId !== "cafe") return;
  roomSyncInFlight = true;
  try {
    const presence = await api(`/api/rooms/${currentRoomApiId()}/state`);
    state.roomPresence = presence;
    const ownLease = presence.leases.find((lease) => lease.sessionId === identity.sessionId && lease.state === "occupied");
    state.currentSeatId = ownLease ? Number(ownLease.seatId) : null;
    const room = scenes.cafe.rooms.find((item) => item.id === currentRoomApiId());
    const visibleLeases = cafeVisibleLeases(presence.leases);
    if (room) room.occupied = visibleLeases.length;
    scenes.cafe.online = scenes.cafe.rooms.reduce((total, item) => total + Number(item.occupied || 0), 0);
    syncCafeSceneObjectLayers();
    syncCafeSeatActorLayers(presence.leases);
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
  const renderedSeatEntries = cafeVisibleSeatEntries();
  markerLayer.innerHTML = renderedSeatEntries.map(({ seat, index }) => renderSeat(seat, index, "cafe")).join("");
  syncCafeSceneObjectLayers();
  syncCafeSeatActorLayers();
  const openSeats = renderedSeatEntries.filter(({ index }) => !leaseForSeat(index)).length;
  const note = document.querySelector(".room-footer-copy span");
  if (note && state.selectedSeat === null) note.textContent = `选择一张喜欢的位置坐下 · 还剩 ${openSeats} 个空位`;
  const syncLabel = document.querySelector(".room-sync-label");
  if (syncLabel) syncLabel.textContent = `${cafeVisibleLeases().length} 人正在房间里`;
}

function updateCafeSeatSelection() {
  document.querySelectorAll("button[data-seat]").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.seat) === state.selectedSeat);
  });
  const title = document.querySelector(".room-footer-copy strong");
  const note = document.querySelector(".room-footer-copy span");
  const action = document.querySelector('[data-action="sit-down"]');
  if (title) title.textContent = state.selectedSeat === null ? "找一个喜欢的位置坐下" : `已选择 ${state.selectedSeat + 1} 号座位`;
  if (note && state.selectedSeat !== null) note.textContent = state.currentSeatId ? "确认后，角色会切换到新的动态座位" : `确认后，你会化身小角色坐进 ${state.selectedSeat + 1} 号座位`;
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

async function releaseSeat({ beacon = false, force = false } = {}) {
  clearImmersiveAutoEnter();
  if (!force && !state.currentSeatId && !state.switchingFromSeatId) return;
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
              <img src="${scenes.cafe.image}" alt="四时咖啡馆房间内的座位与安静专注的岛民" loading="lazy" />
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
              <img src="${scenes.cafe.image}" alt="四种光线氛围的四时咖啡馆" loading="lazy" />
              <span class="scene-index">01 / CITY</span>
            </div>
            <div class="scene-story-copy">
              <span class="scene-icon">${regionIcon("city")}</span>
              <p class="landing-eyebrow">四时咖啡馆</p>
              <h3>让生活的声音，<br />陪你轻轻开始。</h3>
              <p>晴日、雨雾、黄昏和月夜会给开始带来不同的节奏。选一间今天最想待着的房间，让咖啡馆的日常声音陪你进入状态。</p>
              <div class="sound-line"><span>环境声</span><strong>天气环境 · 咖啡馆底噪 · 偶尔杯碟声</strong></div>
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
  if (scene.id === "cafe") {
    renderCafeRooms(scene);
    return;
  }
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

function renderCafeRooms(scene) {
  const selectedRoom = scene.rooms.find((room) => room.id === state.roomPreviewId) || scene.rooms.find((room) => room.id === "cafe-rain") || scene.rooms[0];
  state.roomPreviewId = selectedRoom.id;
  const capacity = cafeVisibleSeats().length;
  app.innerHTML = `
    <section class="view rooms cafe-room-selector">
      <img class="scene-image" src="${selectedRoom.selectorImage || selectedRoom.image}" alt="${selectedRoom.name}" />
      ${topbar({ back: "back-island", showPresence: false })}
      <main class="cafe-room-picker" aria-labelledby="cafe-room-picker-title">
        <section class="cafe-room-intro">
          <p class="eyebrow">${scene.islandLabel} · ${scene.name}</p>
          <h1 id="cafe-room-picker-title">${scene.name}</h1>
          <i class="cafe-room-intro-rule" aria-hidden="true"></i>
          <p class="cafe-room-intro-copy">随光线与天气，进入自己的专注节奏。</p>
          <div class="cafe-room-features" aria-label="房间特点">
            ${cafeRoomFeature("quiet", "安静共处", "沉浸不打扰")}
            ${cafeRoomFeature("people", "6 人小房间", "适合专注学习")}
            ${cafeRoomFeature("coffee", "专注陪伴", "让时间更有质感")}
          </div>
        </section>
        <section class="cafe-room-list-panel" aria-label="四时咖啡馆房间列表">
          <div class="cafe-room-list-heading"><strong>选择房间</strong><small>${scene.rooms.length} 个房间</small></div>
          <div class="cafe-room-preview-list">
            ${scene.rooms.map((room) => cafeRoomPreviewCard(room, selectedRoom.id, capacity)).join("")}
          </div>
          <button type="button" class="cafe-room-enter" data-action="enter-preview-room">进入${selectedRoom.name} <span aria-hidden="true">→</span></button>
        </section>
      </main>
    </section>`;
}

function cafeRoomFeature(icon, title, copy) {
  const icons = {
    quiet: `<path d="M12 21v-8m0 0c-4.2 0-6.5-2-7-6 4-.3 6.6 1.4 7 6Zm0 0c4.2 0 6.5-2 7-6-4-.3-6.6 1.4-7 6Z"/>`,
    people: `<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.2"/><path d="M3.5 20c.5-4.2 2.3-6.2 5.5-6.2s5 2 5.5 6.2m.3-4.7c.8-.8 1.7-1.2 2.9-1.2 2.1 0 3.3 1.7 3.8 5.1"/>`,
    coffee: `<path d="M4 8h13v6.5A4.5 4.5 0 0 1 12.5 19h-4A4.5 4.5 0 0 1 4 14.5Zm13 2h1.7a2.3 2.3 0 0 1 0 4.6H17M7 4.5c0 1 1 1.2 1 2.2m3-2.2c0 1 1 1.2 1 2.2"/>`,
  };
  return `<div class="cafe-room-feature">
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[icon]}</svg>
    <span><strong>${title}</strong><small>${copy}</small></span>
  </div>`;
}

function cafeRoomPreviewCard(room, selectedRoomId, capacity) {
  const selected = room.id === selectedRoomId;
  return `
    <button type="button" class="cafe-room-preview-card ${selected ? "is-selected" : ""}" data-preview-room="${room.id}" aria-pressed="${selected}">
      <img src="${room.selectorImage || room.image}" alt="" />
      <span class="cafe-room-preview-copy"><strong>${room.name}</strong><small>${room.mood}</small></span>
      <span class="cafe-room-preview-occupancy"><strong>${room.occupied} / ${capacity}</strong></span>
      ${selected ? `<span class="cafe-room-preview-check" aria-hidden="true">✓</span>` : ""}
    </button>`;
}

function roomCard(scene, room) {
  const capacity = scene.id === "cafe" ? cafeVisibleSeats().length : scene.seats.length;
  return `
    <button class="room-card ${room.locked ? "is-locked" : ""}" ${room.locked ? 'data-action="locked-room"' : `data-room="${room.id}"`}>
      <span class="room-card-copy"><strong>${room.name}</strong><span>${room.mood}</span></span>
      <span class="occupancy"><strong>${room.locked ? "稍后" : `${room.occupied}/${capacity}`}</strong><small>${room.locked ? "下一阶段" : "实时在线"}</small></span>
    </button>`;
}

function renderRoom() {
  const scene = scenes[state.sceneId];
  const room = scene.rooms.find((item) => item.id === state.roomId) || scene.rooms[0];
  const animatedCafe = scene.id === "cafe";
  const editableLibrary = scene.id === "library";
  const editableScene = animatedCafe || editableLibrary;
  const cafeDebugMode = animatedCafe && state.cafeDebugMode.enabled;
  const libraryDebugMode = editableLibrary && state.libraryDebugMode.enabled;
  const librarySeated = editableLibrary && state.libraryCurrentSeatId && state.selectedSeat === state.libraryCurrentSeatId - 1;
  const sceneDebugMode = cafeDebugMode || libraryDebugMode;
  const sceneImageSource = sceneDebugMode ? (scene.debugImage || scene.image) : (room.image || scene.image);
  const renderedSeatEntries = animatedCafe ? cafeVisibleSeatEntries() : scene.seats.map((seat, index) => ({ seat, index }));
  const openSeats = animatedCafe ? renderedSeatEntries.filter(({ index }) => !leaseForSeat(index)).length : scene.seats.filter((seat) => !seat[2]).length;
  const awaitingImmersive = animatedCafe && state.awaitingImmersiveFocus && state.currentSeatId && state.selectedSeat === state.currentSeatId - 1;
  const footerTitle = awaitingImmersive
    ? `${state.currentSeatId} 号座位 · 已开始专注`
    : librarySeated
      ? `${state.libraryCurrentSeatId} 号座位 · 角色已坐下`
      : state.selectedSeat === null ? "找一个喜欢的位置坐下" : `已选择 ${state.selectedSeat + 1} 号座位`;
  const footerNote = awaitingImmersive
    ? `<span data-immersive-countdown>已坐下，专注已开始 · ${immersiveCountdownSeconds()} 秒后自动进入沉浸式专注</span>`
    : librarySeated
      ? `<span>人物已按座位独立显示，并正在进行轻微专注动画</span>`
      : `<span>${state.selectedSeat === null ? `${animatedCafe ? "选择一张喜欢的位置坐下" : "亮起的座位可选"} · 还剩 ${openSeats} 个空位` : animatedCafe ? (state.currentSeatId ? "确认后，角色会切换到新的座位" : `确认后，你会化身小角色坐进 ${state.selectedSeat + 1} 号座位`) : `确认后，只会显示 ${state.selectedSeat + 1} 号座位对应的人物`}</span>`;
  const primaryAction = awaitingImmersive ? "enter-immersive-focus" : librarySeated ? "enter-library-focus" : "sit-down";
  const primaryText = awaitingImmersive || librarySeated ? "沉浸式专注" : (animatedCafe && state.currentSeatId) || (editableLibrary && state.libraryCurrentSeatId) ? "起身并换座" : "坐下，准备专注";
  const primaryDisabled = !awaitingImmersive && !librarySeated && state.selectedSeat === null;
  app.innerHTML = `
    <section class="view room ${editableScene ? "animated-room" : ""} ${editableLibrary ? "library-room" : ""} ${sceneDebugMode ? "is-debug-layout" : ""}">
      ${topbar({ back: "back-rooms", showPresence: false })}
      ${animatedCafe && state.currentSeatId ? renderSessionHud("room") : ""}
      <div class="room-debug-shell">
        <div class="room-stage">
          <img class="scene-image" src="${sceneImageSource}" alt="${room.name}房间内部" />
          <div class="room-title">${regionIcon(scene.icon, "room-region-icon")}<span>${room.name} · 保持安静</span></div>
          <div class="seat-layer" aria-label="座位区域">
            ${animatedCafe ? renderCafeSceneObjectLayers({ editor: cafeDebugMode }) : ""}
            ${editableLibrary ? renderLibrarySceneObjectLayers({ editor: libraryDebugMode }) : ""}
            <div class="seat-markers">${renderedSeatEntries.map(({ seat, index }) => renderSeat(seat, index, scene.id)).join("")}</div>
          </div>
          <div class="room-footer">
            <div class="room-footer-copy">
              <strong>${footerTitle}</strong>
              ${footerNote}
            </div>
            ${animatedCafe ? `<span class="room-sync-label">正在同步真实座位…</span>` : ""}
            <button class="primary-button" data-action="${primaryAction}" ${primaryDisabled ? "disabled" : ""}>${primaryText}</button>
          </div>
        </div>
        ${animatedCafe ? renderCafeSpriteTuningPanel() : ""}
        ${editableLibrary ? renderLibrarySceneEditorPanel() : ""}
      </div>
    </section>`;
  if (animatedCafe) requestAnimationFrame(() => startCafePresence());
  if (awaitingImmersive) updateImmersiveCountdownCopy();
}

function renderSeat(seat, index, sceneId) {
  const [defaultX, defaultY, staticOccupied] = seat;
  const markerConfig = sceneId === "cafe"
    ? cafeSceneObjectConfig(cafeSeatMarkerObjectId(index))
    : sceneId === "library"
      ? librarySceneObjectConfig(librarySeatMarkerObjectId(index))
      : null;
  const x = markerConfig ? markerConfig.left : defaultX;
  const y = markerConfig ? markerConfig.top : defaultY;
  const lease = sceneId === "cafe" ? leaseForSeat(index) : null;
  const mineInLibrary = sceneId === "library" && Number(state.libraryCurrentSeatId) === index + 1;
  const occupied = sceneId === "cafe" ? Boolean(lease) : staticOccupied || mineInLibrary;
  const cafeZoneClass = sceneId === "cafe" ? `seat-zone-${index < 2 ? "bar" : index < 4 ? "window" : "sofa"}` : "";
  const markerAttrs = sceneId === "cafe" && state.cafeDebugMode.enabled
    ? `data-cafe-seat-marker-object="${cafeSeatMarkerObjectId(index)}"`
    : sceneId === "library" && state.libraryDebugMode.enabled
      ? `data-library-seat-marker-object="${librarySeatMarkerObjectId(index)}"`
      : "";
  const selectedMarkerClass = state.cafeDebugMode.enabled && state.cafeSceneEditor.activeObjectId === cafeSeatMarkerObjectId(index)
    || state.libraryDebugMode.enabled && state.librarySceneEditor.activeObjectId === librarySeatMarkerObjectId(index)
    ? "is-selected"
    : "";
  if (occupied) {
    if (sceneId === "cafe") {
      const mine = lease.sessionId === identity.sessionId;
      const minutes = focusedMinutes(lease);
      const status = minutes > 0 ? `已专注 ${minutes} 分钟` : "刚刚坐下";
      return `
        <span class="seat occupied cafe-seat-status ${cafeZoneClass} ${mine ? "is-mine" : ""} ${selectedMarkerClass}" ${markerAttrs} style="left:${x}%; top:${y}%" tabindex="0" aria-label="${index + 1}号座位已占用，${lease.displayName}${status}">
          <span class="seat-status-dot busy" aria-hidden="true"></span>
          <span class="seat-number">${index + 1}</span>
          <span class="seat-popover" role="tooltip">
            <strong>${mine ? `${identity.displayName}（你）` : lease.displayName}</strong>
            <small>${status} · ${lease.activity || "安静专注"}</small>
            <em><i></i>正在专注</em>
          </span>
        </span>`;
    }
    return `<span class="seat occupied ${mineInLibrary ? "is-mine" : ""} ${cafeZoneClass} ${selectedMarkerClass}" ${markerAttrs} style="left:${x}%; top:${y}%" title="${index + 1}号座位已占用" aria-label="${index + 1}号座位已占用"><span class="seat-status-dot busy" aria-hidden="true"></span><span class="seat-number">${index + 1}</span></span>`;
  }
  return `<button class="seat available ${cafeZoneClass} ${state.selectedSeat === index ? "selected" : ""} ${selectedMarkerClass}" ${markerAttrs} style="left:${x}%; top:${y}%" data-seat="${index}" aria-label="选择 ${index + 1} 号空位"><span class="seat-status-dot free" aria-hidden="true"></span><span class="seat-number">${index + 1}</span><span class="seat-free-label">空位</span></button>`;
}

async function occupySelectedSeat() {
  if (state.isTransitioning || state.selectedSeat === null) return;
  const scene = scenes[state.sceneId];
  if (scene.id === "library") {
    state.libraryCurrentSeatId = state.selectedSeat + 1;
    startFocusFromSeat();
    renderRoom();
    return;
  }
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
    sitButton.textContent = "正在为你留座…";
  }
  if (backButton) backButton.disabled = true;
  if (footerTitle) footerTitle.textContent = fromSeatId ? `正在换到 ${targetSeatId} 号座位` : `正在确认 ${targetSeatId} 号座位`;
  if (footerNote) footerNote.textContent = "座位确认后，你的小角色会坐下并开始轻微专注动画";

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
    await api(`/api/sessions/${identity.sessionId}/occupy`, {
      method: "POST",
      body: JSON.stringify({ roomId: currentRoomApiId(), seatId: targetSeatId }),
    });
    state.currentSeatId = targetSeatId;
    state.switchingFromSeatId = null;
    await syncCafeState({ refreshMarkers: false });
    syncCafeSceneObjectLayers();
    syncCafeSeatActorLayers();
    // A genuinely new sit-down starts a fresh focus clock. Switching seats keeps
    // the current session continuous, but stale values from an earlier visit must
    // never leak into a newly occupied seat.
    if (!fromSeatId) {
      stopTicker();
      state.durationSeconds = Math.max(0, state.timerMode * 60);
      state.remainingSeconds = state.durationSeconds;
      state.elapsedSeconds = 0;
      state.sessionStartedAt = Date.now();
      state.sessionResult = null;
      lastTick = null;
      localStorage.removeItem(STORAGE_KEYS.activeSession);
    }
    startFocusFromSeat();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      await new Promise((resolve) => window.setTimeout(resolve, CAFE_STATE_LAYER_SETTLE_MS));
    }
    state.isTransitioning = false;
    beginImmersiveAutoEnter();
    renderRoom();
    return;
  } catch (error) {
    state.isTransitioning = false;
    clearImmersiveAutoEnter();
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
  const scene = scenes[state.sceneId];
  const room = scene.rooms.find((item) => item.id === state.roomId) || scene.rooms[0];
  const focusImage = selectedFocusImage(scene);
  app.innerHTML = `
    <section class="view focus">
      <img class="scene-image" data-focus-scene-image src="${focusImage}" alt="坐在${room.name}${state.selectedSeat + 1}号座位看到的沉浸式工作视角" />
      ${topbar({ back: "finish-session", showPresence: false })}
      ${renderSessionHud("focus")}
      <div class="immersive-seat-caption">${scene.name} · ${room.name} · ${state.selectedSeat + 1} 号座位</div>
    </section>`;
  persistActiveSession();
  if (state.isRunning) startTicker();
  if (scene.id === "cafe") {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = window.setInterval(sendHeartbeat, 15000);
    sendHeartbeat();
  }
}

function selectedFocusImage(scene = scenes[state.sceneId]) {
  const choices = {
    window: `${ASSET_BASE}20261013-cafe-window-real-focus-view.png`,
    bar: `${ASSET_BASE}20261013-cafe-bar-real-focus-view.png`,
    sofa: `${ASSET_BASE}20261013-cafe-sofa-real-focus-view.png`,
  };
  if (state.focusImageChoice !== "seat" && choices[state.focusImageChoice]) return choices[state.focusImageChoice];
  return scene.focusViews?.[state.selectedSeat + 1] || scene.image;
}

function renderSessionHud(context = "focus") {
  const companionCount = Math.max(0, cafeVisibleLeases().length - (state.currentSeatId ? 1 : 0));
  const timerLabel = state.timerMode === -1 ? "自由专注" : state.timerMode === 0 ? "正计时" : `${state.timerMode} 分钟倒计时`;
  return `
    <aside class="session-hud session-hud-${context} ${state.sessionPanelOpen ? "is-open" : ""}" aria-label="专注计时与设置">
      <button class="session-clock-button" type="button" data-action="toggle-session-panel" aria-expanded="${state.sessionPanelOpen}">
        <strong data-session-clock>${formatTime()}</strong>
        <small>${timerLabel}</small>
      </button>
      ${state.sessionPanelOpen ? `
        <section class="session-control-panel">
          <header><div><strong>专注设置</strong><small>计时已经开始，修改后立即生效</small></div><button type="button" data-action="toggle-session-panel" aria-label="关闭设置">×</button></header>
          <div class="session-setting-group">
            <span>计时方式</span>
            <div class="session-choice-row">
              ${modeButton(25, "25 分钟倒计时")}
              ${modeButton(50, "50 分钟倒计时")}
              ${modeButton(0, "正计时")}
              ${modeButton(-1, "自由专注")}
            </div>
          </div>
          <div class="session-setting-group">
            <span>沉浸画面</span>
            <div class="session-choice-row compact">
              ${focusViewButton("seat", "当前座位")}
              ${focusViewButton("window", "雨窗")}
              ${focusViewButton("bar", "吧台")}
              ${focusViewButton("sofa", "沙发")}
            </div>
          </div>
          <div class="session-setting-group">
            <span>声音</span>
            <div class="sound-controls" aria-label="声音设置">
              ${soundButton("ambient", "♫", "环境音")}
              ${soundButton("presence", "◌", "陪伴感")}
              ${soundButton("white", "≈", "柔和底噪")}
              ${soundButton("music", "♪", "背景音乐")}
            </div>
          </div>
          <p class="session-companions"><i></i><span>${companionCount} 位真实岛民正在陪伴</span></p>
          <div class="session-panel-actions">
            <button type="button" data-action="toggle-timer">${state.isRunning ? "暂停" : "继续"}</button>
            ${state.sceneId === "cafe" ? '<button type="button" data-action="switch-seat">换座</button>' : ""}
            <button type="button" class="danger" data-action="finish-session">结束</button>
          </div>
        </section>` : ""}
    </aside>`;
}

function modeButton(value, label) {
  return `<button class="mode-button ${state.timerMode === value ? "active" : ""}" data-mode="${value}">${label}</button>`;
}

function focusViewButton(value, label) {
  return `<button class="focus-view-button ${state.focusImageChoice === value ? "active" : ""}" data-focus-view="${value}">${label}</button>`;
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
  if (state.timerMode === -1) return "专注中";
  const total = state.timerMode === 0 ? state.elapsedSeconds : state.remainingSeconds;
  const minutes = Math.floor(total / 60);
  const seconds = Math.floor(total % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function setTimerMode(mode) {
  if (state.isRunning) syncTimerFromClock();
  state.timerMode = mode;
  state.durationSeconds = Math.max(0, mode * 60);
  state.remainingSeconds = state.durationSeconds;
  state.elapsedSeconds = 0;
  state.sessionStartedAt = Date.now();
  state.sessionResult = null;
  lastTick = Date.now();
  if (state.view === "room") renderRoom();
  else renderFocus();
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
  document.querySelectorAll('[data-action="toggle-timer"]').forEach((button) => {
    button.textContent = state.isRunning ? "暂停" : "继续";
  });
}

function startTicker() {
  if (ticker) return;
  lastTick = lastTick || Date.now();
  ticker = window.setInterval(() => {
    if (syncTimerFromClock()) return;
    document.querySelectorAll("[data-session-clock]").forEach((timerElement) => {
      timerElement.textContent = formatTime();
    });
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
  if (state.view !== "focus" && !state.awaitingImmersiveFocus) stopTicker();
}

async function finishSession(forcedStatus = null) {
  if (state.isRunning && !forcedStatus && syncTimerFromClock()) return;
  state.isRunning = false;
  state.sessionPanelOpen = false;
  clearImmersiveAutoEnter();
  stopTicker();
  stopAudio();
  const status = forcedStatus || (state.elapsedSeconds === 0 ? "not_started" : state.timerMode <= 0 ? "free_completed" : "ended_early");
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
    const scene = saved ? scenes[saved.sceneId] : null;
    if (!saved || !scene || saved.selectedSeat === null || saved.selectedSeat >= scene.seats.length) return;
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
  clearImmersiveAutoEnter();
  state.timerMode = keepMode ? state.timerMode : 25;
  state.durationSeconds = Math.max(0, state.timerMode * 60);
  state.remainingSeconds = state.durationSeconds;
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

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    textarea.remove();
    return success;
  }
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
    state.libraryCurrentSeatId = null;
    state.sceneId = sceneButton.dataset.scene;
    state.roomId = null;
    state.roomPreviewId = null;
    state.view = "rooms";
    render();
    return;
  }

  const roomPreviewButton = event.target.closest("[data-preview-room]");
  if (roomPreviewButton) {
    state.roomPreviewId = roomPreviewButton.dataset.previewRoom;
    renderRooms();
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

  const seatMarkerElement = event.target.closest("[data-cafe-seat-marker-object]");
  if (seatMarkerElement && state.cafeDebugMode.enabled) {
    state.cafeSceneEditor.activeObjectId = seatMarkerElement.dataset.cafeSeatMarkerObject;
    renderRoom();
    return;
  }

  const librarySeatMarkerElement = event.target.closest("[data-library-seat-marker-object]");
  if (librarySeatMarkerElement && state.libraryDebugMode.enabled) {
    state.librarySceneEditor.activeObjectId = librarySeatMarkerElement.dataset.librarySeatMarkerObject;
    renderRoom();
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

  const focusViewButtonElement = event.target.closest("[data-focus-view]");
  if (focusViewButtonElement) {
    state.focusImageChoice = focusViewButtonElement.dataset.focusView;
    if (state.view === "focus") renderFocus();
    else renderRoom();
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

  const sceneObjectElement = event.target.closest("[data-cafe-scene-object]");
  if (sceneObjectElement && state.cafeDebugMode.enabled) {
    state.cafeSceneEditor.activeObjectId = sceneObjectElement.dataset.cafeSceneObject;
    renderRoom();
    return;
  }

  const libraryObjectElement = event.target.closest("[data-library-scene-object]");
  if (libraryObjectElement && state.libraryDebugMode.enabled) {
    state.librarySceneEditor.activeObjectId = libraryObjectElement.dataset.librarySceneObject;
    renderRoom();
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
    state.roomPreviewId = null;
    render();
  }
  if (action === "back-rooms") {
    state.isTransitioning = false;
    clearImmersiveAutoEnter();
    releaseSeat();
    stopRoomPresence();
    state.view = "rooms";
    state.selectedSeat = null;
    state.libraryCurrentSeatId = null;
    render();
  }
  if (action === "sit-down" && state.selectedSeat !== null) {
    occupySelectedSeat();
  }
  if (action === "enter-preview-room") {
    state.roomId = state.roomPreviewId || scenes[state.sceneId].rooms[0].id;
    state.selectedSeat = null;
    state.view = "room";
    render();
  }
  if (action === "enter-immersive-focus") enterImmersiveFocus();
  if (action === "enter-library-focus") {
    state.view = "focus";
    render();
  }
  if (action === "toggle-session-panel") {
    state.sessionPanelOpen = !state.sessionPanelOpen;
    if (state.view === "focus") renderFocus();
    else renderRoom();
  }
  if (action === "toggle-timer") toggleTimer();
  if (action === "switch-seat") {
    syncTimerFromClock();
    state.isRunning = false;
    state.sessionPanelOpen = false;
    clearImmersiveAutoEnter();
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
  if (action === "toggle-cafe-debug-mode") {
    state.cafeDebugMode.enabled = !state.cafeDebugMode.enabled;
    state.cafeSpriteTuning.enabled = state.cafeDebugMode.enabled;
    if (state.cafeDebugMode.enabled) clearImmersiveAutoEnter();
    renderRoom();
  }
  if (action === "toggle-library-debug-mode") {
    state.libraryDebugMode.enabled = !state.libraryDebugMode.enabled;
    renderRoom();
  }
  if (action === "publish-cafe-scene-layout") {
    publishCafeSceneLayout();
    showToast("当前位置已固定，普通模式将使用这套布局");
  }
  if (action === "select-cafe-scene-object") {
    const objectId = actionElement.dataset.cafeObjectOption;
    if (cafeEditorObjectById(objectId)) {
      state.cafeSceneEditor.activeObjectId = objectId;
      renderRoom();
    }
  }
  if (action === "nudge-cafe-scene-object") {
    const objectId = state.cafeSceneEditor.activeObjectId;
    const field = actionElement.dataset.objectField;
    const delta = Number(actionElement.dataset.objectDelta || 0);
    const current = cafeSceneObjectConfig(objectId);
    updateCafeSceneObject(objectId, { [field]: Number(current[field]) + delta });
  }
  if (action === "flip-cafe-scene-object") {
    const objectId = state.cafeSceneEditor.activeObjectId;
    const current = cafeSceneObjectConfig(objectId);
    updateCafeSceneObject(objectId, { flipX: !current.flipX });
  }
  if (action === "toggle-cafe-scene-object-visible") {
    const objectId = state.cafeSceneEditor.activeObjectId;
    const current = cafeSceneObjectConfig(objectId);
    updateCafeSceneObject(objectId, { visible: !current.visible });
  }
  if (action === "duplicate-cafe-scene-object") {
    const copyId = duplicateCafeSceneObject(state.cafeSceneEditor.activeObjectId);
    if (copyId) {
      renderRoom();
      showToast("已复制当前物件，可以直接拖动副本");
    }
  }
  if (action === "delete-cafe-scene-object") {
    if (deleteCafeSceneObject(state.cafeSceneEditor.activeObjectId)) {
      renderRoom();
      showToast("已删除当前物件");
    }
  }
  if (action === "reset-cafe-scene-object") {
    resetCafeSceneObject(state.cafeSceneEditor.activeObjectId);
    showToast("已恢复当前物件默认参数");
  }
  if (action === "release-cafe-seat-now") {
    releaseSeat({ force: true }).then(() => {
      state.selectedSeat = null;
      syncCafeState();
      renderRoom();
      showToast("已释放当前浏览器的座位占用");
    });
  }
  if (action === "copy-cafe-scene-objects") {
    const json = JSON.stringify(allCafeSceneObjectConfigs(), null, 2);
    copyTextToClipboard(json).then((success) => {
      showToast(success ? "全部场景物件 JSON 已复制" : "复制失败，请手动记录参数");
    });
  }
  if (action === "publish-library-scene-layout") {
    publishLibrarySceneLayout();
    showToast("学院区当前位置已固定，普通模式将使用这套布局");
  }
  if (action === "select-library-scene-object") {
    const objectId = actionElement.dataset.libraryObjectOption;
    if (libraryEditorObjectById(objectId)) {
      state.librarySceneEditor.activeObjectId = objectId;
      renderRoom();
    }
  }
  if (action === "nudge-library-scene-object") {
    const objectId = state.librarySceneEditor.activeObjectId;
    const field = actionElement.dataset.objectField;
    const delta = Number(actionElement.dataset.objectDelta || 0);
    const current = librarySceneObjectConfig(objectId);
    updateLibrarySceneObject(objectId, { [field]: Number(current[field]) + delta });
  }
  if (action === "flip-library-scene-object") {
    const objectId = state.librarySceneEditor.activeObjectId;
    const current = librarySceneObjectConfig(objectId);
    updateLibrarySceneObject(objectId, { flipX: !current.flipX });
  }
  if (action === "toggle-library-scene-object-visible") {
    const objectId = state.librarySceneEditor.activeObjectId;
    const current = librarySceneObjectConfig(objectId);
    updateLibrarySceneObject(objectId, { visible: !current.visible });
  }
  if (action === "duplicate-library-scene-object") {
    if (duplicateLibrarySceneObject(state.librarySceneEditor.activeObjectId)) {
      renderRoom();
      showToast("已复制当前学院区物件");
    }
  }
  if (action === "delete-library-scene-object") {
    if (deleteLibrarySceneObject(state.librarySceneEditor.activeObjectId)) {
      renderRoom();
      showToast("已删除当前学院区物件");
    }
  }
  if (action === "reset-library-scene-object") {
    resetLibrarySceneObject(state.librarySceneEditor.activeObjectId);
    showToast("已恢复当前物件默认参数");
  }
  if (action === "copy-library-scene-objects") {
    copyTextToClipboard(JSON.stringify(allLibrarySceneObjectConfigs(), null, 2)).then((success) => {
      showToast(success ? "学院区全部物件 JSON 已复制" : "复制失败，请手动记录参数");
    });
  }
  if (action === "nudge-cafe-sprite") {
    const seatId = state.cafeSpriteTuning.activeSeatId;
    const field = actionElement.dataset.tuneField;
    const delta = Number(actionElement.dataset.tuneDelta || 0);
    const current = cafeSpriteTuningForSeat(seatId);
    updateCafeSpriteTuning(seatId, { [field]: Number(current[field]) + delta });
  }
  if (action === "flip-cafe-sprite") {
    const seatId = state.cafeSpriteTuning.activeSeatId;
    const current = cafeSpriteTuningForSeat(seatId);
    updateCafeSpriteTuning(seatId, { flipX: !current.flipX });
  }
  if (action === "reset-cafe-sprite-tuning") {
    resetCafeSpriteTuning(state.cafeSpriteTuning.activeSeatId);
    showToast("已恢复默认角色参数");
  }
  if (action === "copy-cafe-sprite-tuning") {
    const seatId = state.cafeSpriteTuning.activeSeatId;
    const json = JSON.stringify({ [seatId]: cafeSpriteTuningForSeat(seatId) }, null, 2);
    copyTextToClipboard(json).then((success) => {
      showToast(success ? "角色参数 JSON 已复制" : "复制失败，请手动记录参数");
    });
  }
  if (action === "profile") showToast("个人中心将用于设置、偏好与语言切换，后续开放");
  if (action === "locked-room") showToast("首期先把临窗雨声做完整，另外两个房间会沿用同一套引擎");
  if (action === "locked") showToast("这个区域还在建设中，内测后会根据投票决定优先开放顺序");
});

document.addEventListener("input", (event) => {
  const libraryObjectInput = event.target.closest("[data-library-object-input]");
  if (libraryObjectInput) {
    const field = libraryObjectInput.dataset.libraryObjectInput;
    updateLibrarySceneObject(state.librarySceneEditor.activeObjectId, { [field]: Number(libraryObjectInput.value) });
    return;
  }
  const objectInput = event.target.closest("[data-object-input]");
  if (objectInput) {
    const field = objectInput.dataset.objectInput;
    updateCafeSceneObject(state.cafeSceneEditor.activeObjectId, { [field]: Number(objectInput.value) });
    return;
  }
  const input = event.target.closest("[data-tune-input]");
  if (!input) return;
  const field = input.dataset.tuneInput;
  updateCafeSpriteTuning(state.cafeSpriteTuning.activeSeatId, { [field]: Number(input.value) });
});

document.addEventListener("pointerdown", (event) => {
  const cafeEditorActive = state.sceneId === "cafe" && state.cafeDebugMode.enabled;
  const libraryEditorActive = state.sceneId === "library" && state.libraryDebugMode.enabled;
  if ((!cafeEditorActive && !libraryEditorActive) || state.view !== "room") return;
  if (event.button !== undefined && event.button !== 0) return;
  const objectElement = event.target.closest("[data-cafe-scene-object], [data-cafe-seat-marker-object], [data-library-scene-object], [data-library-seat-marker-object]");
  if (!objectElement) return;
  const stageElement = objectElement.closest(".seat-layer");
  if (!stageElement) return;
  const objectId = objectElement.dataset.cafeSceneObject || objectElement.dataset.cafeSeatMarkerObject || objectElement.dataset.librarySceneObject || objectElement.dataset.librarySeatMarkerObject;
  const config = libraryEditorActive ? librarySceneObjectConfig(objectId) : cafeSceneObjectConfig(objectId);
  const pointer = cafeScenePointerPosition(event, stageElement);
  if (libraryEditorActive) {
    state.librarySceneEditor.activeObjectId = objectId;
    applyLibrarySceneObjectToDom(objectId);
  } else {
    state.cafeSceneEditor.activeObjectId = objectId;
    applyCafeSceneObjectToDom(objectId);
  }
  cafeSceneObjectDrag = {
    objectId,
    sceneId: state.sceneId,
    pointerId: event.pointerId,
    offsetLeft: pointer.left - config.left,
    offsetTop: pointer.top - config.top,
    element: objectElement,
  };
  objectElement.classList.add("is-dragging");
  document.body.classList.add("is-cafe-object-dragging");
  objectElement.setPointerCapture?.(event.pointerId);
  event.preventDefault();
});

document.addEventListener("pointermove", (event) => {
  if (!cafeSceneObjectDrag) return;
  if (event.pointerId !== cafeSceneObjectDrag.pointerId) return;
  const stageElement = document.querySelector(".room.is-debug-layout .seat-layer");
  if (!stageElement) return;
  const pointer = cafeScenePointerPosition(event, stageElement);
  const updateObject = cafeSceneObjectDrag.sceneId === "library" ? updateLibrarySceneObject : updateCafeSceneObject;
  updateObject(cafeSceneObjectDrag.objectId, {
    left: clampScenePercent(pointer.left - cafeSceneObjectDrag.offsetLeft),
    top: clampScenePercent(pointer.top - cafeSceneObjectDrag.offsetTop),
  });
  event.preventDefault();
});

function endCafeSceneObjectDrag(event) {
  if (!cafeSceneObjectDrag) return;
  if (event?.pointerId !== undefined && event.pointerId !== cafeSceneObjectDrag.pointerId) return;
  cafeSceneObjectDrag.element?.classList.remove("is-dragging");
  document.body.classList.remove("is-cafe-object-dragging");
  cafeSceneObjectDrag = null;
}

document.addEventListener("pointerup", endCafeSceneObjectDrag);
document.addEventListener("pointercancel", endCafeSceneObjectDrag);

document.addEventListener("keydown", (event) => {
  if (state.view !== "room" || !["cafe", "library"].includes(state.sceneId)) return;
  const libraryEditorActive = state.sceneId === "library" && state.libraryDebugMode.enabled;
  if (!libraryEditorActive && !state.cafeSpriteTuning.enabled && !state.cafeDebugMode.enabled) return;
  const deltas = {
    ArrowLeft: { left: -1 },
    ArrowRight: { left: 1 },
    ArrowUp: { top: -1 },
    ArrowDown: { top: 1 },
  };
  const direction = deltas[event.key];
  if (!direction) return;
  const activeTag = document.activeElement?.tagName;
  if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") return;
  event.preventDefault();
  const step = event.shiftKey ? 1 : 0.2;
  if (libraryEditorActive) {
    const objectId = state.librarySceneEditor.activeObjectId;
    const current = librarySceneObjectConfig(objectId);
    updateLibrarySceneObject(objectId, {
      left: current.left + (direction.left || 0) * step,
      top: current.top + (direction.top || 0) * step,
    });
    return;
  }
  if (state.cafeDebugMode.enabled) {
    const objectId = state.cafeSceneEditor.activeObjectId;
    const current = cafeSceneObjectConfig(objectId);
    updateCafeSceneObject(objectId, {
      left: current.left + (direction.left || 0) * step,
      top: current.top + (direction.top || 0) * step,
    });
    return;
  }
  const seatId = state.cafeSpriteTuning.activeSeatId;
  const current = cafeSpriteTuningForSeat(seatId);
  updateCafeSpriteTuning(seatId, {
    left: current.left + (direction.left || 0) * step,
    top: current.top + (direction.top || 0) * step,
  });
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
