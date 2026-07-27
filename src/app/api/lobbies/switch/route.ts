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

    const { matchId, team } = await req.json();

    if (!matchId || !team || !["RADIANT", "DIRE"].includes(team)) {
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

    if (player.team === team) {
      return NextResponse.json({ success: true });
    }

    const teamCount = match.players.filter(p => p.team === team).length;
    if (teamCount >= 5) {
      return NextResponse.json({ error: "Энэ баг дүүрсэн байна" }, { status: 400 });
    }

    await prisma.matchPlayer.update({
      where: { id: player.id },
      data: { team }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
