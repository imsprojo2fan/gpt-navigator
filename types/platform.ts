import type { Prisma } from "@prisma/client";

export type PlatformStatus = "active" | "inactive" | "pending";

export type TaskType =
  | "survey"
  | "games"
  | "app"
  | "video"
  | "referral"
  | "shopping"
  | "cashback"
  | "offer";

export type PaymentMethod =
  | "paypal"
  | "crypto"
  | "giftcard"
  | "bank"
  | "venmo"
  | "skrill"
  | "payoneer";

export type Region = "US" | "UK" | "CA" | "AU" | "Global" | "EU";

export interface Platform {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string;
  affiliateUrl: string | null;
  minCashout: string | null;
  rating: number | null;
  trustpilotScore: number | null;
  trustpilotUrl: string | null;
  isVerified: boolean;
  status: PlatformStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformFeature {
  id: number;
  platformId: number;
  taskTypes: TaskType[];
  paymentMethods: PaymentMethod[];
  regions: Region[];
  hasMobileApp: boolean;
  isBeginnerFriendly: boolean;
}

export interface PlatformWithFeatures extends Platform {
  features: PlatformFeature[];
}

export interface PlatformListParams {
  taskTypes?: TaskType[];
  paymentMethods?: PaymentMethod[];
  regions?: Region[];
  minCashout?: number;
  sort?: "rating" | "newest" | "cashout";
  page?: number;
  limit?: number;
}

/** Convert Prisma Decimal fields to number for component consumption. */
export function toPlatform(
  p: Prisma.PlatformGetPayload<{ include: { features: true } }>
): PlatformWithFeatures {
  return {
    ...p,
    status: p.status as PlatformStatus,
    rating: p.rating ? Number(p.rating) : null,
    trustpilotScore: p.trustpilotScore ? Number(p.trustpilotScore) : null,
    features: p.features.map((f) => ({
      ...f,
      taskTypes: f.taskTypes as TaskType[],
      paymentMethods: f.paymentMethods as PaymentMethod[],
      regions: f.regions as Region[],
    })),
  };
}

export interface PlatformListParams {
  taskTypes?: TaskType[];
  paymentMethods?: PaymentMethod[];
  regions?: Region[];
  minCashout?: number;
  sort?: "rating" | "newest" | "cashout";
  page?: number;
  limit?: number;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  survey: "Surveys",
  games: "Games",
  app: "Apps",
  video: "Videos",
  referral: "Referrals",
  shopping: "Shopping",
  cashback: "Cashback",
  offer: "Offers",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  paypal: "PayPal",
  crypto: "Crypto",
  giftcard: "Gift Cards",
  bank: "Bank Transfer",
  venmo: "Venmo",
  skrill: "Skrill",
  payoneer: "Payoneer",
};

export const REGION_LABELS: Record<Region, string> = {
  US: "United States",
  UK: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  Global: "Global",
  EU: "Europe",
};
