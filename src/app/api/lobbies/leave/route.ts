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

    const { matchId } = await req.json();

    if (!matchId) {
      return NextResponse.json({ error: "Буруу мэдээлэл" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true }
    });

    if (!match || (match.status !== "PENDING" && match.status !== "LOBBY_CREATED")) {
      return NextResponse.json({ error: "Лобби руу хандах боломжгүй байна" }, { status: 400 });
    }

    const player = match.players.find(p => p.userId === session.userId);
    if (!player) {
      return NextResponse.json({ error: "Та энэ лоббинд ороогүй байна" }, { status: 400 });
    }

    const transactions: any[] = [];

    // Мөнгө буцаах
    if (match.stakeAmount > 0) {
      transactions.push(
        prisma.user.update({
          where: { id: session.userId },
          data: { balance: { increment: match.stakeAmount } }
        })
      );
      transactions.push(
        prisma.transaction.create({
          data: {
            userId: session.userId,
            amount: match.stakeAmount,
            type: "BET_REFUND",
            status: "COMPLETED",
            description: `Лоббиноос гарсан (Буцаалт): ${match.lobbyName}`
          }
        })
      );
    }

    transactions.push(
      prisma.matchPlayer.delete({
        where: { id: player.id }
      })
    );

    // Хэрвээ хамгийн сүүлийн хүн байсан бол лоббиг устгана
    if (match.players.length === 1) {
      transactions.push(
        prisma.match.delete({
          where: { id: match.id }
        })
      );
    }

    await prisma.$transaction(transactions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
