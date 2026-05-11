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

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-800">
        <p><strong>欢迎进入管理后台。</strong>本页展示平台和爬虫任务的概况数据。</p>
        <p className="mt-1 text-blue-600">
          · <strong>平台管理</strong>：左侧点「Platforms」查看/编辑/新增平台<br />
          · <strong>爬虫任务</strong>：左侧点「Crawl Jobs」查看爬虫执行状态，失败的任务可以重试<br />
          · <strong>新增平台</strong>：左边点「Platforms」→ 点「+ Add Platform」手动录入，或运行爬虫自动收录
        </p>
      </div>

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
