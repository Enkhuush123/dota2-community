export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetId, isPositive } = await req.json();

    if (session.userId === targetId) {
      return NextResponse.json({ error: "You cannot review yourself" }, { status: 400 });
    }

    // Upsert review
    await prisma.userReview.upsert({
      where: {
        reviewerId_targetId: {
          reviewerId: session.userId,
          targetId: targetId
        }
      },
      update: {
        isPositive
      },
      create: {
        reviewerId: session.userId,
        targetId: targetId,
        isPositive
      }
    });

    // Recalculate trust score (simple version: start at 100, +2 for like, -5 for dislike, capped at 0-100)
    // Or just percentage of positive reviews
    const allReviews = await prisma.userReview.findMany({
      where: { targetId }
    });

    const positiveCount = allReviews.filter((r: any) => r.isPositive).length;
    let newScore = 100;
    
    if (allReviews.length > 0) {
      newScore = Math.round((positiveCount / allReviews.length) * 100);
    }

    await prisma.user.update({
      where: { id: targetId },
      data: { trustScore: newScore }
    });

    return NextResponse.json({ success: true, newScore });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
