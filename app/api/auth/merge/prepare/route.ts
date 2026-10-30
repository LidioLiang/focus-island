import { randomBytes } from "node:crypto";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sha256 } from "@/lib/paddle";
import { authenticatedSupabase, json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

export async function POST(request: Request) {
  if (rateLimited(request, "merge-prepare", 5, 30 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const auth = await authenticatedSupabase();
  if (!auth?.user.is_anonymous) return json({ error: "anonymous_account_required" }, { status: 400 });
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("account_merge_requests").insert({
    anonymous_user_id: auth.user.id, token_hash: sha256(token), expires_at: expiresAt,
  });
  if (error) return json({ error: "merge_prepare_failed" }, { status: 503 });
  return json({ mergeToken: token, expiresAt });
}
