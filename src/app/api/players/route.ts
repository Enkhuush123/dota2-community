export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const players = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        rank: true,
        position: true,
        lastSeen: true,
        trustScore: true,
      },
      orderBy: {
        lastSeen: "desc"
      }
    });
    
    // A player is online if they've pinged in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const enhancedPlayers = players.map(p => ({
      ...p,
      isOnline: p.lastSeen > fiveMinutesAgo
    }));

    return NextResponse.json({ players: enhancedPlayers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
