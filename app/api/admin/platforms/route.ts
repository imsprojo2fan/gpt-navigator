import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Auth check
  const token = request.cookies.get("admin_token")?.value;
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const platform = await prisma.platform.create({
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
        features: {
          create: {
            taskTypes: body.taskTypes || [],
            paymentMethods: body.paymentMethods || [],
            regions: body.regions || [],
            hasMobileApp: body.hasMobileApp || false,
            isBeginnerFriendly: body.isBeginnerFriendly ?? true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, id: platform.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
