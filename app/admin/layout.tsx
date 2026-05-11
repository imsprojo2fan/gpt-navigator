import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — GPT Navigator",
  robots: "noindex, nofollow",
};

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/platforms", label: "Platforms" },
  { href: "/admin/crawl-jobs", label: "Crawl Jobs" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r bg-white">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/admin" className="text-sm font-bold text-gray-900">
            GPT Navigator Admin
          </Link>
        </div>
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
            >
              {item.label}
            </Link>
          ))}
          <hr className="my-2" />
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition"
            target="_blank"
          >
            View Site →
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden p-6">
        {children}
      </main>
    </div>
  );
}
