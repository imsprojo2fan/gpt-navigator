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

    // Build feature filter (1-to-1 relation, use `is`)
    const featureWhere: Prisma.PlatformFeatureWhereInput = {};
    if (taskTypes.length > 0) featureWhere.taskTypes = { hasSome: taskTypes };
    if (paymentMethods.length > 0) featureWhere.paymentMethods = { hasSome: paymentMethods };
    if (regions.length > 0) featureWhere.regions = { hasSome: regions };
    if (Object.keys(featureWhere).length > 0) {
      where.features = { is: featureWhere };
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
    return apiError(message, 500);
  }
}
