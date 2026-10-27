export type RoomLoad = { roomId: string; occupied: number };
export function chooseRoom(roomIds: readonly string[], loads: RoomLoad[], capacity: number): string | null;
