import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  TASK_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  REGION_LABELS,
} from "@/types/platform";
import type { TaskType, PaymentMethod } from "@/types/platform";

export const metadata: Metadata = {
  title: "Compare GPT Platforms",
  description:
    "Compare get-paid-to platforms side by side. See task types, payment methods, ratings, and minimum cashout.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Compare GPT Platforms | GPT Navigator",
    description:
      "Compare get-paid-to platforms side by side. See task types, payment methods, ratings, and minimum cashout.",
    url: "/compare",
  },
};

export const revalidate = 60;

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function ComparePage({ searchParams }: Props) {
  // Parse slugs from query params: ?slugs=freecash&slugs=swagbucks
  const slugParam = searchParams.slugs;
  const slugs: string[] = slugParam
    ? Array.isArray(slugParam)
      ? slugParam
      : [slugParam]
    : [];

  const platforms = slugs.length > 0
    ? await prisma.platform.findMany({
        where: { slug: { in: slugs }, status: "active" },
        include: { features: true },
      })
    : [];

  // Get top-rated for selection
  const topPlatforms = await prisma.platform.findMany({
    where: { status: "active", rating: { not: null } },
    orderBy: { rating: "desc" },
    take: 20,
    select: { id: true, name: true, slug: true, rating: true },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Compare Platforms</h1>
      <p className="mt-1 text-gray-500">
        Select platforms to compare side by side.
      </p>

      {/* Platform selector */}
      <div className="mt-6 rounded-xl border bg-white p-4">
        <p className="text-sm font-medium text-gray-500 mb-2">
          Choose platforms ({slugs.length}/3 selected):
        </p>
        <div className="flex flex-wrap gap-2">
          {topPlatforms.map((p) => {
            const isSelected = slugs.includes(p.slug);
            const nextSlugs = isSelected
              ? slugs.filter((s) => s !== p.slug)
              : [...slugs, p.slug].slice(0, 3);
            const qs = nextSlugs.map((s) => `slugs=${s}`).join("&");

            return (
              <Link
                key={p.id}
                href={`/compare${qs ? `?${qs}` : ""}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.name}
                {p.rating != null && ` (${p.rating.toFixed(1)})`}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Comparison table */}
      {platforms.length > 0 ? (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border bg-gray-50 p-3 text-left font-medium text-gray-500 w-40">
                  Feature
                </th>
                {platforms.map((p) => (
                  <th key={p.id} className="border bg-gray-50 p-3 text-left font-semibold text-gray-900">
                    <Link href={`/platforms/${p.slug}`} className="hover:text-blue-600">
                      {p.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              <CompareRow label="Rating" values={platforms.map((p) => p.rating != null ? `${p.rating.toFixed(1)} / 5` : "N/A")} />
              <CompareRow label="Min Cashout" values={platforms.map((p) => p.minCashout || "Unknown")} />
              <CompareRow
                label="Task Types"
                values={platforms.map(
                  (p) =>
                    p.features?.taskTypes
                      .map((t) => TASK_TYPE_LABELS[t as TaskType] || t)
                      .join(", ") || "N/A"
                )}
              />
              <CompareRow
                label="Payment Methods"
                values={platforms.map(
                  (p) =>
                    p.features?.paymentMethods
                      .map((m) => PAYMENT_METHOD_LABELS[m as PaymentMethod] || m)
                      .join(", ") || "N/A"
                )}
              />
              <CompareRow
                label="Regions"
                values={platforms.map(
                  (p) =>
                    p.features?.regions
                      .map((r) => REGION_LABELS[r as keyof typeof REGION_LABELS] || r)
                      .join(", ") || "N/A"
                )}
              />
              <CompareRow
                label="Mobile App"
                values={platforms.map((p) => (p.features?.hasMobileApp ? "Yes" : "No"))}
              />
              <CompareRow
                label="Beginner Friendly"
                values={platforms.map((p) => (p.features?.isBeginnerFriendly ? "Yes" : "No"))}
              />
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8 text-center py-16 text-gray-500">
          <p className="text-lg font-medium">
            {slugs.length === 0
              ? "Select platforms above to compare"
              : "Selected platforms not found"}
          </p>
        </div>
      )}
    </div>
  );
}

function CompareRow({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  return (
    <tr>
      <td className="border p-3 font-medium text-gray-500">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="border p-3 text-gray-900">
          {v}
        </td>
      ))}
    </tr>
  );
}
