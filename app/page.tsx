import Script from "next/script";
import { RealtimeBridge } from "./realtime-bridge";
import { RELEASE_INFO } from "@/lib/release";

export default function Home() {
  const publicConfig = {
    appVersion: RELEASE_INFO.version,
    release: RELEASE_INFO,
    audioBaseUrl: process.env.NEXT_PUBLIC_AUDIO_BASE_URL || "",
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Focus Isle",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://focus-island-nine.vercel.app/",
    description: "A browser-based immersive focus timer with virtual spaces, ambient sounds, static seat selection, and 25-minute, 50-minute, or open-ended focus modes.",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web browser",
    offers: [
      { "@type": "Offer", name: "First focus session", price: "0", priceCurrency: "USD" },
      { "@type": "Offer", name: "Monthly membership", price: "4.99", priceCurrency: "USD" },
      { "@type": "Offer", name: "Annual membership", price: "19.99", priceCurrency: "USD" },
      { "@type": "Offer", name: "Founder lifetime pass", price: "39.99", priceCurrency: "USD" },
    ],
  };
  return (
    <>
      <main id="app" aria-live="polite" />
      <div className="rotate-notice">请将设备横过来，岛上的房间会更舒展。</div>
      <RealtimeBridge url={process.env.NEXT_PUBLIC_SUPABASE_URL} publishableKey={process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <Script id="focus-island-config" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `window.__FOCUS_ISLAND_CONFIG__=${JSON.stringify(publicConfig).replace(/</g, "\\u003c")}` }} />
      <Script src="/app.js?v=48" strategy="afterInteractive" />
    </>
  );
}
