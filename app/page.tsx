import Script from "next/script";
import { RealtimeBridge } from "./realtime-bridge";

export default function Home() {
  const publicConfig = {
    appVersion: "1.1.0",
    audioBaseUrl: process.env.NEXT_PUBLIC_AUDIO_BASE_URL || "",
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
  };
  return (
    <>
      <main id="app" aria-live="polite" />
      <div className="rotate-notice">请将设备横过来，岛上的房间会更舒展。</div>
      <RealtimeBridge url={process.env.NEXT_PUBLIC_SUPABASE_URL} publishableKey={process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY} />
      <Script id="focus-island-config" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `window.__FOCUS_ISLAND_CONFIG__=${JSON.stringify(publicConfig).replace(/</g, "\\u003c")}` }} />
      <Script src="/app.js?v=40" strategy="afterInteractive" />
    </>
  );
}
