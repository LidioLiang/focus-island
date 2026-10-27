const ASSET_BASE = "./assets/";
const PUBLIC_CONFIG = window.__FOCUS_ISLAND_CONFIG__ || {};
const AUDIO_BASE = PUBLIC_CONFIG.audioBaseUrl
  ? `${String(PUBLIC_CONFIG.audioBaseUrl).replace(/\/$/, "")}/`
  : `${ASSET_BASE}audio/`;
// 填入正式问卷地址后，页面底部的反馈入口会自动启用。
const FEEDBACK_FORM_URL = "";
const CAFE_STATE_LAYER_SETTLE_MS = 800;
const CAFE_IMMERSIVE_AUTO_ENTER_MS = 800;
const CAFE_ROOM_3D_READY_TIMEOUT_MS = 12000;
const CAFE_ROOM_RENDERER_QUERY_KEY = "roomRenderer";
const CAFE_ROOM_RENDERER_STORAGE_KEY = "focusIslandInternalCafeRoomRendererV1";
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
    image: `${ASSET_BASE}20261013-cafe-room-six-seat-base.png`,
    debugImage: `${ASSET_BASE}20261015-cafe-room-empty-stage-wide.png`,
    focusViews: Object.fromEntries([1, 2, 3, 4, 5, 6].map((seatId) => [seatId, `${ASSET_BASE}20261013-cafe-window-real-focus-view.png`])),
    description: "在六座咖啡馆里选一张喜欢的位置，和其他人安静地开始今天的专注。",
    sounds: ["咖啡馆底噪", "窗外环境声", "偶尔杯碟声"],
    filter: 620,
    rooms: [
      { id: "cafe-01", name: "四时咖啡馆", occupied: 0, image: `${ASSET_BASE}20261013-cafe-room-six-seat-base.png` },
      { id: "cafe-02", name: "四时咖啡馆", occupied: 0, image: `${ASSET_BASE}20261013-cafe-room-six-seat-base.png` },
      { id: "cafe-03", name: "四时咖啡馆", occupied: 0, image: `${ASSET_BASE}20261013-cafe-room-six-seat-base.png` },
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

// The only production room-layout configuration used by the fast MVP.
// Coordinates are percentages of the 1586 × 992 design canvas.
const staticSeatSlots = [
  { seat_id: 1, hit_area: [32, 49], occupant_anchor: [24.8, 23.8, 13.2, 31.2], label_anchor: [32, 43], desk_zone_id: "bar", occupied_asset: `${ASSET_BASE}20261014-cafe-avatar-seat-01-idle-sheet.png`, flip: false },
  { seat_id: 2, hit_area: [37, 49], occupant_anchor: [32.1, 23.6, 13.2, 31.2], label_anchor: [37, 43], desk_zone_id: "bar", occupied_asset: `${ASSET_BASE}20261014-cafe-avatar-seat-02-idle-sheet.png`, flip: false },
  { seat_id: 3, hit_area: [71, 50], occupant_anchor: [63.68, 23.69, 14.56, 28.23], label_anchor: [71, 44], desk_zone_id: "window", occupied_asset: `${ASSET_BASE}20261014-cafe-avatar-window-idle-sheet.png`, flip: false },
  { seat_id: 4, hit_area: [80, 51], occupant_anchor: [74.2, 24.1, 14.56, 28.23], label_anchor: [80, 45], desk_zone_id: "window", occupied_asset: `${ASSET_BASE}20261014-cafe-avatar-seat-04-idle-sheet.png`, flip: true },
  { seat_id: 5, hit_area: [15.5, 67], occupant_anchor: [5.1, 40.7, 14.1, 28.4], label_anchor: [15.5, 61], desk_zone_id: "lounge", occupied_asset: `${ASSET_BASE}20261014-cafe-avatar-seat-05-idle-sheet.png`, flip: false },
  { seat_id: 6, hit_area: [66, 72], occupant_anchor: [58.8, 48.4, 14.1, 28.4], label_anchor: [66, 66], desk_zone_id: "lounge", occupied_asset: `${ASSET_BASE}20261014-cafe-avatar-seat-06-idle-sheet.png`, flip: false },
];

const islandImage = `${ASSET_BASE}20261012-focus-island-map-detailed.png`;
const STORAGE_KEYS = {
  activeSession: "focusIslandActiveSessionV1",
  history: "focusIslandHistoryV1",
  guestIdentity: "focusIslandGuestIdentityV2",
  preferences: "focusIslandPreferencesV1",
  cafeSpriteTuning: "focusIslandCafeSpriteTuningV2",
  // V5 resets stale editor drafts that were created before the scene layout
  // was fixed. Older drafts can otherwise override the restored coordinates.
  cafeSceneEditor: "focusIslandCafeSceneEditorV6",
  cafeScenePublished: "focusIslandCafeScenePublishedV1",
  librarySceneEditor: "focusIslandLibrarySceneEditorV1",
  libraryScenePublished: "focusIslandLibraryScenePublishedV1",
};

const FOCUS_MUSIC_TRACKS = {
  "rainy-notes": { name: "雨夜手札", src: `${AUDIO_BASE}20261022-focus-music-rainy-notes.mp3` },
  "warm-reverie": { name: "暖灯漫想", src: `${AUDIO_BASE}20261022-focus-music-warm-reverie.mp3` },
  "moonlit-walk": { name: "月光缓行", src: `${AUDIO_BASE}20261022-focus-music-moonlit-walk.mp3` },
  "island-breeze": { name: "岛屿长风", src: `${AUDIO_BASE}20261022-focus-music-island-breeze.mp3` },
};
const MUSIC_VOLUME_BOOST = 1.3;
const CAFE_AMBIENT_GAIN = 0.09;
const SOUND_OPTION_ART = {
  mute: `${ASSET_BASE}20261013-cafe-window-real-focus-view.png`,
  ambient: `${ASSET_BASE}20261013-cafe-bar-real-focus-view.png`,
  white: `${ASSET_BASE}20261013-cafe-window-real-focus-view.png`,
  "rainy-notes": `${ASSET_BASE}20261013-cafe-window-real-focus-view.png`,
  "warm-reverie": `${ASSET_BASE}20261013-cafe-bar-real-focus-view.png`,
  "moonlit-walk": `${ASSET_BASE}20261015-晴朗月夜学习场景.png`,
  "island-breeze": `${ASSET_BASE}20261013-cafe-sofa-real-focus-view.png`,
};
const AVATAR_OPTIONS = [
  { id: 0, name: "暖光旅人", image: `${ASSET_BASE}20261014-cafe-avatar-seat-01-source.png` },
  { id: 1, name: "静谧旅人", image: `${ASSET_BASE}20261014-cafe-avatar-seat-02-source.png` },
  { id: 2, name: "晨雾旅人", image: `${ASSET_BASE}20261014-cafe-avatar-seat-04-source.png` },
  { id: 3, name: "月夜旅人", image: `${ASSET_BASE}20261014-cafe-avatar-seat-05-source.png` },
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
  view: "welcome",
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
let onlineIdentityPromise = null;
let onlineUserId = null;

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
    language: "zh-CN",
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
        onlineUserId = session.userId;
        return session;
      }
      const captchaToken = await turnstileToken();
      const created = await api("/api/auth/anonymous", {
        method: "POST",
        body: JSON.stringify({ captchaToken, displayName: identity.displayName, avatarSkin: identity.avatarSkin }),
      });
      onlineUserId = created.userId;
      return created;
    })().catch((error) => {
      onlineIdentityPromise = null;
      throw error;
    });
  }
  return onlineIdentityPromise;
}

function currentRoomApiId() {
  return state.roomId || (state.sceneId === "cafe" ? scenes.cafe.rooms[0].id : null);
}

function localNpcLeases() {
  const now = Date.now();
  return [
    { roomId: "cafe-local", seatId: 2, sessionId: "npc-02", displayName: "岛民 · 小鹿", avatarSkin: 1, memberType: "npc", state: "occupied", activity: "安静阅读", focusStartedAt: now - 18 * 60 * 1000 },
    { roomId: "cafe-local", seatId: 4, sessionId: "npc-04", displayName: "岛民 · 海獭", avatarSkin: 2, memberType: "npc", state: "occupied", activity: "整理笔记", focusStartedAt: now - 7 * 60 * 1000 },
  ];
}

async function enterCafeRoom() {
  if (state.isAllocatingRoom) return;
  state.isAllocatingRoom = true;
  showToast("正在为你准备咖啡馆座位…");
  try {
    await ensureOnlineIdentity();
    const allocation = await api("/api/scenes/cafe/allocate", {
      method: "POST",
      body: JSON.stringify(identityBody()),
    });
    state.roomId = allocation.roomId;
    state.localRoom = allocation.mode === "local";
  } catch (_) {
    state.roomId = "cafe-local";
    state.localRoom = true;
    showToast("在线房间暂不可用，已进入本地岛民房间");
  } finally {
    state.isAllocatingRoom = false;
  }
  state.roomPresence = state.localRoom
    ? { leases: localNpcLeases(), serverNow: Date.now() }
    : { leases: [], serverNow: Date.now() };
  state.selectedSeat = null;
  state.currentSeatId = null;
  state.view = roomViewForScene();
  render();
}

function leaseForSeat(seatIndex) {
  return state.roomPresence.leases.find((lease) => Number(lease.seatId) === seatIndex + 1 && ["reserved", "moving", "occupied"].includes(lease.state)) || null;
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
  const reduceMotion = preferences.reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  if (state.localRoom) {
    state.roomPresence.serverNow = Date.now();
    if (refreshMarkers && state.view === "room") refreshCafeSeatMarkers();
    return;
  }
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
  const staticOccupants = document.querySelector(".static-occupants");
  if (staticOccupants) staticOccupants.innerHTML = renderStaticCafeOccupants();
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
      state.currentSeatId = null;
      showToast("座位连接已过期，请重新选座");
    }
  }
}

async function releaseSeat({ beacon = false, force = false } = {}) {
  clearImmersiveAutoEnter();
  if (!force && !state.currentSeatId && !state.switchingFromSeatId) return;
  if (state.localRoom) {
    state.roomPresence.leases = localNpcLeases();
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

function openPersonalCenter() {
  if (state.isRunning || state.sessionPhase === "rest") syncTimerFromClock();
  persistActiveSession(true);
  state.personalCenter.open = true;
  state.personalCenter.tab = "overview";
  state.personalCenter.monthKey = shanghaiDateKey(Date.now()).slice(0, 7);
  state.personalCenter.selectedDate = shanghaiDateKey(Date.now());
  state.personalCenter.filters = { scene: "all", status: "all", mode: "all" };
  state.personalCenter.confirmAction = null;
  document.body.classList.add("personal-center-open");
  renderPersonalCenter();
}

function closePersonalCenter() {
  state.personalCenter.open = false;
  state.personalCenter.confirmAction = null;
  document.querySelector(".personal-center-overlay")?.remove();
  document.body.classList.remove("personal-center-open");
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
  document.querySelector(".personal-center-overlay")?.remove();
  const tabs = [
    ["overview", "⌂", "个人概览"],
    ["history", "▣", "专注记录"],
    ["preferences", "♪", "偏好设置"],
    ["account", "◇", "账户与数据"],
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
          <div><strong>${escapeHtml(identity.displayName)}</strong><small>本地游客</small></div>
        </div>
        <nav aria-label="个人中心">
          ${tabs.map(([id, icon, label]) => `<button type="button" class="personal-nav-button ${state.personalCenter.tab === id ? "is-active" : ""}" data-profile-tab="${id}" aria-current="${state.personalCenter.tab === id ? "page" : "false"}"><span aria-hidden="true">${icon}</span>${label}</button>`).join("")}
        </nav>
        <p class="personal-center-local-note">身份、记录与偏好保存在本设备</p>
      </aside>
      <main class="personal-center-main">
        <header class="personal-center-header">
          <div><p>PERSONAL CENTER</p><h1 id="personal-center-title">${tabs.find(([id]) => id === state.personalCenter.tab)?.[2] || "个人中心"}</h1></div>
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
          <div><span>本地游客</span><h2>${escapeHtml(identity.displayName)}</h2><p>你的身份和记录保存在这台设备中。</p></div>
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
        <div class="profile-language-row"><div><strong>语言</strong><small>English 将在完整翻译后开放</small></div><div class="profile-segmented is-compact"><button type="button" class="is-active">简体中文</button><button type="button" disabled>English</button></div></div>
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
  const idLabel = onlineUserId ? "匿名账户 ID" : "本设备身份 ID";
  const activeSession = hasActiveSeatSession();
  return `
    <div class="profile-account-layout">
      <section class="profile-settings-card">
        <div class="profile-settings-heading"><span>匿名游客资料</span><h2>你的岛上身份</h2></div>
        <label class="profile-name-field"><span>昵称</span><div><input type="text" maxlength="16" value="${escapeHtml(identity.displayName)}" data-profile-name aria-describedby="profile-name-help" /><button type="button" data-action="save-profile-identity">保存昵称</button></div><small id="profile-name-help">1–16 个字符</small></label>
        <fieldset class="profile-avatar-field"><legend>选择角色</legend><div>${AVATAR_OPTIONS.map((avatar) => `<button type="button" class="profile-avatar-option ${identity.avatarSkin === avatar.id ? "is-active" : ""}" data-profile-avatar="${avatar.id}" aria-pressed="${identity.avatarSkin === avatar.id}"><span style="background-image:url('${avatar.image}')"></span><small>${avatar.name}</small></button>`).join("")}</div></fieldset>
        <div class="profile-local-id"><span>${idLabel}</span><code>${shortId}</code></div>
        <p class="profile-storage-note">匿名账户用于安全分房和占座；偏好与专注记录仍保存在这台设备。未绑定可恢复登录方式前，清除浏览器数据后可能无法找回该账户。</p>
      </section>
      <section class="profile-settings-card profile-data-card">
        <div class="profile-settings-heading"><span>数据管理</span><h2>重置或清理本地数据</h2></div>
        <div class="profile-data-action"><div><strong>恢复默认偏好</strong><small>不会删除游客身份、记录或当前会话</small></div><button type="button" data-confirm-profile="reset-preferences">恢复默认</button></div>
        <div class="profile-data-action"><div><strong>清空专注记录</strong><small>身份和偏好会继续保留</small></div><button type="button" data-confirm-profile="clear-history">清空记录</button></div>
        <div class="profile-data-action is-danger"><div><strong>删除账户与本地数据</strong><small>${activeSession ? "请先结束当前专注，再执行此操作" : "匿名账户、偏好和记录都会被删除"}</small></div><button type="button" data-confirm-profile="delete-all" ${activeSession ? "disabled" : ""}>删除全部</button></div>
      </section>
    </div>`;
}

function renderPersonalCenterConfirm() {
  const action = state.personalCenter.confirmAction;
  if (!action) return "";
  const content = {
    "reset-preferences": ["恢复默认偏好？", "默认计时、声音、界面和提醒将恢复初始状态。", "恢复默认"],
    "clear-history": ["清空全部专注记录？", "此操作无法撤销，但不会影响身份、偏好或当前会话。", "清空记录"],
    "delete-all": ["删除账户与全部本地数据？", "匿名账户、偏好和专注记录都会被删除，此操作无法撤销。", "确认删除"],
  }[action];
  if (!content) return "";
  return `<div class="profile-confirm-backdrop" role="presentation"><div class="profile-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="profile-confirm-title"><span>请确认</span><h2 id="profile-confirm-title">${content[0]}</h2><p>${content[1]}</p><div><button type="button" data-action="cancel-profile-confirm">取消</button><button type="button" class="is-danger" data-action="execute-profile-confirm">${content[2]}</button></div></div></div>`;
}

async function executeProfileDataAction() {
  const action = state.personalCenter.confirmAction;
  state.personalCenter.confirmAction = null;
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
    showToast("账户与本地数据已删除，已生成新的游客身份");
  }
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
          <div class="welcome-kicker"><span class="presence-dot"></span>内部演示 · 画面中的陪伴角色均为岛民 NPC</div>
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
          <p><a href="/privacy">隐私政策</a> · <a href="/terms">服务条款</a></p>
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
  return state.sceneId === "cafe" && resolveCafeRoomRenderer() === CAFE_ROOM_RENDERER_GODOT_3D
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
    const [left, top, width, height] = slot.occupant_anchor;
    const [labelLeft, labelTop] = slot.label_anchor;
    return `
      <div class="static-seat-occupant ${mine ? "is-mine" : ""}" style="--left:${left}%;--top:${top}%;--width:${width}%;--height:${height}%;--avatar:${Number(lease.avatarSkin || 0)};${slot.flip ? "--flip:-1;" : ""}">
        <span class="static-seat-avatar" style="background-image:url('${slot.occupied_asset}')" aria-hidden="true"></span>
      </div>
      <div class="static-seat-label ${mine ? "is-mine" : ""} ${npc ? "is-npc" : ""}" style="left:${labelLeft}%;top:${labelTop}%">
        <strong>${mine ? "我" : npc ? "岛民" : lease.displayName}</strong>
        <small>${mine ? identity.displayName : status}</small>
      </div>`;
  }).join("");
}

function renderStaticCafeRoom() {
  const openSeats = staticSeatSlots.filter((slot) => !leaseForSeat(slot.seat_id - 1)).length;
  const roomMode = state.localRoom ? "本地岛民房间" : "在线陪伴房间";
  app.innerHTML = `
    <section class="view room static-seat-room">
      ${topbar({ back: "back-island", showPresence: false })}
      ${state.currentSeatId && state.sessionStartedAt ? renderSessionHud("room") : ""}
      <div class="room-stage">
        <img class="scene-image" src="${scenes.cafe.image}" alt="四时咖啡馆六座静态房间" />
        <div class="room-title">${regionIcon("city", "room-region-icon")}<span>四时咖啡馆 · ${roomMode}</span></div>
        <div class="seat-layer" aria-label="六个固定座位">
          <div class="static-occupants">${renderStaticCafeOccupants()}</div>
          <div class="seat-markers">${staticSeatSlots.map((slot) => renderSeat([slot.hit_area[0], slot.hit_area[1], false], slot.seat_id - 1, "cafe")).join("")}</div>
        </div>
        <div class="room-footer">
          <div class="room-footer-copy">
            <strong>${state.isTransitioning ? "正在为你留座…" : "点击一个空位坐下"}</strong>
            <span>${state.isTransitioning ? "确认成功后会直接进入专注设置" : `无需移动角色 · 还剩 ${openSeats} 个空位`}</span>
          </div>
          <span class="room-sync-label">${state.localRoom ? "岛民 NPC · 不计入真人在线" : `${cafeVisibleLeases().filter((lease) => lease.memberType !== "npc").length} 人正在房间里`}</span>
        </div>
      </div>
    </section>`;
  requestAnimationFrame(() => startCafePresence());
}

function renderRoom() {
  const scene = scenes[state.sceneId];
  if (scene.id === "cafe" && !state.cafeDebugMode.enabled) {
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
    renderRoom();
    const reduceMotion = preferences.reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      await new Promise((resolve) => window.setTimeout(resolve, CAFE_STATE_LAYER_SETTLE_MS));
    }
    state.sessionPanelOpen = false;
    state.focusImageChoice = preferences.rememberLastFocusView ? preferences.lastFocusView : "window";
    if (!preferences.rememberLastSound) {
      const defaults = defaultPreferences();
      state.sounds = { ...defaults.sounds };
      state.musicTrack = defaults.musicTrack;
      state.soundVolumes = { ...defaults.soundVolumes };
    }
    state.view = "focus";
    if (!fromSeatId) startFocusFromSeat();
    render();
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
        <button class="focus-exit-button" type="button" data-action="finish-session" aria-label="退出专注">
          <span aria-hidden="true">←</span><strong>${resting ? "退出房间" : "退出专注"}</strong>
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
    window: `${ASSET_BASE}20261013-cafe-window-real-focus-view.png`,
    bar: `${ASSET_BASE}20261013-cafe-bar-real-focus-view.png`,
    night: `${ASSET_BASE}20261015-晴朗月夜学习场景.png`,
    lounge: `${ASSET_BASE}20261013-cafe-sofa-real-focus-view.png`,
  };
  return focusImages[state.focusImageChoice] || focusImages.window;
}

function renderSessionHud(context = "focus") {
  const timerLabel = state.timerMode === 0 ? "自由正计时" : `${state.timerMode} 分钟倒计时`;
  const timerHasStarted = Boolean(state.sessionStartedAt);
  const timerActionLabel = state.isRunning ? "暂停" : timerHasStarted ? "继续" : "开始";
  const allSoundsMuted = !state.sounds.ambient && !state.sounds.white && !state.sounds.music;
  return `
    <aside class="session-hud session-hud-${context} ${state.sessionPanelOpen ? "is-open" : ""}" aria-label="专注计时与设置">
      <div class="immersive-timer" aria-live="off">
        <strong data-session-clock>${formatTime()}</strong>
        <small>${timerLabel}</small>
      </div>
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
              ${focusViewButton("window", "窗边视角", `${ASSET_BASE}20261013-cafe-window-real-focus-view.png`)}
              ${focusViewButton("bar", "吧台一角", `${ASSET_BASE}20261013-cafe-bar-real-focus-view.png`)}
              ${focusViewButton("night", "月夜咖啡馆", `${ASSET_BASE}20261015-晴朗月夜学习场景.png`)}
              ${focusViewButton("lounge", "安静角落", `${ASSET_BASE}20261013-cafe-sofa-real-focus-view.png`)}
            </div>
          </div>
        </section>` : ""}
      <nav class="focus-control-dock" aria-label="专注快捷操作">
        <button class="focus-dock-button ${state.isRunning ? "is-active" : ""}" type="button" data-action="toggle-timer" aria-label="${timerActionLabel}">
          <span class="focus-dock-icon" aria-hidden="true">${state.isRunning ? `<svg viewBox="0 0 24 24"><path d="M9 7v10M15 7v10"/></svg>` : `<svg viewBox="0 0 24 24"><path d="m9 7 8 5-8 5z"/></svg>`}</span><small>${timerActionLabel}</small>
        </button>
        <button class="focus-dock-button ${state.sessionPanelOpen ? "is-active" : ""}" type="button" data-action="toggle-session-panel" aria-label="专注设置" aria-expanded="${state.sessionPanelOpen}">
          <span class="focus-dock-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2.1-1.2L14 3h-4l-.4 2.7a7 7 0 0 0-2.1 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2.1 1.2L10 21h4l.4-2.7a7 7 0 0 0 2.1-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></svg></span><small>设置</small>
        </button>
        <button class="focus-dock-button is-danger" type="button" data-action="finish-session" aria-label="结束专注">
          <span class="focus-dock-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 8h8v8H8z"/></svg></span><small>结束</small>
        </button>
      </nav>
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

function setTimerMode(mode) {
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

function toggleTimer() {
  const timerHadStarted = Boolean(state.sessionStartedAt);
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

function syncTimerFromClock() {
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
      finishSession("completed");
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
    startNextFocusSession();
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

async function finishSession(forcedStatus = null) {
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
  if (state.isRunning && !forcedStatus && syncTimerFromClock()) return;
  state.isRunning = false;
  state.sessionPanelOpen = false;
  clearImmersiveAutoEnter();
  stopTicker();
  stopAudio();
  const status = forcedStatus || (state.elapsedSeconds === 0 ? "not_started" : state.timerMode <= 0 ? "free_completed" : "ended_early");
  state.sessionResult = buildSessionResult(status);
  if (state.elapsedSeconds > 0) saveSessionResult(state.sessionResult);
  if (status === "completed" && [25, 50].includes(state.timerMode)) {
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
  document.title = "休息一下 · 专注岛";
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

function startNextFocusSession() {
  stopTicker();
  state.sessionPhase = "focus";
  state.timerMode = [25, 50].includes(state.nextFocusMode) ? state.nextFocusMode : 25;
  state.durationSeconds = state.timerMode * 60;
  state.remainingSeconds = state.durationSeconds;
  state.elapsedSeconds = 0;
  state.sessionStartedAt = Date.now();
  state.sessionResult = null;
  state.restStartedAt = null;
  state.restCustomOpen = false;
  state.isRunning = true;
  state.sessionPanelOpen = false;
  lastTick = Date.now();
  document.title = "专注中 · 专注岛";
  renderFocus();
  updateAudio();
  persistActiveSession(true);
  sendHeartbeat();
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
      companions: saved.companions || 6,
      focusImageChoice: saved.focusImageChoice || "window",
      sounds: { ...state.sounds, ...saved.sounds },
      musicTrack: FOCUS_MUSIC_TRACKS[saved.musicTrack] ? saved.musicTrack : "rainy-notes",
      soundVolumes: { ...state.soundVolumes, ...saved.soundVolumes },
      sessionPanelOpen: false,
    });
    if (state.localRoom) {
      state.roomPresence = {
        leases: [...localNpcLeases(), {
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
        state.sessionStartedAt = Date.now();
        state.sessionResult = null;
        state.restStartedAt = null;
        state.isRunning = true;
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
          state.sessionResult = buildSessionResult("completed");
          saveSessionResult(state.sessionResult);
          state.sessionPhase = "rest";
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

document.addEventListener("click", (event) => {
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
    if (state.isRunning) updateAudio();
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
    state.personalCenter.tab = profileTabButton.dataset.profileTab;
    state.personalCenter.confirmAction = null;
    renderPersonalCenter();
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
    state.personalCenter.confirmAction = profileConfirmButton.dataset.confirmProfile;
    renderPersonalCenter();
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
  if (action === "cancel-profile-confirm") {
    state.personalCenter.confirmAction = null;
    renderPersonalCenter();
    return;
  }
  if (action === "execute-profile-confirm") {
    executeProfileDataAction();
    return;
  }

  if (action === "enter-island") {
    window.scrollTo({ top: 0, behavior: "auto" });
    state.view = "island";
    render();
  }
  if (action === "scroll-story") {
    document.querySelector("#story")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (action === "back-island") {
    if (state.currentSeatId) releaseSeat();
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
  if (!["focus", "room"].includes(state.view) || (!state.isRunning && state.sessionPhase !== "rest")) return;
  if (syncTimerFromClock()) return;
  persistActiveSession(true);
  if (!document.hidden) {
    document.querySelectorAll("[data-session-clock]").forEach((timerElement) => { timerElement.textContent = formatTime(); });
    document.querySelectorAll("[data-rest-clock]").forEach((timerElement) => { timerElement.textContent = formatRestTime(); });
  }
});

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

document.addEventListener("pointermove", () => scheduleHudFade(), { passive: true });
document.addEventListener("keydown", () => scheduleHudFade());

applyPreferencesToState();
restoreActiveSession();
render();
