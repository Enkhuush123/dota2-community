import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        rank: true,
        position: true,
        dota2Id: true,
        balance: true,
        role: true,
        trustScore: true,
        _count: {
          select: {
            matches: {
              where: { match: { status: "COMPLETED" } }
            }
          }
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        matches: {
          where: {
            match: {
              status: "COMPLETED"
            }
          },
          orderBy: { joinedAt: "desc" },
          take: 10,
          include: {
            match: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
