import Link from "next/link";
import type { Platform, PlatformFeature } from "@/types/platform";
import { TASK_TYPE_LABELS } from "@/types/platform";

type Props = {
  platform: Platform & { features: PlatformFeature[] };
};

export function PlatformCard({ platform }: Props) {
  const features = platform.features[0];

  return (
    <Link
      href={`/platforms/${platform.slug}`}
      className="group block rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-200"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xl font-bold text-blue-600">
          {platform.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {platform.name}
          </h3>

          {platform.rating != null && (
            <div className="mt-1 flex items-center gap-1 text-sm">
              <span className="text-yellow-500">★</span>
              <span className="font-medium text-gray-700">{platform.rating.toFixed(1)}</span>
            </div>
          )}

          {platform.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {platform.description}
            </p>
          )}

          {features && (
            <div className="mt-3 flex flex-wrap gap-1">
              {features.taskTypes.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {TASK_TYPE_LABELS[t] || t}
                </span>
              ))}
              {features.taskTypes.length > 3 && (
                <span className="text-xs text-gray-400">+{features.taskTypes.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {platform.minCashout && (
          <div className="shrink-0 text-right text-xs text-gray-400">
            <div>Min cashout</div>
            <div className="font-medium text-gray-600">{platform.minCashout}</div>
          </div>
        )}
      </div>
    </Link>
  );
}
