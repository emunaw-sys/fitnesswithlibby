import type { Metadata } from "next";
import { Anton, Bebas_Neue, Poppins, Great_Vibes } from "next/font/google";
import "./globals.css";

// Display headline — heavy condensed (the "WHERE FITNESS" weight)
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display-heavy",
  display: "swap",
});

// Display headline — lighter condensed (the "MEETS" weight)
const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Body / UI / nav
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Script accent — the pink "fun"
const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fitness With Libby — Beit Shemesh",
  description:
    "Women-only fitness classes in Beit Shemesh. Strength, balance and confidence — body and soul. Where fitness meets fun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${bebas.variable} ${poppins.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
