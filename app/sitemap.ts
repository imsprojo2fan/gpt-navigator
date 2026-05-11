import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gpt-navigator.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/platforms`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  // Dynamic platform detail pages
  let platformPages: MetadataRoute.Sitemap = [];
  try {
    const platforms = await prisma.platform.findMany({
      where: { status: "active" },
      select: { slug: true, updatedAt: true },
    });

    platformPages = platforms.map((p) => ({
      url: `${baseUrl}/platforms/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB unavailable at build time — platforms will appear on next revalidation
  }

  return [...staticPages, ...platformPages];
}
