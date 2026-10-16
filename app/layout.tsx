import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "专注岛 · Focus Isle",
  description: "像进入游戏一样，找一个安静的位置开始专注。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#102824",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="stylesheet" href="/styles.css?v=13" />
      </head>
      <body>{children}</body>
    </html>
  );
}
