import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ACCESS_COOKIE_NAME } from "@/lib/access";
import { json } from "@/lib/presence";

const schema = z.object({ allDevices: z.boolean().default(false) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return json({ error: "invalid_request" }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut({ scope: parsed.data.allDevices ? "global" : "local" });
  const response = json(error ? { error: "sign_out_failed" } : { ok: true }, { status: error ? 503 : 200 });
  response.cookies.delete(ACCESS_COOKIE_NAME);
  return response;
}
