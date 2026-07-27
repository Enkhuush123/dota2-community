export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rank, position, dota2Id, username } = await req.json();

    if (username && (username.trim().length < 3 || username.trim().length > 20)) {
      return NextResponse.json({ error: "Нэр 3-аас 20 тэмдэгттэй байх ёстой" }, { status: 400 });
    }

    if (username) {
      const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
      if (existing && existing.id !== session.userId) {
        return NextResponse.json({ error: "Энэ нэр бүртгэлтэй байна" }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        rank,
        position,
        dota2Id,
        ...(username ? { username: username.trim() } : {})
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
