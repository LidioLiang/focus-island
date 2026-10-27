import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter((file) => file && existsSync(file));
const oversized = files.filter((file) => statSync(file).size > 20 * 1024 * 1024);
if (oversized.length) throw new Error(`Tracked files over 20 MiB:\n${oversized.join("\n")}`);

const patterns = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s#]+/i,
  /sb_secret_[A-Za-z0-9_-]{16,}/,
  /sk_live_[A-Za-z0-9]{16,}/,
];
const excluded = new Set([".env.example", "scripts/repository-guard.mjs"]);
const textFiles = files.filter((file) => !excluded.has(file) && statSync(file).size < 2 * 1024 * 1024 && /(^|\/)([^/]+\.(?:ts|tsx|js|mjs|json|md|toml|sql|ya?ml)|LICENSE)$/.test(file));
const findings = textFiles.filter((file) => patterns.some((pattern) => pattern.test(readFileSync(file, "utf8"))));
if (findings.length) throw new Error(`Possible secret detected in:\n${findings.join("\n")}`);
process.stdout.write(`Repository guard passed for ${files.length} tracked files.\n`);
