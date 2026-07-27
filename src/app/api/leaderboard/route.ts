export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { mmr: "desc" },
      take: 50,
      select: {
        id: true,
        username: true,
        rank: true,
        position: true,
        mmr: true,
        wins: true,
        losses: true,
        totalEarned: true,
        trustScore: true,
        winStreak: true,
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
