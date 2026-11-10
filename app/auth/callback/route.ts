import { mergeGuestAccount } from "@/lib/account-merge";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/auth-providers";
import { sha256 } from "@/lib/crypto";
import { readProfile } from "@/lib/profile";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = new URL("/", appOrigin(request));
  const cookieStore = await cookies();
  const token = cookieStore.get("focus-oauth-merge")?.value;
  cookieStore.set("focus-oauth-merge", "", { path: "/auth/callback", maxAge: 0 });
  const code = url.searchParams.get("code");
  if (!code || url.searchParams.has("error")) {
    destination.searchParams.set("account-error", "sign_in_cancelled");
  } else {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.user) throw new Error("oauth_failed");
      if (token) {
        try {
          const merged = await mergeGuestAccount(supabase, data.user, sha256(token));
          if (merged.profileTransferWarning) destination.searchParams.set("account-error", "profile_transfer_failed");
        } catch { destination.searchParams.set("account-error", "history_merge_failed"); }
      }
      await readProfile(supabase, data.user);
      destination.searchParams.set("account", "profile");
    } catch { destination.searchParams.set("account-error", "sign_in_failed"); }
  }
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
