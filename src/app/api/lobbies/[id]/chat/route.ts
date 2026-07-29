import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET messages for a lobby
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Fetch last 50 messages
    const messages = await prisma.lobbyMessage.findMany({
      where: { matchId: id },
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: {
        user: {
          select: { username: true, rank: true, mmr: true }
        }
      }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}

// POST a new message to a lobby
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Нэвтэрсэн байх шаардлагатай" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    
    if (!body.content || typeof body.content !== "string" || body.content.trim().length === 0) {
      return NextResponse.json({ error: "Хоосон мессеж" }, { status: 400 });
    }

    // Verify user is part of the lobby?
    // Actually, maybe we allow anyone to chat if they are viewing the live match? Or only players?
    // Let's allow everyone who is logged in to chat for hype.

    const message = await prisma.lobbyMessage.create({
      data: {
        matchId: id,
        userId: session.userId,
        content: body.content.trim().substring(0, 500) // Max 500 chars
      },
      include: {
        user: {
          select: { username: true, rank: true, mmr: true }
        }
      }
    });

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: "Алдаа гарлаа" }, { status: 500 });
  }
}
