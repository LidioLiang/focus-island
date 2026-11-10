export const SOCIAL_PROVIDERS = ["google", "apple", "github"] as const;
export type SocialProvider = typeof SOCIAL_PROVIDERS[number];
export async function enabledProviders() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("auth_service_unavailable");
  const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, cache: "no-store", signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error("auth_service_unavailable");
  const data = await response.json();
  return Object.fromEntries([...SOCIAL_PROVIDERS, "email"].map(provider => [provider, data.external?.[provider] === true])) as Record<SocialProvider | "email", boolean>;
}
export function appOrigin(request: Request) {
  return new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin;
}
