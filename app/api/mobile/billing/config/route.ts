import { json } from "@/lib/presence";
import { appleStore, APPLE_PRODUCTS } from "@/lib/apple-store";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { environment } = appleStore();
    const { error } = await createAdminSupabaseClient().from("apple_subscriptions").select("original_transaction_id").limit(0);
    if (error) throw error;
    return json({ enabled: true, environment, productIds: APPLE_PRODUCTS }, { headers: { "Cache-Control": "no-store" } });
  } catch { return json({ enabled: false, productIds: [] }, { headers: { "Cache-Control": "no-store" } }); }
}
