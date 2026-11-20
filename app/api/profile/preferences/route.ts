import { z } from "zod";
import { authenticatedSupabase, json } from "@/lib/presence";
import { preferencesSchema } from "@/lib/preferences";
import { rateLimited } from "@/lib/security";
export async function GET(request: Request) {
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "registration_required" }, { status: 401 });
  if (request.headers.get("X-Focus-User") !== auth.user.id) return json({ error: "identity_changed" }, { status: 409 });
  const { data, error } = await auth.supabase.from("user_preferences").select("settings,version").eq("user_id", auth.user.id).maybeSingle();
  if (error) return json({ error: "preferences_unavailable" }, { status: 503 });
  const parsed = preferencesSchema.safeParse(data?.settings || {});
  if (!parsed.success) return json({ error: "invalid_preferences" }, { status: 503 });
  return json({ userId: auth.user.id, settings: parsed.data, version: data?.version || 0 }, { headers: { "Cache-Control": "no-store" } });
}
export async function PUT(request: Request) {
  if (rateLimited(request, "preferences-save", 30)) return json({ error: "rate_limited" }, { status: 429 });
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "registration_required" }, { status: 401 });
  if (request.headers.get("X-Focus-User") !== auth.user.id) return json({ error: "identity_changed" }, { status: 409 });
  const parsed = z.object({ settings: preferencesSchema, expectedVersion: z.number().int().min(0).max(2147483646) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_preferences" }, { status: 400 });
  const { data, error } = await auth.supabase.rpc("save_my_preferences", { p_settings: parsed.data.settings, p_expected_version: parsed.data.expectedVersion });
  if (error) return json({ error: error.message.includes("preferences_conflict") ? "preferences_conflict" : "preferences_unavailable" }, { status: error.message.includes("preferences_conflict") ? 409 : 503 });
  return json({ userId: auth.user.id, ...data }, { headers: { "Cache-Control": "no-store" } });
}
