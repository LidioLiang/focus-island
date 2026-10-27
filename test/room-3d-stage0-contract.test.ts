import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  isRoom3DInteractionEnvelope,
  ROOM_3D_CONTRACT_VERSION,
  ROOM_3D_EVENT_TYPES,
  ROOM_3D_REQUIRED_FIELDS,
} from "../lib/room-3d-contract.ts";

const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const roomConfig = await readFile(new URL("./fixtures/20261023-cafe_room_3d_contract.tres", import.meta.url), "utf8");

test("3D cafe renderer is opt-in and defaults to the static room", () => {
  assert.match(appSource, /CAFE_ROOM_RENDERER_STATIC = "static"/);
  assert.match(appSource, /stored === CAFE_ROOM_RENDERER_GODOT_3D[\s\S]*CAFE_ROOM_RENDERER_STATIC/);
  assert.match(appSource, /state\.sceneId === "cafe"[\s\S]*resolveCafeRoomRenderer\(\)/);
  assert.match(appSource, /CAFE_ROOM_3D_DEFAULT_SRC = "\/godot-room-3d\/index\.html"/);
  assert.match(appSource, /CAFE_ROOM_3D_SRC_QUERY_KEY = "godot3dSrc"/);
  assert.match(appSource, /src="\$\{escapeHtml\(resolveGodotRoom3DSrc\(\)\)\}"/);
});
test("3D iframe bridge supports a separately hosted Web export", () => {
  assert.match(appSource, /frame\.contentWindow\.postMessage\(message,[\s\S]*\.origin\)/);
  assert.match(appSource, /event\.source !== frame\.contentWindow/);
  assert.match(appSource, /event\.origin !== new URL\(frame\.src, window\.location\.href\)\.origin/);
});

test("3D loading failure and readiness timeout return to the static room", () => {
  assert.match(appSource, /function fallbackFromGodotRoom/);
  assert.match(appSource, /state\.view = "room"/);
  assert.match(appSource, /CAFE_ROOM_3D_READY_TIMEOUT_MS = 12000/);
  assert.match(appSource, /fallbackFromGodotRoom\("ready_timeout"\)/);
  assert.match(appSource, /fallbackFromGodotRoom\("load_failed"\)/);
});

test("room configuration freezes six selectable seats and two privacy chairs", () => {
  assert.equal((roomConfig.match(/service_seat_id = [1-6]/g) || []).length, 6);
  assert.equal((roomConfig.match(/privacy_reserved = true/g) || []).length, 2);
  assert.equal((roomConfig.match(/selectable = false/g) || []).length, 2);
  assert.match(roomConfig, /seat_profile_id = &"bar_stool"/);
  assert.match(roomConfig, /seat_profile_id = &"window_wood_chair"/);
  assert.match(roomConfig, /seat_profile_id = &"lounge_armchair"/);
  assert.match(roomConfig, /activity_profile_id = &"computer_focus"/);
  assert.match(roomConfig, /activity_profile_id = &"reading_focus"/);
});

test("versioned bridge envelope accepts complete messages and rejects stale shapes", () => {
  assert.equal(ROOM_3D_CONTRACT_VERSION, 1);
  assert.equal(ROOM_3D_EVENT_TYPES.length, 13);
  assert.deepEqual(ROOM_3D_REQUIRED_FIELDS, [
    "contract_version", "event_type", "interaction_id", "room_id", "seat_id",
    "look_id", "lease_revision", "event_sequence", "server_time", "payload",
  ]);
  assert.equal(isRoom3DInteractionEnvelope({
    contract_version: 1,
    event_type: "seat_intent",
    interaction_id: "interaction-001",
    room_id: "cafe-01",
    seat_id: "cafe_window_seat_01",
    look_id: "female_golden_sample_01",
    lease_revision: 4,
    event_sequence: 1,
    server_time: 1_792_729_800_000,
    payload: {},
  }), true);
  assert.equal(isRoom3DInteractionEnvelope({ contract_version: 1, event_type: "seat_intent" }), false);
});
