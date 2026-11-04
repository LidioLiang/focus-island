import { createHash, randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { createClient } from "@supabase/supabase-js";

async function loadConfiguration() {
  if (!process.argv.includes("--stdin-json")) return process.env;

  const reader = createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  const payload = await reader.question("");
  reader.close();
  if (!payload.trim()) throw new Error("Expected a JSON configuration object on stdin.");
  return JSON.parse(payload);
}

const configuration = await loadConfiguration();
const url = configuration.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = configuration.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = configuration.NEXT_PUBLIC_APP_URL;
const campaignName = configuration.LIFETIME_INVITE_CAMPAIGN || "v1.1-founder-50";
const maxClaims = Number(configuration.LIFETIME_INVITE_MAX_CLAIMS || 50);
const token = configuration.LIFETIME_INVITE_TOKEN || randomBytes(32).toString("base64url");

if (!url || !serviceRoleKey || !appUrl) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_APP_URL in the process environment.");
}
if (!Number.isInteger(maxClaims) || maxClaims < 1 || maxClaims > 100000) throw new Error("LIFETIME_INVITE_MAX_CLAIMS is invalid.");

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const tokenHash = createHash("sha256").update(token).digest("hex");
const { error } = await supabase.from("lifetime_invite_campaigns").upsert({
  name: campaignName,
  token_hash: tokenHash,
  max_claims: maxClaims,
  active: true,
  updated_at: new Date().toISOString(),
}, { onConflict: "name" });
if (error) throw error;

const inviteUrl = new URL(appUrl);
inviteUrl.searchParams.set("lifetime_invite", token);
process.stdout.write(`${inviteUrl.toString()}\n`);
