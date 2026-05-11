import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const platform = await prisma.platform.findUnique({
      where: { slug: params.slug },
      include: { features: true },
    });

    if (!platform) {
      return apiError("Platform not found", 404);
    }

    return apiSuccess(platform);
  } catch (error) {
    return apiError("Failed to fetch platform", 500);
  }
}
