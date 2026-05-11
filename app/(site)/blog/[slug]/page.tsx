import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/content/blog/posts";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";

type Props = {
  params: { slug: string };
};

export function generateMetadata({ params }: Props): Metadata {
  const post = getPost(params.slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gpt-navigator.com";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <BreadcrumbSchema
        crumbs={[
          { name: "Home", url: baseUrl },
          { name: "Blog", url: `${baseUrl}/blog` },
          { name: post.title, url: `${baseUrl}/blog/${post.slug}` },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-gray-700">Blog</Link>
      </nav>

      {/* Header */}
      <div className="mb-8">
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
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          {post.title}
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Published on{" "}
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Content */}
      <article
        className="prose prose-blue max-w-none
          prose-headings:text-gray-900 prose-headings:font-semibold
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-gray-700 prose-p:leading-relaxed
          prose-li:text-gray-700
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-900"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* CTA */}
      <div className="mt-12 rounded-xl border bg-blue-50 p-6 text-center">
        <p className="text-lg font-semibold text-blue-900">
          Ready to start earning?
        </p>
        <p className="mt-1 text-sm text-blue-700">
          Browse our curated list of the best GPT platforms.
        </p>
        <Link
          href="/platforms"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Browse Platforms →
        </Link>
      </div>
    </div>
  );
}
