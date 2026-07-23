import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
    }

    const { matchId } = await req.json();

    if (!matchId) {
      return NextResponse.json({ error: "Лобби олдсонгүй" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true }
    });

    if (!match || (match.status !== "PENDING" && match.status !== "LOBBY_CREATED")) {
      return NextResponse.json({ error: "Лобби руу орох боломжгүй байна" }, { status: 400 });
    }

    if (match.players.length >= 10) {
      return NextResponse.json({ error: "Лобби дүүрсэн байна" }, { status: 400 });
    }

    if (match.players.find((p: any) => p.userId === session.userId)) {
      return NextResponse.json({ error: "Та энэ лоббинд орсон байна" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.balance < match.stakeAmount) {
      return NextResponse.json({ error: "Үлдэгдэл хүрэлцэхгүй байна" }, { status: 400 });
    }

    await prisma.matchPlayer.create({
      data: {
        matchId,
        userId: session.userId,
      }
    });

    if (match.stakeAmount > 0) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.userId },
          data: { balance: { decrement: match.stakeAmount } }
        }),
        prisma.transaction.create({
          data: {
            userId: session.userId,
            amount: match.stakeAmount,
            type: "BET_DEDUCT",
            status: "COMPLETED",
            description: `Лоббид нэгдсэн: ${match.lobbyName}`
          }
        })
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
