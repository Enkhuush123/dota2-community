export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ invites: [] });
    }

    // Get pending invites for the current user
    const invites = await prisma.lobbyInvite.findMany({
      where: {
        receiverId: session.userId,
        status: "PENDING"
      },
      include: {
        sender: { select: { username: true } },
        match: { select: { id: true, lobbyName: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Invites GET error:", error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
    }

    const { receiverId, matchId } = await req.json();

    if (!receiverId || !matchId) {
      return NextResponse.json({ error: "Мэдээлэл дутуу байна" }, { status: 400 });
    }

    // Prevent duplicate invites
    const existing = await prisma.lobbyInvite.findFirst({
      where: {
        senderId: session.userId,
        receiverId,
        matchId,
        status: "PENDING"
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Та энэ хүн рүү аль хэдийн урилга явуулсан байна" }, { status: 400 });
    }

    const invite = await prisma.lobbyInvite.create({
      data: {
        senderId: session.userId,
        receiverId,
        matchId,
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, invite });
  } catch (error) {
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
    }

    const { inviteId, action } = await req.json(); // action: ACCEPT or DECLINE

    if (!inviteId) {
      return NextResponse.json({ error: "Урилгын ID байхгүй байна" }, { status: 400 });
    }

    const invite = await prisma.lobbyInvite.findUnique({
      where: { id: inviteId }
    });

    if (!invite || invite.receiverId !== session.userId) {
      return NextResponse.json({ error: "Урилга олдсонгүй эсвэл эрхгүй байна" }, { status: 403 });
    }

    await prisma.lobbyInvite.update({
      where: { id: inviteId },
      data: { status: action === "ACCEPT" ? "ACCEPTED" : "DECLINED" }
    });

    return NextResponse.json({ success: true, matchId: invite.matchId });
  } catch (error) {
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
