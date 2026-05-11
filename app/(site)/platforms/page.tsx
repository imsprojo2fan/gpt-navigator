import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PlatformCard } from "@/components/platform/PlatformCard";
import { FilterBar } from "@/components/platform/FilterBar";
import { toPlatform } from "@/types/platform";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "All GPT Platforms",
  description:
    "Browse and compare hundreds of get-paid-to platforms. Filter by task type, payment method, and region.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function PlatformsPage({ searchParams }: Props) {
  // Parse search params
  const taskTypes = parseArray(searchParams.taskType);
  const payments = parseArray(searchParams.payment);
  const regions = parseArray(searchParams.region);
  const sort = parseString(searchParams.sort) || "rating";
  const page = Math.max(1, parseInt(parseString(searchParams.page) || "1", 10));
  const limit = 20;

  // Build where clause
  const where: Prisma.PlatformWhereInput = { status: "active" };

  // Build feature filter (1-to-1 relation, use `is`)
  const featureWhere: Prisma.PlatformFeatureWhereInput = {};
  if (taskTypes.length > 0) featureWhere.taskTypes = { hasSome: taskTypes };
  if (payments.length > 0) featureWhere.paymentMethods = { hasSome: payments };
  if (regions.length > 0) featureWhere.regions = { hasSome: regions };
  if (Object.keys(featureWhere).length > 0) {
    where.features = { is: featureWhere };
  }

  // Build orderBy
  let orderBy: Prisma.PlatformOrderByWithRelationInput;
  switch (sort) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "cashout":
      orderBy = { minCashout: "asc" };
      break;
    default:
      orderBy = { rating: { sort: "desc", nulls: "last" } };
  }

  const [platforms, total] = await Promise.all([
    prisma.platform.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { features: true },
    }),
    prisma.platform.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">All Platforms</h1>
        <p className="mt-1 text-gray-500">
          {total} platform{total !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="mb-8 rounded-xl border bg-white p-4">
        <FilterBar />
      </div>

      {platforms.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platforms.map((p) => (
              <PlatformCard key={p.id} platform={toPlatform(p)} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildPageUrl(searchParams, p)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    p === page
                      ? "bg-blue-600 text-white"
                      : "bg-white border text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium">No platforms found</p>
          <p className="mt-1 text-sm">
            Try adjusting your filters or run the crawler to populate data.
          </p>
        </div>
      )}
    </div>
  );
}

function parseArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function parseString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildPageUrl(
  current: Record<string, string | string[] | undefined>,
  newPage: number
): string {
  const next = new URLSearchParams();
  for (const [key, val] of Object.entries(current)) {
    if (key === "page") continue;
    if (Array.isArray(val)) {
      for (const v of val) next.append(key, v);
    } else if (val) {
      next.set(key, val);
    }
  }
  if (newPage > 1) next.set("page", String(newPage));
  const qs = next.toString();
  return `/platforms${qs ? `?${qs}` : ""}`;
}
