import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://focus-island-nine.vercel.app"),
  title: "Focus Isle — Immersive Focus Spaces for Deep Work",
  description: "Choose a quiet café seat, set a 25 or 50 minute timer, and focus with calming soundscapes and gentle company.",
  keywords: ["focus timer", "immersive focus", "deep work", "pomodoro timer", "virtual café", "ambient sounds"],
  alternates: { canonical: "/" },
  icons: { icon: "/assets/20261031-focus-isle-logo-icon.svg" },
  openGraph: {
    type: "website",
    siteName: "Focus Isle",
    title: "Focus Isle — Your Focus Has a Place",
    description: "Choose a quiet world, take a seat, and begin a calm focus session.",
    url: "/",
    images: [{ url: "/assets/20261012-cafe-window-focus-view.png", alt: "A warm café desk overlooking a rainy canal on Focus Isle" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Focus Isle — Your Focus Has a Place",
    description: "Choose a quiet world, take a seat, and begin a calm focus session.",
    images: ["/assets/20261012-cafe-window-focus-view.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f8fb",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/styles.css?v=39" />
        <link rel="stylesheet" href="/landing-final.css?v=2" />
        <link rel="stylesheet" href="/minimal-mvp.css?v=3" />
        <link rel="stylesheet" href="/account-center.css?v=1" />
      </head>
      <body>
        {children}
        <Script src="/vendor/i18next.min.js?v=26.4.2" strategy="beforeInteractive" />
        <Script src="/locales/en.js?v=13" strategy="beforeInteractive" />
        <Script src="/account-center.js?v=2" strategy="beforeInteractive" />
        <Script src="/scene-runtime.js?v=1" strategy="beforeInteractive" />
        <Script src="/minimal-mvp.js?v=6" strategy="beforeInteractive" />
        <Script src="/i18n.js?v=12" strategy="afterInteractive" />
      </body>
    </html>
  );
}
