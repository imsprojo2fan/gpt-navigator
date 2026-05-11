import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { posts } from "@/content/blog/posts";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ins199.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const platforms = await prisma.platform.findMany({
    where: { status: "active" },
    select: { slug: true, updatedAt: true },
  });

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/platforms`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const platformPages: MetadataRoute.Sitemap = platforms.map((p) => ({
    url: `${BASE_URL}/platforms/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...platformPages, ...blogPages];
}
