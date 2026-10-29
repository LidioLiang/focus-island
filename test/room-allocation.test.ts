import assert from "node:assert/strict";
import test from "node:test";
import { chooseRoom } from "../lib/room-allocation.mjs";

const rooms = ["cafe-01", "cafe-02", "cafe-03"];

test("prefers an occupied room that still has a seat", () => {
  assert.equal(chooseRoom(rooms, [
    { roomId: "cafe-01", occupied: 2 },
    { roomId: "cafe-02", occupied: 5 },
  ], 6), "cafe-02");
});

test("uses stable order when rooms have equal load", () => {
  assert.equal(chooseRoom(rooms, [], 6), "cafe-01");
});

test("returns null when every room is full", () => {
  assert.equal(chooseRoom(rooms, rooms.map((roomId) => ({ roomId, occupied: 6 })), 6), null);
});
