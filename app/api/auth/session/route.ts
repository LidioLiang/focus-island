import { authenticatedSupabase, json } from "@/lib/presence";

export async function GET() {
  const auth = await authenticatedSupabase();
  return json(auth ? { authenticated: true, userId: auth.user.id, anonymous: auth.user.is_anonymous === true } : { authenticated: false }, {
    headers: { "Cache-Control": "no-store" },
  });
}
