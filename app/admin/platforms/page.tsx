import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function AdminPlatformsPage({ searchParams }: Props) {
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined;
  const page = Math.max(1, parseInt(
    (typeof searchParams.page === "string" ? searchParams.page : "1"), 10
  ));
  const limit = 20;

  const where = status ? { status } : {};

  const [platforms, total] = await Promise.all([
    prisma.platform.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        rating: true,
        affiliateUrl: true,
        updatedAt: true,
      },
    }),
    prisma.platform.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const statusTabs = [
    { label: "All", href: "/admin/platforms", active: !status },
    { label: "Active", href: "/admin/platforms?status=active", active: status === "active" },
    { label: "Pending", href: "/admin/platforms?status=pending", active: status === "pending" },
    { label: "Inactive", href: "/admin/platforms?status=inactive", active: status === "inactive" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Platforms</h1>
        <Link
          href="/admin/platforms/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          + Add Platform
        </Link>
      </div>

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-sm text-blue-800">
        管理所有平台列表。点击「Edit」可修改平台信息、Affiliate 链接、评分等。<strong>绿色 Active = 前台可见，黄色 Pending = 待审核不可见。</strong>
      </div>

      {/* Status Tabs */}
      <div className="mt-4 flex gap-1">
        {statusTabs.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              t.active
                ? "bg-gray-900 text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left font-medium text-gray-500">Name</th>
              <th className="p-3 text-left font-medium text-gray-500">Slug</th>
              <th className="p-3 text-left font-medium text-gray-500">Status</th>
              <th className="p-3 text-left font-medium text-gray-500">Rating</th>
              <th className="p-3 text-left font-medium text-gray-500">Affiliate</th>
              <th className="p-3 text-left font-medium text-gray-500">Updated</th>
              <th className="p-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {platforms.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-900">{p.name}</td>
                <td className="p-3 text-gray-500">{p.slug}</td>
                <td className="p-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="p-3">
                  {p.rating != null ? Number(p.rating).toFixed(1) : "—"}
                </td>
                <td className="p-3">
                  {p.affiliateUrl ? (
                    <span className="text-green-600 text-xs">✓ Set</span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="p-3 text-gray-500 text-xs">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/admin/platforms/${p.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {platforms.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">
                  No platforms found.
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
                href={`/admin/platforms${qs ? `?${qs}` : ""}`}
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    inactive: "bg-red-50 text-red-700",
    pending: "bg-yellow-50 text-yellow-700",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
