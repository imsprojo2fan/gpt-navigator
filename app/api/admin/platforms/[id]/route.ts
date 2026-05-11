import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth check
  const token = request.cookies.get("admin_token")?.value;
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();

    // Update platform fields
    await prisma.platform.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        websiteUrl: body.websiteUrl,
        affiliateUrl: body.affiliateUrl || null,
        logoUrl: body.logoUrl || null,
        minCashout: body.minCashout || null,
        rating: body.rating || null,
        trustpilotScore: body.trustpilotScore || null,
        trustpilotUrl: body.trustpilotUrl || null,
        isVerified: body.isVerified || false,
        status: body.status || "active",
      },
    });

    // Find existing feature or create new one
    const existing = await prisma.platformFeature.findFirst({
      where: { platformId: id },
    });

    if (existing) {
      await prisma.platformFeature.update({
        where: { id: existing.id },
        data: {
          taskTypes: body.taskTypes || [],
          paymentMethods: body.paymentMethods || [],
          regions: body.regions || [],
          hasMobileApp: body.hasMobileApp || false,
          isBeginnerFriendly: body.isBeginnerFriendly ?? true,
        },
      });
    } else {
      await prisma.platformFeature.create({
        data: {
          platformId: id,
          taskTypes: body.taskTypes || [],
          paymentMethods: body.paymentMethods || [],
          regions: body.regions || [],
          hasMobileApp: body.hasMobileApp || false,
          isBeginnerFriendly: body.isBeginnerFriendly ?? true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
