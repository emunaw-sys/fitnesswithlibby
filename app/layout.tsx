import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Alex_Brush, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { ORG, SITE_NAME, SITE_URL } from "./site";

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

const TITLE = "Fitness With Libby — Women-Only Studio, Beit Shemesh";
const DESCRIPTION =
  "Women-only fitness classes in Beit Shemesh. Strength, cardio and dance in a warm, kosher, private studio. Where fitness meets fun.";

export const metadata: Metadata = {
  // Required. Without it Next emits *relative* Open Graph URLs, which every
  // social scraper rejects — the shared link previews as a blank grey card.
  metadataBase: new URL(SITE_URL),

  title: TITLE,
  description: DESCRIPTION,
  applicationName: SITE_NAME,

  // Collapses the apex, www and *.vercel.app duplicates into one indexed page.
  alternates: { canonical: "/" },

  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
  },

  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * Structured data. This is what lets Google show the studio as a real local
 * business — knowledge panel, Maps card — rather than just a web page.
 *
 * Every claim here is also visible on the page, which matters: structured data
 * that contradicts the rendered content gets rich results suppressed. That's
 * why there's no telephone or street address — neither appears on the site.
 */
const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: ORG.legalName,
  description: DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image`,
  email: ORG.email,
  address: {
    "@type": "PostalAddress",
    addressLocality: ORG.address.locality,
    addressRegion: ORG.address.region,
    addressCountry: ORG.address.country,
  },
  ...(ORG.sameAs.length ? { sameAs: ORG.sameAs } : {}),
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
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
        {children}
        {/* Vercel Web Analytics. Cookieless, so the site still needs no
            cookie banner. Sends nothing in local dev. */}
        <Analytics />
        {/* Core Web Vitals from real visitors — what Google actually ranks on,
            as opposed to Lighthouse's single simulated run. */}
        <SpeedInsights />
      </body>
    </html>
  );
}
