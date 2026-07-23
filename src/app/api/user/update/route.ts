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

    const { rank, position, dota2Id } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        rank,
        position,
        dota2Id
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
