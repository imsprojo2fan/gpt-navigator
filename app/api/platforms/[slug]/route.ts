import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api";
import { toPlatform } from "@/types/platform";

export const dynamic = "force-dynamic";

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

    return apiSuccess(toPlatform(platform));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return apiError(message, 500);
  }
}
