/**
 * Prefer a room that already has people, without ever returning a full room.
 * Stable room order is used as the final tie breaker.
 * @param {readonly string[]} roomIds
 * @param {{roomId: string, occupied: number}[]} loads
 * @param {number} capacity
 */
export function chooseRoom(roomIds, loads, capacity) {
  const counts = new Map(loads.map((item) => [item.roomId, Number(item.occupied) || 0]));
  return roomIds
    .map((roomId, order) => ({ roomId, order, occupied: counts.get(roomId) || 0 }))
    .filter((item) => item.occupied < capacity)
    .sort((a, b) => b.occupied - a.occupied || a.order - b.order)[0]?.roomId || null;
}
