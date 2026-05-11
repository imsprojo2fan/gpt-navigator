import type { Metadata } from "next";
import Link from "next/link";
import { posts } from "@/content/blog/posts";

export const metadata: Metadata = {
  title: "Blog — GPT Navigator",
  description:
    "Guides, reviews, and tips about get-paid-to platforms. Learn how to maximize your earnings with the best GPT sites.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog | GPT Navigator",
    description:
      "Guides, reviews, and tips about get-paid-to platforms. Learn how to maximize your earnings with the best GPT sites.",
    url: "/blog",
  },
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
      <p className="mt-1 text-gray-500">
        Guides, reviews, and tips about get-paid-to platforms.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md hover:border-blue-200"
            >
              <div className="flex flex-wrap gap-1 mb-3">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                {post.description}
              </p>
              <p className="mt-4 text-xs text-gray-400">
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </Link>
          ))}
      </div>
    </div>
  );
}
