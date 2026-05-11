import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PlatformCard } from "@/components/platform/PlatformCard";
import type { TaskType, Region } from "@/types/platform";
import { TASK_TYPE_LABELS, REGION_LABELS, toPlatform } from "@/types/platform";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "GPT Navigator — Find the Best Get-Paid-To Sites",
    description:
      "Compare hundreds of GPT platforms. Earn money with surveys, games, apps, and videos. We track ratings, payouts, and payment methods.",
    url: "/",
  },
};

const CATEGORIES: { type: TaskType; icon: string; color: string }[] = [
  { type: "survey", icon: "📋", color: "bg-purple-50 text-purple-700" },
  { type: "games", icon: "🎮", color: "bg-green-50 text-green-700" },
  { type: "app", icon: "📱", color: "bg-blue-50 text-blue-700" },
  { type: "video", icon: "▶️", color: "bg-red-50 text-red-700" },
  { type: "shopping", icon: "🛒", color: "bg-orange-50 text-orange-700" },
  { type: "referral", icon: "👥", color: "bg-pink-50 text-pink-700" },
];

const REGIONS: { code: Region; flag: string }[] = [
  { code: "US", flag: "🇺🇸" },
  { code: "UK", flag: "🇬🇧" },
  { code: "CA", flag: "🇨🇦" },
  { code: "AU", flag: "🇦🇺" },
  { code: "Global", flag: "🌍" },
];

export const revalidate = 60;

export default async function HomePage() {
  const [featured, latest] = await Promise.all([
    prisma.platform.findMany({
      where: { status: "active", rating: { not: null } },
      orderBy: { rating: "desc" },
      take: 6,
      include: { features: true },
    }),
    prisma.platform.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { features: true },
    }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Find the Best{" "}
            <span className="text-blue-600">Get-Paid-To</span> Sites
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Compare hundreds of GPT platforms. Earn money with surveys, games,
            apps, and videos. We track ratings, payouts, and payment methods so
            you don&apos;t have to.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/platforms"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Browse All Platforms
            </Link>
            <Link
              href="/compare"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
            >
              Compare
            </Link>
          </div>
        </div>
      </section>

      {/* Task Type Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900">Browse by Task Type</h2>
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {CATEGORIES.map(({ type, icon, color }) => (
            <Link
              key={type}
              href={`/platforms?taskType=${type}`}
              className={`flex flex-col items-center gap-2 rounded-xl p-4 text-center transition hover:opacity-80 ${color}`}
            >
              <span className="text-3xl">{icon}</span>
              <span className="text-xs font-medium">{TASK_TYPE_LABELS[type]}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Platforms */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Top Rated</h2>
          <Link
            href="/platforms?sort=rating"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View all →
          </Link>
        </div>
        {featured.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PlatformCard key={p.id} platform={toPlatform(p)} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-gray-500 text-sm">
            No platforms yet. Crawl data first with{" "}
            <code className="bg-gray-100 px-1 rounded">python main.py crawl</code>
          </p>
        )}
      </section>

      {/* Browse by Region */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900">Browse by Region</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {REGIONS.map(({ code, flag }) => (
            <Link
              key={code}
              href={`/platforms?region=${code}`}
              className="flex items-center gap-3 rounded-xl border bg-white p-4 text-sm font-medium text-gray-700 shadow-sm transition hover:border-blue-200 hover:shadow"
            >
              <span className="text-2xl">{flag}</span>
              {REGION_LABELS[code]}
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Additions */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Recently Added</h2>
          <Link
            href="/platforms?sort=newest"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View all →
          </Link>
        </div>
        {latest.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((p) => (
              <PlatformCard key={p.id} platform={toPlatform(p)} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-gray-500 text-sm">No platforms yet.</p>
        )}
      </section>
    </div>
  );
}
