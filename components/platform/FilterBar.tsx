"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  TASK_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  REGION_LABELS,
} from "@/types/platform";
import type { TaskType, PaymentMethod, Region } from "@/types/platform";

const TASK_TYPES = Object.entries(TASK_TYPE_LABELS) as [TaskType, string][];
const PAYMENT_METHODS = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];
const REGIONS = Object.entries(REGION_LABELS) as [Region, string][];

const SORT_OPTIONS = [
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
  { value: "cashout", label: "Lowest Cashout" },
];

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();

  const activeTaskTypes = params.getAll("taskType");
  const activePayments = params.getAll("payment");
  const activeRegions = params.getAll("region");
  const activeSort = params.get("sort") || "rating";

  function toggleParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    const existing = next.getAll(key);
    if (existing.includes(value)) {
      next.delete(key);
      for (const v of existing) {
        if (v !== value) next.append(key, v);
      }
    } else {
      next.append(key, value);
    }
    next.set("page", "1");
    router.push(`/platforms?${next.toString()}`);
  }

  function setSort(value: string) {
    const next = new URLSearchParams(params.toString());
    next.set("sort", value);
    next.set("page", "1");
    router.push(`/platforms?${next.toString()}`);
  }

  function clearAll() {
    router.push("/platforms");
  }

  const hasFilters =
    activeTaskTypes.length > 0 ||
    activePayments.length > 0 ||
    activeRegions.length > 0;

  return (
    <div className="space-y-4">
      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500">Sort:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              activeSort === opt.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Task Type */}
      <div>
        <span className="text-sm font-medium text-gray-500">Task Type:</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {TASK_TYPES.map(([value, label]) => (
            <button
              key={value}
              onClick={() => toggleParam("taskType", value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeTaskTypes.includes(value)
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <span className="text-sm font-medium text-gray-500">Payment:</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {PAYMENT_METHODS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => toggleParam("payment", value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activePayments.includes(value)
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Regions */}
      <div>
        <span className="text-sm font-medium text-gray-500">Region:</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {REGIONS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => toggleParam("region", value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeRegions.includes(value)
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-xs text-red-500 hover:text-red-700 font-medium"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
