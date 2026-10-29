import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_AUDIO_BUCKET || "focus-audio";
const version = process.env.ASSET_RELEASE_VERSION || "v1.0.0";
const sourceDir = process.env.FOCUS_AUDIO_SOURCE_DIR || resolve("../archive/assets/focus-audio-v1.0.0");
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

const supabase = createClient(url, key, { auth: { persistSession: false } });
const files = ["rainy-notes", "warm-reverie", "moonlit-walk", "island-breeze"]
  .map((slug) => resolve(sourceDir, `20261028-focus-music-${slug}.mp3`));

for (const file of files) {
  await access(file);
  const objectPath = `${version}/${basename(file)}`;
  const { error } = await supabase.storage.from(bucket).upload(objectPath, createReadStream(file), {
    contentType: "audio/mpeg",
    cacheControl: "31536000, immutable",
    upsert: false,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) throw error;
  process.stdout.write(`${objectPath}\n`);
}
