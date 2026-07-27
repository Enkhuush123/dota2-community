export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json({ error: "Лобби олдсонгүй" }, { status: 400 });
    }

    const messages = await prisma.lobbyMessage.findMany({
      where: { matchId },
      include: {
        user: { select: { username: true, rank: true } }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
    }

    const { matchId, content } = await req.json();

    if (!matchId || !content || content.trim() === "") {
      return NextResponse.json({ error: "Мэдээлэл дутуу байна" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true }
    });

    if (!match || (match.status !== "PENDING" && match.status !== "LOBBY_CREATED")) {
      return NextResponse.json({ error: "Энэ лоббинд чатлах боломжгүй байна" }, { status: 400 });
    }

    const isPlayer = match.players.some(p => p.userId === session.userId);
    if (!isPlayer) {
      return NextResponse.json({ error: "Та энэ лоббинд ороогүй байна" }, { status: 403 });
    }

    const message = await prisma.lobbyMessage.create({
      data: {
        matchId,
        userId: session.userId,
        content: content.trim()
      },
      include: {
        user: { select: { username: true, rank: true } }
      }
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
