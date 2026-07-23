export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(req: Request) {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can delete lobbies" }, { status: 403 });
    }

    const { matchId } = await req.json();

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true }
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot delete a completed match" }, { status: 400 });
    }

    // Refund players if stake > 0
    if (match.stakeAmount > 0) {
      for (const p of match.players) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: p.userId },
            data: { balance: { increment: match.stakeAmount } }
          }),
          prisma.transaction.create({
            data: {
              userId: p.userId,
              amount: match.stakeAmount,
              type: "REFUND",
              status: "COMPLETED",
              description: `Лобби цуцлагдсан буцаалт: ${match.lobbyName}`
            }
          })
        ]);
      }
    }

    // Mark as CANCELLED or delete it completely. Let's delete it so it disappears.
    // First delete players
    await prisma.matchPlayer.deleteMany({ where: { matchId } });
    await prisma.match.delete({ where: { id: matchId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
