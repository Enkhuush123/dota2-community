export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        lastSeen: {
          gte: fiveMinsAgo
        }
      },
      select: {
        id: true,
        username: true,
        rank: true,
        position: true,
        trustScore: true,
        mmr: true,
        winStreak: true,
        lastSeen: true,
      },
      orderBy: {
        lastSeen: "desc"
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
