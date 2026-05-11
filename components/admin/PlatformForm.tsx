"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlatformWithFeatures } from "@/types/platform";
import {
  TASK_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  REGION_LABELS,
} from "@/types/platform";
import type { TaskType, PaymentMethod, Region } from "@/types/platform";

const ALL_TASK_TYPES = Object.entries(TASK_TYPE_LABELS) as [TaskType, string][];
const ALL_PAYMENTS = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];
const ALL_REGIONS = Object.entries(REGION_LABELS) as [Region, string][];

type FormData = {
  name: string;
  slug: string;
  description: string;
  websiteUrl: string;
  affiliateUrl: string;
  logoUrl: string;
  minCashout: string;
  rating: string;
  trustpilotScore: string;
  trustpilotUrl: string;
  taskTypes: TaskType[];
  paymentMethods: PaymentMethod[];
  regions: Region[];
  hasMobileApp: boolean;
  isBeginnerFriendly: boolean;
  isVerified: boolean;
  status: string;
};

type Props = {
  platform?: PlatformWithFeatures;
};

export function PlatformForm({ platform }: Props) {
  const router = useRouter();
  const isEdit = !!platform;
  const features = platform?.features[0];

  const [form, setForm] = useState<FormData>({
    name: platform?.name || "",
    slug: platform?.slug || "",
    description: platform?.description || "",
    websiteUrl: platform?.websiteUrl || "",
    affiliateUrl: platform?.affiliateUrl || "",
    logoUrl: platform?.logoUrl || "",
    minCashout: platform?.minCashout || "",
    rating: platform?.rating?.toFixed(1) || "",
    trustpilotScore: platform?.trustpilotScore?.toFixed(1) || "",
    trustpilotUrl: platform?.trustpilotUrl || "",
    taskTypes: (features?.taskTypes as TaskType[]) || [],
    paymentMethods: (features?.paymentMethods as PaymentMethod[]) || [],
    regions: (features?.regions as Region[]) || [],
    hasMobileApp: features?.hasMobileApp || false,
    isBeginnerFriendly: features?.isBeginnerFriendly ?? true,
    isVerified: platform?.isVerified || false,
    status: platform?.status || "active",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArray<T>(key: keyof FormData, value: T) {
    const arr = form[key] as T[];
    set(key, (arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value]) as FormData[typeof key]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      rating: form.rating ? parseFloat(form.rating) : null,
      trustpilotScore: form.trustpilotScore ? parseFloat(form.trustpilotScore) : null,
    };

    try {
      const url = isEdit
        ? `/api/admin/platforms/${platform.id}`
        : "/api/admin/platforms";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin/platforms");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Network error");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Basic Info */}
      <fieldset className="rounded-xl border bg-white p-5">
        <legend className="text-sm font-semibold text-gray-900">Basic Info</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(v) => set("name", v)} required />
          <Input label="Slug" value={form.slug} onChange={(v) => set("slug", v)} required />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <Input label="Website URL" value={form.websiteUrl} onChange={(v) => set("websiteUrl", v)} required />
          <Input label="Affiliate URL" value={form.affiliateUrl} onChange={(v) => set("affiliateUrl", v)} />
          <Input label="Logo URL" value={form.logoUrl} onChange={(v) => set("logoUrl", v)} />
          <Input label="Min Cashout" value={form.minCashout} onChange={(v) => set("minCashout", v)} placeholder="$1.00" />
          <Input label="Rating (0-5)" value={form.rating} onChange={(v) => set("rating", v)} type="number" min="0" max="5" step="0.1" />
          <Input label="Trustpilot Score" value={form.trustpilotScore} onChange={(v) => set("trustpilotScore", v)} type="number" min="0" max="5" step="0.1" />
          <Input label="Trustpilot URL" value={form.trustpilotUrl} onChange={(v) => set("trustpilotUrl", v)} />
        </div>
      </fieldset>

      {/* Task Types */}
      <fieldset className="rounded-xl border bg-white p-5">
        <legend className="text-sm font-semibold text-gray-900">Task Types</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_TASK_TYPES.map(([value, label]) => (
            <Toggle key={value} label={label} active={form.taskTypes.includes(value)} onClick={() => toggleArray("taskTypes", value)} />
          ))}
        </div>
      </fieldset>

      {/* Payment Methods */}
      <fieldset className="rounded-xl border bg-white p-5">
        <legend className="text-sm font-semibold text-gray-900">Payment Methods</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_PAYMENTS.map(([value, label]) => (
            <Toggle key={value} label={label} active={form.paymentMethods.includes(value)} onClick={() => toggleArray("paymentMethods", value)} />
          ))}
        </div>
      </fieldset>

      {/* Regions */}
      <fieldset className="rounded-xl border bg-white p-5">
        <legend className="text-sm font-semibold text-gray-900">Regions</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_REGIONS.map(([value, label]) => (
            <Toggle key={value} label={label} active={form.regions.includes(value)} onClick={() => toggleArray("regions", value)} />
          ))}
        </div>
      </fieldset>

      {/* Flags */}
      <fieldset className="rounded-xl border bg-white p-5">
        <legend className="text-sm font-semibold text-gray-900">Flags</legend>
        <div className="mt-3 space-y-3">
          <Checkbox label="Has Mobile App" checked={form.hasMobileApp} onChange={(v) => set("hasMobileApp", v)} />
          <Checkbox label="Beginner Friendly" checked={form.isBeginnerFriendly} onChange={(v) => set("isBeginnerFriendly", v)} />
          <Checkbox label="Verified" checked={form.isVerified} onChange={(v) => set("isVerified", v)} />
        </div>
      </fieldset>

      {/* Status */}
      <fieldset className="rounded-xl border bg-white p-5">
        <legend className="text-sm font-semibold text-gray-900">Status</legend>
        <div className="mt-3 flex gap-3">
          {["active", "pending", "inactive"].map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="status"
                value={s}
                checked={form.status === s}
                onChange={() => set("status", s)}
              />
              <span className="capitalize">{s}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? "Saving..." : isEdit ? "Update Platform" : "Create Platform"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Input({
  label, value, onChange, required, type = "text", placeholder, min, max, step,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; placeholder?: string;
  min?: string; max?: string; step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}

function Toggle({
  label, active, onClick,
}: {
  label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

function Checkbox({
  label, checked, onChange,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded"
      />
      {label}
    </label>
  );
}
