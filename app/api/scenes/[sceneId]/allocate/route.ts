import { authenticatedSupabase, json, parseIdentity, rpcError } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ sceneId: string }> }) {
  if (rateLimited(request, "allocate", 30)) return json({ error: "rate_limited" }, { status: 429 });
  const { sceneId } = await context.params;
  if (sceneId !== "cafe") return json({ error: "scene_not_available" }, { status: 404 });
  const identity = parseIdentity(await request.json().catch(() => null));
  if (!identity) return json({ error: "invalid_identity" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  const { data, error } = await auth.supabase.rpc("allocate_room", {
    p_scene_id: sceneId,
    p_session_id: identity.sessionId,
    p_display_name: identity.displayName,
    p_avatar_skin: identity.avatarSkin,
  });
  if (error) return rpcError(error);
  return json(data, { headers: { "Cache-Control": "no-store" } });
}
