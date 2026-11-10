const ASSET_BASE = "./assets/";
const PUBLIC_CONFIG = window.__FOCUS_ISLAND_CONFIG__ || {};
const AUDIO_BASE = PUBLIC_CONFIG.audioBaseUrl
  ? `${String(PUBLIC_CONFIG.audioBaseUrl).replace(/\/$/, "")}/`
  : `${ASSET_BASE}audio/`;
// 填入正式问卷地址后，页面底部的反馈入口会自动启用。
const FEEDBACK_FORM_URL = "";
const CAFE_IMMERSIVE_AUTO_ENTER_MS = 5000;
const CAFE_IMMERSIVE_CROSSFADE_MS = 1400;
const CAFE_ROOM_3D_READY_TIMEOUT_MS = 12000;
const CAFE_ROOM_RENDERER_QUERY_KEY = "roomRenderer";
const CAFE_ROOM_RENDERER_STORAGE_KEY = "focusIslandInternalCafeRoomRendererV2";
const CAFE_ROOM_RENDERER_STATIC = "static";
const CAFE_ROOM_RENDERER_GODOT_3D = "godot3d";
const CAFE_ROOM_3D_SRC_QUERY_KEY = "godot3dSrc";
const CAFE_ROOM_3D_DEFAULT_SRC = "/godot-room-3d/index.html";
const ROOM_3D_CONTRACT_VERSION = 1;
const ROOM_3D_SERVICE_SEAT_ID = 3;
const ROOM_3D_RESPONSE_STORAGE_KEY = "focusIslandRoom3DResponseV1";
const ROOM_3D_LEASE_HEARTBEAT_MS = 5000;
const ROOM_3D_EVENT_TYPES = new Set([
  "seat_intent", "seat_reservation_granted", "seat_reservation_denied",
  "seat_sequence_started", "seat_contact_completed", "seat_occupation_confirmed",
  "seat_occupation_failed", "activity_setup_completed", "focus_autostart_requested",
  "focus_autostart_confirmed", "focus_autostart_failed", "seat_sequence_failed",
  "seat_release_requested",
]);
const DEFAULT_REST_MINUTES = 5;
const REST_PRESET_MINUTES = [5, 10, 15];
const scenes = {
  cafe: {
    id: "cafe",
    name: "四时咖啡馆",
    shortName: "咖啡厅",
    islandLabel: "四时咖啡厅",
    icon: "city",
    online: 0,
    image: `${ASSET_BASE}20261028-cafe-room-static-seat-master.webp`,
    debugImage: `${ASSET_BASE}20261015-cafe-room-empty-stage-wide.png`,
    focusViews: Object.fromEntries([1, 2, 3, 4, 5, 6].map((seatId) => [seatId, `${ASSET_BASE}20261013-cafe-window-real-focus-view.webp`])),
    description: "在六座咖啡馆里选一张喜欢的位置，和其他人安静地开始今天的专注。",
    sounds: ["咖啡馆底噪", "窗外环境声", "偶尔杯碟声"],
    filter: 620,
    rooms: [
      { id: "cafe-01", name: "四时咖啡馆", occupied: 0, image: `${ASSET_BASE}20261028-cafe-room-static-seat-master.webp` },
      { id: "cafe-02", name: "四时咖啡馆", occupied: 0, image: `${ASSET_BASE}20261028-cafe-room-static-seat-master.webp` },
      { id: "cafe-03", name: "四时咖啡馆", occupied: 0, image: `${ASSET_BASE}20261028-cafe-room-static-seat-master.webp` },
    ],
    seats: [
      [28.11, 52.0723, false], [39.1746, 47.5027, false],
      [67.5837, 50.6908, false], [83.433, 56.8544, false],
      [15.5502, 75.983, false], [66.0885, 83.9532, false],
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

// The only production room-layout configuration used by the fast MVP.
// Coordinates are percentages of the calibrated 1672 × 941 sunny cafe canvas.
const staticSeatSlots = [
  { seat_id: 1, avatar_anchor: [28.5, 33], hit_area: [28.11, 52.0723], occupant_anchor: [23.2057, 19.6599, 9.5694, 34.0064], label_anchor: [28, 19.5], desk_zone_id: "bar", occupied_asset: `${ASSET_BASE}20261028-cafe-seat-01-occupied.png`, flip: false },
  { seat_id: 2, avatar_anchor: [39.3, 30], hit_area: [39.1746, 47.5027], occupant_anchor: [32.3565, 17.6408, 10.1675, 31.1371], label_anchor: [37.44, 17.5], desk_zone_id: "bar", occupied_asset: `${ASSET_BASE}20261028-cafe-seat-02-occupied.png`, flip: false },
  { seat_id: 3, avatar_anchor: [68.5, 35], hit_area: [59.7, 50.6908], occupant_anchor: [62.9187, 22.848, 12.3804, 27.3114], label_anchor: [69.11, 22.7], desk_zone_id: "window", occupied_asset: `${ASSET_BASE}20261028-cafe-seat-03-occupied.png`, flip: false },
  { seat_id: 4, avatar_anchor: [84, 43], hit_area: [83.433, 56.8544], occupant_anchor: [78.0502, 28.6929, 11.4234, 31.881], label_anchor: [83.76, 28.5], desk_zone_id: "window", occupied_asset: `${ASSET_BASE}20261028-cafe-seat-04-occupied.png`, flip: false },
  { seat_id: 5, avatar_anchor: [16, 53], hit_area: [15.5502, 75.983], occupant_anchor: [8.6722, 44.102, 16.6268, 32.8374], label_anchor: [16.99, 44], desk_zone_id: "lounge", occupied_asset: `${ASSET_BASE}20261028-cafe-seat-05-occupied.png`, flip: false },
  { seat_id: 6, avatar_anchor: [67, 63], hit_area: [66.0885, 83.9532], occupant_anchor: [59.2105, 49.3092, 15.5502, 35.0691], label_anchor: [66.99, 49.2], desk_zone_id: "lounge", occupied_asset: `${ASSET_BASE}20261028-cafe-seat-06-occupied.png`, flip: false },
];

const islandImage = `${ASSET_BASE}20261012-focus-island-map-detailed.webp`;
const STORAGE_KEYS = {
  activeSession: "focusIslandActiveSessionV1",
  history: "focusIslandHistoryV1",
  pendingMergeToken: "focusIslandPendingMergeTokenV1",
  guestIdentity: "focusIslandGuestIdentityV2",
  preferences: "focusIslandPreferencesV1",
  cafeSpriteTuning: "focusIslandCafeSpriteTuningV2",
  // V5 resets stale editor drafts that were created before the scene layout
  // was fixed. Older drafts can otherwise override the restored coordinates.
  cafeSceneEditor: "focusIslandCafeSceneEditorV6",
  cafeScenePublished: "focusIslandCafeScenePublishedV1",
  staticSeatMarkers: "focusIslandStaticSeatMarkersV1",
  librarySceneEditor: "focusIslandLibrarySceneEditorV1",
  libraryScenePublished: "focusIslandLibraryScenePublishedV1",
};

const FOCUS_MUSIC_TRACKS = {
  "rainy-notes": { name: "雨夜手札", src: `${AUDIO_BASE}20261028-focus-music-rainy-notes.mp3` },
  "warm-reverie": { name: "暖灯漫想", src: `${AUDIO_BASE}20261028-focus-music-warm-reverie.mp3` },
  "moonlit-walk": { name: "月光缓行", src: `${AUDIO_BASE}20261028-focus-music-moonlit-walk.mp3` },
  "island-breeze": { name: "岛屿长风", src: `${AUDIO_BASE}20261028-focus-music-island-breeze.mp3` },
};
const MUSIC_VOLUME_BOOST = 1.3;
const CAFE_AMBIENT_GAIN = 0.09;
const SOUND_OPTION_ART = {
  mute: `${ASSET_BASE}20261013-cafe-window-real-focus-view.webp`,
  ambient: `${ASSET_BASE}20261013-cafe-bar-real-focus-view.webp`,
  white: `${ASSET_BASE}20261013-cafe-window-real-focus-view.webp`,
  "rainy-notes": `${ASSET_BASE}20261013-cafe-window-real-focus-view.webp`,
  "warm-reverie": `${ASSET_BASE}20261013-cafe-bar-real-focus-view.webp`,
  "moonlit-walk": `${ASSET_BASE}20261015-晴朗月夜学习场景.png`,
  "island-breeze": `${ASSET_BASE}20261013-cafe-sofa-real-focus-view.webp`,
};
const AVATAR_OPTIONS = [
  { id: 0, name: "暖光旅人", image: `${ASSET_BASE}20261028-profile-avatar-warm-light.png` },
  { id: 1, name: "静谧旅人", image: `${ASSET_BASE}20261028-profile-avatar-quiet.png` },
  { id: 2, name: "晨雾旅人", image: `${ASSET_BASE}20261028-profile-avatar-morning-mist.png` },
  { id: 3, name: "月夜旅人", image: `${ASSET_BASE}20261028-profile-avatar-moonlit.png` },
];

let preferences = loadPreferences();

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
  view: PUBLIC_CONFIG.minimalMvp ? "island" : new URLSearchParams(window.location.search).has("welcome") ? "welcome" : "island",
  sceneId: null,
  roomId: null,
  localRoom: false,
  isAllocatingRoom: false,
  roomPreviewId: null,
  selectedSeat: null,
  timerMode: preferences.defaultTimerMode,
  durationSeconds: Math.max(0, preferences.defaultTimerMode * 60),
  remainingSeconds: Math.max(0, preferences.defaultTimerMode * 60),
  elapsedSeconds: 0,
  isRunning: false,
  sessionPhase: "focus",
  restDurationSeconds: DEFAULT_REST_MINUTES * 60,
  restRemainingSeconds: DEFAULT_REST_MINUTES * 60,
  restStartedAt: null,
  restCustomOpen: false,
  nextFocusMode: 25,
  isTransitioning: false,
  sessionStartedAt: null,
  sessionResult: null,
  companions: 6,
  roomPresence: { leases: [], serverNow: Date.now() },
  localNpcRoster: [],
  currentSeatId: null,
  switchingFromSeatId: null,
  awaitingImmersiveFocus: false,
  immersiveAutoEnterAt: null,
  sessionPanelOpen: false,
  focusImageChoice: preferences.rememberLastFocusView ? preferences.lastFocusView : "window",
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
  staticSeatCalibration: {
    enabled: false,
    positions: loadStaticSeatMarkerPositions(),
  },
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
  accessStatus: null,
  isDeveloper: false,
  billingPlans: null,
  pendingLifetimeInvite: false,
  accessOverlay: null,
  authMode: "sign-up",
  authEmail: "",
  authError: "",
  authPending: false,
  authContinuation: null,
  cloudFocusClientId: null,
  focusRecovery: null,
  developerDiagnostics: null,
  developerDiagnosticsPending: false,
  developerDiagnosticsError: "",
  developerEndSession: null,
  developerEndingSession: false,
  sounds: { ...preferences.sounds },
  musicTrack: preferences.musicTrack,
  soundVolumes: { ...preferences.soundVolumes },
  personalCenter: {
    open: false,
    tab: "overview",
    monthKey: shanghaiDateKey(Date.now()).slice(0, 7),
    selectedDate: shanghaiDateKey(Date.now()),
    filters: { scene: "all", status: "all", mode: "all" },
    confirmAction: null,
  },
};

let ticker = null;
let lastTick = null;
let lastPersistAt = 0;
let audioContext = null;
let noiseSource = null;
let noiseGain = null;
let noiseFilter = null;
let whiteNoiseSource = null;
let whiteNoiseGain = null;
let musicAudio = null;
let loadedMusicTrack = null;
let roomSyncTimer = null;
let heartbeatTimer = null;
let room3DLeaseHeartbeatTimer = null;
let room3DInteraction = null;
let immersiveAutoTimer = null;
let hudIdleTimer = null;
let godotRoomReadyTimer = null;
let roomSyncInFlight = false;
let cafeSceneObjectDrag = null;
let staticSeatMarkerDrag = null;
let onlineIdentityPromise = null;
let onlineUserId = null;
let seatRecoveryPromise = null;
let accessStatusPromise = null;
let accessStatusFetchedAt = 0;
let focusAuthorizationPromise = null;
let finishSessionPromise = null;
let pendingFocusUpdatePromise = null;

let identity = getOrCreateIdentity();

const app = document.querySelector("#app");

function defaultPreferences() {
  return {
    schemaVersion: 1,
    defaultTimerMode: 25,
    rememberLastSound: true,
    rememberLastFocusView: true,
    lastFocusView: "window",
    sounds: { ambient: true, white: false, music: false },
    musicTrack: "rainy-notes",
    soundVolumes: { ambient: 55, white: 30, music: 24 },
    language: "en",
    motionEffects: true,
    reduceMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false,
    hudAutoHide: true,
    completionSound: true,
    desktopNotifications: false,
  };
}

function clampVolume(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, Math.round(number))) : fallback;
}

function loadPreferences() {
  const defaults = defaultPreferences();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.preferences) || "null");
    if (!saved || saved.schemaVersion !== 1) return defaults;
    const defaultTimerMode = [0, 25, 50].includes(Number(saved.defaultTimerMode)) ? Number(saved.defaultTimerMode) : defaults.defaultTimerMode;
    const musicTrack = FOCUS_MUSIC_TRACKS[saved.musicTrack] ? saved.musicTrack : defaults.musicTrack;
    return {
      ...defaults,
      ...saved,
      schemaVersion: 1,
      defaultTimerMode,
      musicTrack,
      sounds: { ...defaults.sounds, ...(saved.sounds || {}) },
      soundVolumes: {
        ambient: clampVolume(saved.soundVolumes?.ambient, defaults.soundVolumes.ambient),
        white: clampVolume(saved.soundVolumes?.white, defaults.soundVolumes.white),
        music: clampVolume(saved.soundVolumes?.music, defaults.soundVolumes.music),
      },
      language: saved.language === "en" ? "en" : "zh-CN",
    };
  } catch (_) {
    return defaults;
  }
}

function savePreferences() {
  localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferences));
  document.body.classList.toggle("reduce-motion", Boolean(preferences.reduceMotion));
  document.body.classList.toggle("motion-effects-off", !preferences.motionEffects);
}

function saveSoundPreferencesFromState() {
  preferences.sounds = { ...state.sounds };
  preferences.musicTrack = state.musicTrack;
  preferences.soundVolumes = { ...state.soundVolumes };
  savePreferences();
}

function applyPreferencesToState({ includeTimer = false } = {}) {
  state.sounds = { ...preferences.sounds };
  state.musicTrack = preferences.musicTrack;
  state.soundVolumes = { ...preferences.soundVolumes };
  if (includeTimer) {
    state.timerMode = preferences.defaultTimerMode;
    state.durationSeconds = Math.max(0, state.timerMode * 60);
    state.remainingSeconds = state.durationSeconds;
  }
  if (preferences.rememberLastFocusView && preferences.lastFocusView) state.focusImageChoice = preferences.lastFocusView;
  document.body.classList.toggle("reduce-motion", Boolean(preferences.reduceMotion));
  if (state.isRunning) updateAudio();
}

function persistIdentity() {
  localStorage.setItem(STORAGE_KEYS.guestIdentity, JSON.stringify(identity));
  const ownLease = state.roomPresence.leases.find((lease) => lease.sessionId === identity.sessionId);
  if (ownLease) {
    ownLease.displayName = identity.displayName;
    ownLease.avatarSkin = identity.avatarSkin;
    ownLease.avatarUrl = identity.avatarUrl || null;
  }
}

function shanghaiParts(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return parts;
}

function shanghaiDateKey(value) {
  const parts = shanghaiParts(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
}

function shiftDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

function dateKeyWeekday(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function formatClockTime(value) {
  const parts = shanghaiParts(value);
  return parts ? `${parts.hour}:${parts.minute}` : "--:--";
}

function formatDuration(seconds) {
  const totalMinutes = Math.floor(Math.max(0, Number(seconds) || 0) / 60);
  if (totalMinutes < 60) return `${totalMinutes} 分钟`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`;
}

function getOrCreateIdentity() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.guestIdentity) || "null");
    if (saved?.guestId && saved?.sessionId && Number.isInteger(saved?.avatarSkin)) return saved;
  } catch (_) { /* create a new local identity */ }
  const englishIdentity = window.FocusI18n?.getLanguage() === "en" || (!window.FocusI18n && !/^zh\b/i.test(window.navigator.language || ""));
  const adjectives = englishIdentity
    ? ["Quiet", "Sunlit", "Unhurried", "Window-side", "Rainy", "Focused", "Gentle", "Calm"]
    : ["安静的", "晨光里的", "慢慢来的", "靠窗的", "雨声里的", "专心的", "温柔的", "从容的"];
  const nouns = englishIdentity
    ? ["Otter", "Robin", "Deer", "Traveler", "Squirrel", "Cloud", "Lighthouse", "Oak"]
    : ["海獭", "知更鸟", "小鹿", "旅人", "松鼠", "云朵", "灯塔", "橡树"];
  const randomId = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const guestId = randomId();
  const value = {
    guestId,
    sessionId: randomId(),
    displayName: `${adjectives[Math.floor(Math.random() * adjectives.length)]}${englishIdentity ? " " : ""}${nouns[Math.floor(Math.random() * nouns.length)]}`,
    avatarSkin: Math.abs([...guestId].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 4,
  };
  localStorage.setItem(STORAGE_KEYS.guestIdentity, JSON.stringify(value));
  return value;
}

function localizedIdentityDisplayName(displayName) {
  const value = String(displayName || "");
  const generatedChineseName = /^(安静的|晨光里的|慢慢来的|靠窗的|雨声里的|专心的|温柔的|从容的)(海獭|知更鸟|小鹿|旅人|松鼠|云朵|灯塔|橡树)$/;
  if (window.FocusI18n?.getLanguage() === "en" && generatedChineseName.test(value)) {
    return window.FocusI18n.translate(value);
  }
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
    signal: options.signal || AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "request_failed");
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function turnstileToken() {
  const siteKey = PUBLIC_CONFIG.turnstileSiteKey;
  if (!siteKey) return "";
  if (!window.turnstile) {
    await new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-focus-island-turnstile]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.focusIslandTurnstile = "true";
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.appendChild(script);
    });
  }
  return new Promise((resolve, reject) => {
    const container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed", inset: "0", zIndex: "10000", display: "grid", placeItems: "center",
      background: "rgba(8, 28, 24, .42)", backdropFilter: "blur(8px)",
    });
    document.body.appendChild(container);
    const cleanup = () => container.remove();
    window.turnstile.render(container, {
      sitekey: siteKey,
      size: "compact",
      appearance: "interaction-only",
      callback: (token) => { cleanup(); resolve(token); },
      "error-callback": () => { cleanup(); reject(new Error("captcha_failed")); },
      "expired-callback": () => { cleanup(); reject(new Error("captcha_expired")); },
    });
  });
}

async function ensureOnlineIdentity() {
  if (!onlineIdentityPromise) {
    onlineIdentityPromise = (async () => {
      const session = await api("/api/auth/session");
      if (session.authenticated) {
        applyAccountProfile(session.profile);
        onlineUserId = session.userId;
        state.isDeveloper = session.developer === true;
        return session;
      }
      const captchaToken = await turnstileToken();
      const guest = await api("/api/auth/anonymous", { method: "POST", body: JSON.stringify({ ...identityBody(), captchaToken }) });
      applyAccountProfile(guest.profile);
      onlineUserId = guest.userId;
      state.isDeveloper = guest.developer === true;
      if (guest.access) { state.accessStatus = guest.access; accessStatusFetchedAt = Date.now(); }
      return { authenticated: true, anonymous: guest.anonymous, userId: guest.userId, developer: state.isDeveloper };
    })().catch((error) => {
      onlineIdentityPromise = null;
      throw error;
    });
  }
  return onlineIdentityPromise;
}

async function getAccessStatus({ refresh = false } = {}) {
  if (state.accessStatus && !refresh) return state.accessStatus;
  if (!accessStatusPromise) accessStatusPromise = (async () => {
    const response = await fetch("/api/access/status", { cache: "no-store" });
    const status = await response.json().catch(() => ({ authenticated: false, paywallReason: "access_service_unavailable" }));
    if (!response.ok) throw Object.assign(new Error(status.paywallReason || "access_service_unavailable"), { status: response.status });
    state.accessStatus = status;
    state.isDeveloper = status.developer === true;
    accessStatusFetchedAt = Date.now();
    return status;
  })().finally(() => { accessStatusPromise = null; });
  return accessStatusPromise;
}

function billingPrice(plan, fallback) {
  const configured = state.billingPlans?.find((item) => item.key === plan);
  const amount = Number(configured?.amount || fallback) / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: configured?.currency || "USD" }).format(amount);
}

async function loadBillingPlans() {
  try {
    const result = await api("/api/billing/plans");
    state.billingPlans = Array.isArray(result.plans) ? result.plans : null;
  } catch (_) {
    state.billingPlans = null;
  }
}

async function claimPendingLifetimeInvite() {
  if (!state.pendingLifetimeInvite) return null;
  try {
    const result = await api("/api/invitations/lifetime/claim", { method: "POST", body: "{}" });
    state.pendingLifetimeInvite = false;
    state.accessStatus = null;
    await getAccessStatus({ refresh: true });
    showToast(result.alreadyClaimed ? "这个账号已拥有终身体验权益" : `终身体验已领取${Number.isInteger(result.remaining) ? `，剩余 ${result.remaining} 个名额` : ""}`);
    return result;
  } catch (error) {
    if (error.status === 401) return null;
    state.pendingLifetimeInvite = false;
    showToast(error.message === "invitation_exhausted" ? "这批 50 个终身体验名额已领完" : "邀请链接无效或已失效");
    return null;
  }
}

async function prepareLifetimeInviteFromUrl() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("lifetime_invite");
  if (!token) return;
  url.searchParams.delete("lifetime_invite");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  try {
    await api("/api/invitations/lifetime/prepare", { method: "POST", body: JSON.stringify({ token }) });
    state.pendingLifetimeInvite = true;
    const session = await api("/api/auth/session");
    if (session.authenticated && !session.anonymous) {
      onlineUserId = session.userId;
      state.isDeveloper = session.developer === true;
      await claimPendingLifetimeInvite();
    } else {
      state.authMode = "sign-up";
      openAuthGate();
    }
  } catch (_) {
    showToast("邀请链接无效，请向邀请人确认完整链接");
  }
}

function openAuthGate(error = "", continuation = null) {
  if (continuation) state.authContinuation = continuation;
  state.accessOverlay = "auth";
  state.authError = error;
  state.authPending = false;
  renderAccessOverlay();
}

function openPaywall(reason = "payment_required") {
  state.accessOverlay = "paywall";
  state.authError = reason;
  renderAccessOverlay();
  loadBillingPlans().then(() => {
    if (state.accessOverlay === "paywall") renderAccessOverlay();
  });
}

function closeAccessOverlay() {
  state.accessOverlay = null;
  state.authContinuation = null;
  state.focusRecovery = null;
  document.querySelector(".access-overlay")?.remove();
}

function authErrorCopy(code) {
  return ({
    authentication_required: "请先注册或登录邮箱账号。",
    invalid_credentials: "邮箱或密码不正确。",
    email_already_registered: "这个邮箱已经注册。请登录原账号，我们会继续迁移匿名记录。",
    invalid_registration: "密码至少 10 位，并同时包含大小写字母、数字和符号。",
    password_mismatch: "两次输入的密码不一致。",
    registration_session_unavailable: "注册配置尚未完成，请稍后再试。",
    captcha_required: "请先完成人机验证。",
    rate_limited: "尝试次数过多，请稍后再试。",
    closed_beta_full: "本轮 100 名封闭测试名额已满，感谢关注。",
    access_service_unavailable: "暂时无法验证使用资格，请稍后再试。",
    focus_session_finished: "上次专注已结束，请重新选择开始。",
    invalid_current_password: "当前密码不正确。",
    current_password_required: "请输入当前密码后再修改。",
    billing_price_mismatch: "结账价格与 v1.1 定价不一致，已安全阻止扣款。",
  })[code] || "操作没有完成，请稍后重试。";
}

function renderAccessOverlay() {
  document.querySelector(".access-overlay")?.remove();
  if (!state.accessOverlay) return;
  const shell = document.createElement("div");
  shell.className = "access-overlay";
  if (state.accessOverlay === "leave-focus") {
    shell.innerHTML = `<section class="access-dialog" role="alertdialog" aria-modal="true" aria-labelledby="leave-focus-title">
      <h2 id="leave-focus-title">结束本轮并返回海岛？</h2><p>已专注的时间会保存，本轮座位将释放。</p>
      <button type="button" class="primary-button" data-action="confirm-leave-focus">结束并返回海岛</button>
      <button type="button" class="access-link" data-action="close-access-overlay">继续专注</button>
    </section>`;
  } else if (state.accessOverlay === "focus-recovery") {
    const previous = state.focusRecovery;
    shell.innerHTML = `<section class="access-dialog" role="dialog" aria-modal="true" aria-labelledby="focus-recovery-title">
      <button class="access-close" data-action="close-access-overlay" aria-label="关闭">×</button>
      <p class="access-eyebrow">RESUME FOCUS</p><h2 id="focus-recovery-title">上次专注尚未结束</h2>
      <p>可以继续上次的计时，或结束上次记录后重新开始。如果另一设备仍在专注，结束操作也会结束那一轮。</p>
      <p>${previous?.timer_mode ? `${Number(previous.timer_mode)} 分钟` : "自由专注"} · ${previous?.started_at ? escapeHtml(new Date(previous.started_at).toLocaleString()) : ""}</p>
      <button type="button" class="primary-button" data-action="continue-previous-focus" ${state.authPending ? "disabled" : ""}>继续上次专注</button>
      <button type="button" class="access-link" data-action="replace-previous-focus" ${state.authPending ? "disabled" : ""}>结束上次并重新开始</button>
      ${state.authError ? `<p class="access-error">${escapeHtml(authErrorCopy(state.authError))}</p>` : ""}
    </section>`;
  } else if (state.accessOverlay === "paywall") {
    shell.innerHTML = `<section class="access-dialog paywall-dialog" role="dialog" aria-modal="true" aria-labelledby="paywall-title">
      <button class="access-close" data-action="close-access-overlay" aria-label="关闭">×</button>
      <p class="access-eyebrow">FOCUS ISLE PLUS</p>
      <h2 id="paywall-title">继续留在岛上专注</h2>
      <p>你的免费 25 分钟已经使用。选择任一方案即可继续使用核心专注功能。</p>
      <div class="paywall-plans">
        <button data-billing-plan="plus_monthly"><small>灵活开始</small><strong>${billingPrice("plus_monthly", "499")} <b>/ 月</b></strong><span>Plus 月付 · 自动续订</span></button>
        <button class="recommended" data-billing-plan="plus_annual"><em>推荐</em><small>更适合长期使用</small><strong>${billingPrice("plus_annual", "1999")} <b>/ 年</b></strong><span>Plus 年付 · 自动续订</span></button>
        <button data-billing-plan="founder_lifetime"><small>限时名额</small><strong>${billingPrice("founder_lifetime", "3999")}</strong><span>创始终身版 · 一次购买</span></button>
      </div>
      <p class="access-fineprint">美元定价；最终税费以 Stripe Checkout 显示为准。服务端会校验真实 Price，付款完成后由签名 Webhook 确认权益。</p>
      <button class="access-link" data-action="auth-sign-in-from-paywall">已有账号？登录</button>
    </section>`;
  } else {
    const signUp = state.authMode === "sign-up";
    shell.innerHTML = `<section class="access-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button class="access-close" data-action="close-access-overlay" aria-label="关闭">×</button>
      <p class="access-eyebrow">${signUp ? "CREATE ACCOUNT" : "WELCOME BACK"}</p>
      <h2 id="auth-title">${state.pendingLifetimeInvite ? (signUp ? "注册领取终身体验" : "登录领取终身体验") : signUp ? "Create an optional account" : "Welcome back"}</h2>
      <p>${state.pendingLifetimeInvite ? "你已通过限量邀请链接进入。注册成功后自动领取，名额以最终领取成功为准。" : signUp ? "Keep your account details together. Café focus stays free with or without an account." : "Sign in to manage your account and existing purchases."}</p>
      <form data-auth-form="${signUp ? "sign-up" : "sign-in"}">
        <label>邮箱<input name="email" type="email" autocomplete="email" value="${escapeHtml(state.authEmail)}" required /></label>
        <label>密码<input name="password" type="password" autocomplete="${signUp ? "new-password" : "current-password"}" ${signUp ? "minlength=\"10\"" : ""} required /></label>
        ${signUp ? '<label>再次输入密码<input name="confirmPassword" type="password" autocomplete="new-password" minlength="10" required /></label>' : ""}
        ${state.authError ? `<p class="access-error">${escapeHtml(authErrorCopy(state.authError))}</p>` : ""}
        <button class="primary-button" type="submit" ${state.authPending ? "disabled" : ""}>${state.authPending ? "请稍候…" : signUp ? "注册并继续专注" : "登录并继续"}</button>
      </form>
      <button class="access-link" data-action="toggle-auth-mode">${signUp ? "已有账号？登录" : "没有账号？注册"}</button>
      ${!signUp ? `<button class="access-link muted" data-action="reset-password">忘记密码</button>` : ""}
    </section>`;
  }
  document.body.appendChild(shell);
  window.setTimeout(() => shell.querySelector("input")?.focus(), 0);
}

async function importLocalHistory() {
  const sessions = readHistory().slice(0, 100).map((item) => ({
    client_session_id: String(item.clientSessionId || item.id), scene_id: item.sceneId || "cafe",
    room_id: item.roomId || "", seat_id: Number(item.seat || 0) + 1,
    timer_mode: [0, 25, 50].includes(Number(item.timerMode)) ? Number(item.timerMode) : 25,
    planned_seconds: Number(item.targetSeconds) || 0, actual_seconds: Number(item.elapsedSeconds) || 0,
    started_at: new Date(item.startedAt || Date.now()).toISOString(), ended_at: new Date(item.endedAt || Date.now()).toISOString(),
    status: focusStatusKey(item.status) === "completed" ? "completed" : focusStatusKey(item.status),
  }));
  if (!sessions.length) return;
  await api("/api/focus/sessions", { method: "POST", body: JSON.stringify({ sessions }) }).catch(() => {});
}

async function completeAuthenticatedFlow(result) {
  if (PUBLIC_CONFIG.minimalMvp && onlineUserId !== result.userId) {
    resetTimerState(); identity.sessionId = crypto.randomUUID(); persistIdentity();
    state.currentSeatId = null; state.selectedSeat = null; state.roomId = null;
    state.roomPresence = { leases: [], serverNow: Date.now() };
  }
  onlineUserId = result.userId;
  state.isDeveloper = result.developer === true;
  onlineIdentityPromise = Promise.resolve({ authenticated: true, anonymous: false, userId: result.userId, developer: state.isDeveloper });
  state.accessStatus = result.access || null;
  accessStatusFetchedAt = result.access ? Date.now() : 0;
  await claimPendingLifetimeInvite();
  if (!state.accessStatus) await getAccessStatus({ refresh: true });
  const continuation = state.authContinuation;
  closeAccessOverlay();
  // History import and signed-grace refresh must not block the first screen.
  void importLocalHistory();
  void flushPendingFocusUpdates();
  if (["subscription", "lifetime", "admin"].includes(state.accessStatus?.entitlementType)) {
    void getAccessStatus({ refresh: true }).catch(() => {});
  }
  if (continuation === "start-focus" && state.view === "room" && state.selectedSeat !== null) {
    await enterImmersiveFocus();
    return;
  }
  state.view = "island";
  render();
}

async function authorizeFocusStart() {
  if (PUBLIC_CONFIG.minimalMvp && state.offlineFocus) return true;
  if (state.cloudFocusClientId) return true;
  if (focusAuthorizationPromise) return focusAuthorizationPromise;
  focusAuthorizationPromise = requestFocusAuthorization().finally(() => { focusAuthorizationPromise = null; });
  return focusAuthorizationPromise;
}

async function requestFocusAuthorization() {
  const clientSessionId = crypto.randomUUID();
  try {
    await flushPendingFocusUpdates();
    await api("/api/focus/sessions/start", { method: "POST", body: JSON.stringify({
      clientSessionId, sceneId: state.sceneId || "cafe", roomId: state.roomId || "",
      seatId: state.selectedSeat === null ? null : state.selectedSeat + 1, timerMode: state.timerMode,
    }) });
    state.cloudFocusClientId = clientSessionId;
    return true;
  } catch (error) {
    if (error.status === 402) openPaywall(error.message);
    else if (error.status === 401 || error.status === 403) openAuthGate(error.message, "start-focus");
    else if (error.status === 409 && error.message === "active_session_exists") await openFocusRecovery();
    else if (error.status === 429) showToast("操作有些频繁，请稍等一分钟后重试");
    else showToast("暂时无法开始专注，请稍后再试");
    return false;
  }
}

async function openFocusRecovery() {
  clearImmersiveAutoEnter();
  try {
    const result = await api("/api/focus/sessions?active=1");
    const previous = result.sessions?.[0];
    if (!previous) { showToast("上次专注已结束，请再次开始"); return; }
    state.focusRecovery = previous;
    state.authError = "";
    state.authPending = false;
    state.accessOverlay = "focus-recovery";
    renderAccessOverlay();
  } catch (_) { showToast("暂时无法读取上次专注，请稍后重试"); }
}

async function resolvePreviousFocus(restart) {
  const previous = state.focusRecovery;
  if (!previous || state.authPending) return;
  state.authPending = true;
  renderAccessOverlay();
  try {
    if (restart) {
      await api(`/api/focus/sessions/${encodeURIComponent(previous.client_session_id)}`, {
        method: "PATCH", body: JSON.stringify({ status: "interrupted", actualSeconds: Number(previous.actual_seconds) || 0, pausedSeconds: Number(previous.paused_seconds) || 0 }),
      });
      closeAccessOverlay();
      state.cloudFocusClientId = null;
      state.sessionStartedAt = null;
      state.elapsedSeconds = 0;
      state.remainingSeconds = state.durationSeconds;
      state.isRunning = false;
      persistActiveSession(true);
      if (!await startFocusFromSeat()) return;
    } else {
      // Revalidate the exact prior session; never create a second trial.
      const result = await api("/api/focus/sessions/start", { method: "POST", body: JSON.stringify({
        clientSessionId: previous.client_session_id, sceneId: previous.scene_id,
        roomId: previous.room_id || "", seatId: previous.seat_id, timerMode: previous.timer_mode,
      }) });
      const session = result.session;
      if (!session || !["running", "paused"].includes(session.status)) throw new Error("focus_session_finished");
      closeAccessOverlay();
      state.cloudFocusClientId = session.client_session_id;
      state.timerMode = session.timer_mode;
      state.durationSeconds = session.planned_seconds;
      state.sessionStartedAt = Date.parse(session.started_at);
      const elapsed = session.status === "paused" ? Number(session.actual_seconds) || 0
        : Math.max(Number(session.actual_seconds) || 0, Math.floor((Date.now() - state.sessionStartedAt) / 1000) - (Number(session.paused_seconds) || 0));
      state.elapsedSeconds = state.timerMode > 0 ? Math.min(elapsed, state.durationSeconds) : elapsed;
      state.remainingSeconds = Math.max(0, state.durationSeconds - state.elapsedSeconds);
      state.sessionPhase = "focus";
      state.isRunning = session.status === "running";
      lastTick = Date.now();
      persistActiveSession(true);
    }
    closePersonalCenter();
    state.view = "focus";
    render();
    if (state.isRunning && state.timerMode > 0 && state.remainingSeconds === 0) await finishSession("completed");
  } catch (error) {
    state.authError = error.message;
    if (state.accessOverlay === "focus-recovery") renderAccessOverlay();
    else showToast("上次专注状态已变化，请重新开始");
  } finally { state.authPending = false; if (state.accessOverlay === "focus-recovery") renderAccessOverlay(); }
}

function currentRoomApiId() {
  return state.roomId || (state.sceneId === "cafe" ? scenes.cafe.rooms[0].id : null);
}

function shuffledCopy(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function createLocalNpcLeases({ excludeSeatIds = [] } = {}) {
  if (PUBLIC_CONFIG.minimalMvp) return [];
  const now = Date.now();
  const excluded = new Set(excludeSeatIds.map(Number));
  const seatIds = shuffledCopy(staticSeatSlots.map((slot) => slot.seat_id).filter((seatId) => !excluded.has(seatId))).slice(0, 2);
  const nicknames = shuffledCopy(["晨光小鹿", "雨声海獭", "靠窗松鼠", "慢行旅人", "云朵知更鸟", "安静灯塔"]);
  const activities = shuffledCopy(["安静阅读", "整理笔记", "专心学习", "查看资料", "书写计划", "复习功课"]);
  return seatIds.map((seatId, index) => {
    const focusedForMinutes = 4 + Math.floor(Math.random() * 38);
    return {
      roomId: "cafe-local",
      seatId,
      sessionId: `npc-${seatId}-${now}-${index}`,
      displayName: nicknames[index],
      avatarSkin: (seatId + index) % 4,
      memberType: "npc",
      state: "occupied",
      activity: activities[index],
      focusStartedAt: now - focusedForMinutes * 60 * 1000,
    };
  });
}

function reconcileLocalNpcRoster(leases = state.roomPresence.leases) {
  const realLeases = leases.filter((lease) => lease.memberType !== "npc");
  const occupiedSeatIds = new Set(realLeases.map((lease) => Number(lease.seatId)));
  const stableRoster = state.localNpcRoster.filter((lease) => !occupiedSeatIds.has(Number(lease.seatId)));
  const missingCount = Math.max(0, 2 - stableRoster.length);
  if (!missingCount) {
    state.localNpcRoster = stableRoster.slice(0, 2);
    return;
  }
  const replacements = createLocalNpcLeases({
    excludeSeatIds: [...occupiedSeatIds, ...stableRoster.map((lease) => Number(lease.seatId))],
  }).slice(0, missingCount);
  state.localNpcRoster = [...stableRoster, ...replacements].slice(0, 2);
}

function cafeSeatOccupancyLeases() {
  const leasesBySeat = new Map();
  state.roomPresence.leases.forEach((lease) => leasesBySeat.set(Number(lease.seatId), lease));
  state.localNpcRoster.forEach((lease) => {
    const seatId = Number(lease.seatId);
    if (!leasesBySeat.has(seatId)) leasesBySeat.set(seatId, lease);
  });
  return [...leasesBySeat.values()];
}

async function enterCafeRoom() {
  if (state.isAllocatingRoom) return;
  state.isAllocatingRoom = true;
  showToast("正在为你准备咖啡馆座位…");
  let access = null;
  try {
    await ensureOnlineIdentity();
    access = await getAccessStatus({ refresh: Date.now() - accessStatusFetchedAt > 15000 });
    if (!access.authenticated) {
      openAuthGate(access.paywallReason);
      return;
    }
    if (!access.canStartFocus) {
      openPaywall(access.paywallReason);
      return;
    }
    await ensureOnlineIdentity();
    const allocation = await api("/api/scenes/cafe/allocate", {
      method: "POST",
      body: JSON.stringify(identityBody()),
    });
    state.roomId = allocation.roomId;
    state.localRoom = allocation.mode === "local";
    if (PUBLIC_CONFIG.minimalMvp) { state.offlineFocus = false; state.presenceUnavailable = false; }
  } catch (error) {
    if (PUBLIC_CONFIG.minimalMvp && (!error.status || error.status >= 500)) {
      state.roomId = "cafe-local";
      state.localRoom = true;
      state.offlineFocus = true;
      showToast("Live rooms are unavailable. You can focus on your own.");
    } else if (access?.entitlementType === "offline_grace") {
      state.roomId = "cafe-local";
      state.localRoom = true;
      showToast("在线服务暂不可用，已使用付费离线宽限进入本地岛民房间");
    } else {
    if (error.status === 401 || error.status === 403) openAuthGate(error.message);
    else if (error.status === 402) openPaywall(error.message);
    else showToast("暂时无法验证使用资格，请稍后再试");
    return;
    }
  } finally {
    state.isAllocatingRoom = false;
  }
  state.localNpcRoster = createLocalNpcLeases();
  state.roomPresence = state.localRoom
    ? { leases: [...state.localNpcRoster], serverNow: Date.now() }
    : { leases: [], serverNow: Date.now() };
  state.selectedSeat = null;
  state.currentSeatId = null;
  state.view = roomViewForScene();
  render();
}

function leaseForSeat(seatIndex) {
  return cafeSeatOccupancyLeases().find((lease) => Number(lease.seatId) === seatIndex + 1 && ["reserved", "moving", "occupied"].includes(lease.state)) || null;
}

function focusedMinutes(lease) {
  if (!lease.focusStartedAt) return 0;
  const referenceNow = state.localRoom ? Date.now() : (state.roomPresence.serverNow || Date.now());
  return Math.max(0, Math.floor((referenceNow - Number(lease.focusStartedAt)) / 60000));
}

function updateStaticFocusTimes() {
  document.querySelectorAll("[data-static-focus-started-at]").forEach((element) => {
    const startedAt = Number(element.dataset.staticFocusStartedAt);
    if (!Number.isFinite(startedAt)) return;
    const minutes = Math.max(0, Math.floor((Date.now() - startedAt) / 60000));
    element.textContent = `已专注 ${minutes} 分钟`;
  });
}

function immersiveCountdownSeconds() {
  if (!state.immersiveAutoEnterAt) return Math.ceil(CAFE_IMMERSIVE_AUTO_ENTER_MS / 1000);
  return Math.max(0, Math.ceil((state.immersiveAutoEnterAt - Date.now()) / 1000));
}

function updateImmersiveCountdownCopy() {
  const note = document.querySelector("[data-immersive-countdown]");
  if (note) note.textContent = `${immersiveCountdownSeconds()} 秒后自动进入沉浸视角`;
}

function clearImmersiveAutoEnter({ resetState = true } = {}) {
  if (immersiveAutoTimer) window.clearInterval(immersiveAutoTimer);
  immersiveAutoTimer = null;
  if (resetState) {
    state.awaitingImmersiveFocus = false;
    state.immersiveAutoEnterAt = null;
  }
}

async function startFocusFromSeat() {
  if (!await authorizeFocusStart()) return false;
  state.isRunning = true;
  state.sessionStartedAt = state.sessionStartedAt || Date.now();
  lastTick = Date.now();
  startTicker();
  updateAudio();
  persistActiveSession(true);
  return true;
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

async function enterImmersiveFocus() {
  if (state.sceneId !== "cafe" || state.selectedSeat === null) return;
  if (document.querySelector(".focus-transition-preview")) return;
  clearImmersiveAutoEnter();
  if (!state.sessionStartedAt && !await startFocusFromSeat()) return;
  const reduceMotion = preferences.reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const roomView = document.querySelector(".view.room");
  if (reduceMotion || !roomView) {
    state.view = "focus";
    render();
    return;
  }
  state.isTransitioning = true;
  const preview = document.createElement("div");
  preview.className = "focus-transition-preview";
  preview.setAttribute("aria-hidden", "true");
  preview.innerHTML = `<img src="${selectedFocusImage()}" alt="" />`;
  roomView.appendChild(preview);
  requestAnimationFrame(() => preview.classList.add("is-visible"));
  window.setTimeout(() => {
    state.isTransitioning = false;
    state.view = "focus";
    render();
  }, CAFE_IMMERSIVE_CROSSFADE_MS);
}

function stopRoomPresence() {
  window.clearInterval(roomSyncTimer);
  window.clearInterval(heartbeatTimer);
  roomSyncTimer = null;
  heartbeatTimer = null;
  roomSyncInFlight = false;
  window.dispatchEvent(new CustomEvent("focus-island:subscribe-room", { detail: { roomId: null } }));
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

function loadStaticSeatMarkerPositions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.staticSeatMarkers) || "{}");
    if (!saved || typeof saved !== "object") return {};
    return Object.fromEntries(Object.entries(saved).filter(([, position]) =>
      Number.isFinite(Number(position?.left)) && Number.isFinite(Number(position?.top))
    ));
  } catch (_) {
    return {};
  }
}

function saveStaticSeatMarkerPositions() {
  localStorage.setItem(STORAGE_KEYS.staticSeatMarkers, JSON.stringify(state.staticSeatCalibration.positions));
}

function staticSeatMarkerPosition(slot) {
  const saved = state.staticSeatCalibration.positions[slot.seat_id];
  return saved
    ? [Number(saved.left), Number(saved.top)]
    : [Number(slot.hit_area[0]), Number(slot.hit_area[1])];
}

function updateStaticSeatMarkerPosition(seatId, position) {
  state.staticSeatCalibration.positions[seatId] = {
    left: clampScenePercent(position.left),
    top: clampScenePercent(position.top),
  };
  saveStaticSeatMarkerPositions();
}

function resetStaticSeatMarkerPositions() {
  state.staticSeatCalibration.positions = {};
  localStorage.removeItem(STORAGE_KEYS.staticSeatMarkers);
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
  if (!state.isDeveloper || !state.cafeDebugMode.enabled) return "";
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
  if (!state.isDeveloper || !state.libraryDebugMode.enabled) return "";
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
  if (state.localRoom) {
    state.roomPresence.serverNow = Date.now();
    if (refreshMarkers && state.view === "room") refreshCafeSeatMarkers();
    return;
  }
  roomSyncInFlight = true;
  try {
    const presence = await api(`/api/rooms/${currentRoomApiId()}/state`);
    state.roomPresence = presence;
    state.presenceUnavailable = false;
    state.presenceFetchedAt = Date.now();
    reconcileLocalNpcRoster(presence.leases);
    const ownLease = presence.leases.find((lease) => lease.sessionId === identity.sessionId && lease.state === "occupied");
    if (ownLease) state.currentSeatId = Number(ownLease.seatId);
    const room = scenes.cafe.rooms.find((item) => item.id === currentRoomApiId());
    const visibleLeases = cafeVisibleLeases(presence.leases);
    if (room) room.occupied = visibleLeases.length;
    scenes.cafe.online = scenes.cafe.rooms.reduce((total, item) => total + Number(item.occupied || 0), 0);
    syncCafeSceneObjectLayers();
    syncCafeSeatActorLayers(presence.leases);
    if (refreshMarkers && state.view === "room") refreshCafeSeatMarkers();
  } catch (_) {
    if (PUBLIC_CONFIG.minimalMvp) { state.presenceUnavailable = true; if (state.view === "room") refreshMinimalSeats(); }
    const syncLabel = document.querySelector(".room-sync-label");
    if (syncLabel) syncLabel.textContent = "正在重新连接…";
  } finally {
    roomSyncInFlight = false;
  }
}

function refreshCafeSeatMarkers() {
  if (PUBLIC_CONFIG.minimalMvp) return refreshMinimalSeats();
  const markerLayer = document.querySelector(".seat-markers");
  if (!markerLayer || state.sceneId !== "cafe") return;
  const renderedSeatEntries = cafeVisibleSeatEntries();
  const staticRoom = Boolean(document.querySelector(".static-seat-room"));
  const markerMarkup = staticRoom
    ? staticSeatSlots.map((slot) => {
      const [markerLeft, markerTop] = staticSeatMarkerPosition(slot);
      return renderSeat([markerLeft, markerTop, false], slot.seat_id - 1, "cafe", { staticMarker: true });
    }).join("")
    : renderedSeatEntries.map(({ seat, index }) => renderSeat(seat, index, "cafe")).join("");
  if (markerLayer.dataset.renderKey !== markerMarkup) {
    markerLayer.innerHTML = markerMarkup;
    markerLayer.dataset.renderKey = markerMarkup;
  }
  const staticOccupants = document.querySelector(".static-occupants");
  const occupantMarkup = staticOccupants ? renderStaticCafeOccupants() : "";
  if (staticOccupants && staticOccupants.dataset.renderKey !== occupantMarkup) {
    staticOccupants.innerHTML = occupantMarkup;
    staticOccupants.dataset.renderKey = occupantMarkup;
  }
  syncCafeSceneObjectLayers();
  syncCafeSeatActorLayers();
  const openSeats = renderedSeatEntries.filter(({ index }) => !leaseForSeat(index)).length;
  const note = document.querySelector(".room-footer-copy span");
  if (note && document.querySelector(".static-seat-room")) note.textContent = `无需移动角色 · 还剩 ${openSeats} 个空位`;
  else if (note && state.selectedSeat === null) note.textContent = `选择一张喜欢的位置坐下 · 还剩 ${openSeats} 个空位`;
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
  if (state.localRoom) {
    refreshCafeSeatMarkers();
    updateStaticFocusTimes();
    roomSyncTimer = window.setInterval(() => {
      state.roomPresence.serverNow = Date.now();
      updateStaticFocusTimes();
    }, 15000);
    return;
  }
  await syncCafeState();
  window.dispatchEvent(new CustomEvent("focus-island:subscribe-room", { detail: { roomId: currentRoomApiId() } }));
  roomSyncTimer = window.setInterval(() => syncCafeState(), 60000);
  heartbeatTimer = window.setInterval(sendHeartbeat, 15000);
}

async function sendHeartbeat() {
  if (!state.currentSeatId || state.sceneId !== "cafe") return;
  if (state.localRoom) return;
  try {
    await api(`/api/sessions/${identity.sessionId}/heartbeat`, {
      method: "POST",
      body: JSON.stringify({ activity: state.sessionPhase === "rest" ? "休息中" : state.isRunning ? "专注计时中" : "已入座", focusing: state.isRunning }),
    });
  } catch (error) {
    if (error.status === 404 || error.status === 409) {
      await recoverCafeSeat("heartbeat");
    }
  }
}

function currentSeatActivity() {
  if (state.sessionPhase === "rest") return "休息中";
  if (state.isRunning) return "专注计时中";
  return "已入座";
}

async function recoverCafeSeat(source = "resume") {
  if (seatRecoveryPromise) return seatRecoveryPromise;
  if (document.hidden || state.sceneId !== "cafe" || state.localRoom || !state.currentSeatId) return false;
  if (!["focus", "room"].includes(state.view)) return false;
  const preferredRoomId = currentRoomApiId();
  const preferredSeatId = Number(state.currentSeatId);
  if (!preferredRoomId || !Number.isInteger(preferredSeatId)) return false;

  seatRecoveryPromise = (async () => {
    try {
      const result = await api(`/api/sessions/${identity.sessionId}/resume`, {
        method: "POST",
        body: JSON.stringify({
          preferredRoomId,
          preferredSeatId,
          displayName: identity.displayName,
          avatarSkin: identity.avatarSkin,
          activity: currentSeatActivity(),
          focusing: state.isRunning,
          focusStartedAt: state.sessionStartedAt,
        }),
      });
      const previousRoomId = state.roomId;
      state.roomId = result.roomId;
      state.currentSeatId = Number(result.seatId);
      state.selectedSeat = state.currentSeatId - 1;
      state.switchingFromSeatId = null;
      if (previousRoomId !== state.roomId) {
        window.dispatchEvent(new CustomEvent("focus-island:subscribe-room", { detail: { roomId: state.roomId } }));
      }
      persistActiveSession(true);
      await syncCafeState({ refreshMarkers: state.view === "room" });
      return true;
    } catch (error) {
      if (error.status === 409 && error.message === "system_rooms_full") {
        state.currentSeatId = null;
        showToast("当前系统房间暂无空位，你的专注计时仍会保留");
        if (state.view === "room") renderRoom();
      } else {
        const syncLabel = document.querySelector(".room-sync-label");
        if (syncLabel) syncLabel.textContent = "正在重新连接…";
      }
      return false;
    } finally {
      seatRecoveryPromise = null;
    }
  })();
  return seatRecoveryPromise;
}

async function releaseSeat({ beacon = false, force = false } = {}) {
  clearImmersiveAutoEnter();
  if (!force && !state.currentSeatId && !state.switchingFromSeatId) return;
  if (state.localRoom) {
    if (!state.localNpcRoster.length) state.localNpcRoster = createLocalNpcLeases();
    state.roomPresence.leases = [...state.localNpcRoster];
    state.roomPresence.serverNow = Date.now();
    state.currentSeatId = null;
    state.switchingFromSeatId = null;
    return;
  }
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

function avatarOption(avatarSkin = identity.avatarSkin) {
  return AVATAR_OPTIONS.find((option) => option.id === Number(avatarSkin)) || AVATAR_OPTIONS[0];
}

function profileAvatarMarkup(className = "profile-avatar-mini", avatarSkin = identity.avatarSkin) {
  const avatar = avatarOption(avatarSkin);
  return `<span class="${className}" style="background-image:url('${avatar.image}')" aria-hidden="true"></span>`;
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
        ${showPresence ? `<div class="glass-pill global-presence" title="内部演示状态">
          <span class="presence-dot"></span>
          <span class="presence-stat"><strong>内部演示</strong><small>岛民 NPC</small></span>
        </div>` : ""}
        <button class="icon-button profile-button" data-action="profile" aria-label="打开个人中心" title="个人中心">
          ${profileAvatarMarkup()}
        </button>
      </div>` : ""}
    </header>`;
}

function render() {
  landingExperienceCleanup?.();
  landingExperienceCleanup = null;
  stopTickerIfNeeded();
  const isLanding = state.view === "welcome";
  document.body.classList.toggle("landing-mode", isLanding);
  app.dataset.view = state.view;
  if (state.view === "welcome") renderWelcome();
  if (state.view === "island") renderIsland();
  if (state.view === "rooms") renderRooms();
  if (state.view === "godot-room") renderGodotRoom();
  if (state.view === "room") renderRoom();
  if (state.view === "focus") renderFocus();
  if (state.view === "summary") renderSummary();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function validFocusHistory() {
  return readHistory().filter((item) => Number(item?.elapsedSeconds) > 0 && shanghaiDateKey(item.endedAt || item.startedAt));
}

function focusStatusKey(status) {
  if (["completed", "free_completed"].includes(status)) return "completed";
  if (status === "interrupted") return "interrupted";
  return "ended_early";
}

function focusStatusLabel(status) {
  return focusStatusKey(status) === "completed" ? "已完成" : focusStatusKey(status) === "interrupted" ? "已中断" : "提前结束";
}

function isActiveFocusSession() {
  return Boolean(state.currentSeatId && state.sceneId && (state.sessionStartedAt || state.sessionPhase === "rest"));
}

function hasActiveSeatSession() {
  return Boolean(state.currentSeatId || state.switchingFromSeatId || isActiveFocusSession());
}

function openPersonalCenter({ tab = "overview" } = {}) {
  if (state.isRunning || state.sessionPhase === "rest") syncTimerFromClock();
  persistActiveSession(true);
  state.personalCenter.open = true;
  state.personalCenter.tab = tab === "developer" && state.isDeveloper ? "developer" : PUBLIC_CONFIG.minimalMvp && tab === "account" ? "account" : "overview";
  state.personalCenter.monthKey = shanghaiDateKey(Date.now()).slice(0, 7);
  state.personalCenter.selectedDate = shanghaiDateKey(Date.now());
  state.personalCenter.filters = { scene: "all", status: "all", mode: "all" };
  state.personalCenter.confirmAction = null;
  document.body.classList.add("personal-center-open");
  if (PUBLIC_CONFIG.minimalMvp) {
    accountCenter.returnFocus = document.activeElement;
    minimalUi.panel = null; minimalRenderPanel();
    document.querySelector(".minimal-root")?.setAttribute("inert", "");
  }
  renderPersonalCenter();
  void getAccessStatus({ refresh: true }).then(() => {
    if (!state.personalCenter.open) return;
    if (state.personalCenter.tab === "developer" && !state.isDeveloper) state.personalCenter.tab = "overview";
    renderPersonalCenter();
  }).catch(() => {});
  if (state.personalCenter.tab === "developer") void refreshDeveloperDiagnostics();
}

function closePersonalCenter() {
  state.personalCenter.open = false;
  state.personalCenter.confirmAction = null;
  document.querySelector(".personal-center-overlay")?.remove();
  document.body.classList.remove("personal-center-open");
  if (PUBLIC_CONFIG.minimalMvp) {
    document.querySelector(".minimal-root")?.removeAttribute("inert");
    const target = accountCenter.returnFocus?.isConnected ? accountCenter.returnFocus : document.querySelector(".scene-tools button");
    target?.focus({ preventScroll: true });
  }
  scheduleHudFade();
}

function personalCenterNotice() {
  if (!isActiveFocusSession()) return "";
  const message = state.sessionPhase === "rest" || !state.isRunning
    ? "本次专注已暂停，返回专注页面后可继续"
    : state.timerMode === 0
      ? "你还在专注中，计时仍在继续，请尽快返回专注页面"
      : "你还在专注中，倒计时仍在继续，请尽快返回专注页面";
  return `<div class="personal-focus-notice" role="status"><span><i aria-hidden="true"></i>${message}</span><button type="button" data-action="return-active-focus">返回专注</button></div>`;
}

function renderPersonalCenter() {
  if (PUBLIC_CONFIG.minimalMvp) return renderAccountCenter();
  document.querySelector(".personal-center-overlay")?.remove();
  const tabs = [
    ["overview", "⌂", "个人概览"],
    ["history", "▣", "专注记录"],
    ["preferences", "♪", "偏好设置"],
    ["account", "◇", "账户与数据"],
    ...(state.isDeveloper ? [["developer", "⌘", developerToolsCopy().nav]] : []),
  ];
  const overlay = document.createElement("section");
  overlay.className = "personal-center-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "personal-center-title");
  overlay.innerHTML = `
    <div class="personal-center-backdrop" aria-hidden="true"></div>
    <div class="personal-center-shell">
      <aside class="personal-center-sidebar">
        <div class="personal-center-brand">${brand()}</div>
        <div class="personal-center-identity">
          ${profileAvatarMarkup("personal-center-avatar")}
          <div><strong>${escapeHtml(localizedIdentityDisplayName(identity.displayName))}</strong><small>岛上昵称</small></div>
        </div>
        <nav aria-label="个人中心">
          ${tabs.map(([id, icon, label]) => `<button type="button" class="personal-nav-button ${state.personalCenter.tab === id ? "is-active" : ""}" data-profile-tab="${id}" aria-current="${state.personalCenter.tab === id ? "page" : "false"}"><span aria-hidden="true">${icon}</span>${label}</button>`).join("")}
        </nav>
        <p class="personal-center-local-note" data-no-auto-i18n>Focus Isle v${escapeHtml(PUBLIC_CONFIG.appVersion || "—")} · ${developerToolsCopy().cloudNote}</p>
      </aside>
      <main class="personal-center-main">
        <header class="personal-center-header">
          <div><p>PROFILE</p><h1 id="personal-center-title">${tabs.find(([id]) => id === state.personalCenter.tab)?.[2] || "个人中心"}</h1></div>
          <button class="personal-center-close" type="button" data-action="close-personal-center" aria-label="关闭个人中心">×</button>
        </header>
        ${personalCenterNotice()}
        <div class="personal-center-content">${renderPersonalCenterContent()}</div>
      </main>
    </div>
    ${renderPersonalCenterConfirm()}`;
  app.appendChild(overlay);
  window.setTimeout(() => overlay.querySelector(".personal-center-close")?.focus(), 0);
}

function renderPersonalCenterContent() {
  if (state.personalCenter.tab === "history") return renderPersonalHistory();
  if (state.personalCenter.tab === "preferences") return renderPersonalPreferences();
  if (state.personalCenter.tab === "account") return renderPersonalAccount();
  if (state.personalCenter.tab === "developer" && state.isDeveloper) return renderDeveloperTools();
  return renderPersonalOverview();
}

function personalCenterPrimaryAction() {
  if (isActiveFocusSession()) return { action: "return-active-focus", label: "返回专注" };
  if (localStorage.getItem(STORAGE_KEYS.activeSession)) return { action: "resume-focus-session", label: "继续上次专注" };
  return { action: "profile-start-focus", label: "开始专注" };
}

function sumHistory(history) {
  return history.reduce((total, item) => total + Math.max(0, Number(item.elapsedSeconds) || 0), 0);
}

function renderPersonalOverview() {
  const history = validFocusHistory();
  const todayKey = shanghaiDateKey(Date.now());
  const weekday = dateKeyWeekday(todayKey);
  const weekStart = shiftDateKey(todayKey, -((weekday + 6) % 7));
  const monthKey = todayKey.slice(0, 7);
  const todayHistory = history.filter((item) => shanghaiDateKey(item.endedAt || item.startedAt) === todayKey);
  const weekHistory = history.filter((item) => {
    const key = shanghaiDateKey(item.endedAt || item.startedAt);
    return key >= weekStart && key <= todayKey;
  });
  const monthDays = new Set(history.map((item) => shanghaiDateKey(item.endedAt || item.startedAt)).filter((key) => key.startsWith(monthKey))).size;
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => shiftDateKey(todayKey, index - 6));
  const dailyTotals = lastSevenDays.map((key) => sumHistory(history.filter((item) => shanghaiDateKey(item.endedAt || item.startedAt) === key)));
  const maximumDaily = Math.max(...dailyTotals, 1);
  const sceneUsage = new Map();
  history.forEach((item) => {
    if (!scenes[item.sceneId]) return;
    const current = sceneUsage.get(item.sceneId) || { count: 0, lastUsed: 0 };
    current.count += 1;
    current.lastUsed = Math.max(current.lastUsed, Number(item.endedAt || item.startedAt) || 0);
    sceneUsage.set(item.sceneId, current);
  });
  const recentScenes = [...sceneUsage.entries()].sort((a, b) => b[1].lastUsed - a[1].lastUsed).slice(0, 3);
  const primary = personalCenterPrimaryAction();
  return `
    <div class="profile-overview">
      <section class="profile-hero-card">
        <div class="profile-hero-identity">
          ${profileAvatarMarkup("profile-hero-avatar")}
          <div><span>已验证账号</span><h2>${escapeHtml(localizedIdentityDisplayName(identity.displayName))}</h2><p>专注记录会保存到你的云端账号。</p></div>
        </div>
        <div class="profile-hero-actions"><button type="button" class="profile-text-button" data-profile-tab="account">编辑资料</button><button type="button" class="profile-primary-button" data-action="${primary.action}">${primary.label}<span aria-hidden="true">→</span></button></div>
      </section>
      <section class="profile-stat-grid" aria-label="专注数据概览">
        ${profileStatCard("今日专注", formatDuration(sumHistory(todayHistory)), "今天的真实记录")}
        ${profileStatCard("本周专注", formatDuration(sumHistory(weekHistory)), "从本周一开始")}
        ${profileStatCard("本月专注", `${monthDays} 天`, "有记录的自然日")}
        ${profileStatCard("累计专注", formatDuration(sumHistory(history)), `${history.length} 次记录`)}
      </section>
      <div class="profile-overview-grid">
        <section class="profile-panel profile-week-panel">
          <div class="profile-panel-heading"><div><span>最近七天</span><h3>专注节奏</h3></div><small>${formatDuration(sumHistory(history.filter((item) => lastSevenDays.includes(shanghaiDateKey(item.endedAt || item.startedAt)))))}</small></div>
          <div class="profile-week-chart" aria-label="最近七天专注时长">
            ${lastSevenDays.map((key, index) => `<div class="profile-chart-day"><span class="profile-chart-bar"><i style="height:${Math.max(dailyTotals[index] ? 10 : 2, Math.round(dailyTotals[index] / maximumDaily * 100))}%"></i></span><small>${["日", "一", "二", "三", "四", "五", "六"][dateKeyWeekday(key)]}</small></div>`).join("")}
          </div>
          ${history.length ? "" : '<p class="profile-empty-inline">完成一次专注后，这里会出现你的节奏。</p>'}
        </section>
        <section class="profile-panel">
          <div class="profile-panel-heading"><div><span>最近使用</span><h3>场景</h3></div></div>
          <div class="profile-scene-list">
            ${recentScenes.length ? recentScenes.map(([sceneId, usage]) => `<article class="profile-scene-item"><img src="${scenes[sceneId].image}" alt="" /><div><strong>${scenes[sceneId].name}</strong><small>${usage.count} 次专注</small></div></article>`).join("") : '<p class="profile-empty-state">去咖啡馆开始第一段专注时光吧。</p>'}
          </div>
        </section>
      </div>
      <section class="profile-panel profile-recent-panel">
        <div class="profile-panel-heading"><div><span>最近记录</span><h3>刚刚走过的专注时光</h3></div><button type="button" data-profile-tab="history">查看全部记录</button></div>
        ${renderProfileRecordList(history.slice(0, 3), "还没有专注记录。去咖啡馆找个喜欢的位置吧。")}
      </section>
    </div>`;
}

function profileStatCard(label, value, note) {
  return `<article class="profile-stat-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`;
}

function renderProfileRecordList(history, emptyMessage) {
  if (!history.length) return `<p class="profile-empty-state">${emptyMessage}</p>`;
  return `<div class="profile-record-list">${history.map((item) => {
    const scene = scenes[item.sceneId];
    return `<article class="profile-record-item"><time>${formatClockTime(item.startedAt || item.endedAt)}</time><strong>${formatDuration(item.elapsedSeconds)}</strong><span>${escapeHtml(scene?.name || "已移除场景")}</span><em class="is-${focusStatusKey(item.status)}">${focusStatusLabel(item.status)}</em></article>`;
  }).join("")}</div>`;
}

function monthCalendarDays(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leading = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return { year, month, days, leading };
}

function renderPersonalHistory() {
  const history = validFocusHistory();
  const { year, month, days, leading } = monthCalendarDays(state.personalCenter.monthKey);
  const todayKey = shanghaiDateKey(Date.now());
  const recordDates = new Set(history.map((item) => shanghaiDateKey(item.endedAt || item.startedAt)));
  const filters = state.personalCenter.filters;
  const selectedHistory = history.filter((item) => {
    if (shanghaiDateKey(item.endedAt || item.startedAt) !== state.personalCenter.selectedDate) return false;
    if (filters.scene !== "all" && item.sceneId !== filters.scene) return false;
    if (filters.status !== "all" && focusStatusKey(item.status) !== filters.status) return false;
    if (filters.mode !== "all" && String(item.timerMode) !== filters.mode) return false;
    return true;
  });
  const completedCount = selectedHistory.filter((item) => focusStatusKey(item.status) === "completed").length;
  const sceneIds = [...new Set(history.map((item) => item.sceneId).filter((sceneId) => scenes[sceneId]))];
  const selectedDay = Number(state.personalCenter.selectedDate.slice(-2));
  return `
    <div class="profile-history-layout">
      <section class="profile-calendar-card">
        <div class="profile-calendar-header"><button type="button" data-profile-month-delta="-1" aria-label="上个月">‹</button><h2>${year} 年 ${month} 月</h2><button type="button" data-profile-month-delta="1" aria-label="下个月">›</button></div>
        <div class="profile-calendar-weekdays">${["日", "一", "二", "三", "四", "五", "六"].map((day) => `<span>${day}</span>`).join("")}</div>
        <div class="profile-calendar-grid">
          ${Array.from({ length: leading }, () => "<span></span>").join("")}
          ${Array.from({ length: days }, (_, index) => {
            const day = index + 1;
            const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            return `<button type="button" class="profile-calendar-day ${key === todayKey ? "is-today" : ""} ${key === state.personalCenter.selectedDate ? "is-selected" : ""} ${recordDates.has(key) ? "has-record" : ""}" data-profile-date="${key}" aria-label="${month}月${day}日${recordDates.has(key) ? "，有专注记录" : ""}"><span>${day}</span>${recordDates.has(key) ? "<i></i>" : ""}</button>`;
          }).join("")}
        </div>
      </section>
      <section class="profile-history-detail">
        <div class="profile-history-title"><div><span>当天记录</span><h2>${month} 月 ${selectedDay} 日</h2></div><div class="profile-filter-row">
          <label>场景<select data-profile-filter="scene"><option value="all">全部场景</option>${sceneIds.map((sceneId) => `<option value="${sceneId}" ${filters.scene === sceneId ? "selected" : ""}>${scenes[sceneId].name}</option>`).join("")}</select></label>
          <label>状态<select data-profile-filter="status"><option value="all">全部状态</option><option value="completed" ${filters.status === "completed" ? "selected" : ""}>已完成</option><option value="ended_early" ${filters.status === "ended_early" ? "selected" : ""}>提前结束</option><option value="interrupted" ${filters.status === "interrupted" ? "selected" : ""}>已中断</option></select></label>
          <label>模式<select data-profile-filter="mode"><option value="all">全部模式</option><option value="25" ${filters.mode === "25" ? "selected" : ""}>25 分钟</option><option value="50" ${filters.mode === "50" ? "selected" : ""}>50 分钟</option><option value="0" ${filters.mode === "0" ? "selected" : ""}>自由正计时</option></select></label>
        </div></div>
        <div class="profile-day-summary">${profileStatCard("专注次数", `${selectedHistory.length} 次`, "当天记录")}${profileStatCard("实际时长", formatDuration(sumHistory(selectedHistory)), "真实累计")}${profileStatCard("完成次数", `${completedCount} 次`, "正常完成")}</div>
        ${renderProfileRecordList(selectedHistory, history.length ? "这一天没有符合当前筛选条件的记录。" : "还没有专注记录。去咖啡馆找个喜欢的位置吧。")}
      </section>
    </div>`;
}

function profileToggle(key, label, description, checked = preferences[key], disabled = false) {
  return `<div class="profile-setting-row ${disabled ? "is-disabled" : ""}"><div><strong>${label}</strong><small>${description}</small></div><button type="button" class="profile-switch ${checked ? "is-on" : ""}" data-preference-toggle="${key}" aria-pressed="${Boolean(checked)}" ${disabled ? "disabled" : ""}><span></span></button></div>`;
}

function soundSettingRow(key, label) {
  return `<div class="profile-sound-row"><button type="button" class="profile-sound-toggle ${state.sounds[key] ? "is-on" : ""}" data-profile-sound-toggle="${key}" aria-pressed="${Boolean(state.sounds[key])}"><span>${state.sounds[key] ? "开启" : "关闭"}</span><strong>${label}</strong></button><label><input type="range" min="0" max="100" value="${state.soundVolumes[key]}" data-profile-volume="${key}" aria-label="${label}音量" /><span data-profile-volume-value="${key}">${state.soundVolumes[key]}%</span></label></div>`;
}

function renderPersonalPreferences() {
  const notificationSupported = "Notification" in window;
  const notificationDescription = !notificationSupported ? "当前浏览器不支持桌面通知" : Notification.permission === "denied" ? "通知权限已关闭，请在浏览器设置中开启" : "专注完成后发送系统通知";
  return `
    <div class="profile-settings-layout">
      <section class="profile-settings-card">
        <div class="profile-settings-heading"><span>默认专注</span><h2>下一次如何开始</h2></div>
        <div class="profile-segmented" aria-label="默认计时模式">${[[25, "25 分钟"], [50, "50 分钟"], [0, "自由正计时"]].map(([value, label]) => `<button type="button" class="${preferences.defaultTimerMode === value ? "is-active" : ""}" data-preference-timer="${value}" aria-pressed="${preferences.defaultTimerMode === value}">${label}</button>`).join("")}</div>
        ${profileToggle("rememberLastSound", "记住上次声音组合", "下一次沿用当前声音选择")}
        ${profileToggle("rememberLastFocusView", "记住上次沉浸画面", "下一次沿用当前窗景")}
      </section>
      <section class="profile-settings-card">
        <div class="profile-settings-heading"><span>声音</span><h2>专注时的听觉环境</h2></div>
        <div class="profile-sound-settings">${soundSettingRow("ambient", "咖啡馆环境声")}${soundSettingRow("white", "白噪音")}${soundSettingRow("music", "背景音乐")}</div>
        <div class="profile-music-grid">${Object.entries(FOCUS_MUSIC_TRACKS).map(([key, track]) => `<button type="button" class="${state.musicTrack === key ? "is-active" : ""}" data-profile-music="${key}"><span>${escapeHtml(track.name)}</span><small>${state.musicTrack === key ? "当前曲目" : "选择"}</small></button>`).join("")}</div>
      </section>
      <section class="profile-settings-card">
        <div class="profile-settings-heading"><span>界面与提醒</span><h2>减少不必要的打扰</h2></div>
        <div class="profile-language-row"><div><strong>语言</strong><small>选择界面语言</small></div><div class="profile-segmented is-compact" aria-label="语言"><button type="button" class="${preferences.language === "zh-CN" ? "is-active" : ""}" data-profile-language="zh-CN" aria-pressed="${preferences.language === "zh-CN"}">简体中文</button><button type="button" class="${preferences.language === "en" ? "is-active" : ""}" data-profile-language="en" aria-pressed="${preferences.language === "en"}">English</button></div></div>
        ${profileToggle("motionEffects", "动态效果", "保留场景和界面过渡")}
        ${profileToggle("reduceMotion", "减少动画", "降低大幅移动和弹跳效果")}
        ${profileToggle("hudAutoHide", "HUD 自动淡出", "无操作时隐藏沉浸控制")}
        ${profileToggle("completionSound", "完成提示音", "计时完成时播放双音提示")}
        ${profileToggle("desktopNotifications", "桌面通知", notificationDescription, preferences.desktopNotifications, !notificationSupported || Notification.permission === "denied")}
      </section>
    </div>`;
}

function renderPersonalAccount() {
  const visibleId = onlineUserId || identity.guestId;
  const shortId = `${visibleId.slice(0, 8)}…${visibleId.slice(-4)}`;
  const idLabel = onlineUserId ? "账号 ID" : "等待登录";
  const activeSession = hasActiveSeatSession();
  const subscriptionActive = state.accessStatus?.entitlementType === "subscription";
  const billingSummary = subscriptionActive
    ? `订阅状态：${escapeHtml(state.accessStatus?.subscriptionStatus || "有效")}`
    : state.accessStatus?.entitlementType === "lifetime"
      ? "终身权益已生效，无需续订"
      : state.accessStatus?.entitlementType === "admin"
        ? "开发者账号由服务端角色授权"
        : "当前没有付费订阅";
  return `
    <div class="profile-account-layout">
      <section class="profile-settings-card">
        <div class="profile-settings-heading"><span>账号资料</span><h2>你的岛上身份</h2></div>
        <label class="profile-name-field"><span>昵称</span><div><input type="text" maxlength="16" value="${escapeHtml(localizedIdentityDisplayName(identity.displayName))}" data-profile-name aria-describedby="profile-name-help" /><button type="button" data-action="save-profile-identity">保存昵称</button></div><small id="profile-name-help">1–16 个字符</small></label>
        <fieldset class="profile-avatar-field"><legend>选择角色</legend><div>${AVATAR_OPTIONS.map((avatar) => `<button type="button" class="profile-avatar-option ${identity.avatarSkin === avatar.id ? "is-active" : ""}" data-profile-avatar="${avatar.id}" aria-pressed="${identity.avatarSkin === avatar.id}"><span style="background-image:url('${avatar.image}')"></span><small>${avatar.name}</small></button>`).join("")}</div></fieldset>
        <div class="profile-local-id"><span>${idLabel}</span><code>${shortId}</code></div>
        <p class="profile-storage-note">邮箱账号用于安全分房、试用资格与跨设备记录恢复；密码由 Supabase Auth 安全管理。</p>
      </section>
      <section class="profile-settings-card">
        <div class="profile-settings-heading"><span>会员与账单</span><h2>Stripe 订阅管理</h2></div>
        <div class="profile-data-action"><div><strong>${billingSummary}</strong><small>${subscriptionActive ? "在 Stripe Customer Portal 中更新付款方式、查看账单或取消订阅" : "购买月付或年付后，可在这里管理订阅"}</small></div><button type="button" data-action="open-billing-portal" ${subscriptionActive ? "" : "disabled"}>管理账单</button></div>
      </section>
      <section class="profile-settings-card profile-password-card">
        <div class="profile-settings-heading"><span>账号安全</span><h2>修改登录密码</h2></div>
        <form class="profile-password-form" data-account-form="password">
          <label><span>当前密码</span><input type="password" name="currentPassword" autocomplete="current-password" required /></label>
          <label><span>新密码</span><input type="password" name="password" autocomplete="new-password" minlength="10" required /></label>
          <label><span>确认新密码</span><input type="password" name="confirmPassword" autocomplete="new-password" minlength="10" required /></label>
          <small>至少 10 位，并同时包含大小写字母、数字和符号。</small>
          <button type="submit">确认修改密码</button>
        </form>
      </section>
      <section class="profile-settings-card profile-data-card">
        <div class="profile-settings-heading"><span>数据管理</span><h2>重置或清理本地数据</h2></div>
        <div class="profile-data-action"><div><strong>恢复默认偏好</strong><small>不会删除账号、云端记录或当前会话</small></div><button type="button" data-confirm-profile="reset-preferences">恢复默认</button></div>
        <div class="profile-data-action"><div><strong>清空专注记录</strong><small>身份和偏好会继续保留</small></div><button type="button" data-confirm-profile="clear-history">清空记录</button></div>
        <div class="profile-data-action is-danger"><div><strong>删除账户与本地数据</strong><small>${activeSession ? "请先结束当前专注，再执行此操作" : "账号、云端记录、偏好和本地缓存都会被删除"}</small></div><button type="button" data-confirm-profile="delete-all" ${activeSession ? "disabled" : ""}>删除全部</button></div>
      </section>
    </div>`;
}

function developerToolsCopy() {
  const zh = (window.FocusI18n?.getLanguage() || preferences.language) === "zh-CN";
  return zh ? {
    nav: "开发者工具", title: "静态 MVP 开发者控制台", subtitle: "检查当前版本、在线房间和自己的测试会话。",
    cloudNote: "账号与记录云端同步", version: "产品版本", tools: "工具版本", build: "构建", environment: "运行环境",
    rooms: "在线房间", roomsHelp: "状态来自服务器快照；岛民不计入真人占座。", refresh: "刷新诊断", loading: "正在读取…",
    never: "尚未读取服务器状态", checked: "上次读取", failed: "读取失败，请重试。下方保留上次快照。", unknown: "未知",
    room: "房间", seat: "座位", available: "空位", occupied: "已占用", reserved: "预留中", moving: "换座中", mine: "我的座位",
    local: "本地岛民房间", online: "在线房间", notInRoom: "尚未入房", idle: "未开始", paused: "已暂停", running: "专注中", rest: "休息中",
    current: "本机状态", status: "计时状态", connection: "连接方式", cloudSession: "云端活动会话", noSession: "本账号没有未结束的云端专注。",
    sessionHelp: "可在海岛查询和结束自己的遗留测试会话；继续计时前需要先选择座位。", free: "自由计时", minutes: "分钟", recorded: "已记录", seconds: "秒",
    enter: "进入咖啡馆", recover: "继续或重新开始", end: "结束此测试会话", raw: "查看原始诊断数据", sessionUnavailable: "暂时无法读取本账号会话。",
    staticTools: "静态房间工具", calibration: "校准六个座位编号", calibrationHelp: "只调整热点编号的位置，不改变人物与家具。", calibrate: "开始校准",
    enterFirst: "先进入咖啡馆并打开房间视角。", reset: "恢复静态视图", resetHelp: "退出旧调试状态并恢复默认编号，保留当前计时与记录。",
    scope: "当前范围", scopeHelp: "固定六座咖啡馆、真人占座和沉浸专注。旧家具编辑器、3D 调试和未开放场景不在此控制台中。",
    mismatch: "页面和服务器版本不一致，请刷新页面后重试。", confirmEnd: "结束这轮测试专注？", confirmBody: "已记录的时长会保留。如果同一会话仍在另一设备运行，也会被结束。", cancel: "取消", ended: "测试会话已结束", noPending: "没有可结束的测试会话。",
  } : {
    nav: "Developer tools", title: "Static MVP developer console", subtitle: "Inspect the current release, shared rooms and your own test session.",
    cloudNote: "Account & cloud history", version: "App version", tools: "Tools version", build: "Build", environment: "Environment",
    rooms: "Shared rooms", roomsHelp: "Server snapshots only. Islander companions are excluded from human seat occupancy.", refresh: "Refresh diagnostics", loading: "Loading…",
    never: "Server status has not been loaded", checked: "Last checked", failed: "Could not refresh. The last snapshot is shown below.", unknown: "Unknown",
    room: "Room", seat: "Seat", available: "Available", occupied: "Occupied", reserved: "Reserved", moving: "Moving seats", mine: "My seat",
    local: "Local islander room", online: "Shared online room", notInRoom: "Not in a room", idle: "Not started", paused: "Paused", running: "Focusing", rest: "On a break",
    current: "This device", status: "Timer status", connection: "Connection", cloudSession: "Active cloud session", noSession: "This account has no unfinished cloud focus session.",
    sessionHelp: "Inspect and end your own leftover test session from the island. Choose a seat before resuming a timer.", free: "Open-ended", minutes: "min", recorded: "Recorded", seconds: "sec",
    enter: "Enter café", recover: "Resume or start again", end: "End this test session", raw: "Show diagnostic JSON", sessionUnavailable: "Your cloud session could not be loaded.",
    staticTools: "Static room tools", calibration: "Calibrate six seat labels", calibrationHelp: "Adjust label hotspots without moving characters or furniture.", calibrate: "Start calibration",
    enterFirst: "Enter the café and open the room view first.", reset: "Restore static view", resetHelp: "Leave legacy debug states and reset seat labels, keeping your timer and records.",
    scope: "Current scope", scopeHelp: "One six-seat café, shared seat occupancy and immersive focus. Legacy furniture editors, 3D debugging and unopened scenes are outside this console.",
    mismatch: "The page and server versions differ. Refresh the page before continuing.", confirmEnd: "End this test session?", confirmBody: "Recorded time will be kept. This also ends the same session if it is still running on another device.", cancel: "Cancel", ended: "Test session ended", noPending: "There is no test session to end.",
  };
}

function developerDate(value) {
  const date = new Date(value || "");
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "—";
}

function renderDeveloperTools() {
  const c = developerToolsCopy();
  const inCafeRoom = state.view === "room" && state.sceneId === "cafe";
  const diagnostics = state.developerDiagnostics;
  const release = PUBLIC_CONFIG.release || {};
  const mismatch = diagnostics?.version && diagnostics.version !== PUBLIC_CONFIG.appVersion;
  const rows = [
    [c.room, state.roomId || c.notInRoom], [c.connection, state.localRoom ? c.local : state.roomId ? c.online : c.notInRoom],
    [c.seat, state.currentSeatId || "—"], [c.status, state.sessionPhase === "rest" ? c.rest : state.isRunning ? c.running : state.sessionStartedAt ? c.paused : c.idle],
  ];
  const sessions = Array.isArray(diagnostics?.activeSessions) ? diagnostics.activeSessions : [];
  const roomCards = (diagnostics?.rooms || []).map((room) => `<article class="developer-room-card" data-developer-room="${escapeHtml(room.roomId)}">
    <header><strong>${escapeHtml(room.roomId)}</strong><span>${room.available ? `${room.occupied} / ${room.capacity}` : c.unknown}</span></header>
    <div class="developer-seat-grid">${Array.from({ length: Number(room.capacity) || 6 }, (_, index) => {
      const seat = room.seats?.find((item) => Number(item.seatId) === index + 1);
      const status = seat?.state || "unknown";
      const label = seat?.mine ? c.mine : c[status] || c.unknown;
      return `<span class="developer-seat is-${["available", "occupied", "reserved", "moving"].includes(status) ? status : "unknown"} ${seat?.mine ? "is-mine" : ""}" aria-label="${c.seat} ${index + 1}: ${escapeHtml(label)}"><b>${index + 1}</b><small>${escapeHtml(label)}</small></span>`;
    }).join("")}</div>
  </article>`).join("");
  return `<div class="developer-console" data-no-auto-i18n data-developer-tools-version="${escapeHtml(release.developerToolsVersion || "2.0")}">
    <header class="developer-console-heading"><div><span class="developer-eyebrow">DEVELOPER CONSOLE · ${escapeHtml(release.developerToolsVersion || "2.0")}</span><h2>${c.title}</h2><p>${c.subtitle}</p></div><button type="button" data-action="developer-refresh-diagnostics" ${state.developerDiagnosticsPending ? "disabled" : ""}>${state.developerDiagnosticsPending ? c.loading : c.refresh}</button></header>
    <div class="developer-release-grid">${[[c.version, PUBLIC_CONFIG.appVersion || "—"], [c.tools, release.developerToolsVersion || "2.0"], [c.environment, release.environment || "—"], [c.build, release.commit || "—"]].map(([label, value]) => `<div><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>
    ${mismatch ? `<p class="developer-message is-error" role="alert">${c.mismatch}</p>` : ""}
    ${state.developerDiagnosticsError ? `<p class="developer-message is-error" role="alert">${c.failed}</p>` : ""}
    <section class="profile-settings-card"><div class="profile-settings-heading"><span>ROOMS</span><h2>${c.rooms}</h2></div><p>${c.roomsHelp}</p><p class="developer-checked">${diagnostics?.checkedAt ? `${c.checked}: ${developerDate(diagnostics.checkedAt)}` : c.never}</p><div class="developer-rooms">${roomCards}</div></section>
    <div class="developer-details-grid"><section class="profile-settings-card"><div class="profile-settings-heading"><span>LOCAL</span><h2>${c.current}</h2></div><dl class="developer-status-grid">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>${!state.currentSeatId ? `<button type="button" class="developer-secondary" data-action="developer-enter-cafe">${c.enter}</button>` : ""}</section>
    <section class="profile-settings-card"><div class="profile-settings-heading"><span>MY SESSION</span><h2>${c.cloudSession}</h2></div><p>${c.sessionHelp}</p>
      ${!diagnostics ? `<p>${c.never}</p>` : diagnostics.activeSessions === null ? `<p role="status">${c.sessionUnavailable}</p>` : !sessions.length ? `<p class="developer-empty" data-developer-no-session>${c.noSession}</p>` : sessions.map((session) => `<article class="developer-session-card"><strong>${c[session.status] || c.unknown} · ${session.timer_mode ? `${session.timer_mode} ${c.minutes}` : c.free}</strong><time>${developerDate(session.started_at)}</time><span>${c.recorded}: ${Number(session.actual_seconds) || 0} ${c.seconds}</span><code>${escapeHtml(session.client_session_id?.slice(0, 8) || "—")}</code></article>`).join("")}
      ${sessions.length ? `<div class="developer-session-actions"><button type="button" data-action="developer-recover-focus" ${state.currentSeatId && !mismatch && !state.developerEndingSession ? "" : "disabled"}>${c.recover}</button><button type="button" class="is-danger" data-confirm-profile="developer-end-focus" ${mismatch || state.developerEndingSession ? "disabled" : ""}>${c.end}</button></div>` : ""}
    </section></div>
    <section class="profile-settings-card"><div class="profile-settings-heading"><span>STATIC MVP</span><h2>${c.staticTools}</h2></div><div class="profile-data-action"><div><strong>${c.calibration}</strong><small>${inCafeRoom ? c.calibrationHelp : c.enterFirst}</small></div><button type="button" data-action="open-static-seat-calibration" ${inCafeRoom ? "" : "disabled"}>${c.calibrate}</button></div><div class="profile-data-action"><div><strong>${c.reset}</strong><small>${c.resetHelp}</small></div><button type="button" data-action="developer-reset-static">${c.reset}</button></div><p class="profile-storage-note"><strong>${c.scope}</strong> · ${c.scopeHelp}</p></section>
    ${diagnostics ? `<details class="developer-raw"><summary>${c.raw}</summary><pre class="developer-diagnostics">${escapeHtml(JSON.stringify(diagnostics, null, 2))}</pre></details>` : ""}
  </div>`;
}

async function refreshDeveloperDiagnostics() {
  if (!state.isDeveloper || state.developerDiagnosticsPending) return;
  state.developerDiagnosticsPending = true;
  state.developerDiagnosticsError = "";
  if (state.personalCenter.open) renderPersonalCenter();
  try { state.developerDiagnostics = await api("/api/developer/diagnostics"); }
  catch (error) {
    state.developerDiagnosticsError = error.message;
    if (error.status === 401 || error.status === 403) {
      state.isDeveloper = false;
      state.personalCenter.tab = "overview";
    }
  }
  finally {
    state.developerDiagnosticsPending = false;
    if (state.personalCenter.open) renderPersonalCenter();
  }
}

function confirmDeveloperSessionEnd() {
  if (!state.isDeveloper || state.developerEndingSession || state.developerDiagnostics?.version !== PUBLIC_CONFIG.appVersion) return;
  const session = state.developerDiagnostics?.activeSessions?.[0];
  if (!session?.client_session_id) return;
  state.developerEndSession = { ...session };
  state.personalCenter.confirmAction = "developer-end-focus";
  renderPersonalCenter();
}

function renderPersonalCenterConfirm() {
  const action = state.personalCenter.confirmAction;
  if (!action) return "";
  if (action === "developer-end-focus") {
    if (!state.isDeveloper || !state.developerEndSession) return "";
    const c = developerToolsCopy();
    return `<div class="profile-confirm-backdrop" role="presentation" data-no-auto-i18n><div class="profile-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="profile-confirm-title"><h2 id="profile-confirm-title">${c.confirmEnd}</h2><p>${c.confirmBody}</p><code>${escapeHtml(state.developerEndSession.client_session_id.slice(0, 8))}</code><div><button type="button" data-action="cancel-profile-confirm">${c.cancel}</button><button type="button" class="is-danger" data-action="execute-profile-confirm">${c.end}</button></div></div></div>`;
  }
  const content = {
    "reset-preferences": ["恢复默认偏好？", "默认计时、声音、界面和提醒将恢复初始状态。", "恢复默认"],
    "clear-history": ["清空全部专注记录？", "此操作无法撤销，但不会影响身份、偏好或当前会话。", "清空记录"],
    "delete-all": ["删除账户与全部数据？", "账号、云端专注记录、偏好和本地缓存都会被删除，此操作无法撤销。", "确认删除"],
  }[action];
  if (!content) return "";
  return `<div class="profile-confirm-backdrop" role="presentation"><div class="profile-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="profile-confirm-title"><span>请确认</span><h2 id="profile-confirm-title">${content[0]}</h2><p>${content[1]}</p><div><button type="button" data-action="cancel-profile-confirm">取消</button><button type="button" class="is-danger" data-action="execute-profile-confirm">${content[2]}</button></div></div></div>`;
}

async function executeProfileDataAction() {
  const action = state.personalCenter.confirmAction;
  state.personalCenter.confirmAction = null;
  if (action === "developer-end-focus") {
    if (!state.isDeveloper || state.developerEndingSession) return;
    const session = state.developerEndSession;
    state.developerEndSession = null;
    if (!session) return;
    state.developerEndingSession = true;
    renderPersonalCenter();
    try {
      if (state.cloudFocusClientId === session.client_session_id && isActiveFocusSession()) {
        closePersonalCenter();
        await finishSession();
      } else {
        await api(`/api/focus/sessions/${encodeURIComponent(session.client_session_id)}`, {
          method: "PATCH", body: JSON.stringify({ status: "interrupted", actualSeconds: Number(session.actual_seconds) || 0, pausedSeconds: 0 }),
        });
      }
      await refreshDeveloperDiagnostics();
      showToast(developerToolsCopy().ended);
    } catch (error) {
      state.developerDiagnosticsError = error.message;
      if (state.personalCenter.open) renderPersonalCenter();
    } finally {
      state.developerEndingSession = false;
      if (state.personalCenter.open) renderPersonalCenter();
    }
    return;
  }
  if (action === "reset-preferences") {
    preferences = defaultPreferences();
    applyPreferencesToState();
    savePreferences();
    persistActiveSession(true);
    renderPersonalCenter();
    showToast("偏好已恢复默认");
    return;
  }
  if (action === "clear-history") {
    localStorage.removeItem(STORAGE_KEYS.history);
    renderPersonalCenter();
    showToast("专注记录已清空");
    return;
  }
  if (action === "delete-all") {
    if (hasActiveSeatSession()) {
      renderPersonalCenter();
      showToast("请先结束当前专注，再删除全部本地数据");
      return;
    }
    try {
      const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" } });
      if (!response.ok && response.status !== 401) throw new Error("account_delete_failed");
    } catch (_) {
      renderPersonalCenter();
      showToast("云端账户暂时无法删除，请稍后重试");
      return;
    }
    onlineIdentityPromise = null;
    onlineUserId = null;
    [STORAGE_KEYS.activeSession, STORAGE_KEYS.history, STORAGE_KEYS.guestIdentity, STORAGE_KEYS.preferences].forEach((key) => localStorage.removeItem(key));
    preferences = defaultPreferences();
    identity = getOrCreateIdentity();
    applyPreferencesToState({ includeTimer: true });
    closePersonalCenter();
    state.view = "welcome";
    render();
    showToast("账户与本地数据已删除");
  }
}

function renderWelcomeLegacy() {
  const english = window.FocusI18n?.getLanguage() === "en"
    || (!window.FocusI18n && !/^zh\b/i.test(window.navigator.language || ""));
  const copy = english ? {
    brandTag: "A quiet place to begin",
    navHow: "How it works",
    navWhy: "Why it works",
    navPricing: "Pricing",
    navCta: "Try one session",
    heroKicker: "A focus space for people who work alone",
    heroTitle: "Make starting\nfeel lighter.",
    heroBody: "Step into a quiet café, choose a seat, and let the room carry you from “I should start” to actually beginning.",
    heroCta: "Start 25 minutes free",
    heroSecondary: "See how it works",
    heroNote: "No camera · No chat · Your first session is free",
    openNow: "Open now",
    cafe: "Four Seasons Café",
    focusReady: "Your quiet table is ready",
    focusMode: "FIRST SESSION · 25 MIN",
    focusStatus: "Quiet company · no social pressure",
    bridgeEyebrow: "THE HARDEST PART IS THE THRESHOLD",
    bridgeTitle: "You may not need more discipline.\nYou may need somewhere to begin.",
    bridgeBody: "A timer can count the minutes, but it cannot create the small transition between daily life and focused work. Focus Isle turns that transition into a place you can enter.",
    bridgeA: "Leave the noise",
    bridgeB: "Choose a seat",
    bridgeC: "Begin one thing",
    howEyebrow: "FROM INTENTION TO ACTION",
    howTitle: "One island. One café.\nOne clear path into focus.",
    howBody: "No room lists, character controls, or setup maze. This version keeps the journey intentionally short.",
    step1Title: "Arrive on the island",
    step1Body: "The café is the only open destination today, so there is nothing to compare or configure.",
    step2Title: "Choose your seat",
    step2Body: "We place you in a small six-seat café. Pick an open seat and settle into the quiet company around you.",
    step3Title: "Let the interface disappear",
    step3Body: "Choose 25 minutes and begin. Café ambience, white noise, and soft music stay under your control.",
    howCta: "Take a seat",
    presenceEyebrow: "PRESENCE WITHOUT PERFORMANCE",
    presenceTitle: "Feel accompanied,\nwithout having to be seen.",
    presenceBody: "Focus Isle keeps the comfort of a shared room and removes the parts that turn presence into pressure.",
    noCamera: "No camera",
    noCameraBody: "Show up exactly as you are. Nothing to prepare and no feeling of being watched.",
    noChat: "No chat or DMs",
    noChatBody: "No introductions, notifications, or expectation to reply while you work.",
    noFeed: "No feed to perform for",
    noFeedBody: "There are no streak competitions, status posts, or social tasks pulling you away.",
    offerEyebrow: "TRY THE EXPERIENCE FIRST",
    offerTitle: "Finish one real session.\nThen decide if it belongs in your day.",
    offerBody: "Create an account when you begin. Your first 25-minute focus session is free; continued access uses one of the plans below.",
    trial: "First session",
    trialPrice: "$0",
    trialLine: "One complete 25-minute session",
    monthly: "Monthly",
    monthlyPrice: "$4.99",
    monthlyLine: "Flexible access to the core focus experience",
    annual: "Annual",
    annualPrice: "$19.99",
    annualLine: "A quieter commitment for the whole year",
    annualBadge: "Best value",
    founder: "Founder lifetime",
    founderPrice: "$39.99",
    founderLine: "One-time payment while founder access remains available",
    priceNote: "USD pricing. Taxes, eligibility, and final availability are confirmed in Stripe Checkout. Focus Isle is currently in beta.",
    finalEyebrow: "YOUR NEXT 25 MINUTES",
    finalTitle: "You do not need to fix the whole day.\nJust find a seat.",
    finalBody: "Enter the café, let the room get quiet, and begin with the next small thing.",
    finalCta: "Start my free session",
    footerLine: "A quiet place to focus, with company and without interruption.",
    privacy: "Privacy",
    terms: "Terms",
    beta: "Interactive beta · v1.1",
  } : {
    brandTag: "一个更容易开始的地方",
    navHow: "如何使用",
    navWhy: "为什么有效",
    navPricing: "价格",
    navCta: "免费试一次",
    heroKicker: "为独自工作的人，准备的沉浸式专注空间",
    heroTitle: "让开始专注，\n变得轻一点。",
    heroBody: "走进一间安静的咖啡馆，选一个座位，让场景、声音和陪伴替你完成从“想做”到“开始做”的切换。",
    heroCta: "免费开始 25 分钟",
    heroSecondary: "看看它如何工作",
    heroNote: "无需摄像头 · 没有聊天 · 第一次专注免费",
    openNow: "当前开放",
    cafe: "四时咖啡馆",
    focusReady: "你的安静座位已经准备好",
    focusMode: "首次体验 · 25 分钟",
    focusStatus: "安静陪伴 · 没有社交压力",
    bridgeEyebrow: "最难的不是坚持，而是跨过开始的门槛",
    bridgeTitle: "你也许不缺自律。\n只是缺一个开始的地方。",
    bridgeBody: "计时器可以计算分钟，却不能替你完成从日常生活切换到专注工作的那一步。专注岛把这一步，变成一个可以走进去的空间。",
    bridgeA: "离开杂音",
    bridgeB: "选一个座位",
    bridgeC: "只开始一件事",
    howEyebrow: "从想做，到真的开始",
    howTitle: "一座岛，一间咖啡馆，\n一条清楚的专注路径。",
    howBody: "没有房间列表、角色操控和复杂设置。当前版本刻意把进入专注的旅程缩短。",
    step1Title: "抵达海岛",
    step1Body: "咖啡馆是当前唯一开放的目的地，不需要比较，也不用做复杂选择。",
    step2Title: "找个位置坐下",
    step2Body: "系统会把你带进一间六座小咖啡馆。选一个空位，在安静的陪伴感里坐下。",
    step3Title: "让界面退到身后",
    step3Body: "选择 25 分钟并开始。咖啡馆环境、白噪音和轻音乐都可以独立控制。",
    howCta: "去选一个座位",
    presenceEyebrow: "有陪伴感，不需要表演",
    presenceTitle: "有陪伴感，\n但你不必被看见。",
    presenceBody: "专注岛保留身边有人一起安静做事的感觉，同时拿走那些会把陪伴变成压力的东西。",
    noCamera: "不开摄像头",
    noCameraBody: "不用整理自己，也不需要承担一直被注视的感觉。",
    noChat: "没有聊天与私信",
    noChatBody: "不必自我介绍，没有消息提醒，也没有必须及时回应的关系。",
    noFeed: "没有需要经营的动态",
    noFeedBody: "没有连胜排名、状态发布或社交任务把注意力从工作上拿走。",
    offerEyebrow: "先体验，再决定",
    offerTitle: "先完成一次真正的专注，\n再决定它是否适合你的日常。",
    offerBody: "第一次开始时注册账号，可免费完成一次 25 分钟专注。继续使用时，再从下面的方案中选择。",
    trial: "首次体验",
    trialPrice: "$0",
    trialLine: "一次完整的 25 分钟专注",
    monthly: "月付",
    monthlyPrice: "$4.99",
    monthlyLine: "灵活使用当前核心专注体验",
    annual: "年付",
    annualPrice: "$19.99",
    annualLine: "用更低成本保留一整年的专注空间",
    annualBadge: "更划算",
    founder: "创始终身版",
    founderPrice: "$39.99",
    founderLine: "创始权益仍开放时可一次性购买",
    priceNote: "美元定价；税费、购买资格和最终可售状态以 Stripe Checkout 为准。专注岛当前处于内测阶段。",
    finalEyebrow: "从接下来的 25 分钟开始",
    finalTitle: "不需要修好一整天。\n先找个位置坐下。",
    finalBody: "进入咖啡馆，让画面安静下来，从眼前最小的一件事开始。",
    finalCta: "开始我的免费专注",
    footerLine: "一个有人陪伴、互不打扰的沉浸式专注空间。",
    privacy: "隐私政策",
    terms: "服务条款",
    beta: "可交互内测 · v1.1",
  };

  const lines = (value) => value.split("\n").map((line) => `<span>${line}</span>`).join("");
  const logo = `
    <span class="landing-brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="7" r="2.2" fill="currentColor" stroke="none" />
        <path d="M4.5 16.2c2.1-3.1 4.6-4.7 7.5-4.7s5.4 1.6 7.5 4.7" />
        <path d="M3.5 18.7c2.7-1.1 5.5-1.1 8.3 0s5.7 1.1 8.7-.1" />
      </svg>
    </span>`;

  app.innerHTML = `
    <div class="landing-page landing-v2" id="top">
      <header class="landing-v2-nav">
        <a class="landing-v2-brand" href="#top" aria-label="Focus Isle">
          ${logo}<span><strong>${english ? "Focus Isle" : "专注岛"}</strong><small>${copy.brandTag}</small></span>
        </a>
        <nav aria-label="${english ? "Landing page" : "落地页导航"}">
          <a href="#how">${copy.navHow}</a>
          <a href="#why">${copy.navWhy}</a>
          <a href="#pricing">${copy.navPricing}</a>
        </nav>
        <button class="landing-v2-nav-cta" data-action="enter-island">${copy.navCta}<span aria-hidden="true">↗</span></button>
      </header>

      <main>
        <section class="landing-v2-hero" aria-labelledby="welcome-title">
          <div class="landing-v2-orb landing-v2-orb-a" aria-hidden="true"></div>
          <div class="landing-v2-orb landing-v2-orb-b" aria-hidden="true"></div>
          <div class="landing-v2-hero-copy">
            <p class="landing-v2-eyebrow"><span></span>${copy.heroKicker}</p>
            <h1 id="welcome-title">${lines(copy.heroTitle)}</h1>
            <p class="landing-v2-lead">${copy.heroBody}</p>
            <div class="landing-v2-actions">
              <button class="landing-v2-primary" data-action="enter-island">${copy.heroCta}<span aria-hidden="true">→</span></button>
              <a class="landing-v2-text-link" href="#how">${copy.heroSecondary}<span aria-hidden="true">↓</span></a>
            </div>
            <p class="landing-v2-note">${copy.heroNote}</p>
          </div>

          <div class="landing-v2-product" aria-label="${copy.cafe}">
            <div class="landing-v2-product-frame">
              <div class="landing-v2-product-bar"><i></i><i></i><i></i><span>focus-isle.app / café</span></div>
              <img src="${scenes.cafe.image}" alt="${copy.cafe}" />
              <div class="landing-v2-product-card">
                <span>${copy.focusMode}</span>
                <strong>25:00</strong>
                <small>${copy.focusReady}</small>
              </div>
              <div class="landing-v2-open-pill"><span></span>${copy.openNow} · ${copy.cafe}</div>
            </div>
            <p class="landing-v2-product-caption"><span>◌</span>${copy.focusStatus}</p>
          </div>
          <span class="landing-v2-version">${copy.beta}</span>
        </section>

        <section class="landing-v2-bridge" id="story" aria-labelledby="problem-title">
          <div class="landing-v2-shell landing-v2-bridge-grid">
            <div>
              <p class="landing-v2-eyebrow">${copy.bridgeEyebrow}</p>
              <h2 id="problem-title">${lines(copy.bridgeTitle)}</h2>
            </div>
            <div class="landing-v2-bridge-copy">
              <p>${copy.bridgeBody}</p>
              <div class="landing-v2-threshold" aria-label="${copy.bridgeA}, ${copy.bridgeB}, ${copy.bridgeC}">
                <span>01<small>${copy.bridgeA}</small></span><i>→</i>
                <span>02<small>${copy.bridgeB}</small></span><i>→</i>
                <span>03<small>${copy.bridgeC}</small></span>
              </div>
            </div>
          </div>
        </section>

        <section class="landing-v2-how" id="how" aria-labelledby="how-title">
          <div class="landing-v2-shell">
            <div class="landing-v2-section-head">
              <div><p class="landing-v2-eyebrow">${copy.howEyebrow}</p><h2 id="how-title">${lines(copy.howTitle)}</h2></div>
              <p>${copy.howBody}</p>
            </div>
            <div class="landing-v2-steps">
              <article>
                <div class="landing-v2-step-visual"><img src="${islandImage}" alt="${copy.step1Title}" loading="lazy" /><span>01</span></div>
                <h3>${copy.step1Title}</h3><p>${copy.step1Body}</p>
              </article>
              <article>
                <div class="landing-v2-step-visual"><img src="${scenes.cafe.image}" alt="${copy.step2Title}" loading="lazy" /><span>02</span></div>
                <h3>${copy.step2Title}</h3><p>${copy.step2Body}</p>
              </article>
              <article>
                <div class="landing-v2-step-visual"><img src="${ASSET_BASE}20261028-cafe-rain-clearing-focus-view.webp" alt="${copy.step3Title}" loading="lazy" /><span>03</span></div>
                <h3>${copy.step3Title}</h3><p>${copy.step3Body}</p>
              </article>
            </div>
            <div class="landing-v2-center-action"><button class="landing-v2-primary" data-action="enter-island">${copy.howCta}<span aria-hidden="true">→</span></button></div>
          </div>
        </section>

        <section class="landing-v2-presence" id="why" aria-labelledby="presence-title">
          <div class="landing-v2-shell">
            <div class="landing-v2-presence-intro">
              <p class="landing-v2-eyebrow">${copy.presenceEyebrow}</p>
              <h2 id="presence-title">${lines(copy.presenceTitle)}</h2>
              <p>${copy.presenceBody}</p>
            </div>
            <div class="landing-v2-principles">
              <article><span>01</span><h3>${copy.noCamera}</h3><p>${copy.noCameraBody}</p></article>
              <article><span>02</span><h3>${copy.noChat}</h3><p>${copy.noChatBody}</p></article>
              <article><span>03</span><h3>${copy.noFeed}</h3><p>${copy.noFeedBody}</p></article>
            </div>
          </div>
        </section>

        <section class="landing-v2-offer" id="pricing" aria-labelledby="pricing-title">
          <div class="landing-v2-shell">
            <div class="landing-v2-offer-head">
              <p class="landing-v2-eyebrow">${copy.offerEyebrow}</p>
              <h2 id="pricing-title">${lines(copy.offerTitle)}</h2>
              <p>${copy.offerBody}</p>
            </div>
            <div class="landing-v2-price-grid">
              <article class="landing-v2-price landing-v2-price-trial"><span>${copy.trial}</span><strong>${copy.trialPrice}</strong><p>${copy.trialLine}</p><button data-action="enter-island">${copy.navCta}<i>→</i></button></article>
              <article class="landing-v2-price"><span>${copy.monthly}</span><strong>${copy.monthlyPrice}<small>/mo</small></strong><p>${copy.monthlyLine}</p></article>
              <article class="landing-v2-price landing-v2-price-featured"><em>${copy.annualBadge}</em><span>${copy.annual}</span><strong>${copy.annualPrice}<small>/yr</small></strong><p>${copy.annualLine}</p></article>
              <article class="landing-v2-price"><span>${copy.founder}</span><strong>${copy.founderPrice}</strong><p>${copy.founderLine}</p></article>
            </div>
            <p class="landing-v2-price-note">${copy.priceNote}</p>
          </div>
        </section>

        <section class="landing-v2-final" aria-labelledby="final-cta-title">
          <img src="${ASSET_BASE}20261028-cafe-rain-clearing-focus-view.webp" alt="" aria-hidden="true" loading="lazy" />
          <div class="landing-v2-final-overlay"></div>
          <div class="landing-v2-final-copy">
            <p class="landing-v2-eyebrow">${copy.finalEyebrow}</p>
            <h2 id="final-cta-title">${lines(copy.finalTitle)}</h2>
            <p>${copy.finalBody}</p>
            <button class="landing-v2-primary" data-action="enter-island">${copy.finalCta}<span aria-hidden="true">→</span></button>
          </div>
        </section>
      </main>

      <footer class="landing-v2-footer">
        <div class="landing-v2-shell">
          <a class="landing-v2-brand" href="#top">${logo}<span><strong>${english ? "Focus Isle" : "专注岛"}</strong><small>${copy.brandTag}</small></span></a>
          <p>${copy.footerLine}</p>
          <div><a href="/privacy">${copy.privacy}</a><a href="/terms">${copy.terms}</a><button data-action="enter-island">${copy.navCta} →</button></div>
        </div>
      </footer>
    </div>`;
}


const LANDING_COPY = (() => {
  const en = {
    label:"English",navHow:"How it works",navWhy:"Why it works",navPricing:"Pricing",signIn:"Sign in",startFree:"Start free",heroKicker:"IMMERSIVE FOCUS SPACE",heroTitle:"Find Your Quiet.",heroLead:"Step onto the island and begin with 25 calm minutes.",heroCta:"Start 25 Minutes Free",heroMeta:"No camera · No chat · Your first session is free",explore:"SCROLL TO EXPLORE",cafe:"Café",academy:"Academy",lakeside:"Lakeside",seaside:"Seaside",snow:"Snowy Mountain",openNow:"OPEN NOW",comingSoon:"COMING SOON",whyKicker:"WHY FOCUS ISLE",whyTitle:"The hardest part isn't focus. It's starting.",whyBody:"Focus Isle turns the moment before work into a place you can enter—quiet, visual, and free from social pressure.",card1Title:"One island",card1Body:"A clear threshold between everyday noise and the work ahead.",card2Title:"Five places",card2Body:"Café, academy, lakeside, seaside, and snowy mountain—each with a different rhythm.",card3Title:"25 minutes",card3Body:"One calm first session. Enough time to begin without carrying the whole day.",howKicker:"HOW IT WORKS",howTitle:"Three gentle shifts into focus.",step1Title:"Choose a place",step1Body:"Start with the atmosphere you need today. The café is open now; more destinations are on the way.",step2Title:"Take a quiet seat",step2Body:"Enter a small room, choose an open seat, and settle in without cameras, chat, or introductions.",step3Title:"Let everything else disappear",step3Body:"Begin 25 minutes and keep only the timer, the ambience, and the work in front of you.",pricingKicker:"START FREE",pricingTitle:"Try one real session. Stay if it helps.",pricingBody:"Your first 25-minute focus session is free. Choose a plan only after you have felt the experience.",first:"First session",firstBody:"One complete 25-minute focus.",monthly:"Monthly",monthlyBody:"Flexible access to the core experience.",annual:"Annual",annualBody:"A quieter commitment for the year.",lifetime:"Founder lifetime",lifetimeBody:"One payment while founder access remains available.",finalTitle:"Your next 25 minutes can start here.",finalBody:"You do not need the whole day figured out. Just choose a place and begin.",finalCta:"Start My Free Session",privacy:"Privacy",terms:"Terms"
  };
  const languages = {
    en,
    "zh-CN": {...en,label:"简体中文",navHow:"如何使用",navWhy:"为什么有效",navPricing:"价格",signIn:"登录",startFree:"免费开始",heroKicker:"沉浸式专注空间",heroTitle:"找到你的安静。",heroLead:"登上专注岛，从平静的 25 分钟开始。",heroCta:"免费开始 25 分钟",heroMeta:"无需摄像头 · 没有聊天 · 第一次专注免费",explore:"向下探索",cafe:"咖啡馆",academy:"学院",lakeside:"湖畔",seaside:"海滨",snow:"雪山",openNow:"当前开放",comingSoon:"即将开放",whyKicker:"为什么选择专注岛",whyTitle:"最难的不是专注，而是开始。",whyBody:"专注岛把开始工作前的那一刻，变成一个可以进入的空间：安静、可感知，也没有社交压力。",card1Title:"一座岛",card1Body:"在日常杂音与眼前任务之间，建立一个清楚的入口。",card2Title:"五个地方",card2Body:"咖啡馆、学院、湖畔、海滨与雪山，每个地方都有不同节奏。",card3Title:"25 分钟",card3Body:"一次平静的首次专注，不需要背负一整天。",howKicker:"如何使用",howTitle:"三个温和的切换，进入专注。",step1Title:"选择一个地方",step1Body:"从今天需要的氛围开始。咖啡馆当前开放，更多地点正在准备。",step2Title:"找个安静座位",step2Body:"进入一间小房间，选一个空位，不开摄像头，也不需要聊天。",step3Title:"让其他东西退到身后",step3Body:"开始 25 分钟，只留下计时、环境声和眼前的事情。",pricingKicker:"免费开始",pricingTitle:"先完成一次真实专注，再决定是否留下。",pricingBody:"第一次 25 分钟专注免费。先体验，再选择适合的方案。",first:"首次体验",firstBody:"一次完整的 25 分钟专注。",monthly:"月付",monthlyBody:"灵活使用核心专注体验。",annual:"年付",annualBody:"用更低成本保留一整年。",lifetime:"创始终身版",lifetimeBody:"创始权益开放期间一次性购买。",finalTitle:"接下来的 25 分钟，可以从这里开始。",finalBody:"不必先想好一整天。选一个地方，然后开始。",finalCta:"开始我的免费专注",privacy:"隐私政策",terms:"服务条款"},
    "zh-TW": {...en,label:"繁體中文",navHow:"如何使用",navWhy:"為什麼有效",navPricing:"價格",signIn:"登入",startFree:"免費開始",heroKicker:"沉浸式專注空間",heroTitle:"找到你的安靜。",heroLead:"登上專注島，從平靜的 25 分鐘開始。",heroCta:"免費開始 25 分鐘",heroMeta:"無需攝影機 · 沒有聊天 · 第一次專注免費",explore:"向下探索",cafe:"咖啡館",academy:"學院",lakeside:"湖畔",seaside:"海濱",snow:"雪山",openNow:"目前開放",comingSoon:"即將開放",whyKicker:"為什麼選擇專注島",whyTitle:"最難的不是專注，而是開始。",whyBody:"專注島把開始工作前的那一刻，變成一個可以進入的安靜空間。",howKicker:"如何使用",howTitle:"三個溫和的切換，進入專注。",pricingKicker:"免費開始",pricingTitle:"先完成一次真實專注，再決定是否留下。",finalTitle:"接下來的 25 分鐘，可以從這裡開始。",finalCta:"開始我的免費專注",privacy:"隱私政策",terms:"服務條款"},
    ja: {...en,label:"日本語",navHow:"使い方",navWhy:"選ばれる理由",navPricing:"料金",signIn:"ログイン",startFree:"無料で始める",heroKicker:"没入型フォーカス空間",heroTitle:"自分の静けさを。",heroLead:"集中島に渡り、穏やかな25分から始めましょう。",heroCta:"25分間、無料で始める",heroMeta:"カメラ不要 · チャットなし · 初回セッション無料",explore:"下へスクロール",cafe:"カフェ",academy:"アカデミー",lakeside:"湖畔",seaside:"海辺",snow:"雪山",openNow:"営業中",comingSoon:"近日公開",whyKicker:"FOCUS ISLE の理由",whyTitle:"難しいのは集中ではなく、始めること。",whyBody:"仕事を始める直前の時間を、静かで視覚的な場所へ変えます。",howKicker:"使い方",howTitle:"集中へ向かう、三つの穏やかな切り替え。",pricingKicker:"無料で始める",pricingTitle:"まず一度、実際に集中してみましょう。",finalTitle:"次の25分は、ここから始められます。",finalCta:"無料セッションを始める"},
    ko: {...en,label:"한국어",navHow:"이용 방법",navWhy:"효과가 있는 이유",navPricing:"요금",signIn:"로그인",startFree:"무료 시작",heroKicker:"몰입형 집중 공간",heroTitle:"나만의 고요를 찾으세요.",heroLead:"집중의 섬에 올라 평온한 25분으로 시작하세요.",heroCta:"25분 무료로 시작",heroMeta:"카메라 없음 · 채팅 없음 · 첫 집중 무료",explore:"아래로 탐색",cafe:"카페",academy:"아카데미",lakeside:"호숫가",seaside:"해변",snow:"설산",openNow:"현재 운영 중",comingSoon:"곧 공개",whyKicker:"FOCUS ISLE을 선택하는 이유",whyTitle:"어려운 건 집중이 아니라 시작입니다.",whyBody:"일을 시작하기 전의 순간을 조용하고 시각적인 공간으로 바꿉니다.",howKicker:"이용 방법",howTitle:"집중으로 이어지는 세 번의 부드러운 전환.",pricingKicker:"무료 시작",pricingTitle:"한 번 직접 집중해 보고 결정하세요.",finalTitle:"다음 25분은 여기서 시작할 수 있습니다.",finalCta:"무료 집중 시작"},
    es: {...en,label:"Español",navHow:"Cómo funciona",navWhy:"Por qué funciona",navPricing:"Precios",signIn:"Entrar",startFree:"Empezar gratis",heroKicker:"ESPACIO DE CONCENTRACIÓN INMERSIVO",heroTitle:"Encuentra tu calma.",heroLead:"Llega a la isla y comienza con 25 minutos de calma.",heroCta:"Empieza 25 minutos gratis",heroMeta:"Sin cámara · Sin chat · Primera sesión gratis",explore:"DESLIZA PARA EXPLORAR",cafe:"Cafetería",academy:"Academia",lakeside:"Lago",seaside:"Costa",snow:"Montaña nevada",openNow:"ABIERTO",comingSoon:"PRÓXIMAMENTE",whyKicker:"POR QUÉ FOCUS ISLE",whyTitle:"Lo difícil no es concentrarse. Es empezar.",whyBody:"Focus Isle convierte el momento antes de trabajar en un lugar tranquilo al que puedes entrar.",howKicker:"CÓMO FUNCIONA",howTitle:"Tres cambios suaves hacia la concentración.",pricingKicker:"EMPIEZA GRATIS",pricingTitle:"Prueba una sesión real. Quédate si te ayuda.",finalTitle:"Tus próximos 25 minutos pueden empezar aquí.",finalCta:"Empezar mi sesión gratis"},
    fr: {...en,label:"Français",navHow:"Comment ça marche",navWhy:"Pourquoi ça marche",navPricing:"Tarifs",signIn:"Connexion",startFree:"Commencer gratuitement",heroKicker:"ESPACE DE CONCENTRATION IMMERSIF",heroTitle:"Trouvez votre calme.",heroLead:"Rejoignez l’île et commencez par 25 minutes de calme.",heroCta:"Commencer 25 min gratuitement",heroMeta:"Sans caméra · Sans chat · Première session offerte",explore:"DÉFILER POUR EXPLORER",cafe:"Café",academy:"Académie",lakeside:"Bord du lac",seaside:"Bord de mer",snow:"Montagne enneigée",openNow:"OUVERT",comingSoon:"BIENTÔT",whyKicker:"POURQUOI FOCUS ISLE",whyTitle:"Le plus difficile n’est pas de se concentrer. C’est de commencer.",whyBody:"Focus Isle transforme l’instant avant le travail en un lieu calme où entrer.",howKicker:"COMMENT ÇA MARCHE",howTitle:"Trois transitions douces vers la concentration.",pricingKicker:"COMMENCER GRATUITEMENT",pricingTitle:"Essayez une vraie session. Restez si elle vous aide.",finalTitle:"Vos prochaines 25 minutes peuvent commencer ici.",finalCta:"Commencer ma session gratuite"},
    de: {...en,label:"Deutsch",navHow:"So funktioniert es",navWhy:"Warum es wirkt",navPricing:"Preise",signIn:"Anmelden",startFree:"Kostenlos starten",heroKicker:"IMMERSIVER FOKUSRAUM",heroTitle:"Finde deine Ruhe.",heroLead:"Betritt die Insel und beginne mit 25 ruhigen Minuten.",heroCta:"25 Minuten kostenlos starten",heroMeta:"Keine Kamera · Kein Chat · Erste Sitzung kostenlos",explore:"NACH UNTEN ENTDECKEN",cafe:"Café",academy:"Akademie",lakeside:"Seeufer",seaside:"Küste",snow:"Schneeberg",openNow:"GEÖFFNET",comingSoon:"BALD",whyKicker:"WARUM FOCUS ISLE",whyTitle:"Das Schwerste ist nicht der Fokus. Es ist der Anfang.",whyBody:"Focus Isle macht aus dem Moment vor der Arbeit einen ruhigen Ort, den du betreten kannst.",howKicker:"SO FUNKTIONIERT ES",howTitle:"Drei sanfte Schritte in den Fokus.",pricingKicker:"KOSTENLOS STARTEN",pricingTitle:"Teste eine echte Sitzung. Bleib, wenn sie hilft.",finalTitle:"Deine nächsten 25 Minuten können hier beginnen.",finalCta:"Kostenlose Sitzung starten"},
    pt: {...en,label:"Português",navHow:"Como funciona",navWhy:"Por que funciona",navPricing:"Preços",signIn:"Entrar",startFree:"Começar grátis",heroKicker:"ESPAÇO DE FOCO IMERSIVO",heroTitle:"Encontre sua calma.",heroLead:"Entre na ilha e comece com 25 minutos de calma.",heroCta:"Começar 25 minutos grátis",heroMeta:"Sem câmera · Sem chat · Primeira sessão grátis",explore:"ROLE PARA EXPLORAR",cafe:"Café",academy:"Academia",lakeside:"Lago",seaside:"Litoral",snow:"Montanha nevada",openNow:"ABERTO",comingSoon:"EM BREVE",whyKicker:"POR QUE FOCUS ISLE",whyTitle:"O mais difícil não é focar. É começar.",whyBody:"Focus Isle transforma o momento antes do trabalho em um lugar calmo para entrar.",howKicker:"COMO FUNCIONA",howTitle:"Três transições suaves para o foco.",pricingKicker:"COMEÇAR GRÁTIS",pricingTitle:"Experimente uma sessão real. Fique se ajudar.",finalTitle:"Seus próximos 25 minutos podem começar aqui.",finalCta:"Começar minha sessão grátis"}
  };
  return languages;
})();

const LANDING_DETAIL_COPY = {
  en: {
    navWhy: "Experience",
    navWorlds: "Worlds",
    navFaq: "FAQ",
    heroKicker: "YOUR ISLAND OF ATTENTION",
    heroTitle: "Your focus has a place.",
    heroLead: "Choose a quiet corner. Take a breath. Begin with what matters.",
    heroCta: "Enter the café",
    heroMeta: "No camera · No chat · No pressure",
    cafeMood: "Warm light · quiet company · soft rain",
    academyMood: "Turning pages · fireplace · deep work",
    creek: "Moss Creek",
    creekMood: "Running water · green shade · room to breathe",
    sceneCafeKicker: "RAIN AT THE WINDOW",
    sceneAcademyKicker: "A ROOM FOR LONG THOUGHTS",
    sceneCreekKicker: "OPEN AIR, CLEAR MIND",
    manifestoKicker: "FOR THE MOMENT BEFORE FOCUS",
    manifestoTitle: "You don’t need more pressure. You need a place that makes beginning feel lighter.",
    manifestoBody: "Come as you are. Choose one quiet corner. Let the room hold the noise while you do one thing that matters.",
    howTitle: "Arrive. Sit. Begin.",
    howBody: "Three small steps between the noise outside and the work in front of you.",
    step1Label: "ARRIVE",
    step1Title: "Leave the noise outside.",
    step1Body: "Step onto the island and enter the café that is open today.",
    step2Label: "TAKE YOUR PLACE",
    step2Title: "Find a corner that feels yours.",
    step2Body: "Choose one of six seats. Your place appears, and the room gets out of the way.",
    step3Label: "BEGIN GENTLY",
    step3Title: "Give one thing your attention.",
    step3Body: "Set the time. Keep only the sounds you want. Let everything else wait.",
    experienceKicker: "INSIDE A FOCUS SESSION",
    experienceTitle: "Held by the room. Free to do the work.",
    experienceBody: "A little atmosphere, a little structure, and less to think about.",
    experienceVisual: "A quiet place for the thing that matters.",
    experience1Title: "A gentle beginning.",
    experience1Body: "Choose 25 minutes, 50 minutes, or simply count upward. No complicated setup.",
    experience2Title: "A room that stays with you.",
    experience2Body: "Blend café ambience, white noise, and quiet music until the space feels right.",
    experience3Title: "Space to disappear into the work.",
    experience3Body: "The controls fade when you no longer need them. Pause, return, or recover after a refresh without losing the thread.",
    worldsKicker: "THE ISLAND IS GROWING",
    worldsTitle: "Different days need different kinds of quiet.",
    worldsBody: "Some days need rain at the window. Others need pages, water, or snow. The café is open; the rest of the island is on its way.",
    openWorldBody: "Warm light, quiet company, and rain beyond the glass.",
    futureKicker: "COMING NEXT",
    futureTitle: "More places to meet yourself.",
    futureBody: "Each new world will offer a different atmosphere, without adding more pressure.",
    pricingKicker: "SIMPLE ACCESS",
    pricingTitle: "Stay when it helps.",
    pricingBody: "Try one free 25-minute session. Continue only if the island earns a place in your routine.",
    monthlyBody: "Come and go with no long commitment.",
    annualBody: "Make the island part of your rhythm.",
    lifetimeBody: "For early supporters who want to stay.",
    chooseMonthly: "Choose monthly",
    chooseAnnual: "Choose annual",
    chooseLifetime: "Get founder access",
    faqKicker: "QUESTIONS, ANSWERED CALMLY",
    faqTitle: "Before you take a seat.",
    faqBody: "Everything you need to know before starting your first session.",
    faq1Q: "What is Focus Isle?",
    faq1A: "Focus Isle is a browser-based focus experience. Enter a virtual island, choose a quiet space, take a seat, and begin a timed or open-ended session.",
    faq2Q: "Which focus world can I use today?",
    faq2A: "Canal Café is open now. Old Academy, Moss Creek, Lakeside, Seaside, and Snowfield are coming soon.",
    faq3Q: "Do I need a camera or microphone?",
    faq3A: "No. Focus Isle does not require a camera, microphone, or live chat.",
    faq4Q: "What is included in the free session?",
    faq4A: "Your first session can run for up to 25 minutes and includes the café view, timer, and available sound controls.",
    finalKicker: "THE CAFÉ IS OPEN",
    finalTitle: "You don’t have to feel ready. Just take a seat.",
    finalBody: "Start with 25 quiet minutes. That is enough for today.",
    finalCta: "Start free for 25 minutes",
    footerBody: "Immersive focus spaces for deep work, quiet study, and calmer beginnings.",
    account: "Account",
    refund: "Refund policy",
  },
  "zh-CN": {
    navWhy: "专注体验",
    navWorlds: "场景",
    navFaq: "常见问题",
    heroKicker: "你的注意力之岛",
    heroTitle: "专注，也可以有一个地方。",
    heroLead: "选一个安静角落。深呼吸，然后开始重要的事。",
    heroCta: "进入咖啡馆",
    heroMeta: "无需摄像头 · 没有聊天 · 没有压力",
    cafeMood: "暖光 · 安静陪伴 · 轻柔雨声",
    academyMood: "翻书声 · 壁炉 · 深度工作",
    creek: "苔溪",
    creekMood: "流水 · 绿荫 · 自由呼吸",
    sceneCafeKicker: "窗外细雨",
    sceneAcademyKicker: "适合长时间思考的房间",
    sceneCreekKicker: "走进自然，清空思绪",
    manifestoKicker: "为开始专注前的那一刻",
    manifestoTitle: "你不需要更多压力，只需要一个让开始变轻一点的地方。",
    manifestoBody: "按你此刻的状态来就好。选一个安静角落，让空间接住杂音，只做眼前重要的一件事。",
    howTitle: "抵达。坐下。开始。",
    howBody: "从外界杂音到眼前工作，只需要三个小步骤。",
    step1Label: "抵达",
    step1Title: "把杂音留在岛外。",
    step1Body: "登上专注岛，走进今天已经开放的咖啡馆。",
    step2Label: "找到位置",
    step2Title: "选一个像是属于你的角落。",
    step2Body: "从六个座位中选一个，人物出现后，房间会安静退到身后。",
    step3Label: "轻轻开始",
    step3Title: "把注意力留给一件事。",
    step3Body: "设定时间，只留下想听的声音，让其他事情暂时等待。",
    experienceKicker: "一次专注的内部体验",
    experienceTitle: "被空间接住，自由投入工作。",
    experienceBody: "一点氛围、一点结构，少一点需要思考的事。",
    experienceVisual: "给重要的事情，一个安静的位置。",
    experience1Title: "温和地开始。",
    experience1Body: "选择 25 分钟、50 分钟或自由正计时，不需要复杂设置。",
    experience2Title: "让空间陪着你。",
    experience2Body: "自由混合咖啡馆环境声、白噪音和轻音乐，直到感觉刚好。",
    experience3Title: "沉进工作里。",
    experience3Body: "不再需要时，控制界面会淡出。暂停、回来或刷新，都不会轻易丢掉进度。",
    worldsKicker: "这座岛仍在生长",
    worldsTitle: "不同的日子，需要不同的安静。",
    worldsBody: "有时需要窗边细雨，有时需要书页、水声或雪光。咖啡馆已经开放，岛上的其他地方正在赶来。",
    openWorldBody: "暖光、安静陪伴，以及玻璃窗外的雨。",
    futureKicker: "即将到来",
    futureTitle: "去更多地方，重新遇见自己。",
    futureBody: "每个新场景都会带来不同氛围，但不会增加新的压力。",
    pricingKicker: "简单使用",
    pricingTitle: "如果有帮助，再留下来。",
    pricingBody: "先免费完成一次 25 分钟专注。只有当这座岛真的进入你的日常，再选择继续。",
    monthlyBody: "灵活使用，不需要长期承诺。",
    annualBody: "让专注岛成为日常节奏的一部分。",
    lifetimeBody: "给愿意长期留下的早期支持者。",
    chooseMonthly: "选择月付",
    chooseAnnual: "选择年付",
    chooseLifetime: "获取创始权益",
    faqKicker: "平静地回答几个问题",
    faqTitle: "坐下之前。",
    faqBody: "开始第一次专注前，你需要知道的事情。",
    faq1Q: "专注岛是什么？",
    faq1A: "专注岛是一款浏览器沉浸式专注产品。进入虚拟海岛，选择安静空间，找个座位，开始倒计时或自由正计时。",
    faq2Q: "现在可以使用哪个场景？",
    faq2A: "运河咖啡馆已经开放；学院、苔溪、湖畔、海滨和雪原即将开放。",
    faq3Q: "需要摄像头或麦克风吗？",
    faq3A: "不需要。开始专注不需要摄像头、麦克风或实时聊天。",
    faq4Q: "免费体验包含什么？",
    faq4A: "第一次专注最长 25 分钟，包含咖啡馆视角、计时器和当前可用的声音控制。",
    finalKicker: "咖啡馆已经开放",
    finalTitle: "不必先准备好。找个位置坐下就够了。",
    finalBody: "先从安静的 25 分钟开始。今天做到这里，也很好。",
    finalCta: "免费开始 25 分钟",
    footerBody: "为深度工作、安静学习和更轻松的开始准备的沉浸式专注空间。",
    account: "账户",
    refund: "退款政策",
  },
};

Object.entries(LANDING_DETAIL_COPY.en).forEach(([key, value]) => {
  Object.values(LANDING_COPY).forEach((copy) => {
    if (!(key in copy)) copy[key] = value;
  });
});
Object.assign(LANDING_COPY.en, LANDING_DETAIL_COPY.en);
Object.assign(LANDING_COPY["zh-CN"], LANDING_DETAIL_COPY["zh-CN"]);

const LANDING_FINAL_TEMPLATE = `
<header class="site-nav" data-nav>
  <a class="brand" href="#top" aria-label="Focus Isle">
    <img src="/assets/20261031-focus-isle-logo-icon.svg" alt="" width="39" height="39" />
    <span>Focus Isle</span>
  </a>
  <nav class="nav-links" aria-label="Landing page navigation">
    <a href="#how" data-i18n="navHow">How it works</a>
    <a href="#experience" data-i18n="navWhy">Experience</a>
    <a href="#worlds" data-i18n="navWorlds">Worlds</a>
    <a href="#pricing" data-i18n="navPricing">Pricing</a>
    <a href="#faq" data-i18n="navFaq">FAQ</a>
  </nav>
  <div class="nav-actions">
    <div class="language" data-language>
      <button class="language-toggle" type="button" aria-expanded="false" aria-haspopup="menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9Z"/></svg>
        <span data-language-label>English</span><span>⌄</span>
      </button>
      <ul class="language-menu" role="menu">
        <li><button type="button" role="menuitem" data-lang="en"><span>EN</span><span>English</span><span>✓</span></button></li>
        <li><button type="button" role="menuitem" data-lang="zh-CN"><span>CN</span><span>简体中文</span><span>✓</span></button></li>
        <li><button type="button" role="menuitem" data-lang="zh-TW"><span>TW</span><span>繁體中文</span><span>✓</span></button></li>
        <li><button type="button" role="menuitem" data-lang="ja"><span>JP</span><span>日本語</span><span>✓</span></button></li>
        <li><button type="button" role="menuitem" data-lang="ko"><span>KR</span><span>한국어</span><span>✓</span></button></li>
        <li><button type="button" role="menuitem" data-lang="es"><span>ES</span><span>Español</span><span>✓</span></button></li>
        <li><button type="button" role="menuitem" data-lang="fr"><span>FR</span><span>Français</span><span>✓</span></button></li>
        <li><button type="button" role="menuitem" data-lang="de"><span>DE</span><span>Deutsch</span><span>✓</span></button></li>
        <li><button type="button" role="menuitem" data-lang="pt"><span>PT</span><span>Português</span><span>✓</span></button></li>
      </ul>
    </div>
    <button type="button" class="sign-in" data-action="open-sign-in" data-i18n="signIn">Sign in</button>
    <button type="button" class="nav-cta" data-action="enter-island" data-i18n="startFree">Start free</button>
  </div>
</header>

<main>
  <section class="hero" id="top" aria-labelledby="welcome-title">
    <div class="hero-copy">
      <p class="eyebrow" data-i18n="heroKicker">YOUR ISLAND OF ATTENTION</p>
      <h1 id="welcome-title" data-i18n="heroTitle">Your focus has a place.</h1>
      <p class="hero-lead" data-i18n="heroLead">Choose a quiet corner. Take a breath. Begin with what matters.</p>
      <div class="hero-actions">
        <button type="button" class="primary" data-action="enter-island"><span data-i18n="heroCta">Enter the café</span><span aria-hidden="true">↗</span></button>
        <small><span data-i18n="firstBody">One complete 25-minute focus.</span></small>
      </div>
      <p class="hero-meta" data-i18n="heroMeta">No camera · No chat · No pressure</p>
    </div>
    <div class="gallery" aria-roledescription="carousel" aria-label="Focus Isle world previews">
      <div class="deck" aria-live="polite">
        <article class="scene is-active">
          <img src="/assets/20261012-cafe-window-focus-view.png" alt="A warm café focus desk overlooking a rainy canal" fetchpriority="high" />
          <span class="badge" data-i18n="openNow">OPEN NOW</span>
          <div class="scene-copy"><small data-i18n="sceneCafeKicker">RAIN AT THE WINDOW</small><h2 data-i18n="cafe">Café</h2><p data-i18n="cafeMood">Warm light · quiet company · soft rain</p></div><span class="scene-index">01</span>
        </article>
        <article class="scene is-next" aria-hidden="true">
          <img src="/assets/20261011-library-focus-room.png" alt="A sunlit academy library with wooden desks and a fireplace" />
          <span class="badge is-soon" data-i18n="comingSoon">COMING SOON</span>
          <div class="scene-copy"><small data-i18n="sceneAcademyKicker">A ROOM FOR LONG THOUGHTS</small><h2 data-i18n="academy">Academy</h2><p data-i18n="academyMood">Turning pages · fireplace · deep work</p></div><span class="scene-index">02</span>
        </article>
        <article class="scene is-prev" aria-hidden="true">
          <img src="/assets/20261011-forest-creek-focus-room.png" alt="An open-air focus space beside a forest creek" />
          <span class="badge is-soon" data-i18n="comingSoon">COMING SOON</span>
          <div class="scene-copy"><small data-i18n="sceneCreekKicker">OPEN AIR, CLEAR MIND</small><h2 data-i18n="creek">Moss Creek</h2><p data-i18n="creekMood">Running water · green shade · room to breathe</p></div><span class="scene-index">03</span>
        </article>
      </div>
      <div class="gallery-controls">
        <div class="arrowset"><button type="button" class="arrow prev-btn" aria-label="Previous world">←</button><button type="button" class="arrow next-btn" aria-label="Next world">→</button></div>
        <div class="dots" aria-label="Choose world"><button type="button" class="dot is-active" aria-label="Show Canal Café"></button><button type="button" class="dot" aria-label="Show Old Academy"></button><button type="button" class="dot" aria-label="Show Moss Creek"></button></div>
      </div>
    </div>
  </section>

  <section class="manifesto" id="why" aria-labelledby="manifesto-title">
    <p class="section-kicker" data-i18n="manifestoKicker">FOR THE MOMENT BEFORE FOCUS</p>
    <h2 id="manifesto-title" data-i18n="manifestoTitle">You don’t need more pressure. You need a place that makes beginning feel lighter.</h2>
    <p data-i18n="manifestoBody">Come as you are. Choose one quiet corner. Let the room hold the noise while you do one thing that matters.</p>
  </section>

  <section class="how" id="how">
    <div class="section-shell">
      <div class="section-head reveal"><div><p class="section-kicker" data-i18n="navHow">How it works</p><h2 data-i18n="howTitle">Arrive. Sit. Begin.</h2></div><p data-i18n="howBody">Three small steps between the noise outside and the work in front of you.</p></div>
      <div class="step-grid">
        <article class="step reveal"><div class="step-no"><span data-i18n="step1Label">ARRIVE</span><b>01</b></div><div class="step-visual"><img src="/assets/20261012-focus-island-map-detailed.webp" alt="Focus Isle map" loading="lazy" /></div><h3 data-i18n="step1Title">Leave the noise outside.</h3><p data-i18n="step1Body">Step onto the island and enter the café that is open today.</p><small data-i18n="openNow">OPEN NOW</small></article>
        <article class="step reveal"><div class="step-no"><span data-i18n="step2Label">TAKE YOUR PLACE</span><b>02</b></div><div class="step-visual"><img src="/assets/20261028-cafe-room-static-seat-master.webp" alt="Warm six-seat café" loading="lazy" /></div><h3 data-i18n="step2Title">Find a corner that feels yours.</h3><p data-i18n="step2Body">Choose one of six seats. Your place appears, and the room gets out of the way.</p><small>ONE CLICK · NO WAITING ROOM</small></article>
        <article class="step reveal"><div class="step-no"><span data-i18n="step3Label">BEGIN GENTLY</span><b>03</b></div><div class="step-visual"><img src="/assets/20261012-cafe-lounge-focus-view.png" alt="A warm café lounge prepared for focus" loading="lazy" /></div><h3 data-i18n="step3Title">Give one thing your attention.</h3><p data-i18n="step3Body">Set the time. Keep only the sounds you want. Let everything else wait.</p><small>25 MIN · 50 MIN · OPEN-ENDED</small></article>
      </div>
    </div>
  </section>

  <section class="experience" id="experience" aria-labelledby="experience-title">
    <div class="section-shell">
      <div class="section-head reveal"><div><p class="section-kicker" data-i18n="experienceKicker">INSIDE A FOCUS SESSION</p><h2 id="experience-title" data-i18n="experienceTitle">Held by the room. Free to do the work.</h2></div><p data-i18n="experienceBody">A little atmosphere, a little structure, and less to think about.</p></div>
      <div class="experience-layout">
        <figure class="experience-visual reveal"><img src="/assets/20261028-cafe-rain-clearing-focus-view.webp" alt="A warm café window view after rain" loading="lazy" /><figcaption><small data-i18n="openNow">OPEN NOW</small><h3 data-i18n="experienceVisual">A quiet place for the thing that matters.</h3></figcaption></figure>
        <div class="feature-list">
          <article class="feature reveal"><span>01</span><div><h3 data-i18n="experience1Title">A gentle beginning.</h3><p data-i18n="experience1Body">Choose 25 minutes, 50 minutes, or simply count upward. No complicated setup.</p><div class="pills"><small>25 MINUTES</small><small>50 MINUTES</small><small>OPEN-ENDED</small></div></div></article>
          <article class="feature reveal"><span>02</span><div><h3 data-i18n="experience2Title">A room that stays with you.</h3><p data-i18n="experience2Body">Blend café ambience, white noise, and quiet music until the space feels right.</p><div class="pills"><small>CAFÉ AMBIENCE</small><small>WHITE NOISE</small><small>QUIET MUSIC</small></div></div></article>
          <article class="feature reveal"><span>03</span><div><h3 data-i18n="experience3Title">Space to disappear into the work.</h3><p data-i18n="experience3Body">The controls fade when you no longer need them. Pause, return, or recover after a refresh without losing the thread.</p></div></article>
        </div>
      </div>
    </div>
  </section>

  <section class="worlds" id="worlds" aria-labelledby="worlds-title">
    <div class="section-shell">
      <div class="section-head reveal"><div><p class="section-kicker" data-i18n="worldsKicker">THE ISLAND IS GROWING</p><h2 id="worlds-title" data-i18n="worldsTitle">Different days need different kinds of quiet.</h2></div><p data-i18n="worldsBody">Some days need rain at the window. Others need pages, water, or snow. The café is open; the rest of the island is on its way.</p></div>
      <div class="world-showcase">
        <article class="open-world reveal"><img src="/assets/20261013-cafe-sofa-real-focus-view.webp" alt="A warm café sofa and notebook beside a rain-lit canal" loading="lazy" /><div class="open-world-copy"><div><span data-i18n="openNow">OPEN NOW</span><h3 data-i18n="cafe">Café</h3></div><p data-i18n="openWorldBody">Warm light, quiet company, and rain beyond the glass.</p></div></article>
        <aside class="future-worlds reveal"><span data-i18n="futureKicker">COMING NEXT</span><h3 data-i18n="futureTitle">More places to meet yourself.</h3><p data-i18n="futureBody">Each new world will offer a different atmosphere, without adding more pressure.</p><div class="future-list">
          <div><b data-i18n="academy">Academy</b><small>PAGES · FIRELIGHT</small></div>
          <div><b data-i18n="creek">Moss Creek</b><small>WATER · GREEN SHADE</small></div>
          <div><b data-i18n="lakeside">Lakeside</b><small>STILL WATER · OPEN SKY</small></div>
          <div><b data-i18n="seaside">Seaside</b><small>SALT AIR · HORIZON</small></div>
          <div><b data-i18n="snow">Snowfield</b><small>SNOW LIGHT · SILENCE</small></div>
        </div></aside>
      </div>
    </div>
  </section>

  <section class="pricing" id="pricing">
    <div class="section-shell">
      <div class="section-head reveal"><div><p class="section-kicker" data-i18n="pricingKicker">SIMPLE ACCESS</p><h2 data-i18n="pricingTitle">Stay when it helps.</h2></div><p data-i18n="pricingBody">Try one free 25-minute session. Continue only if the island earns a place in your routine.</p></div>
      <div class="price-grid">
        <article class="price-card reveal"><span data-i18n="monthly">Monthly</span><strong>$4.99 <small>/ month</small></strong><p data-i18n="monthlyBody">Come and go with no long commitment.</p><ul><li>Full café experience</li><li>All timers and sound controls</li></ul><button type="button" data-billing-plan="plus_monthly" data-i18n="chooseMonthly">Choose monthly</button></article>
        <article class="price-card is-featured reveal"><em>BEST VALUE</em><span data-i18n="annual">Annual</span><strong>$19.99 <small>/ year</small></strong><p data-i18n="annualBody">Make the island part of your rhythm.</p><ul><li>Everything in monthly</li><li>One year of access</li></ul><button type="button" data-billing-plan="plus_annual" data-i18n="chooseAnnual">Choose annual</button></article>
        <article class="price-card reveal"><span data-i18n="lifetime">Founder lifetime</span><strong>$39.99 <small>/ once</small></strong><p data-i18n="lifetimeBody">For early supporters who want to stay.</p><ul><li>Lifetime product access</li><li>Limited founder availability</li></ul><button type="button" data-billing-plan="founder_lifetime" data-i18n="chooseLifetime">Get founder access</button></article>
      </div>
      <p class="price-note">USD pricing. Taxes, eligibility, and final availability are confirmed in Stripe Checkout. Focus Isle is currently in beta.</p>
    </div>
  </section>

  <section class="faq" id="faq" aria-labelledby="faq-title">
    <div class="section-shell faq-layout">
      <div class="faq-title reveal"><p class="section-kicker" data-i18n="faqKicker">QUESTIONS, ANSWERED CALMLY</p><h2 id="faq-title" data-i18n="faqTitle">Before you take a seat.</h2><p data-i18n="faqBody">Everything you need to know before starting your first session.</p></div>
      <div class="faq-list">
        <details class="reveal"><summary data-i18n="faq1Q">What is Focus Isle?</summary><p data-i18n="faq1A">Focus Isle is a browser-based focus experience.</p></details>
        <details class="reveal"><summary data-i18n="faq2Q">Which focus world can I use today?</summary><p data-i18n="faq2A">Canal Café is open now.</p></details>
        <details class="reveal"><summary data-i18n="faq3Q">Do I need a camera or microphone?</summary><p data-i18n="faq3A">No camera, microphone, or live chat is required.</p></details>
        <details class="reveal"><summary data-i18n="faq4Q">What is included in the free session?</summary><p data-i18n="faq4A">Your first session can run for up to 25 minutes.</p></details>
      </div>
    </div>
  </section>

  <section class="final-cta" aria-labelledby="final-title">
    <img src="/assets/20261013-cafe-window-real-focus-view.webp" alt="" aria-hidden="true" loading="lazy" />
    <div class="final-copy reveal"><p class="section-kicker" data-i18n="finalKicker">THE CAFÉ IS OPEN</p><h2 id="final-title" data-i18n="finalTitle">You don’t have to feel ready. Just take a seat.</h2><p data-i18n="finalBody">Start with 25 quiet minutes. That is enough for today.</p><button type="button" class="primary" data-action="enter-island"><span data-i18n="finalCta">Start free for 25 minutes</span><span aria-hidden="true">↗</span></button></div>
  </section>
</main>

<footer class="footer"><div class="section-shell"><div><a class="brand" href="#top"><img src="/assets/20261031-focus-isle-logo-icon.svg" alt="" width="39" height="39" />Focus Isle</a><p data-i18n="footerBody">Immersive focus spaces for deep work, quiet study, and calmer beginnings.</p></div><div class="footer-links"><a href="#how" data-i18n="navHow">How it works</a><a href="#experience" data-i18n="navWhy">Experience</a><a href="#worlds" data-i18n="navWorlds">Worlds</a><a href="#pricing" data-i18n="navPricing">Pricing</a><a href="/privacy" data-i18n="privacy">Privacy</a><a href="/terms" data-i18n="terms">Terms</a></div></div></footer>
<p class="sr-only" aria-live="polite" data-live></p>
`;

let landingExperienceCleanup = null;

function currentLandingLanguage() {
  const saved = localStorage.getItem("focusIsleLandingLanguage");
  return LANDING_COPY[saved] ? saved : "en";
}

function prepareLandingWords(root, updateScroll) {
  root.querySelectorAll("[data-word-reveal]").forEach((heading) => {
    const text = heading.textContent.trim();
    heading.innerHTML = text.split(/\s+/).map((word) => `<span>${escapeHtml(word)}</span>`).join(" ");
  });
  updateScroll();
}

function applyLandingLanguage(code, { announce = false, updateScroll = () => {} } = {}) {
  const root = document.querySelector(".landing-final");
  if (!root) return;
  const language = LANDING_COPY[code] ? code : "en";
  const copy = LANDING_COPY[language];
  root.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = copy[node.dataset.i18n];
    if (value) node.textContent = value;
  });
  const label = root.querySelector("[data-language-label]");
  if (label) label.textContent = copy.label;
  root.querySelectorAll("[data-lang]").forEach((button) => {
    button.setAttribute("aria-current", String(button.dataset.lang === language));
  });
  localStorage.setItem("focusIsleLandingLanguage", language);
  const productLanguage = language === "zh-CN" ? "zh-CN" : "en";
  if (preferences.language !== productLanguage) {
    preferences.language = productLanguage;
    savePreferences();
    window.FocusI18n?.setLanguage(productLanguage);
  }
  document.documentElement.lang = language;
  document.title = language === "zh-CN" ? "专注岛 · 沉浸式专注空间" : "Focus Isle — Immersive Focus Spaces for Deep Work";
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = copy.heroLead;
  if (announce) {
    const live = root.querySelector("[data-live]");
    if (live) live.textContent = copy.label;
  }
  root.querySelector("[data-language]")?.classList.remove("is-open");
  root.querySelector(".language-toggle")?.setAttribute("aria-expanded", "false");
  prepareLandingWords(root, updateScroll);
}

function initLandingExperience() {
  const root = document.querySelector(".landing-final");
  if (!root) return;
  const nav = root.querySelector("[data-nav]");
  const languageRoot = root.querySelector("[data-language]");
  const toggle = root.querySelector(".language-toggle");
  const sceneNodes = [...root.querySelectorAll(".scene")];
  const dotNodes = [...root.querySelectorAll(".dot")];
  const previousButton = root.querySelector(".prev-btn");
  const nextButton = root.querySelector(".next-btn");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let observer = null;
  let ticking = false;
  let currentScene = 0;

  const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));
  const updateScroll = () => {
    ticking = false;
    const y = scrollY;
    nav?.classList.toggle("is-scrolled", y > 36);
    root.style.setProperty("--hero-progress", reduceMotion ? "0" : String(clampValue(y / (innerHeight * 0.65), 0, 1)));
    root.querySelectorAll("[data-word-reveal]").forEach((heading) => {
      const rect = heading.getBoundingClientRect();
      const progress = reduceMotion ? 1 : clampValue((innerHeight * 0.88 - rect.top) / (innerHeight * 0.62), 0, 1);
      const words = [...heading.querySelectorAll("span")];
      words.forEach((word, index) => {
        const start = index / Math.max(words.length, 1) * 0.72;
        const local = clampValue((progress - start) / 0.24, 0, 1);
        word.style.color = heading.hasAttribute("data-dark-words")
          ? `rgba(23,61,52,${0.18 + local * 0.82})`
          : `rgba(255,255,255,${0.2 + local * 0.8})`;
      });
    });
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateScroll);
    }
  };
  const setMenu = (open) => {
    languageRoot?.classList.toggle("is-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
  };
  const onToggle = () => setMenu(!languageRoot?.classList.contains("is-open"));
  const onLanguageClick = (event) => {
    const button = event.currentTarget;
    applyLandingLanguage(button.dataset.lang, { announce: true, updateScroll });
  };
  const onDocumentClick = (event) => {
    if (languageRoot && !languageRoot.contains(event.target)) setMenu(false);
  };
  const onDocumentKeydown = (event) => {
    if (event.key === "Escape") setMenu(false);
  };
  const renderScene = (index) => {
    currentScene = (index + sceneNodes.length) % sceneNodes.length;
    sceneNodes.forEach((scene, sceneIndex) => {
      scene.classList.remove("is-active", "is-next", "is-prev");
      const delta = (sceneIndex - currentScene + sceneNodes.length) % sceneNodes.length;
      scene.classList.add(delta === 0 ? "is-active" : delta === 1 ? "is-next" : "is-prev");
      if (delta === 0) scene.removeAttribute("aria-hidden");
      else scene.setAttribute("aria-hidden", "true");
    });
    dotNodes.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === currentScene));
  };
  const onPreviousScene = () => renderScene(currentScene - 1);
  const onNextScene = () => renderScene(currentScene + 1);

  toggle?.addEventListener("click", onToggle);
  root.querySelectorAll("[data-lang]").forEach((button) => button.addEventListener("click", onLanguageClick));
  previousButton?.addEventListener("click", onPreviousScene);
  nextButton?.addEventListener("click", onNextScene);
  dotNodes.forEach((dot, dotIndex) => dot.addEventListener("click", () => renderScene(dotIndex)));
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onDocumentKeydown);
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", updateScroll, { passive: true });

  observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer?.unobserve(entry.target);
    }
  }), { threshold: 0.16, rootMargin: "0px 0px -8%" });
  root.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
  applyLandingLanguage(currentLandingLanguage(), { updateScroll });

  landingExperienceCleanup = () => {
    toggle?.removeEventListener("click", onToggle);
    root.querySelectorAll("[data-lang]").forEach((button) => button.removeEventListener("click", onLanguageClick));
    previousButton?.removeEventListener("click", onPreviousScene);
    nextButton?.removeEventListener("click", onNextScene);
    document.removeEventListener("click", onDocumentClick);
    document.removeEventListener("keydown", onDocumentKeydown);
    removeEventListener("scroll", onScroll);
    removeEventListener("resize", updateScroll);
    observer?.disconnect();
  };
}

function renderWelcome() {
  app.innerHTML = `<div class="landing-final" data-no-auto-i18n>${LANDING_FINAL_TEMPLATE}</div>`;
  requestAnimationFrame(initLandingExperience);
}


function renderIsland() {
  if (PUBLIC_CONFIG.minimalMvp) return renderMinimalIsland();
  app.innerHTML = `
    <section class="view island">
      <div class="island-map-frame">
        <img class="scene-image" src="${islandImage}" alt="专注岛地图" />
        ${islandHotspot("cafe", 26, 51)}
        ${lockedHotspot("学院区", "图书馆即将开放", 43, 25, "academy")}
        ${lockedHotspot("溪流区", "即将开放", 75, 48, "forest")}
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
      <span class="hotspot-label"><strong>${scene.islandLabel}</strong><small>${scene.shortName} · 现在开放</small></span>
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
      <span class="cafe-room-preview-occupancy"><strong>${capacity} 座</strong></span>
      ${selected ? `<span class="cafe-room-preview-check" aria-hidden="true">✓</span>` : ""}
    </button>`;
}

function roomViewForScene() {
  return "room";
}

// Retained for isolated R&D; the shipped scene flow never calls this helper.
function internalRoomViewForScene() {
  return state.sceneId === "cafe" && state.isDeveloper && resolveCafeRoomRenderer() === CAFE_ROOM_RENDERER_GODOT_3D
    ? "godot-room"
    : "room";
}

function resolveCafeRoomRenderer({ search = window.location.search, storage = localStorage } = {}) {
  const requested = new URLSearchParams(search).get(CAFE_ROOM_RENDERER_QUERY_KEY);
  if (requested === CAFE_ROOM_RENDERER_GODOT_3D || requested === CAFE_ROOM_RENDERER_STATIC) {
    storage.setItem(CAFE_ROOM_RENDERER_STORAGE_KEY, requested);
    return requested;
  }
  const stored = storage.getItem(CAFE_ROOM_RENDERER_STORAGE_KEY);
  return stored === CAFE_ROOM_RENDERER_GODOT_3D
    ? CAFE_ROOM_RENDERER_GODOT_3D
    : CAFE_ROOM_RENDERER_STATIC;
}

function fallbackFromGodotRoom(reason = "load_failed") {
  if (godotRoomReadyTimer) window.clearTimeout(godotRoomReadyTimer);
  godotRoomReadyTimer = null;
  localStorage.setItem(CAFE_ROOM_RENDERER_STORAGE_KEY, CAFE_ROOM_RENDERER_STATIC);
  if (state.view !== "godot-room") return;
  state.view = "room";
  render();
  showToast(reason === "ready_timeout" ? "3D 房间准备超时，已返回静态房间" : "3D 房间加载失败，已返回静态房间");
}

function resolveGodotRoom3DSrc({ search = window.location.search, baseUrl = window.location.href } = {}) {
  const requested = new URLSearchParams(search).get(CAFE_ROOM_3D_SRC_QUERY_KEY);
  if (!requested) return CAFE_ROOM_3D_DEFAULT_SRC;
  try {
    const resolved = new URL(requested, baseUrl);
    return ["http:", "https:"].includes(resolved.protocol) ? resolved.href : CAFE_ROOM_3D_DEFAULT_SRC;
  } catch (_) {
    return CAFE_ROOM_3D_DEFAULT_SRC;
  }
}

function renderGodotRoom() {
  if (!state.currentSeatId) {
    stopRoom3DLeaseHeartbeat();
    room3DInteraction = null;
    localStorage.removeItem(ROOM_3D_RESPONSE_STORAGE_KEY);
  }
  app.innerHTML = `
    <section class="view godot-room-view" aria-label="四时咖啡馆 Godot 房间">
      <div class="godot-room-loading" data-godot-room-loading>
        <span class="presence-dot"></span>
        <strong>正在进入四时咖啡馆…</strong>
        <small>海岛与沉浸专注仍沿用 V1.0</small>
      </div>
      <iframe
        class="godot-room-frame"
        data-godot-room-frame
        src="${escapeHtml(resolveGodotRoom3DSrc())}"
        title="四时咖啡馆互动房间"
        allow="autoplay; fullscreen"
      ></iframe>
    </section>`;
  const frame = document.querySelector("[data-godot-room-frame]");
  frame?.addEventListener("error", () => fallbackFromGodotRoom("load_failed"), { once: true });
  if (godotRoomReadyTimer) window.clearTimeout(godotRoomReadyTimer);
  godotRoomReadyTimer = window.setTimeout(() => fallbackFromGodotRoom("ready_timeout"), CAFE_ROOM_3D_READY_TIMEOUT_MS);
}

function roomCard(scene, room) {
  const capacity = scene.id === "cafe" ? cafeVisibleSeats().length : scene.seats.length;
  return `
    <button class="room-card ${room.locked ? "is-locked" : ""}" ${room.locked ? 'data-action="locked-room"' : `data-room="${room.id}"`}>
      <span class="room-card-copy"><strong>${room.name}</strong><span>${room.mood}</span></span>
      <span class="occupancy"><strong>${room.locked ? "稍后" : `${capacity} 座`}</strong><small>${room.locked ? "下一阶段" : "内部演示"}</small></span>
    </button>`;
}

function renderStaticCafeOccupants() {
  return staticSeatSlots.map((slot) => {
    const lease = leaseForSeat(slot.seat_id - 1);
    if (!lease) return "";
    const mine = lease.sessionId === identity.sessionId;
    const npc = lease.memberType === "npc";
    const minutes = focusedMinutes(lease);
    const status = lease.focusStartedAt ? `已专注 ${minutes} 分钟` : "已入座";
    const displayName = escapeHtml(String(lease.displayName || "安静旅人").replace(/^岛民\s*[·・]\s*/, ""));
    const [left, top, width, height] = slot.occupant_anchor;
    const [labelLeft, labelTop] = slot.label_anchor;
    return `
      <div class="static-seat-occupant ${mine ? "is-mine" : ""}" style="--left:${left}%;--top:${top}%;--width:${width}%;--height:${height}%;--avatar:${Number(lease.avatarSkin || 0)};${slot.flip ? "--flip:-1;" : ""}">
        <span class="static-seat-avatar" style="background-image:url('${slot.occupied_asset}')" aria-hidden="true"></span>
      </div>
      <div class="static-seat-label ${mine ? "is-mine" : ""} ${npc ? "is-npc" : ""}" style="left:${labelLeft}%;top:${labelTop}%">
        <strong>${mine ? "我" : npc ? "岛民" : displayName}</strong>
        <small>${mine ? escapeHtml(localizedIdentityDisplayName(identity.displayName)) : npc ? `${displayName} · <span data-static-focus-started-at="${Number(lease.focusStartedAt || 0)}">${status}</span>` : status}</small>
      </div>`;
  }).join("");
}

function renderStaticCafeRoom() {
  if (PUBLIC_CONFIG.minimalMvp) return renderMinimalRoom();
  const roomMode = state.localRoom ? "本地岛民房间" : "在线陪伴房间";
  const awaitingImmersive = state.awaitingImmersiveFocus && state.currentSeatId && state.selectedSeat === state.currentSeatId - 1;
  app.innerHTML = `
    <section class="view room static-seat-room ${state.staticSeatCalibration.enabled ? "is-static-seat-calibration" : ""}">
      ${topbar({ back: "back-island", showPresence: false })}
      ${state.currentSeatId && state.sessionStartedAt && !awaitingImmersive ? renderSessionHud("room") : ""}
      ${state.isDeveloper && state.staticSeatCalibration.enabled ? `<aside class="static-seat-calibration-tools" aria-label="座位编号校准工具">
        <button type="button" data-action="toggle-static-seat-calibration">完成编号调整</button>
        <span>直接拖动 1–6 号编号</span><button type="button" data-action="reset-static-seat-markers">恢复默认</button>
      </aside>` : ""}
      <div class="room-stage">
        <img class="scene-image" src="${scenes.cafe.image}" alt="四时咖啡馆六座静态房间" />
        <div class="room-title">${regionIcon("city", "room-region-icon")}<span>四时咖啡馆 · ${roomMode}</span></div>
        <div class="seat-layer" aria-label="六个固定座位">
          <div class="static-occupants">${renderStaticCafeOccupants()}</div>
          <div class="seat-markers">${staticSeatSlots.map((slot) => {
            const [markerLeft, markerTop] = staticSeatMarkerPosition(slot);
            return renderSeat([markerLeft, markerTop, false], slot.seat_id - 1, "cafe", { staticMarker: true });
          }).join("")}</div>
        </div>
        ${awaitingImmersive ? `
          <div class="room-immersive-prompt" role="status">
            <span data-immersive-countdown>${immersiveCountdownSeconds()} 秒后自动进入沉浸视角</span>
            <button type="button" data-action="enter-immersive-focus">立即进入沉浸</button>
          </div>` : ""}
      </div>
    </section>`;
  requestAnimationFrame(() => startCafePresence());
  if (awaitingImmersive) updateImmersiveCountdownCopy();
}

function renderRoom() {
  const scene = scenes[state.sceneId];
  if (scene.id === "cafe") {
    renderStaticCafeRoom();
    return;
  }
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
        ${animatedCafe && state.isDeveloper ? renderCafeSpriteTuningPanel() : ""}
        ${editableLibrary && state.isDeveloper ? renderLibrarySceneEditorPanel() : ""}
      </div>
    </section>`;
  if (animatedCafe) requestAnimationFrame(() => startCafePresence());
  if (awaitingImmersive) updateImmersiveCountdownCopy();
}

function renderSeat(seat, index, sceneId, options = {}) {
  const [defaultX, defaultY, staticOccupied] = seat;
  const staticMarker = Boolean(options.staticMarker);
  const markerConfig = staticMarker
    ? null
    : sceneId === "cafe"
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
  const markerAttrs = staticMarker
    ? `data-static-seat-marker="${index + 1}"`
    : sceneId === "cafe" && state.cafeDebugMode.enabled
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
      const npc = lease.memberType === "npc";
      const minutes = focusedMinutes(lease);
      const status = minutes > 0 ? `已专注 ${minutes} 分钟` : "刚刚坐下";
      const displayName = escapeHtml(String(lease.displayName || "安静旅人").replace(/^岛民\s*[·・]\s*/, ""));
      const accessibleName = npc ? `岛民 · ${displayName}` : displayName;
      return `
        <span class="seat occupied cafe-seat-status ${cafeZoneClass} ${mine ? "is-mine" : ""} ${selectedMarkerClass}" ${markerAttrs} style="left:${x}%; top:${y}%" tabindex="0" aria-label="${index + 1}号座位已占用，${accessibleName}${status}">
          <span class="seat-status-dot busy" aria-hidden="true"></span>
          <span class="seat-number">${index + 1}</span>
          <span class="seat-popover" role="tooltip">
            <strong>${mine ? `${escapeHtml(localizedIdentityDisplayName(identity.displayName))}（你）` : accessibleName}</strong>
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
    if (state.localRoom) {
      const otherLeases = state.roomPresence.leases.filter((lease) => lease.sessionId !== identity.sessionId);
      state.roomPresence = {
        leases: [...otherLeases, {
          roomId: "cafe-local",
          seatId: targetSeatId,
          sessionId: identity.sessionId,
          guestId: identity.guestId,
          displayName: identity.displayName,
          avatarSkin: identity.avatarSkin,
          memberType: "human",
          state: "occupied",
          activity: "已入座",
          focusStartedAt: null,
        }],
        serverNow: Date.now(),
      };
    } else {
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
      await syncCafeState({ refreshMarkers: false });
    }
    state.currentSeatId = targetSeatId;
    state.switchingFromSeatId = null;
    if (!fromSeatId) {
      stopTicker();
      state.timerMode = preferences.defaultTimerMode;
      state.durationSeconds = Math.max(0, state.timerMode * 60);
      state.remainingSeconds = state.durationSeconds;
      state.elapsedSeconds = 0;
      state.sessionStartedAt = null;
      state.cloudFocusClientId = null;
      state.isRunning = false;
      state.sessionPhase = "focus";
      state.restDurationSeconds = DEFAULT_REST_MINUTES * 60;
      state.restRemainingSeconds = state.restDurationSeconds;
      state.restStartedAt = null;
      state.restCustomOpen = false;
      state.nextFocusMode = 25;
      state.sessionResult = null;
      lastTick = null;
      localStorage.removeItem(STORAGE_KEYS.activeSession);
    }
    state.isTransitioning = false;
    state.sessionPanelOpen = false;
    state.focusImageChoice = preferences.rememberLastFocusView ? preferences.lastFocusView : "window";
    if (!preferences.rememberLastSound) {
      const defaults = defaultPreferences();
      state.sounds = { ...defaults.sounds };
      state.musicTrack = defaults.musicTrack;
      state.soundVolumes = { ...defaults.soundVolumes };
    }
    if (PUBLIC_CONFIG.minimalMvp) {
      clearImmersiveAutoEnter();
      state.view = "focus";
      persistActiveSession(true);
      renderFocus();
    } else {
      beginImmersiveAutoEnter();
      renderRoom();
    }
    return;
  } catch (error) {
    state.isTransitioning = false;
    clearImmersiveAutoEnter();
    if (error.status === 409) {
      showToast(error.message === "seat_taken" ? "刚刚有人先坐下了，请换一个位置" : "这个座位的预留已过期，请重试");
    } else {
      showToast("座位连接暂时不稳定，请再试一次");
    }
    if (!state.localRoom) await syncCafeState();
    renderRoom();
    return;
  }
  state.isTransitioning = false;
}

function renderFocus() {
  if (PUBLIC_CONFIG.minimalMvp) return renderMinimalFocus();
  window.clearInterval(roomSyncTimer);
  roomSyncTimer = null;
  const scene = scenes[state.sceneId];
  const room = scene.rooms.find((item) => item.id === state.roomId) || scene.rooms[0];
  const focusImage = selectedFocusImage(scene);
  const resting = state.sessionPhase === "rest";
  app.innerHTML = `
    <section class="view focus ${resting ? "is-resting" : ""}">
      <img class="scene-image" data-focus-scene-image src="${focusImage}" alt="坐在${room.name}${state.selectedSeat + 1}号座位看到的沉浸式工作视角" />
      ${resting ? '<div class="rest-scene-veil" aria-hidden="true"></div>' : ""}
      <header class="focus-header" aria-label="沉浸专注导航">
        <button class="focus-exit-button" type="button" data-action="return-room-view" aria-label="返回房间">
          <span aria-hidden="true">←</span><strong>返回房间</strong>
        </button>
        <div class="focus-header-actions">
          ${resting ? `<div class="rest-next-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg><span>下一轮 · ${state.nextFocusMode} 分钟</span></div>` : ""}
          <button class="focus-profile-button" type="button" data-action="profile" aria-label="打开个人中心" title="个人中心">${profileAvatarMarkup()}</button>
        </div>
      </header>
      ${resting ? renderRestStage() : renderSessionHud("focus")}
    </section>`;
  persistActiveSession();
  if (state.isRunning || resting) startTicker();
  if (scene.id === "cafe") {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = window.setInterval(sendHeartbeat, 15000);
    sendHeartbeat();
  }
  scheduleHudFade();
}

function scheduleHudFade() {
  window.clearTimeout(hudIdleTimer);
  document.body.classList.remove("hud-idle");
  if (!preferences.hudAutoHide || state.view !== "focus" || state.sessionPanelOpen || state.sessionPhase === "rest" || state.personalCenter.open) return;
  hudIdleTimer = window.setTimeout(() => {
    if (state.view === "focus" && !state.sessionPanelOpen) document.body.classList.add("hud-idle");
  }, 5000);
}

function selectedFocusImage(scene = scenes[state.sceneId]) {
  if (scene.id !== "cafe") return scene.image;
  const focusImages = {
    window: `${ASSET_BASE}20261013-cafe-window-real-focus-view.webp`,
    bar: `${ASSET_BASE}20261013-cafe-bar-real-focus-view.webp`,
    clearing: `${ASSET_BASE}20261028-cafe-rain-clearing-focus-view.webp`,
    lounge: `${ASSET_BASE}20261013-cafe-sofa-real-focus-view.webp`,
  };
  return focusImages[state.focusImageChoice] || focusImages.window;
}

function renderSessionHud(context = "focus") {
  const timerLabel = state.timerMode === 0 ? "自由正计时" : `${state.timerMode} 分钟倒计时`;
  const timerHasStarted = Boolean(state.sessionStartedAt);
  const timerActionLabel = state.isRunning ? "暂停" : timerHasStarted ? "继续" : "开始";
  const roomViewLabel = context === "room" ? "沉浸" : "房间";
  const allSoundsMuted = !state.sounds.ambient && !state.sounds.white && !state.sounds.music;
  return `
    <aside class="session-hud session-hud-${context} ${state.sessionPanelOpen ? "is-open" : ""}" aria-label="专注计时与设置">
      ${state.sessionPanelOpen ? `
        <section class="session-control-panel" role="dialog" aria-modal="false" aria-labelledby="focus-settings-title">
          <header><div><strong id="focus-settings-title">专注设置</strong><small>${timerHasStarted ? "本次计时进行中" : "选择专注方式，然后开始"}</small></div><button type="button" data-action="toggle-session-panel" aria-label="关闭设置">×</button></header>
          <div class="session-setting-group">
            <span>计时选项</span>
            <div class="session-choice-row">
              ${modeButton(25, "25 分钟")}
              ${modeButton(50, "50 分钟")}
              ${modeButton(0, "自由正计时")}
            </div>
          </div>
          <div class="session-setting-group">
            <span>声音设置</span>
            <div class="environment-sound-grid" aria-label="声音设置">
              ${soundButton("mute", "⊘", "无声音", allSoundsMuted)}
              ${Object.entries(FOCUS_MUSIC_TRACKS).map(([key, track], index) => soundButton(key, String(index + 1).padStart(2, "0"), track.name)).join("")}
              ${soundButton("ambient", "♫", "咖啡馆")}
              ${soundButton("white", "≈", "白噪音")}
            </div>
          </div>
          <div class="session-setting-group">
            <span>场景设置</span>
            <div class="focus-scene-grid" aria-label="专注场景设置">
              ${focusViewButton("window", "窗边视角", `${ASSET_BASE}20261013-cafe-window-real-focus-view.webp`)}
              ${focusViewButton("bar", "吧台一角", `${ASSET_BASE}20261013-cafe-bar-real-focus-view.webp`)}
              ${focusViewButton("clearing", "雨后初晴", `${ASSET_BASE}20261028-cafe-rain-clearing-focus-view.webp`)}
              ${focusViewButton("lounge", "安静角落", `${ASSET_BASE}20261013-cafe-sofa-real-focus-view.webp`)}
            </div>
          </div>
        </section>` : ""}
      <div class="focus-control-cluster">
        <div class="immersive-timer" role="timer" tabindex="0" aria-label="当前计时 ${formatTime()}，悬停或聚焦显示快捷操作" aria-live="off">
          <strong data-session-clock>${formatTime()}</strong>
          <small>${timerLabel}</small>
        </div>
        <nav class="focus-control-dock" aria-label="专注快捷操作">
        <button class="focus-dock-button ${state.isRunning ? "is-active" : ""}" type="button" data-action="toggle-timer" aria-label="${timerActionLabel}">
          <span class="focus-dock-icon" aria-hidden="true">${state.isRunning ? `<svg viewBox="0 0 24 24"><path d="M9 7v10M15 7v10"/></svg>` : `<svg viewBox="0 0 24 24"><path d="m9 7 8 5-8 5z"/></svg>`}</span><small>${timerActionLabel}</small>
        </button>
        <button class="focus-dock-button ${state.sessionPanelOpen ? "is-active" : ""}" type="button" data-action="toggle-session-panel" aria-label="专注设置" aria-expanded="${state.sessionPanelOpen}">
          <span class="focus-dock-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2.1-1.2L14 3h-4l-.4 2.7a7 7 0 0 0-2.1 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2.1 1.2L10 21h4l.4-2.7a7 7 0 0 0 2.1-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></svg></span><small>设置</small>
        </button>
        <button class="focus-dock-button" type="button" data-action="toggle-room-view" aria-label="${context === "room" ? "返回沉浸视角" : "返回房间视角"}">
          <span class="focus-dock-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V20h11v-9.5"/><path d="M9.5 20v-5h5v5"/></svg></span><small>${roomViewLabel}</small>
        </button>
        <button class="focus-dock-button is-danger" type="button" data-action="finish-session" aria-label="结束专注">
          <span class="focus-dock-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 8h8v8H8z"/></svg></span><small>结束</small>
        </button>
        </nav>
      </div>
    </aside>`;
}

function renderRestStage() {
  const restMinutes = Math.max(1, Math.round(state.restDurationSeconds / 60));
  const hasPresetDuration = REST_PRESET_MINUTES.includes(restMinutes) && !state.restCustomOpen;
  return `
    <section class="rest-stage" role="dialog" aria-modal="false" aria-labelledby="rest-stage-title">
      <article class="rest-card">
        <div class="rest-bell" aria-hidden="true">
          <span class="rest-bell-wave rest-bell-wave-left"></span>
          <svg viewBox="0 0 24 24"><path d="M7.5 10.3a4.5 4.5 0 0 1 9 0c0 5.2 2.1 5.5 2.1 5.5H5.4s2.1-.3 2.1-5.5Z"/><path d="M10 18a2.2 2.2 0 0 0 4 0"/></svg>
          <span class="rest-bell-wave rest-bell-wave-right"></span>
        </div>
        <div class="rest-complete-pill">叮 · 本轮专注已完成</div>
        <h1 id="rest-stage-title">起来走一走吧</h1>
        <p class="rest-description">喝口水、伸展一下，${restMinutes} 分钟后再回来。</p>
        <div class="rest-divider" aria-hidden="true"><span></span></div>
        <div class="rest-clock">
          <strong data-rest-clock>${formatRestTime()}</strong>
          <small>休息倒计时</small>
        </div>
        <section class="rest-duration-setting" aria-labelledby="rest-duration-title">
          <h2 id="rest-duration-title">休息时长</h2>
          <div class="rest-duration-options">
            ${REST_PRESET_MINUTES.map((minutes) => `<button type="button" class="rest-duration-button ${hasPresetDuration && restMinutes === minutes ? "active" : ""}" data-rest-minutes="${minutes}" aria-pressed="${hasPresetDuration && restMinutes === minutes}">${minutes === 5 && hasPresetDuration ? '<span aria-hidden="true">✓</span>' : ""}${minutes} 分钟</button>`).join("")}
            <button type="button" class="rest-duration-button ${state.restCustomOpen || !REST_PRESET_MINUTES.includes(restMinutes) ? "active" : ""}" data-rest-minutes="custom" aria-pressed="${state.restCustomOpen || !REST_PRESET_MINUTES.includes(restMinutes)}">自定义</button>
          </div>
          ${state.restCustomOpen ? `<div class="rest-custom-duration"><label for="rest-custom-minutes">输入休息时间</label><div><input id="rest-custom-minutes" data-rest-custom-input type="number" min="1" max="60" step="1" value="${restMinutes}" inputmode="numeric" /><span>分钟</span><button type="button" data-action="apply-custom-rest">应用</button></div></div>` : ""}
          <div class="rest-auto-next"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a7 7 0 1 0 1 7"/><path d="m18 4 .2 4-4-.2"/></svg><span>休息结束后自动开始下一轮 ${state.nextFocusMode} 分钟专注</span></div>
        </section>
        <footer class="rest-actions">
          <button type="button" class="rest-skip-button" data-action="skip-rest">跳过休息</button>
          <button type="button" class="rest-continue-button" data-action="continue-rest">继续休息</button>
        </footer>
      </article>
    </section>`;
}

function formatRestTime() {
  const total = Math.max(0, state.restRemainingSeconds);
  const minutes = Math.floor(total / 60);
  const seconds = Math.floor(total % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function modeButton(value, label) {
  return `<button class="mode-button ${state.timerMode === value ? "active" : ""}" data-mode="${value}">${label}</button>`;
}

function focusViewButton(value, label, image) {
  return `<button type="button" class="focus-view-button ${state.focusImageChoice === value ? "active" : ""}" data-focus-view="${value}" aria-pressed="${state.focusImageChoice === value}"><img src="${image}" alt="" /><small>${label}</small></button>`;
}

function soundButton(key, icon, label, forcedActive = null) {
  const isMusicTrack = Boolean(FOCUS_MUSIC_TRACKS[key]);
  const isActive = forcedActive ?? (isMusicTrack ? state.sounds.music && state.musicTrack === key : Boolean(state.sounds[key]));
  const image = SOUND_OPTION_ART[key] || SOUND_OPTION_ART.ambient;
  return `<button type="button" class="environment-sound-button ${isMusicTrack ? "is-music-track" : ""} ${key === "mute" ? "is-muted-option" : ""} ${isActive ? "active" : ""}" data-sound="${key}" aria-pressed="${isActive}"><span class="sound-option-thumbnail" aria-hidden="true"><img src="${image}" alt="" /><i>${icon}</i></span><small>${label}</small></button>`;
}

function renderSummary() {
  if (PUBLIC_CONFIG.minimalMvp) return renderMinimalSummary();
  const scene = scenes[state.sceneId];
  const result = state.sessionResult || buildSessionResult("ended_early");
  const minutes = Math.floor(result.elapsedSeconds / 60);
  const seconds = result.elapsedSeconds % 60;
  const history = readHistory().filter((item) => item.elapsedSeconds > 0);
  const sessions = history.length;
  const streak = getFocusStreak(history);
  const summaryCopy = getSummaryCopy(result.status);
  const durationLabel = minutes > 0 ? `${String(minutes).padStart(2, "0")} 分钟` : `${String(seconds).padStart(2, "0")} 秒`;
  app.innerHTML = `
    <section class="view summary">
      <img class="summary-island-background" src="${islandImage}" alt="" />
      ${streak > 0 ? `<div class="summary-streak-badge" aria-label="连续专注 ${streak} 天"><span aria-hidden="true">♦</span>连续专注 <strong>${String(streak).padStart(2, "0")}</strong> 天</div>` : ""}
      <article class="summary-card">
        <div class="summary-symbol ${result.status === "not_started" ? "quiet" : ""}">${summaryCopy.symbol}</div>
        <p class="eyebrow">${summaryCopy.eyebrow}</p>
        <h1>${summaryCopy.title}</h1>
        <p class="summary-description">${summaryCopy.description.replace("{scene}", scene.name)}</p>
        <div class="summary-divider" aria-hidden="true"><span></span></div>
        <div class="summary-stats">
          <div class="summary-stat"><span class="summary-stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg></span><div><strong>${durationLabel}</strong><span>本次专注</span></div></div>
          <div class="summary-stat"><span class="summary-stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 9h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9Z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 5c0 1 1 1 1 2M12 5c0 1 1 1 1 2"/></svg></span><div><strong>${scene.name}</strong><span>停留场景</span></div></div>
          <div class="summary-stat"><span class="summary-stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg></span><div><strong>${sessions} 次</strong><span>累计完成</span></div></div>
        </div>
        <div class="feedback-title">这次专注时的状态如何？</div>
        <div class="feedback-options">
          ${[["no", "没有"], ["some", "有一点"], ["yes", "很明显"]].map(([value, label]) => `<button class="feedback-button ${state.feedback === value ? "selected" : ""}" data-feedback="${value}" aria-label="${label}" aria-pressed="${state.feedback === value}">${feedbackFaceIcon(value)}<span>${label}</span></button>`).join("")}
        </div>
        <div class="summary-actions">
          <button class="text-button" data-action="return-island"><span aria-hidden="true">⚑</span>回到海岛</button>
          <button class="secondary-button" data-action="return-room">返回房间</button>
          <button class="primary-button" data-action="retry-session">再来一次 <span aria-hidden="true">→</span></button>
        </div>
      </article>
    </section>`;
}

function feedbackFaceIcon(value) {
  const mouth = value === "yes" ? '<path d="M8.5 13.5c1.8 2 5.2 2 7 0"/>' : value === "some" ? '<path d="M9 14c1.7 1.2 4.3 1.2 6 0"/>' : '<path d="M9 15h6"/>';
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="9" cy="10" r=".7" class="face-eye"/><circle cx="15" cy="10" r=".7" class="face-eye"/>${mouth}</svg>`;
}

function getFocusStreak(history) {
  const activeDays = new Set(history.map((item) => new Date(item.endedAt || item.startedAt || 0)).filter((date) => !Number.isNaN(date.getTime())).map((date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`));
  if (!activeDays.size) return 0;
  const cursor = new Date();
  const dayKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  if (!activeDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (activeDays.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
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

async function setTimerMode(mode) {
  if (!PUBLIC_CONFIG.minimalMvp && (mode === 0 || mode === 50) && !["subscription", "lifetime", "admin", "offline_grace"].includes(state.accessStatus?.entitlementType)) {
    const access = await getAccessStatus({ refresh: true }).catch(() => null);
    if (!access || !["subscription", "lifetime", "admin", "offline_grace"].includes(access.entitlementType)) {
      openPaywall("paid_timer_mode_required");
      return;
    }
  }
  if (state.isRunning) syncTimerFromClock();
  state.sessionPhase = "focus";
  state.timerMode = mode;
  state.durationSeconds = Math.max(0, mode * 60);
  state.remainingSeconds = state.durationSeconds;
  state.elapsedSeconds = 0;
  state.sessionStartedAt = null;
  state.isRunning = false;
  state.sessionResult = null;
  lastTick = null;
  if (state.view === "room") renderRoom();
  else renderFocus();
}

async function toggleTimer() {
  const timerHadStarted = Boolean(state.sessionStartedAt);
  if (state.isRunning) {
    syncTimerFromClock();
    state.isRunning = false;
    stopTicker();
    suspendAudio();
    persistActiveSession(true);
    if (state.cloudFocusClientId) { queueFocusUpdate(state.cloudFocusClientId, { status: "paused", actualSeconds: state.elapsedSeconds, pausedSeconds: 0 }); void flushPendingFocusUpdates(); }
    sendHeartbeat();
  } else {
    if (!timerHadStarted && !await authorizeFocusStart()) return;
    state.isRunning = true;
    state.sessionStartedAt = state.sessionStartedAt || Date.now();
    lastTick = Date.now();
    startTicker();
    updateAudio();
    persistActiveSession(true);
    if (timerHadStarted && state.cloudFocusClientId) { queueFocusUpdate(state.cloudFocusClientId, { status: "running", actualSeconds: state.elapsedSeconds, pausedSeconds: 0 }); void flushPendingFocusUpdates(); }
    sendHeartbeat();
  }
  if (!timerHadStarted && state.isRunning) state.sessionPanelOpen = false;
  if (state.view === "focus") renderFocus();
  else renderRoom();
}

function startTicker() {
  if (ticker) return;
  lastTick = lastTick || Date.now();
  ticker = window.setInterval(() => {
    if (syncTimerFromClock()) return;
    document.querySelectorAll("[data-session-clock]").forEach((timerElement) => {
      timerElement.textContent = formatTime();
    });
    document.querySelectorAll("[data-rest-clock]").forEach((timerElement) => {
      timerElement.textContent = formatRestTime();
    });
    if (Date.now() - lastPersistAt >= 5000) persistActiveSession();
  }, 1000);
}

function syncTimerFromClock({ finishOnComplete = true } = {}) {
  if (state.sessionPhase === "rest") return syncRestTimerFromClock();
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
      if (finishOnComplete) finishSession("completed");
      return true;
    }
  }
  return false;
}

function syncRestTimerFromClock() {
  if (!lastTick) return false;
  const now = Date.now();
  const delta = Math.floor((now - lastTick) / 1000);
  if (delta < 1) return false;
  lastTick += delta * 1000;
  state.restRemainingSeconds = Math.max(0, state.restRemainingSeconds - delta);
  if (state.restRemainingSeconds === 0) {
    if (PUBLIC_CONFIG.minimalMvp) {
      stopTicker(); state.sessionPhase = "focus"; state.restStartedAt = null;
      localStorage.removeItem(STORAGE_KEYS.activeSession); state.view = "summary"; render();
    } else startNextFocusSession();
    return true;
  }
  return false;
}

function stopTicker() {
  if (ticker) window.clearInterval(ticker);
  ticker = null;
}

function stopTickerIfNeeded() {
  if (!["focus", "room"].includes(state.view) && !state.awaitingImmersiveFocus) stopTicker();
}

function queueFocusUpdate(clientSessionId, payload) {
  let pending;
  try { pending = JSON.parse(localStorage.getItem("focusIslandPendingFocusUpdatesV1") || "[]"); }
  catch (_) { pending = []; }
  if (!Array.isArray(pending)) pending = [];
  const previous = pending.find(item => item.clientSessionId === clientSessionId);
  const terminal = status => ["completed", "ended_early", "interrupted"].includes(status);
  if (previous && terminal(previous.payload?.status) && !terminal(payload.status)) return;
  pending = pending.filter(item => item.clientSessionId !== clientSessionId);
  pending.push({ clientSessionId, ownerUserId: onlineUserId, revision: crypto.randomUUID(), payload });
  localStorage.setItem("focusIslandPendingFocusUpdatesV1", JSON.stringify(pending.slice(-20)));
}

async function flushPendingFocusUpdates() {
  if (pendingFocusUpdatePromise) return pendingFocusUpdatePromise;
  pendingFocusUpdatePromise = (async () => {
    for (;;) {
      let pending;
      try { pending = JSON.parse(localStorage.getItem("focusIslandPendingFocusUpdatesV1") || "[]"); }
      catch (_) { return; }
      if (!Array.isArray(pending)) return;
      const item = pending.find(entry => !entry.ownerUserId || entry.ownerUserId === onlineUserId);
      if (!item) return;
      try {
        await api(`/api/focus/sessions/${encodeURIComponent(item.clientSessionId)}`, {
          method: "PATCH", body: JSON.stringify(item.payload), keepalive: true,
        });
      } catch (_) { return; }
      // Remove only the version sent. A terminal update queued while this request
      // was in flight must survive and be drained before this promise resolves.
      const current = JSON.parse(localStorage.getItem("focusIslandPendingFocusUpdatesV1") || "[]");
      localStorage.setItem("focusIslandPendingFocusUpdatesV1", JSON.stringify(current.filter(entry =>
        entry.clientSessionId !== item.clientSessionId || JSON.stringify(entry) !== JSON.stringify(item))));
    }
  })().finally(() => { pendingFocusUpdatePromise = null; });
  return pendingFocusUpdatePromise;
}

async function finishSession(forcedStatus = null) {
  if (finishSessionPromise) return finishSessionPromise;
  finishSessionPromise = finishSessionOnce(forcedStatus).finally(() => { finishSessionPromise = null; });
  return finishSessionPromise;
}

async function finishSessionOnce(forcedStatus = null) {
  if (state.sessionPhase === "rest") {
    state.restStartedAt = null;
    state.restCustomOpen = false;
    stopTicker();
    localStorage.removeItem(STORAGE_KEYS.activeSession);
    await releaseSeat();
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    state.view = "summary";
    render();
    return;
  }
  if (state.isRunning && !forcedStatus && syncTimerFromClock({ finishOnComplete: false })) forcedStatus = "completed";
  state.isRunning = false;
  state.sessionPanelOpen = false;
  clearImmersiveAutoEnter();
  stopTicker();
  stopAudio();
  const status = forcedStatus || (state.elapsedSeconds === 0 ? "not_started" : state.timerMode <= 0 ? "free_completed" : "ended_early");
  state.sessionResult = buildSessionResult(status);
  if (state.cloudFocusClientId) {
    const cloudStatus = status === "completed" || status === "free_completed" ? "completed" : status === "not_started" ? "interrupted" : "ended_early";
    queueFocusUpdate(state.cloudFocusClientId, { status: cloudStatus, actualSeconds: state.elapsedSeconds, pausedSeconds: 0 });
    await flushPendingFocusUpdates();
  }
  if (state.elapsedSeconds > 0) saveSessionResult(state.sessionResult);
  if (!PUBLIC_CONFIG.minimalMvp && status === "completed" && [25, 50].includes(state.timerMode)) {
    notifyFocusComplete();
    beginRestStage(state.timerMode);
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.activeSession);
  await releaseSeat();
  window.clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  state.view = "summary";
  render();
}

function beginRestStage(nextFocusMode) {
  state.sessionPhase = "rest";
  state.nextFocusMode = [25, 50].includes(nextFocusMode) ? nextFocusMode : 25;
  state.restDurationSeconds = DEFAULT_REST_MINUTES * 60;
  state.restRemainingSeconds = state.restDurationSeconds;
  state.restStartedAt = Date.now();
  state.restCustomOpen = false;
  state.isRunning = false;
  state.sessionPanelOpen = false;
  lastTick = Date.now();
  document.title = PUBLIC_CONFIG.minimalMvp ? "Take a break · Focus Isle" : "休息一下 · 专注岛";
  persistActiveSession(true);
  renderFocus();
}

function setRestDuration(minutes) {
  const nextMinutes = Math.min(60, Math.max(1, Math.round(Number(minutes) || DEFAULT_REST_MINUTES)));
  state.restDurationSeconds = nextMinutes * 60;
  state.restRemainingSeconds = state.restDurationSeconds;
  state.restStartedAt = Date.now();
  state.restCustomOpen = false;
  lastTick = Date.now();
  persistActiveSession(true);
  renderFocus();
}

async function startNextFocusSession() {
  state.cloudFocusClientId = null;
  stopTicker();
  state.sessionPhase = "focus";
  state.timerMode = [25, 50].includes(state.nextFocusMode) ? state.nextFocusMode : 25;
  state.durationSeconds = state.timerMode * 60;
  state.remainingSeconds = state.durationSeconds;
  state.elapsedSeconds = 0;
  state.sessionStartedAt = null;
  state.sessionResult = null;
  state.restStartedAt = null;
  state.restCustomOpen = false;
  state.isRunning = false;
  state.sessionPanelOpen = false;
  lastTick = null;
  document.title = "准备专注 · 专注岛";
  renderFocus();
  if (!await authorizeFocusStart()) {
    persistActiveSession(true);
    return;
  }
  state.sessionStartedAt = Date.now();
  state.isRunning = true;
  lastTick = state.sessionStartedAt;
  document.title = "专注中 · 专注岛";
  startTicker();
  updateAudio();
  persistActiveSession(true);
  sendHeartbeat();
  renderFocus();
}

function notifyFocusComplete() {
  document.title = "专注完成 · 专注岛";
  if (preferences.desktopNotifications && "Notification" in window && Notification.permission === "granted") {
    new Notification("专注完成", { body: "这一段时间已经完成，休息一下吧。" });
  }
  if (!preferences.completionSound) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  const context = new AudioCtor();
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.7);
  gain.connect(context.destination);
  [523.25, 659.25].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(context.currentTime + index * 0.12);
    oscillator.stop(context.currentTime + 0.72);
  });
  window.setTimeout(() => context.close(), 900);
}

function buildSessionResult(status) {
  return {
    id: `${state.sessionStartedAt || Date.now()}-${state.sceneId}-${state.roomId}`,
    clientSessionId: state.cloudFocusClientId,
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
    musicTrack: state.musicTrack,
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
  if (!["focus", "room"].includes(state.view) || !state.sceneId || state.selectedSeat === null || !state.currentSeatId) return;
  const now = Date.now();
  if (!force && now - lastPersistAt < 1000) return;
  localStorage.setItem(STORAGE_KEYS.activeSession, JSON.stringify({
    sceneId: state.sceneId,
    roomId: state.roomId,
    localRoom: state.localRoom,
    offlineFocus: Boolean(state.offlineFocus),
    selectedSeat: state.selectedSeat,
    timerMode: state.timerMode,
    durationSeconds: state.durationSeconds,
    remainingSeconds: state.remainingSeconds,
    elapsedSeconds: state.elapsedSeconds,
    isRunning: state.isRunning,
    sessionPhase: state.sessionPhase,
    restDurationSeconds: state.restDurationSeconds,
    restRemainingSeconds: state.restRemainingSeconds,
    restStartedAt: state.restStartedAt,
    nextFocusMode: state.nextFocusMode,
    sessionStartedAt: state.sessionStartedAt,
    cloudFocusClientId: state.cloudFocusClientId,
    companions: state.companions,
    focusImageChoice: state.focusImageChoice,
    sounds: state.sounds,
    musicTrack: state.musicTrack,
    soundVolumes: state.soundVolumes,
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
      localRoom: Boolean(saved.localRoom),
      offlineFocus: Boolean(saved.offlineFocus),
      selectedSeat: saved.selectedSeat,
      currentSeatId: saved.selectedSeat + 1,
      timerMode: saved.timerMode,
      durationSeconds: saved.durationSeconds,
      remainingSeconds: saved.remainingSeconds,
      elapsedSeconds: saved.elapsedSeconds,
      isRunning: Boolean(saved.isRunning),
      sessionPhase: saved.sessionPhase === "rest" ? "rest" : "focus",
      restDurationSeconds: Number(saved.restDurationSeconds) || DEFAULT_REST_MINUTES * 60,
      restRemainingSeconds: Number(saved.restRemainingSeconds) || DEFAULT_REST_MINUTES * 60,
      restStartedAt: saved.restStartedAt || null,
      restCustomOpen: false,
      nextFocusMode: [25, 50].includes(Number(saved.nextFocusMode)) ? Number(saved.nextFocusMode) : 25,
      sessionStartedAt: saved.sessionStartedAt,
      cloudFocusClientId: saved.cloudFocusClientId || null,
      companions: saved.companions || 6,
      focusImageChoice: saved.focusImageChoice || "window",
      sounds: { ...state.sounds, ...saved.sounds },
      musicTrack: FOCUS_MUSIC_TRACKS[saved.musicTrack] ? saved.musicTrack : "rainy-notes",
      soundVolumes: { ...state.soundVolumes, ...saved.soundVolumes },
      sessionPanelOpen: false,
    });
    if (state.localRoom) {
      state.localNpcRoster = createLocalNpcLeases({ excludeSeatIds: [saved.selectedSeat + 1] });
      state.roomPresence = {
        leases: [...state.localNpcRoster, {
          roomId: "cafe-local",
          seatId: saved.selectedSeat + 1,
          sessionId: identity.sessionId,
          guestId: identity.guestId,
          displayName: identity.displayName,
          avatarSkin: identity.avatarSkin,
          memberType: "human",
          state: "occupied",
          activity: saved.sessionPhase === "rest" ? "休息中" : saved.isRunning ? "专注计时中" : "已入座",
          focusStartedAt: saved.sessionStartedAt,
        }],
        serverNow: Date.now(),
      };
    } else {
      state.localNpcRoster = createLocalNpcLeases({ excludeSeatIds: [saved.selectedSeat + 1] });
    }
    if (state.sessionPhase === "rest") {
      const offlineSeconds = Math.max(0, Math.floor((Date.now() - saved.savedAt) / 1000));
      state.restRemainingSeconds = Math.max(0, state.restRemainingSeconds - offlineSeconds);
      if (state.restRemainingSeconds === 0) {
        state.sessionPhase = "focus";
        state.timerMode = state.nextFocusMode;
        state.durationSeconds = state.timerMode * 60;
        state.remainingSeconds = state.durationSeconds;
        state.elapsedSeconds = 0;
        state.sessionStartedAt = null;
        state.cloudFocusClientId = null;
        state.sessionResult = null;
        state.restStartedAt = null;
        state.isRunning = false;
      }
      lastTick = Date.now();
    } else if (state.isRunning) {
      const offlineSeconds = Math.max(0, Math.floor((Date.now() - saved.savedAt) / 1000));
      const appliedOfflineSeconds = state.timerMode > 0 ? Math.min(offlineSeconds, state.remainingSeconds) : offlineSeconds;
      state.elapsedSeconds += appliedOfflineSeconds;
      if (state.timerMode > 0) {
        state.remainingSeconds = Math.max(0, state.remainingSeconds - appliedOfflineSeconds);
        if (state.remainingSeconds === 0) {
          state.isRunning = false;
          if (state.cloudFocusClientId) {
            queueFocusUpdate(state.cloudFocusClientId, { status: "completed", actualSeconds: state.elapsedSeconds, pausedSeconds: 0 });
          }
          state.sessionResult = buildSessionResult("completed");
          saveSessionResult(state.sessionResult);
          state.sessionPhase = PUBLIC_CONFIG.minimalMvp ? "focus" : "rest";
          if (PUBLIC_CONFIG.minimalMvp) { state.view = "summary"; localStorage.removeItem(STORAGE_KEYS.activeSession); void releaseSeat(); }
          state.nextFocusMode = [25, 50].includes(state.timerMode) ? state.timerMode : 25;
          state.restDurationSeconds = DEFAULT_REST_MINUTES * 60;
          state.restRemainingSeconds = Math.max(1, state.restDurationSeconds - Math.max(0, offlineSeconds - appliedOfflineSeconds));
          state.restStartedAt = Date.now();
          lastTick = Date.now();
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
  state.sessionPhase = "focus";
  state.timerMode = keepMode ? state.timerMode : 25;
  state.durationSeconds = Math.max(0, state.timerMode * 60);
  state.remainingSeconds = state.durationSeconds;
  state.elapsedSeconds = 0;
  state.sessionStartedAt = null;
  state.cloudFocusClientId = null;
  state.sessionResult = null;
  state.restDurationSeconds = DEFAULT_REST_MINUTES * 60;
  state.restRemainingSeconds = state.restDurationSeconds;
  state.restStartedAt = null;
  state.restCustomOpen = false;
  state.nextFocusMode = [25, 50].includes(state.timerMode) ? state.timerMode : 25;
  state.feedback = null;
  lastTick = null;
  localStorage.removeItem(STORAGE_KEYS.activeSession);
}

function retrySession() {
  resetTimerState();
  state.selectedSeat = null;
  state.view = roomViewForScene();
  render();
}

function returnRoom() {
  resetTimerState();
  state.selectedSeat = null;
  state.view = roomViewForScene();
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

function isRoom3DInteractionEnvelope(message) {
  return Boolean(message)
    && typeof message === "object"
    && message.contract_version === ROOM_3D_CONTRACT_VERSION
    && ROOM_3D_EVENT_TYPES.has(message.event_type)
    && typeof message.interaction_id === "string"
    && message.interaction_id.length > 0
    && typeof message.room_id === "string"
    && typeof message.seat_id === "string"
    && typeof message.look_id === "string"
    && Number.isSafeInteger(message.lease_revision)
    && Number.isSafeInteger(message.event_sequence)
    && message.event_sequence >= 1
    && typeof message.server_time === "number"
    && message.payload
    && typeof message.payload === "object";
}

function isCurrentRoom3DInteraction(message) {
  if (!isRoom3DInteractionEnvelope(message) || !room3DInteraction) return false;
  return message.interaction_id === room3DInteraction.interaction_id
    && message.event_sequence > room3DInteraction.event_sequence
    && message.lease_revision >= room3DInteraction.lease_revision;
}

function room3DResponse(source, eventType, payload = {}, { leaseRevision } = {}) {
  return {
    contract_version: ROOM_3D_CONTRACT_VERSION,
    event_type: eventType,
    interaction_id: source.interaction_id,
    room_id: currentRoomApiId() || source.room_id,
    seat_id: source.seat_id,
    look_id: source.look_id,
    lease_revision: leaseRevision ?? source.lease_revision,
    event_sequence: source.event_sequence + 1,
    server_time: Date.now(),
    payload: { service_seat_id: ROOM_3D_SERVICE_SEAT_ID, ...payload },
  };
}

function deliverRoom3DResponse(message) {
  room3DInteraction = message;
  localStorage.setItem(ROOM_3D_RESPONSE_STORAGE_KEY, JSON.stringify(message));
  const frame = document.querySelector("[data-godot-room-frame]");
  if (frame?.contentWindow) {
    frame.contentWindow.postMessage(message, new URL(frame.src, window.location.href).origin);
  }
}

function stopRoom3DLeaseHeartbeat() {
  window.clearInterval(room3DLeaseHeartbeatTimer);
  room3DLeaseHeartbeatTimer = null;
}

async function renewRoom3DLease() {
  if (!room3DInteraction || state.localRoom) return;
  try {
    await api(`/api/sessions/${identity.sessionId}/heartbeat`, {
      method: "POST",
      body: JSON.stringify({ activity: "正在走向座位", focusing: false }),
    });
  } catch (_) {
    stopRoom3DLeaseHeartbeat();
  }
}

function startRoom3DLeaseHeartbeat() {
  stopRoom3DLeaseHeartbeat();
  room3DLeaseHeartbeatTimer = window.setInterval(renewRoom3DLease, ROOM_3D_LEASE_HEARTBEAT_MS);
}

async function releaseRoom3DLease() {
  stopRoom3DLeaseHeartbeat();
  room3DInteraction = null;
  localStorage.removeItem(ROOM_3D_RESPONSE_STORAGE_KEY);
  await releaseSeat({ force: true });
}

async function handleRoom3DTransaction(message) {
  if (!isRoom3DInteractionEnvelope(message)) return;
  const serviceSeatId = Number(message.payload?.service_seat_id);
  if (serviceSeatId !== ROOM_3D_SERVICE_SEAT_ID) return;

  if (message.event_type === "seat_intent") {
    if (state.view !== "godot-room" || state.localRoom) {
      deliverRoom3DResponse(room3DResponse(message, "seat_reservation_denied", { reason: "online_authority_unavailable" }));
      return;
    }
    if (room3DInteraction && room3DInteraction.interaction_id !== message.interaction_id) {
      await releaseRoom3DLease();
    }
    room3DInteraction = message;
    try {
      const result = await api(`/api/rooms/${currentRoomApiId()}/seats/${serviceSeatId}/reserve`, {
        method: "POST",
        body: JSON.stringify(identityBody()),
      });
      const granted = room3DResponse(message, "seat_reservation_granted", {
        expires_at: result.expiresAt,
      }, { leaseRevision: message.lease_revision + 1 });
      deliverRoom3DResponse(granted);
      startRoom3DLeaseHeartbeat();
    } catch (error) {
      deliverRoom3DResponse(room3DResponse(message, "seat_reservation_denied", {
        reason: error.message || "reservation_failed",
      }, { leaseRevision: message.lease_revision + 1 }));
    }
    return;
  }

  if (!isCurrentRoom3DInteraction(message)) return;
  room3DInteraction = message;

  if (message.event_type === "seat_sequence_started") return;

  if (message.event_type === "seat_contact_completed") {
    try {
      const result = await api(`/api/sessions/${identity.sessionId}/occupy`, {
        method: "POST",
        body: JSON.stringify({ roomId: currentRoomApiId(), seatId: serviceSeatId }),
      });
      state.currentSeatId = serviceSeatId;
      state.selectedSeat = serviceSeatId - 1;
      const confirmed = room3DResponse(message, "seat_occupation_confirmed", {
        expires_at: result.expiresAt,
      });
      deliverRoom3DResponse(confirmed);
      stopRoom3DLeaseHeartbeat();
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = window.setInterval(sendHeartbeat, 15000);
    } catch (error) {
      const failed = room3DResponse(message, "seat_occupation_failed", {
        reason: error.message || "occupation_failed",
      });
      await releaseRoom3DLease();
      deliverRoom3DResponse(failed);
    }
    return;
  }

  if (message.event_type === "focus_autostart_requested") {
    try {
      state.timerMode = 25;
      state.durationSeconds = 25 * 60;
      state.remainingSeconds = 25 * 60;
      state.elapsedSeconds = 0;
      state.sessionPhase = "focus";
      state.sessionStartedAt = Date.now();
      state.isRunning = true;
      lastTick = state.sessionStartedAt;
      await api(`/api/sessions/${identity.sessionId}/heartbeat`, {
        method: "POST",
        body: JSON.stringify({ activity: "专注计时中", focusing: true }),
      });
      deliverRoom3DResponse(room3DResponse(message, "focus_autostart_confirmed", {
        focus_started_at: state.sessionStartedAt,
      }));
    } catch (error) {
      state.isRunning = false;
      state.sessionStartedAt = null;
      deliverRoom3DResponse(room3DResponse(message, "focus_autostart_failed", {
        reason: error.message || "focus_start_failed",
      }));
    }
    return;
  }

  if (["seat_sequence_failed", "seat_release_requested"].includes(message.event_type)) {
    await releaseRoom3DLease();
  }
}

window.addEventListener("message", (event) => {
  const frame = document.querySelector("[data-godot-room-frame]");
  if (!frame || event.source !== frame.contentWindow) return;
  if (event.origin !== new URL(frame.src, window.location.href).origin) return;
  const message = event.data;
  if (!message || typeof message !== "object") return;

  if (isRoom3DInteractionEnvelope(message)) {
    void handleRoom3DTransaction(message);
    return;
  }

  if (message.type === "focus-island-godot-ready") {
    if (godotRoomReadyTimer) window.clearTimeout(godotRoomReadyTimer);
    godotRoomReadyTimer = null;
    document.querySelector("[data-godot-room-loading]")?.classList.add("is-hidden");
    return;
  }

  if (message.type === "focus-island-room-exit") {
    state.view = "island";
    state.roomId = null;
    state.selectedSeat = null;
    render();
    return;
  }

  if (message.type !== "focus-island-room-focus") return;
  const context = message.payload || {};
  const seatMatch = String(context.seat_id || "").match(/(\d+)$/);
  const seatNumber = Number(context.service_seat_id) || (seatMatch ? Number(seatMatch[1]) : ROOM_3D_SERVICE_SEAT_ID);
  state.sceneId = "cafe";
  state.roomId = state.roomId || "cafe-rain";
  state.selectedSeat = Math.max(0, Math.min(scenes.cafe.seats.length - 1, seatNumber - 1));
  state.timerMode = 25;
  state.durationSeconds = 25 * 60;
  state.remainingSeconds = 25 * 60;
  state.elapsedSeconds = 0;
  state.sessionStartedAt = state.sessionStartedAt || Date.now();
  state.sessionResult = null;
  state.sessionPhase = "focus";
  state.restDurationSeconds = DEFAULT_REST_MINUTES * 60;
  state.restRemainingSeconds = state.restDurationSeconds;
  state.restStartedAt = null;
  state.restCustomOpen = false;
  state.nextFocusMode = 25;
  state.sessionPanelOpen = false;
  state.focusImageChoice = "seat";
  state.isRunning = true;
  lastTick = Date.now();
  state.view = "focus";
  render();
});

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

  const whiteBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const whiteData = whiteBuffer.getChannelData(0);
  for (let index = 0; index < bufferSize; index += 1) whiteData[index] = Math.random() * 2 - 1;
  whiteNoiseSource = audioContext.createBufferSource();
  whiteNoiseSource.buffer = whiteBuffer;
  whiteNoiseSource.loop = true;
  whiteNoiseGain = audioContext.createGain();
  whiteNoiseGain.gain.value = 0;
  whiteNoiseSource.connect(whiteNoiseGain).connect(audioContext.destination);
  whiteNoiseSource.start();

}

function updateAudio() {
  initAudio();
  if (audioContext && noiseGain) {
    audioContext.resume();
    noiseGain.gain.setTargetAtTime(state.sounds.ambient ? CAFE_AMBIENT_GAIN * state.soundVolumes.ambient / 100 : 0, audioContext.currentTime, 0.5);
    whiteNoiseGain?.gain.setTargetAtTime(state.sounds.white ? 0.03 * state.soundVolumes.white / 100 : 0, audioContext.currentTime, 0.5);
    if (noiseFilter) noiseFilter.frequency.setTargetAtTime(scenes[state.sceneId].filter, audioContext.currentTime, 0.6);
  }
  updateMusicAudio();
}

function updateMusicAudio() {
  const track = FOCUS_MUSIC_TRACKS[state.musicTrack];
  if (!state.sounds.music || !state.isRunning || !track) {
    musicAudio?.pause();
    return;
  }
  if (!musicAudio || loadedMusicTrack !== state.musicTrack) {
    musicAudio?.pause();
    musicAudio = new Audio(track.src);
    musicAudio.loop = true;
    musicAudio.preload = "metadata";
    loadedMusicTrack = state.musicTrack;
  }
  musicAudio.volume = Math.min(0.9, Math.max(0, state.soundVolumes.music / 100 * MUSIC_VOLUME_BOOST));
  musicAudio.play().catch(() => {});
}

function muteAllAudioImmediately() {
  if (audioContext) {
    const now = audioContext.currentTime;
    [noiseGain, whiteNoiseGain].filter(Boolean).forEach((gainNode) => {
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(0, now);
    });
  }
  musicAudio?.pause();
}

function suspendAudio() {
  if (audioContext && noiseGain) {
    noiseGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.25);
    whiteNoiseGain?.gain.setTargetAtTime(0, audioContext.currentTime, 0.25);
  }
  musicAudio?.pause();
}

function stopAudio() {
  if (noiseSource) {
    try { noiseSource.stop(); } catch (_) { /* already stopped */ }
  }
  if (whiteNoiseSource) {
    try { whiteNoiseSource.stop(); } catch (_) { /* already stopped */ }
  }
  musicAudio?.pause();
  if (musicAudio) musicAudio.src = "";
  if (audioContext) audioContext.close();
  audioContext = null;
  noiseSource = null;
  noiseGain = null;
  noiseFilter = null;
  whiteNoiseSource = null;
  whiteNoiseGain = null;
  musicAudio = null;
  loadedMusicTrack = null;
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

document.addEventListener("click", async (event) => {
  const clickedOutsideFocusSettings = state.view === "focus"
    && state.sessionPanelOpen
    && !event.target.closest(".session-control-panel")
    && !event.target.closest("[data-action]");
  if (clickedOutsideFocusSettings) {
    state.sessionPanelOpen = false;
    renderFocus();
    return;
  }

  const sceneButton = event.target.closest("[data-scene]");
  if (sceneButton) {
    state.libraryCurrentSeatId = null;
    state.sceneId = sceneButton.dataset.scene;
    state.roomId = null;
    state.roomPreviewId = null;
    if (state.sceneId === "cafe") enterCafeRoom();
    else showToast("这个场景即将开放");
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
  if (seatMarkerElement && state.isDeveloper && state.cafeDebugMode.enabled) {
    state.cafeSceneEditor.activeObjectId = seatMarkerElement.dataset.cafeSeatMarkerObject;
    renderRoom();
    return;
  }

  const librarySeatMarkerElement = event.target.closest("[data-library-seat-marker-object]");
  if (librarySeatMarkerElement && state.isDeveloper && state.libraryDebugMode.enabled) {
    state.librarySceneEditor.activeObjectId = librarySeatMarkerElement.dataset.librarySeatMarkerObject;
    renderRoom();
    return;
  }

  const seatButton = event.target.closest("[data-seat]");
  if (seatButton) {
    if (state.staticSeatCalibration.enabled && seatButton.matches("[data-static-seat-marker]")) return;
    state.selectedSeat = Number(seatButton.dataset.seat);
    if (state.sceneId === "cafe") occupySelectedSeat();
    else renderRoom();
    return;
  }

  const modeButtonElement = event.target.closest("[data-mode]");
  if (modeButtonElement) {
    setTimerMode(Number(modeButtonElement.dataset.mode));
    return;
  }

  const restDurationButton = event.target.closest("[data-rest-minutes]");
  if (restDurationButton) {
    const value = restDurationButton.dataset.restMinutes;
    if (value === "custom") {
      state.restCustomOpen = true;
      renderFocus();
      window.setTimeout(() => document.querySelector("[data-rest-custom-input]")?.focus(), 0);
    } else {
      setRestDuration(Number(value));
    }
    return;
  }

  const soundButtonElement = event.target.closest("[data-sound]");
  if (soundButtonElement) {
    const key = soundButtonElement.dataset.sound;
    Object.keys(state.sounds).forEach((soundKey) => { state.sounds[soundKey] = false; });
    if (FOCUS_MUSIC_TRACKS[key]) {
      state.sounds.music = true;
      state.musicTrack = key;
    } else if (key !== "mute") {
      state.sounds[key] = true;
    }
    if (key === "mute") muteAllAudioImmediately();
    else if (state.isRunning) updateAudio();
    saveSoundPreferencesFromState();
    persistActiveSession(true);
    document.querySelectorAll("[data-sound]").forEach((button) => {
      const buttonKey = button.dataset.sound;
      const isMusicTrack = Boolean(FOCUS_MUSIC_TRACKS[buttonKey]);
      const active = buttonKey === "mute"
        ? !state.sounds.ambient && !state.sounds.white && !state.sounds.music
        : isMusicTrack
          ? state.sounds.music && state.musicTrack === buttonKey
          : Boolean(state.sounds[buttonKey]);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    return;
  }

  const focusViewButtonElement = event.target.closest("[data-focus-view]");
  if (focusViewButtonElement) {
    state.focusImageChoice = focusViewButtonElement.dataset.focusView;
    if (preferences.rememberLastFocusView) {
      preferences.lastFocusView = state.focusImageChoice;
      savePreferences();
    }
    if (state.view === "focus") {
      const focusImageElement = document.querySelector("[data-focus-scene-image]");
      if (focusImageElement) focusImageElement.src = selectedFocusImage();
      document.querySelectorAll("[data-focus-view]").forEach((button) => {
        const active = button.dataset.focusView === state.focusImageChoice;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      persistActiveSession(true);
    } else {
      renderRoom();
    }
    return;
  }

  const feedbackButton = event.target.closest("[data-feedback]");
  if (feedbackButton) {
    state.feedback = feedbackButton.dataset.feedback;
    if (state.sessionResult && state.sessionResult.elapsedSeconds > 0) {
      state.sessionResult.feedback = state.feedback;
      saveSessionResult(state.sessionResult);
    }
    document.querySelectorAll("[data-feedback]").forEach((button) => {
      const selected = button === feedbackButton;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    showToast("谢谢，你的感受已经记下了");
    return;
  }

  const profileTabButton = event.target.closest("[data-profile-tab]");
  if (profileTabButton) {
    if (profileTabButton.dataset.profileTab === "developer" && !state.isDeveloper) return;
    state.personalCenter.tab = profileTabButton.dataset.profileTab;
    state.personalCenter.confirmAction = null;
    renderPersonalCenter();
    if (state.personalCenter.tab === "developer") void refreshDeveloperDiagnostics();
    return;
  }

  const billingButton = event.target.closest("[data-billing-plan]");
  if (billingButton) {
    billingButton.disabled = true;
    billingButton.classList.add("is-loading");
    api("/api/billing/checkout", { method: "POST", body: JSON.stringify({ plan: billingButton.dataset.billingPlan }) })
      .then(({ checkoutUrl }) => { window.location.assign(checkoutUrl); })
      .catch((error) => {
        billingButton.disabled = false;
        billingButton.classList.remove("is-loading");
        if (error.status === 401 || error.status === 403) openAuthGate(error.message);
        else if (error.message === "founder_lifetime_unavailable") showToast("创始终身版当前不可购买");
        else if (error.message === "billing_price_mismatch") showToast("价格校验未通过，已安全阻止打开结账页");
        else if (error.message === "billing_plan_not_configured") showToast("该方案尚未绑定 Stripe Price");
        else showToast("暂时无法打开结账页");
      });
    return;
  }

  const billingPortalButton = event.target.closest('[data-action="open-billing-portal"]');
  if (billingPortalButton) {
    billingPortalButton.disabled = true;
    api("/api/billing/portal", { method: "POST", body: "{}" })
      .then(({ portalUrl }) => { window.location.assign(portalUrl); })
      .catch(() => {
        billingPortalButton.disabled = false;
        showToast("暂时无法打开 Stripe 账单管理");
      });
    return;
  }

  const profileMonthButton = event.target.closest("[data-profile-month-delta]");
  if (profileMonthButton) {
    const [year, month] = state.personalCenter.monthKey.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1 + Number(profileMonthButton.dataset.profileMonthDelta), 1));
    state.personalCenter.monthKey = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
    state.personalCenter.selectedDate = `${state.personalCenter.monthKey}-01`;
    renderPersonalCenter();
    return;
  }

  const profileDateButton = event.target.closest("[data-profile-date]");
  if (profileDateButton) {
    state.personalCenter.selectedDate = profileDateButton.dataset.profileDate;
    renderPersonalCenter();
    return;
  }

  const profileTimerButton = event.target.closest("[data-preference-timer]");
  if (profileTimerButton) {
    preferences.defaultTimerMode = Number(profileTimerButton.dataset.preferenceTimer);
    savePreferences();
    renderPersonalCenter();
    return;
  }

  const profileLanguageButton = event.target.closest("[data-profile-language]");
  if (profileLanguageButton) {
    const language = profileLanguageButton.dataset.profileLanguage === "zh-CN" ? "zh-CN" : "en";
    if (preferences.language === language) return;
    preferences.language = language;
    savePreferences();
    window.FocusI18n?.setLanguage(language);
    render();
    if (state.personalCenter.open) renderPersonalCenter();
    return;
  }

  const preferenceToggle = event.target.closest("[data-preference-toggle]");
  if (preferenceToggle) {
    const key = preferenceToggle.dataset.preferenceToggle;
    const nextValue = !Boolean(preferences[key]);
    if (key === "desktopNotifications" && nextValue && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        preferences.desktopNotifications = permission === "granted";
        savePreferences();
        renderPersonalCenter();
      }).catch(() => showToast("暂时无法申请通知权限"));
      return;
    }
    preferences[key] = nextValue;
    savePreferences();
    renderPersonalCenter();
    return;
  }

  const profileSoundToggle = event.target.closest("[data-profile-sound-toggle]");
  if (profileSoundToggle) {
    const key = profileSoundToggle.dataset.profileSoundToggle;
    state.sounds[key] = !state.sounds[key];
    saveSoundPreferencesFromState();
    if (state.isRunning) updateAudio();
    persistActiveSession(true);
    renderPersonalCenter();
    return;
  }

  const profileMusicButton = event.target.closest("[data-profile-music]");
  if (profileMusicButton) {
    state.musicTrack = profileMusicButton.dataset.profileMusic;
    state.sounds.music = true;
    saveSoundPreferencesFromState();
    if (state.isRunning) updateAudio();
    persistActiveSession(true);
    renderPersonalCenter();
    return;
  }

  const profileAvatarButton = event.target.closest("[data-profile-avatar]");
  if (profileAvatarButton) {
    identity.avatarSkin = Number(profileAvatarButton.dataset.profileAvatar);
    persistIdentity();
    renderPersonalCenter();
    return;
  }

  const profileConfirmButton = event.target.closest("[data-confirm-profile]");
  if (profileConfirmButton) {
    if (profileConfirmButton.dataset.confirmProfile === "developer-end-focus") {
      confirmDeveloperSessionEnd();
      return;
    }
    state.personalCenter.confirmAction = profileConfirmButton.dataset.confirmProfile;
    renderPersonalCenter();
    return;
  }

  const sceneObjectElement = event.target.closest("[data-cafe-scene-object]");
  if (sceneObjectElement && state.isDeveloper && state.cafeDebugMode.enabled) {
    state.cafeSceneEditor.activeObjectId = sceneObjectElement.dataset.cafeSceneObject;
    renderRoom();
    return;
  }

  const libraryObjectElement = event.target.closest("[data-library-scene-object]");
  if (libraryObjectElement && state.isDeveloper && state.libraryDebugMode.enabled) {
    state.librarySceneEditor.activeObjectId = libraryObjectElement.dataset.librarySceneObject;
    renderRoom();
    return;
  }

  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  const action = actionElement.dataset.action;
  const developerAction = /developer-|(?:cafe|library)-(?:debug|scene|sprite)|static-seat|publish-(?:cafe|library)|select-(?:cafe|library)|nudge-(?:cafe|library)|flip-(?:cafe|library)|duplicate-(?:cafe|library)|delete-(?:cafe|library)|reset-(?:cafe|library)|copy-(?:cafe|library)|release-cafe-seat/.test(action);
  if (developerAction && !state.isDeveloper) return;
  if (action === "continue-previous-focus" || action === "replace-previous-focus") {
    void resolvePreviousFocus(action === "replace-previous-focus");
    return;
  }
  if (action === "developer-refresh-diagnostics") { void refreshDeveloperDiagnostics(); return; }
  if (action === "developer-enter-cafe") {
    if (state.currentSeatId) return;
    closePersonalCenter();
    state.sceneId = "cafe";
    state.roomId = null;
    state.roomPreviewId = null;
    state.selectedSeat = null;
    await enterCafeRoom();
    return;
  }
  if (action === "developer-recover-focus") { closePersonalCenter(); void openFocusRecovery(); return; }
  if (action === "developer-reset-static") {
    state.cafeDebugMode.enabled = false;
    state.cafeSpriteTuning.enabled = false;
    state.libraryDebugMode.enabled = false;
    state.staticSeatCalibration.enabled = false;
    resetStaticSeatMarkerPositions();
    localStorage.setItem(CAFE_ROOM_RENDERER_STORAGE_KEY, CAFE_ROOM_RENDERER_STATIC);
    const url = new URL(window.location.href);
    url.searchParams.delete(CAFE_ROOM_RENDERER_QUERY_KEY);
    url.searchParams.delete(CAFE_ROOM_3D_SRC_QUERY_KEY);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    if (state.view === "godot-room") state.view = "room";
    closePersonalCenter();
    render();
    return;
  }
  if (action === "confirm-leave-focus") {
    closeAccessOverlay();
    await finishSession();
    resetTimerState();
    state.view = "island";
    state.selectedSeat = null;
    state.roomId = null;
    state.localRoom = false;
    render();
    return;
  }

  if (action === "profile") {
    openPersonalCenter();
    return;
  }
  if (action === "close-personal-center" || action === "return-active-focus") {
    closePersonalCenter();
    return;
  }
  if (action === "profile-start-focus") {
    closePersonalCenter();
    state.view = "island";
    render();
    return;
  }
  if (action === "resume-focus-session") {
    closePersonalCenter();
    restoreActiveSession();
    render();
    return;
  }
  if (action === "save-profile-identity") {
    const input = document.querySelector("[data-profile-name]");
    const value = String(input?.value || "").trim();
    if (!value || value.length > 16 || /[\u0000-\u001f\u007f]/.test(value)) {
      showToast("昵称需为 1–16 个有效字符");
      input?.focus();
      return;
    }
    identity.displayName = value;
    persistIdentity();
    renderPersonalCenter();
    showToast("昵称已保存");
    return;
  }
  if (action === "open-cafe-developer-editor") {
    showToast("请使用当前静态 MVP 开发者工具");
    return;
  }
  if (action === "open-static-seat-calibration") {
    if (!state.isDeveloper || state.view !== "room" || state.sceneId !== "cafe") return;
    closePersonalCenter();
    state.cafeDebugMode.enabled = false;
    state.cafeSpriteTuning.enabled = false;
    state.staticSeatCalibration.enabled = true;
    clearImmersiveAutoEnter();
    renderStaticCafeRoom();
    return;
  }
  if (action === "cancel-profile-confirm") {
    state.developerEndSession = null;
    state.personalCenter.confirmAction = null;
    renderPersonalCenter();
    return;
  }
  if (action === "execute-profile-confirm") {
    executeProfileDataAction();
    return;
  }

  if (action === "open-sign-in") {
    state.authMode = "sign-in";
    openAuthGate("", "enter-island");
    return;
  }

  if (action === "enter-island") {
    window.scrollTo({ top: 0, behavior: "auto" });
    getAccessStatus({ refresh: true }).then((access) => {
      if (!access.authenticated || !access.canEnterProduct) {
        openAuthGate(access.paywallReason, "enter-island");
        return;
      }
      state.view = "island";
      render();
      importLocalHistory();
    }).catch((error) => openAuthGate(error.message || "access_service_unavailable", "enter-island"));
  }
  if (action === "close-access-overlay") closeAccessOverlay();
  if (action === "toggle-auth-mode") {
    state.authMode = state.authMode === "sign-up" ? "sign-in" : "sign-up";
    state.authError = "";
    renderAccessOverlay();
  }
  if (action === "auth-sign-in-from-paywall") {
    state.authMode = "sign-in";
    state.accessOverlay = "auth";
    state.authError = "";
    renderAccessOverlay();
  }
  if (action === "reset-password") {
    const email = String(document.querySelector('[data-auth-form] input[name="email"]')?.value || state.authEmail).trim();
    if (!email) { showToast("请先填写邮箱"); return; }
    turnstileToken().then((captchaToken) => api("/api/auth/password/reset", { method: "POST", body: JSON.stringify({ email, captchaToken }) }))
      .then(() => showToast("如果账号存在，重置邮件已经发送"))
      .catch(() => showToast("暂时无法发送重置邮件"));
  }
  if (action === "scroll-story") {
    document.querySelector("#story")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (action === "back-island") {
    if (isActiveFocusSession()) {
      state.accessOverlay = "leave-focus";
      renderAccessOverlay();
      return;
    }
    if (state.currentSeatId) await releaseSeat();
    stopRoomPresence();
    state.view = "island";
    state.roomId = null;
    state.localRoom = false;
    state.selectedSeat = null;
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
    state.view = roomViewForScene();
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
  if (action === "apply-custom-rest") {
    const customInput = document.querySelector("[data-rest-custom-input]");
    setRestDuration(customInput?.value);
  }
  if (action === "skip-rest") startNextFocusSession();
  if (action === "continue-rest") {
    state.restCustomOpen = false;
    renderFocus();
    showToast(`${Math.max(1, Math.ceil(state.restRemainingSeconds / 60))} 分钟后提醒你开始下一轮专注`);
  }
  if (action === "return-room-view") {
    if (state.isRunning) syncTimerFromClock();
    state.sessionPanelOpen = false;
    state.view = "room";
    renderRoom();
  }
  if (action === "toggle-room-view") {
    if (state.isRunning) syncTimerFromClock();
    state.sessionPanelOpen = false;
    state.view = state.view === "focus" ? "room" : "focus";
    render();
  }
  if (action === "finish-session") finishSession();
  if (action === "retry-session") retrySession();
  if (action === "return-room") returnRoom();
  if (action === "return-island") returnIsland();
  if (action === "toggle-static-seat-calibration") {
    if (!state.isDeveloper) return;
    state.staticSeatCalibration.enabled = !state.staticSeatCalibration.enabled;
    if (state.staticSeatCalibration.enabled) clearImmersiveAutoEnter();
    renderStaticCafeRoom();
  }
  if (action === "reset-static-seat-markers") {
    if (!state.isDeveloper) return;
    resetStaticSeatMarkerPositions();
    renderStaticCafeRoom();
    showToast("座位编号已恢复默认位置");
  }
  if (action === "toggle-cafe-debug-mode") {
    if (!state.isDeveloper) return;
    state.cafeDebugMode.enabled = false;
    state.cafeSpriteTuning.enabled = false;
    openPersonalCenter({ tab: "developer" });
    return;
  }
  if (action === "toggle-library-debug-mode") {
    if (!state.isDeveloper) return;
    state.libraryDebugMode.enabled = false;
    openPersonalCenter({ tab: "developer" });
    return;
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
  if (action === "locked-room") showToast("首期先把临窗雨声做完整，另外两个房间会沿用同一套引擎");
  if (action === "locked") showToast("这个区域还在建设中，内测后会根据投票决定优先开放顺序");
});

document.addEventListener("input", (event) => {
  const profileVolumeInput = event.target.closest?.("[data-profile-volume]");
  if (profileVolumeInput) {
    const key = profileVolumeInput.dataset.profileVolume;
    state.soundVolumes[key] = clampVolume(profileVolumeInput.value, state.soundVolumes[key]);
    preferences.soundVolumes = { ...state.soundVolumes };
    savePreferences();
    document.querySelector(`[data-profile-volume-value="${key}"]`)?.replaceChildren(`${state.soundVolumes[key]}%`);
    if (state.isRunning) updateAudio();
    persistActiveSession(true);
    return;
  }
  const libraryObjectInput = event.target.closest("[data-library-object-input]");
  if (libraryObjectInput) {
    if (!state.isDeveloper) return;
    const field = libraryObjectInput.dataset.libraryObjectInput;
    updateLibrarySceneObject(state.librarySceneEditor.activeObjectId, { [field]: Number(libraryObjectInput.value) });
    return;
  }
  const objectInput = event.target.closest("[data-object-input]");
  if (objectInput) {
    if (!state.isDeveloper) return;
    const field = objectInput.dataset.objectInput;
    updateCafeSceneObject(state.cafeSceneEditor.activeObjectId, { [field]: Number(objectInput.value) });
    return;
  }
  const input = event.target.closest("[data-tune-input]");
  if (!input) return;
  if (!state.isDeveloper) return;
  const field = input.dataset.tuneInput;
  updateCafeSpriteTuning(state.cafeSpriteTuning.activeSeatId, { [field]: Number(input.value) });
});

document.addEventListener("input", (event) => {
  const volumeInput = event.target.closest?.("[data-sound-volume]");
  if (!volumeInput) return;
  const key = volumeInput.dataset.soundVolume;
  state.soundVolumes[key] = Number(volumeInput.value);
  saveSoundPreferencesFromState();
  if (state.isRunning) updateAudio();
  persistActiveSession(true);
});

document.addEventListener("change", (event) => {
  const profileFilter = event.target.closest?.("[data-profile-filter]");
  if (!profileFilter) return;
  state.personalCenter.filters[profileFilter.dataset.profileFilter] = profileFilter.value;
  renderPersonalCenter();
});

document.addEventListener("pointerdown", (event) => {
  const staticMarkerElement = event.target.closest?.("[data-static-seat-marker]");
  if (staticMarkerElement && state.isDeveloper && state.staticSeatCalibration.enabled && state.view === "room" && state.sceneId === "cafe") {
    if (event.button !== undefined && event.button !== 0) return;
    const stageElement = staticMarkerElement.closest(".seat-layer");
    const seatId = Number(staticMarkerElement.dataset.staticSeatMarker);
    const slot = staticSeatSlots.find((item) => item.seat_id === seatId);
    if (!stageElement || !slot) return;
    const pointer = cafeScenePointerPosition(event, stageElement);
    const [left, top] = staticSeatMarkerPosition(slot);
    staticSeatMarkerDrag = {
      seatId,
      pointerId: event.pointerId,
      offsetLeft: pointer.left - left,
      offsetTop: pointer.top - top,
      element: staticMarkerElement,
    };
    staticMarkerElement.classList.add("is-dragging");
    staticMarkerElement.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    return;
  }
  const cafeEditorActive = state.isDeveloper && state.sceneId === "cafe" && state.cafeDebugMode.enabled;
  const libraryEditorActive = state.isDeveloper && state.sceneId === "library" && state.libraryDebugMode.enabled;
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
  if (staticSeatMarkerDrag) {
    if (event.pointerId !== staticSeatMarkerDrag.pointerId) return;
    const stageElement = document.querySelector(".static-seat-room .seat-layer");
    if (!stageElement) return;
    const pointer = cafeScenePointerPosition(event, stageElement);
    const position = {
      left: pointer.left - staticSeatMarkerDrag.offsetLeft,
      top: pointer.top - staticSeatMarkerDrag.offsetTop,
    };
    updateStaticSeatMarkerPosition(staticSeatMarkerDrag.seatId, position);
    staticSeatMarkerDrag.element.style.left = `${state.staticSeatCalibration.positions[staticSeatMarkerDrag.seatId].left}%`;
    staticSeatMarkerDrag.element.style.top = `${state.staticSeatCalibration.positions[staticSeatMarkerDrag.seatId].top}%`;
    event.preventDefault();
    return;
  }
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
  if (staticSeatMarkerDrag && (event?.pointerId === undefined || event.pointerId === staticSeatMarkerDrag.pointerId)) {
    staticSeatMarkerDrag.element?.classList.remove("is-dragging");
    staticSeatMarkerDrag = null;
  }
  if (!cafeSceneObjectDrag) return;
  if (event?.pointerId !== undefined && event.pointerId !== cafeSceneObjectDrag.pointerId) return;
  cafeSceneObjectDrag.element?.classList.remove("is-dragging");
  document.body.classList.remove("is-cafe-object-dragging");
  cafeSceneObjectDrag = null;
}

document.addEventListener("pointerup", endCafeSceneObjectDrag);
document.addEventListener("pointercancel", endCafeSceneObjectDrag);

document.addEventListener("keydown", (event) => {
  if (state.personalCenter.open) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (state.personalCenter.confirmAction) {
        state.personalCenter.confirmAction = null;
        renderPersonalCenter();
      } else {
        closePersonalCenter();
      }
    }
    return;
  }
  if (state.view !== "room" || !["cafe", "library"].includes(state.sceneId)) return;
  if (!state.isDeveloper) return;
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
  if (!document.hidden) void recoverCafeSeat("visibility");
  if (!["focus", "room"].includes(state.view) || (!state.isRunning && state.sessionPhase !== "rest")) return;
  if (syncTimerFromClock()) return;
  persistActiveSession(true);
  if (!document.hidden) {
    document.querySelectorAll("[data-session-clock]").forEach((timerElement) => { timerElement.textContent = formatTime(); });
    document.querySelectorAll("[data-rest-clock]").forEach((timerElement) => { timerElement.textContent = formatRestTime(); });
  }
});

window.addEventListener("pageshow", () => { void recoverCafeSeat("pageshow"); });
window.addEventListener("online", () => { void flushPendingFocusUpdates(); void recoverCafeSeat("online"); });

window.addEventListener("pagehide", () => {
  if (["focus", "room"].includes(state.view) && (state.isRunning || state.sessionPhase === "rest")) syncTimerFromClock();
  persistActiveSession(true);
});
window.addEventListener("beforeunload", () => {
  persistActiveSession(true);
  stopAudio();
});

window.addEventListener("focus-island:room-change", (event) => {
  if (event.detail?.roomId === currentRoomApiId()) void syncCafeState();
});
window.addEventListener("focus-island:realtime-ready", (event) => {
  if (event.detail?.roomId === currentRoomApiId()) void syncCafeState();
});
window.addEventListener("focus-island:realtime-offline", () => {
  const syncLabel = document.querySelector(".room-sync-label");
  if (syncLabel) syncLabel.textContent = "实时连接中断，已启用快照校准";
});

document.addEventListener("submit", async (event) => {
  const accountForm = event.target.closest('[data-account-form="password"]');
  if (accountForm) {
    event.preventDefault();
    const values = new FormData(accountForm);
    const currentPassword = String(values.get("currentPassword") || "");
    const password = String(values.get("password") || "");
    const confirmPassword = String(values.get("confirmPassword") || "");
    if (password !== confirmPassword) {
      showToast("两次输入的新密码不一致");
      accountForm.querySelector('[name="confirmPassword"]')?.focus();
      return;
    }
    const submitButton = accountForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "正在修改…";
    try {
      await api("/api/auth/password/update", { method: "POST", body: JSON.stringify({ currentPassword, password }) });
      accountForm.reset();
      showToast("密码已修改，请妥善保存新密码");
    } catch (error) {
      showToast(authErrorCopy(error.message));
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "确认修改密码";
    }
    return;
  }
  const form = event.target.closest("[data-auth-form]");
  if (!form) return;
  event.preventDefault();
  if (state.authPending) return;
  state.authPending = true;
  state.authError = "";
  renderAccessOverlay();
  const values = new FormData(form);
  const flow = form.dataset.authForm;
  try {
    if (flow === "sign-up") {
      const email = String(values.get("email") || "").trim();
      const password = String(values.get("password") || "");
      const confirmPassword = String(values.get("confirmPassword") || "");
      if (password !== confirmPassword) throw new Error("password_mismatch");
      state.authEmail = email;
      const captchaToken = await turnstileToken();
      const result = await api("/api/auth/sign-up", { method: "POST", body: JSON.stringify({ email, password, confirmPassword, captchaToken }) });
      await completeAuthenticatedFlow(result);
    } else if (flow === "sign-in") {
      const email = String(values.get("email") || "").trim();
      state.authEmail = email;
      const captchaToken = await turnstileToken();
      const result = await api("/api/auth/sign-in", { method: "POST", body: JSON.stringify({ email, password: String(values.get("password") || ""), captchaToken }) });
      const mergeToken = sessionStorage.getItem(STORAGE_KEYS.pendingMergeToken);
      if (mergeToken) {
        await api("/api/auth/merge/complete", { method: "POST", body: JSON.stringify({ mergeToken }) });
        sessionStorage.removeItem(STORAGE_KEYS.pendingMergeToken);
      }
      await completeAuthenticatedFlow(result);
    }
  } catch (error) {
    state.authError = error.message;
    if (error.message === "email_already_registered") {
      try {
        const prepared = await api("/api/auth/merge/prepare", { method: "POST", body: "{}" });
        sessionStorage.setItem(STORAGE_KEYS.pendingMergeToken, prepared.mergeToken);
      } catch (_) { /* Fresh users have nothing to merge. */ }
      state.authMode = "sign-in";
      state.accessOverlay = "auth";
    }
  } finally {
    state.authPending = false;
    renderAccessOverlay();
  }
});

document.addEventListener("pointermove", () => scheduleHudFade(), { passive: true });
document.addEventListener("keydown", () => scheduleHudFade());

if (PUBLIC_CONFIG.minimalMvp) {
  preferences.language = "en";
  window.FocusI18n?.setLanguage("en");
}
applyPreferencesToState();
restoreActiveSession();
render();
prepareLifetimeInviteFromUrl();

const billingReturnState = new URLSearchParams(window.location.search).get("billing");
if (billingReturnState === "confirming") {
  openPaywall("payment_confirmation_pending");
  const poll = window.setInterval(async () => {
    const access = await getAccessStatus({ refresh: true }).catch(() => null);
    if (access && ["subscription", "lifetime", "admin"].includes(access.entitlementType)) {
      window.clearInterval(poll);
      closeAccessOverlay();
      window.history.replaceState({}, "", window.location.pathname);
      showToast("付款已确认，专注权限已解锁");
    }
  }, 2000);
  window.setTimeout(() => window.clearInterval(poll), 60_000);
} else if (billingReturnState === "canceled") {
  window.history.replaceState({}, "", window.location.pathname);
  showToast("已取消结账，没有产生扣款");
}

if (PUBLIC_CONFIG.minimalMvp) {
  const accountQuery = new URLSearchParams(location.search);
  if (accountQuery.has('account') || accountQuery.has('account-error')) {
    accountCenter.error = accountQuery.has('account-error') ? accountMessage(accountQuery.get('account-error')) : '';
    openPersonalCenter({tab:'account'});
    history.replaceState(null,'',location.pathname);
  }
}
