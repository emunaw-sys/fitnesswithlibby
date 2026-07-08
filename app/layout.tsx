import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Alex_Brush, Outfit } from "next/font/google";
import "./globals.css";

// Display headline face
const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

// Script / handwritten accent
const alexBrush = Alex_Brush({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brush",
  display: "swap",
});

// Body / UI
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fitness With Libby — Women-Only Studio, Beit Shemesh",
  description:
    "Women-only fitness classes in Beit Shemesh. Strength, cardio and dance in a warm, kosher, private studio. Where fitness meets fun.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${alexBrush.variable} ${outfit.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
