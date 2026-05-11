"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryButton({ jobId }: { jobId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function retry() {
    setLoading(true);
    await fetch(`/api/admin/crawl-jobs/${jobId}/retry`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={retry}
      disabled={loading}
      className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
    >
      {loading ? "..." : "Retry"}
    </button>
  );
}
