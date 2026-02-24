// Svoi — Root layout: fonts, providers, Telegram init
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Svoi — Свой базар",
  description: "Доска объявлений для своих в Белграде и Сербии",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Svoi",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Svoi — Свой базар",
    description: "Доска объявлений для своих в Белграде и Сербии",
    type: "website",
    locale: "ru_RS",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,  // disable pinch-zoom in Mini App
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable}>
      <head>
        {/* Telegram Mini App SDK — loaded before any JS to ensure WebApp is ready */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
