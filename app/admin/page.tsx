import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [totalPlatforms, activePlatforms, pendingPlatforms, jobStats] =
    await Promise.all([
      prisma.platform.count(),
      prisma.platform.count({ where: { status: "active" } }),
      prisma.platform.count({ where: { status: "pending" } }),
      prisma.crawlJob.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

  const jobCounts: Record<string, number> = {};
  for (const row of jobStats) {
    jobCounts[row.status] = row._count;
  }

  const statCards = [
    { label: "Total Platforms", value: totalPlatforms, href: "/admin/platforms", color: "bg-blue-50 text-blue-700" },
    { label: "Active", value: activePlatforms, href: "/admin/platforms?status=active", color: "bg-green-50 text-green-700" },
    { label: "Pending Review", value: pendingPlatforms, href: "/admin/platforms?status=pending", color: "bg-yellow-50 text-yellow-700" },
    { label: "Crawl Jobs", value: jobCounts.pending || 0, sublabel: "pending", href: "/admin/crawl-jobs", color: "bg-purple-50 text-purple-700" },
    { label: "Running", value: jobCounts.running || 0, href: "/admin/crawl-jobs?status=running", color: "bg-orange-50 text-orange-700" },
    { label: "Failed", value: jobCounts.failed || 0, href: "/admin/crawl-jobs?status=failed", color: "bg-red-50 text-red-700" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition ${card.color}`}
          >
            <div className="text-sm font-medium opacity-80">{card.label}</div>
            <div className="mt-1 text-3xl font-bold">{card.value}</div>
            {card.sublabel && (
              <div className="text-xs opacity-60">{card.sublabel}</div>
            )}
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/admin/platforms/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            + Add Platform
          </Link>
          <Link
            href="/admin/crawl-jobs"
            className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            View Crawl Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
