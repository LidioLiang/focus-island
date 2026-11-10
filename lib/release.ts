import packageJson from "@/package.json";

export const RELEASE_INFO = {
  version: packageJson.version,
  developerToolsVersion: "2.0",
  environment: process.env.VERCEL_ENV || "local",
  commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
};
