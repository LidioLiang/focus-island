import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";

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
const email = configuration.DEVELOPER_EMAIL?.trim().toLowerCase();
const password = configuration.DEVELOPER_PASSWORD;

if (!url || !serviceRoleKey || !email || !password) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEVELOPER_EMAIL and DEVELOPER_PASSWORD in the process environment.");
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
let existing = null;
for (let page = 1; page <= 20 && !existing; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  existing = data.users.find((user) => user.email?.toLowerCase() === email) || null;
  if (data.users.length < 1000) break;
}

const attributes = {
  email,
  password,
  email_confirm: true,
  app_metadata: { ...(existing?.app_metadata || {}), role: "developer" },
};
const result = existing
  ? await supabase.auth.admin.updateUserById(existing.id, attributes)
  : await supabase.auth.admin.createUser(attributes);
if (result.error || !result.data.user) throw result.error || new Error("Developer account was not provisioned.");
process.stdout.write("Developer account provisioned with server-managed role.\n");
