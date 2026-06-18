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
    <html lang="en" className="h-full antialiased">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600&family=Great+Vibes&display=swap"
      />
      <body className="min-h-full">{children}</body>
    </html>
  );
}
