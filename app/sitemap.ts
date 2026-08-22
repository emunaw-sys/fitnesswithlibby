import type { MetadataRoute } from "next";
import { SITE_URL } from "./site";

/**
 * Served at /sitemap.xml, and submitted once in Google Search Console.
 *
 * Only the two public routes belong here. /admin is Libby's own login and is
 * disallowed in robots.ts — listing it would undo that.
 *
 * Keep this in step with the routes that actually exist: a sitemap pointing at
 * pages that 404 teaches Google to trust the file less.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE_URL, lastModified, changeFrequency: "monthly", priority: 1 },
    {
      url: `${SITE_URL}/book`,
      lastModified,
      changeFrequency: "weekly", // the schedule genuinely changes week to week
      priority: 0.9,
    },
  ];
}
