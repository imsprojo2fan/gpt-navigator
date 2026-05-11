import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const timings: Record<string, number> = {};

  try {
    // Measure PrismaClient creation
    const t0 = performance.now();
    const prisma = new PrismaClient();
    timings.prisma_init = +(performance.now() - t0).toFixed(1);

    // Measure first query (includes connection)
    const t1 = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    timings.first_query = +(performance.now() - t1).toFixed(1);

    // Measure actual data query
    const t2 = performance.now();
    const count = await prisma.platform.count();
    timings.count_query = +(performance.now() - t2).toFixed(1);

    return NextResponse.json({ ok: true, timings, count });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
