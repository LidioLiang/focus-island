// Keep the product on the original origin so cookies and local history survive.
export const MARKETING_PATHS = [
  "/", "/pricing", "/spaces", "/spaces/virtual-cafe", "/spaces/virtual-library",
  "/spaces/forest", "/tools/pomodoro-timer", "/blog", "/contact",
  "/blog/start-a-focus-session", "/blog/choose-your-focus-space", "/blog/25-minute-focus-ritual",
] as const;
const appReturnKeys = ["account", "account-error", "auth", "billing", "merged-from", "lifetime_invite", "roomRenderer", "godot3dSrc", "welcome"];

export function websiteDestination(url: URL): { redirect?: string; rewrite?: string; app?: boolean } {
  const pathname = url.pathname.replace(/\/$/, "") || "/";
  if (pathname === "/" && appReturnKeys.some(key => url.searchParams.has(key))) {
    return { redirect: "/app" + url.search };
  }
  if (pathname === "/app") return { app: true };
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return { rewrite: "/_website" + pathname };
  if (MARKETING_PATHS.some(route => route === pathname)) {
    return { rewrite: "/_website" + (pathname === "/" ? "" : pathname) + "/index.html" };
  }
  return {};
}
