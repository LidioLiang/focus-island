import catalog from "@/lib/scene-catalog.json";
export type FocusSceneId = keyof typeof catalog;
export const SCENE_CATALOG = catalog;
export function focusScene(id: string) { return Object.prototype.hasOwnProperty.call(catalog,id) ? catalog[id as FocusSceneId] : null; }
export const FOCUS_ROOM_IDS = Object.values(catalog).flatMap(scene => scene.onlineRooms);
export function roomSceneId(roomId: string) { return Object.values(catalog).find(scene => scene.onlineRooms.includes(roomId))?.id || null; }
