import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api";
import { toPlatform } from "@/types/platform";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const taskTypes = searchParams.getAll("taskType");
    const paymentMethods = searchParams.getAll("payment");
    const regions = searchParams.getAll("region");
    const sort = searchParams.get("sort") || "rating";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const where: Prisma.PlatformWhereInput = { status: "active" };

    if (taskTypes.length > 0) {
      where.features = {
        ...(where.features as Prisma.PlatformFeatureListRelationFilter || {}),
        some: { taskTypes: { hasSome: taskTypes } },
      };
    }

    if (paymentMethods.length > 0) {
      where.features = {
        ...(where.features as Prisma.PlatformFeatureListRelationFilter || {}),
        some: { paymentMethods: { hasSome: paymentMethods } },
      };
    }

    if (regions.length > 0) {
      where.features = {
        ...(where.features as Prisma.PlatformFeatureListRelationFilter || {}),
        some: { regions: { hasSome: regions } },
      };
    }

    let orderBy: Prisma.PlatformOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (sort === "cashout") {
      orderBy = { minCashout: "asc" };
    }

    const [platforms, total] = await Promise.all([
      prisma.platform.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { features: true },
      }),
      prisma.platform.count({ where }),
    ]);

    return apiSuccess({
      platforms: platforms.map(toPlatform),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("platforms API error:", message);
    return apiError("Failed to fetch platforms", 500);
  }
}
