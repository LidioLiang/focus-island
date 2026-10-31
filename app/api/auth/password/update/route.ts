import { z } from "zod";
import { passwordSchema, authError } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json } from "@/lib/presence";

const schema = z.object({
  password: passwordSchema,
  currentPassword: z.string().min(1).max(128).optional(),
  nonce: z.string().min(1).max(512).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_password", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const { data: current } = await supabase.auth.getUser();
  if (!current.user || current.user.is_anonymous) {
    return json({ error: "permanent_account_required" }, { status: 403 });
  }
  if (parsed.data.currentPassword) {
    if (!current.user.email) return json({ error: "permanent_account_required" }, { status: 403 });
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: current.user.email,
      password: parsed.data.currentPassword,
    });
    if (reauthError) return json({ error: "invalid_current_password" }, { status: 403 });
  } else if (!parsed.data.nonce && current.user.app_metadata?.provider !== "anonymous") {
    return json({ error: "current_password_required" }, { status: 400 });
  }
  const { data, error } = await supabase.auth.updateUser({ password: parsed.data.password, nonce: parsed.data.nonce });
  if (error || !data.user) return json({ error: authError(error, "password_update_failed") }, { status: 400 });
  return json({ ok: true });
}
