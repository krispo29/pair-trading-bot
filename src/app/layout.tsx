import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai"],
});

export const metadata: Metadata = {
  title: "QuantBot 2026 | High-Frequency Pair Trading Bot",
  description: "Advanced statistical arbitrage and mean reversion trading for cryptocurrency pairs. Real-time Z-Score monitoring and AI-powered market sentiment analysis.",
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${notoThai.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
