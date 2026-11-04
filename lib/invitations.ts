import "server-only";

import { createHash } from "node:crypto";

export const LIFETIME_INVITE_COOKIE = "focus_island_lifetime_invite";

export function lifetimeInviteHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
