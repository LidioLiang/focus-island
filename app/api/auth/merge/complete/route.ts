import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sha256 } from "@/lib/paddle";
import { authenticatedSupabase, json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

const schema = z.object({ mergeToken: z.string().min(32).max(256) });

export async function POST(request: Request) {
  if (rateLimited(request, "merge-complete", 5, 30 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_merge_request" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "permanent_account_required" }, { status: 401 });
  const { data, error } = await auth.supabase.rpc("complete_account_merge", { p_token_hash: sha256(parsed.data.mergeToken) });
  if (error) return json({ error: error.message.includes("merge_request_invalid") ? "merge_request_invalid" : "merge_failed" }, { status: 400 });
  const anonymousUserId = (data as { anonymousUserId?: string } | null)?.anonymousUserId;
  if (anonymousUserId) {
    const admin = createAdminSupabaseClient();
    await admin.auth.admin.deleteUser(anonymousUserId, false);
  }
  return json({ ok: true, result: data });
}
