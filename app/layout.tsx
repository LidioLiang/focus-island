import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Focus Isle v1.1",
  description: "Step into a calm space, pick a seat, and get to work.",
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
      </head>
      <body>
        {children}
        <Script src="/vendor/i18next.min.js?v=26.4.2" strategy="beforeInteractive" />
        <Script src="/locales/en.js?v=11" strategy="beforeInteractive" />
        <Script src="/i18n.js?v=9" strategy="afterInteractive" />
      </body>
    </html>
  );
}
