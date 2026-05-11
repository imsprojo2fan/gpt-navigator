import Link from "next/link";

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
          <span className="text-2xl">🧭</span>
          GPT Navigator
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/platforms" className="hover:text-gray-900 transition-colors">
            All Platforms
          </Link>
          <Link href="/compare" className="hover:text-gray-900 transition-colors">
            Compare
          </Link>
        </nav>
      </div>
    </header>
  );
}
