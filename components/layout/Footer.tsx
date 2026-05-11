import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p> 2026 GPT Navigator. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/platforms" className="hover:text-gray-700">
              Platforms
            </Link>
            <Link href="/compare" className="hover:text-gray-700">
              Compare
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
