import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ins199.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "GPT Navigator — Find the Best Get-Paid-To Sites",
    template: "%s | GPT Navigator",
  },
  description:
    "Discover and compare the best get-paid-to (GPT) platforms. Earn money with surveys, games, apps, and videos. Find sites like Freecash, Swagbucks and more.",
  keywords: [
    "GPT sites", "get paid to", "earn money online", "paid surveys",
    "make money", "micro tasks", "side hustle", "Freecash", "Swagbucks",
    "GPT platform", "online earning", "task sites",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "GPT Navigator",
    title: "GPT Navigator — Find the Best Get-Paid-To Sites",
    description:
      "Discover and compare the best get-paid-to (GPT) platforms. Earn money with surveys, games, apps, and videos.",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "GPT Navigator — Find the Best Get-Paid-To Sites",
    description:
      "Discover and compare the best get-paid-to (GPT) platforms. Earn money with surveys, games, apps, and videos.",
  },
  icons: {
    icon: "/favicon.svg",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
