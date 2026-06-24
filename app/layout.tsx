import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
