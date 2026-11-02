import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Focus Isle · Find Your Quiet",
  description: "Step onto the island and begin with 25 calm minutes.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#102824",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/styles.css?v=35" />
        <link rel="stylesheet" href="/landing-final.css?v=1" />
      </head>
      <body>
        {children}
        <Script src="/vendor/i18next.min.js?v=26.4.2" strategy="beforeInteractive" />
        <Script src="/locales/en.js?v=11" strategy="beforeInteractive" />
        <Script src="/i18n.js?v=10" strategy="afterInteractive" />
      </body>
    </html>
  );
}
