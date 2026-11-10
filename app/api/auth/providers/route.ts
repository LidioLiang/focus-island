import { enabledProviders } from "@/lib/auth-providers";
import { json } from "@/lib/presence";
export async function GET() {
  try { return json({ providers: await enabledProviders() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return json({ error: "auth_service_unavailable" }, { status: 503 }); }
}
