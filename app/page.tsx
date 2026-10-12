import Script from "next/script";
import RoomEngineBridge from "./room-engine-bridge";

export default function Home() {
  return (
    <>
      <main id="app" aria-live="polite" />
      <div className="rotate-notice">请将设备横过来，岛上的房间会更舒展。</div>
      <RoomEngineBridge />
      <Script src="/app.js?v=10" strategy="afterInteractive" />
    </>
  );
}
