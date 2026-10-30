import type { MetadataRoute } from "next";
import { SITE_URL } from "@/components/JsonLd.tsx";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: new URL("/sitemap.xml", SITE_URL).href,
  };
}
