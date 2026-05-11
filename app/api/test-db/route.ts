import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await prisma.platform.count();
    return apiSuccess({ db: "ok", count });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return apiError(message, 500);
  }
}
