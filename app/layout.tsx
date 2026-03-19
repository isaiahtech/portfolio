import type { Metadata, Viewport } from "next";
import { Geist, Dancing_Script } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: ["600"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Isaiah Dasen",
  description: "Personal portfolio of Isaiah Dasen — photographer, developer, creator.",
  metadataBase: new URL("https://isaiah.tech"),
  openGraph: {
    title: "Isaiah Dasen",
    description: "Personal portfolio of Isaiah Dasen — photographer, developer, creator.",
    type: "website",
    url: "https://isaiah.tech",
  },
  twitter: {
    card: "summary_large_image",
    title: "Isaiah Dasen",
    description: "Personal portfolio of Isaiah Dasen — photographer, developer, creator.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${dancingScript.variable}`}>
      <body className="pt-16">
        <Header />
        {children}
      </body>
    </html>
  );
}
