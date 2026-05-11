import Link from "next/link";
import { prisma } from "@/lib/db";
import { RetryButton } from "@/components/admin/RetryButton";

export const dynamic = "force-dynamic";

const STATUSES = ["", "pending", "running", "done", "failed"] as const;
const STATUS_LABELS: Record<string, string> = {
  "": "All",
  pending: "Pending",
  running: "Running",
  done: "Done",
  failed: "Failed",
};

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function CrawlJobsPage({ searchParams }: Props) {
  const status = typeof searchParams.status === "string" ? searchParams.status : "";
  const page = Math.max(1, parseInt(
    (typeof searchParams.page === "string" ? searchParams.page : "1"), 10
  ));
  const limit = 20;

  const where = status ? { status } : {};

  const [jobs, total] = await Promise.all([
    prisma.crawlJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.crawlJob.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // Get counts for each status tab
  const statusCounts = await prisma.crawlJob.groupBy({
    by: ["status"],
    _count: true,
  });
  const counts: Record<string, number> = {};
  for (const row of statusCounts) {
    counts[row.status] = row._count;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">爬虫任务</h1>
      <p className="mt-1 text-sm text-gray-500">监控爬虫任务队列，失败的任务可以重试。</p>
      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-sm text-blue-800">
        爬虫任务状态说明：<strong>Pending</strong>（排队中）、<strong>Running</strong>（执行中）、<strong>Done</strong>（已完成，数据已入库）、<strong>Failed</strong>（失败，可点 Retry 重试）。
        失败的可以展开 Error 查看原因。如果大量 403 说明目标站屏蔽了爬虫，属于正常现象，可以去手动录入该平台信息。
      </div>

      {/* Status Tabs */}
      <div className="mt-4 flex gap-1">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s ? `/admin/crawl-jobs?status=${s}` : "/admin/crawl-jobs"}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              status === s
                ? "bg-gray-900 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {STATUS_LABELS[s]} ({counts[s] || 0})
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left font-medium text-gray-500 w-16">ID</th>
              <th className="p-3 text-left font-medium text-gray-500">Target URL</th>
              <th className="p-3 text-left font-medium text-gray-500">Source</th>
              <th className="p-3 text-left font-medium text-gray-500">Type</th>
              <th className="p-3 text-left font-medium text-gray-500">Status</th>
              <th className="p-3 text-left font-medium text-gray-500">Retries</th>
              <th className="p-3 text-left font-medium text-gray-500">Created</th>
              <th className="p-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="p-3 text-gray-500">{job.id}</td>
                <td className="p-3 max-w-[300px] truncate text-gray-900" title={job.targetUrl}>
                  {job.targetUrl}
                </td>
                <td className="p-3 text-gray-500 text-xs">{job.sourceSite || "—"}</td>
                <td className="p-3 text-gray-500">{job.jobType || "—"}</td>
                <td className="p-3">
                  <JobStatusBadge status={job.status} />
                </td>
                <td className="p-3 text-gray-500">{job.retryCount}</td>
                <td className="p-3 text-gray-500 text-xs">
                  {new Date(job.createdAt).toLocaleString()}
                </td>
                <td className="p-3 text-right">
                  {job.status === "failed" && (
                    <RetryButton jobId={job.id} />
                  )}
                  {job.errorMsg && (
                    <details className="mt-1 text-left">
                      <summary className="cursor-pointer text-xs text-red-500">Error</summary>
                      <p className="mt-1 max-w-xs text-xs text-red-600 whitespace-pre-wrap">
                        {job.errorMsg}
                      </p>
                    </details>
                  )}
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">
                  No crawl jobs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            if (status) params.set("status", status);
            if (p > 1) params.set("page", String(p));
            const qs = params.toString();
            return (
              <Link
                key={p}
                href={`/admin/crawl-jobs${qs ? `?${qs}` : ""}`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  p === page
                    ? "bg-blue-600 text-white"
                    : "bg-white border text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700",
    running: "bg-blue-50 text-blue-700",
    done: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-700",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
