import test from "node:test";
import assert from "node:assert/strict";
import { bearerToken } from "../lib/bearer-auth.ts";

test("native bearer parsing distinguishes absent credentials from invalid ones", () => {
  assert.equal(bearerToken(null), null);
  assert.equal(bearerToken("Bearer aaa.bbb.ccc"), "aaa.bbb.ccc");
  assert.equal(bearerToken("bearer aaa.bbb.ccc"), "aaa.bbb.ccc");
  for (const bad of ["", "Basic aaa", "Bearer null", "Bearer aaa.bbb.ccc extra", "Bearer aaa.bbb.ccc\n", "Bearer " + "a".repeat(8192) + ".b.c"]) {
    assert.throws(() => bearerToken(bad), /invalid_authorization/);
  }
});
