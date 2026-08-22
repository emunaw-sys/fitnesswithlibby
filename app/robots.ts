import type { MetadataRoute } from "next";
import { SITE_URL } from "./site";

/**
 * Served at /robots.txt. Points crawlers at the sitemap and keeps the admin
 * surfaces out of the index — an indexed /admin login page is both a useless
 * search result and a free advertisement of where the door is.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
