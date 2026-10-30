import { authenticatedSupabase, json } from "@/lib/presence";
import { isDeveloper } from "@/lib/authorization";

export async function GET() {
  const auth = await authenticatedSupabase();
  return json(auth ? {
    authenticated: true,
    userId: auth.user.id,
    anonymous: auth.user.is_anonymous === true,
    accountType: auth.user.is_anonymous ? "anonymous" : "permanent",
    email: auth.user.email || null,
    emailVerified: Boolean(auth.user.email_confirmed_at),
    developer: isDeveloper(auth.user),
  } : { authenticated: false, emailVerified: false }, {
    headers: { "Cache-Control": "no-store" },
  });
}
