/**
 * Single source of truth for the site's public URL and business details.
 *
 * Everything absolute — metadataBase, the sitemap, canonical URLs, JSON-LD and
 * Open Graph image URLs — resolves from here, so a domain change is a one-line
 * edit rather than a hunt through six files.
 *
 * `NEXT_PUBLIC_SITE_URL` should be set in Vercel → Settings → Environment
 * Variables. The fallback below is the live canonical host: the apex
 * (fitnesswithlibby.org) redirects to www, so www is what we advertise
 * everywhere. Changing one without the other makes search engines see two
 * copies of every page.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.fitnesswithlibby.org";

export const SITE_NAME = "Fitness With Libby";

/**
 * Feeds the JSON-LD block in app/layout.tsx. For a studio with a physical
 * location this is what earns a Google knowledge panel and a Maps card —
 * usually worth more traffic to a local business than the site's own ranking.
 *
 * No `telephone` here on purpose: no phone number appears anywhere on the site,
 * and structured data that claims something the page doesn't show gets rich
 * results suppressed. Add it here and to the footer together, or not at all.
 */
export const ORG = {
  legalName: "Fitness With Libby",
  email: "Libbysolomons71@gmail.com",
  address: {
    locality: "Ramat Beit Shemesh Gimmel",
    region: "Beit Shemesh",
    country: "IL",
  },
  // Profiles that confirm this is the same business. Populates `sameAs`, which
  // is how Google links the site to a Google Business or Instagram listing.
  sameAs: [] as string[],
} as const;
