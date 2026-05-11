import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PlatformCard } from "@/components/platform/PlatformCard";
import { PlatformSchema } from "@/components/seo/PlatformSchema";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import {
  TASK_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  REGION_LABELS,
  toPlatform,
} from "@/types/platform";
import type { TaskType, PaymentMethod } from "@/types/platform";

type Props = {
  params: { slug: string };
};

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const platform = await prisma.platform.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true },
  });

  if (!platform) {
    return { title: "Platform Not Found" };
  }

  const desc =
    platform.description ||
    `Read our review of ${platform.name}. See task types, payment methods, minimum cashout, and user ratings.`;

  return {
    title: `${platform.name} Review`,
    description: desc,
    alternates: { canonical: `/platforms/${params.slug}` },
    openGraph: {
      title: `${platform.name} Review | GPT Navigator`,
      description: desc,
      url: `/platforms/${params.slug}`,
      type: "article",
    },
  };
}

export default async function PlatformDetailPage({ params }: Props) {
  const platform = await prisma.platform.findUnique({
    where: { slug: params.slug },
    include: { features: true },
  });

  if (!platform) {
    notFound();
  }

  const features = platform.features;

  // Similar platforms: same task types, exclude current
  const similar =
    features && features.taskTypes.length > 0
      ? await prisma.platform.findMany({
          where: {
            status: "active",
            slug: { not: platform.slug },
            features: { is: { taskTypes: { hasSome: features.taskTypes } } },
          },
          orderBy: { rating: { sort: "desc", nulls: "last" } },
          take: 3,
          include: { features: true },
        })
      : await prisma.platform.findMany({
          where: {
            status: "active",
            slug: { not: platform.slug },
          },
          orderBy: { rating: { sort: "desc", nulls: "last" } },
          take: 3,
          include: { features: true },
        });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gpt-navigator.com";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <PlatformSchema platform={toPlatform(platform)} />
      <BreadcrumbSchema
        crumbs={[
          { name: "Home", url: baseUrl },
          { name: "Platforms", url: `${baseUrl}/platforms` },
          { name: platform.name, url: `${baseUrl}/platforms/${platform.slug}` },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/platforms" className="hover:text-gray-700">
          Platforms
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{platform.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-3xl font-bold text-blue-600">
              {platform.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {platform.name} Review
              </h1>
              <p className="mt-2 text-gray-600">
                {platform.description || "No description available yet."}
              </p>
            </div>
          </div>

          {/* Rating + Trustpilot */}
          <div className="flex flex-wrap gap-4">
            {platform.rating != null && (
              <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {platform.rating.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Our Rating</div>
                </div>
              </div>
            )}
            {platform.trustpilotScore != null && (
              <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3">
                <span className="text-2xl">
                  {Number(platform.trustpilotScore) >= 4 ? "🟢" : "🟡"}
                </span>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {platform.trustpilotScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Trustpilot</div>
                </div>
              </div>
            )}
            {platform.minCashout && (
              <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3">
                <span className="text-2xl">💰</span>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {platform.minCashout}
                  </div>
                  <div className="text-xs text-gray-500">Min Cashout</div>
                </div>
              </div>
            )}
          </div>

          {/* Task Types */}
          {features && features.taskTypes.length > 0 && (
            <Section title="Task Types">
              <div className="flex flex-wrap gap-2">
                {features.taskTypes.map((t) => (
                  <Link
                    key={t}
                    href={`/platforms?taskType=${t}`}
                    className="rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700 hover:bg-purple-100 transition"
                  >
                    {TASK_TYPE_LABELS[t as TaskType] || t}
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Payment Methods */}
          {features && features.paymentMethods.length > 0 && (
            <Section title="Payment Methods">
              <div className="flex flex-wrap gap-2">
                {features.paymentMethods.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700"
                  >
                    {PAYMENT_METHOD_LABELS[p as PaymentMethod] || p}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Regions */}
          {features && features.regions.length > 0 && (
            <Section title="Available Regions">
              <div className="flex flex-wrap gap-2">
                {features.regions.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                  >
                    {REGION_LABELS[r as keyof typeof REGION_LABELS] || r}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Features */}
          {features && (
            <Section title="Features">
              <ul className="space-y-2 text-sm text-gray-600">
                <FeatureItem
                  label="Mobile App"
                  value={features.hasMobileApp}
                />
                <FeatureItem
                  label="Beginner Friendly"
                  value={features.isBeginnerFriendly}
                />
                <FeatureItem
                  label="Verified"
                  value={platform.isVerified}
                />
              </ul>
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* CTA */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            {platform.affiliateUrl ? (
              <a
                href={platform.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                Visit {platform.name} →
              </a>
            ) : (
              <a
                href={platform.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
              >
                Visit Website →
              </a>
            )}
            <p className="mt-2 text-center text-xs text-gray-400">
              We may earn a commission if you sign up.
            </p>
          </div>

          {/* Quick Info */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">Quick Info</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Website</dt>
                <dd className="text-gray-900 truncate max-w-[140px]">
                  {new URL(platform.websiteUrl).hostname}
                </dd>
              </div>
              {platform.minCashout && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Min Cashout</dt>
                  <dd className="font-medium text-gray-900">{platform.minCashout}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Added</dt>
                <dd className="text-gray-900">
                  {new Date(platform.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Similar Platforms */}
      {similar.length > 0 && (
        <section className="mt-12 border-t pt-12">
          <h2 className="text-2xl font-bold text-gray-900">Similar Platforms</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <PlatformCard key={p.id} platform={toPlatform(p)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function FeatureItem({ label, value }: { label: string; value: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span>{value ? "✅" : "❌"}</span>
      <span>{label}</span>
    </li>
  );
}
