import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const entries = Object.entries(lock.packages || {}).filter(([path]) => path.startsWith("node_modules/"));
const forbidden = /(^|[ (])(AGPL|GPL|SSPL|BUSL|UNLICENSED|SEE LICENSE)/i;
const missing = entries.filter(([, value]) => !value.license).map(([path]) => path);
const denied = entries.filter(([, value]) => forbidden.test(String(value.license || ""))).map(([path, value]) => `${path}: ${value.license}`);
if (missing.length || denied.length) {
  throw new Error([missing.length ? `Missing license metadata:\n${missing.join("\n")}` : "", denied.length ? `Review-blocking licenses:\n${denied.join("\n")}` : ""].filter(Boolean).join("\n\n"));
}
process.stdout.write(`Dependency license guard passed for ${entries.length} packages.\n`);
