export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
    }

    const { targetId, isPositive } = await req.json();

    if (!targetId || typeof isPositive !== 'boolean') {
      return NextResponse.json({ error: "Мэдээлэл дутуу байна" }, { status: 400 });
    }

    if (session.userId === targetId) {
      return NextResponse.json({ error: "Өөрийгөө үнэлэх боломжгүй" }, { status: 400 });
    }

    // 1. Upsert the review (Create if not exists, Update if exists)
    // We must find the existing review first because Prisma upsert with compound unique constraint 
    // requires the unique identifier.
    const existingReview = await prisma.userReview.findUnique({
      where: {
        reviewerId_targetId: {
          reviewerId: session.userId,
          targetId: targetId
        }
      }
    });

    if (existingReview) {
      await prisma.userReview.update({
        where: { id: existingReview.id },
        data: { isPositive }
      });
    } else {
      await prisma.userReview.create({
        data: {
          reviewerId: session.userId,
          targetId: targetId,
          isPositive
        }
      });
    }

    // 2. Recalculate Trust Score for the target user
    const allReviews = await prisma.userReview.findMany({
      where: { targetId }
    });

    const totalReviews = allReviews.length;
    const positiveReviews = allReviews.filter(r => r.isPositive).length;
    
    // Default trust score is 100 if no reviews, otherwise calculate percentage
    const newTrustScore = totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 100;

    // 3. Update the User's Trust Score
    await prisma.user.update({
      where: { id: targetId },
      data: { trustScore: newTrustScore }
    });

    return NextResponse.json({ success: true, trustScore: newTrustScore });
  } catch (error) {
    console.error("Review API Error:", error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
