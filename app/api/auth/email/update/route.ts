import { z } from "zod";
import { emailSchema, authError } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json } from "@/lib/presence";

const schema = z.object({ email: emailSchema });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_email" }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const { data: current } = await supabase.auth.getUser();
  if (!current.user || current.user.is_anonymous) return json({ error: "permanent_account_required" }, { status: 401 });
  const { error } = await supabase.auth.updateUser({ email: parsed.data.email }, { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/?auth=email-updated` });
  if (error) return json({ error: authError(error, "email_update_failed") }, { status: 400 });
  return json({ ok: true, requiresEmailVerification: true });
}
