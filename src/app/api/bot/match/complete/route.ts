export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const K_FACTOR = 32;

function calculateElo(playerMMR: number, opponentMMR: number, isWinner: boolean) {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentMMR - playerMMR) / 400));
  const actualScore = isWinner ? 1 : 0;
  return Math.round(playerMMR + K_FACTOR * (actualScore - expectedScore));
}

export async function POST(req: Request) {
  try {
    const { matchId, winnerTeam, dota2MatchId, secretKey } = await req.json();

    // Verify secret key to ensure only our bot can call this
    const BOT_SECRET = process.env.BOT_SECRET_KEY || "fallback_secret_key_123";
    if (secretKey !== BOT_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!matchId || !winnerTeam) {
      return NextResponse.json({ error: "Missing matchId or winnerTeam" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: { include: { user: true } } }
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status === "COMPLETED") {
      return NextResponse.json({ error: "Match already completed" }, { status: 400 });
    }

    // Calculate average MMR for both teams to compute Elo
    const radiantPlayers = match.players.filter(p => p.team === "RADIANT");
    const direPlayers = match.players.filter(p => p.team === "DIRE");

    const radiantAvgMMR = radiantPlayers.length > 0 ? 
      radiantPlayers.reduce((sum, p) => sum + (p.user.mmr || 1000), 0) / radiantPlayers.length : 1000;
      
    const direAvgMMR = direPlayers.length > 0 ? 
      direPlayers.reduce((sum, p) => sum + (p.user.mmr || 1000), 0) / direPlayers.length : 1000;

    // Start a transaction to update all users and the match
    await prisma.$transaction(async (tx) => {
      // 1. Update Match Status
      await tx.match.update({
        where: { id: matchId },
        data: { 
          status: "COMPLETED",
          winnerTeam: winnerTeam,
          dota2MatchId: dota2MatchId || null
        }
      });

      // 2. Process each player
      for (const player of match.players) {
        const isWinner = player.team === winnerTeam;
        const opponentAvgMMR = player.team === "RADIANT" ? direAvgMMR : radiantAvgMMR;
        const newMMR = calculateElo(player.user.mmr || 1000, opponentAvgMMR, isWinner);
        const mmrDiff = newMMR - (player.user.mmr || 1000);

        if (isWinner) {
          // Calculate winnings (stake * 1.9 to account for 5% platform fee)
          const winnings = match.stakeAmount > 0 ? match.stakeAmount * 1.9 : 0;
          
          await tx.user.update({
            where: { id: player.userId },
            data: {
              mmr: newMMR,
              wins: { increment: 1 },
              winStreak: { increment: 1 },
              totalEarned: { increment: match.stakeAmount > 0 ? match.stakeAmount * 0.9 : 0 },
              balance: { increment: winnings }
            }
          });

          if (winnings > 0) {
            await tx.transaction.create({
              data: {
                userId: player.userId,
                amount: winnings,
                type: "BET_WIN",
                status: "COMPLETED",
                description: `Тоглолтод хожсон: ${match.lobbyName} (+${mmrDiff} MMR)`
              }
            });
          }
        } else {
          // Loser (stake already deducted on join, so just update stats)
          await tx.user.update({
            where: { id: player.userId },
            data: {
              mmr: newMMR,
              losses: { increment: 1 },
              winStreak: 0
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true, message: "Match completed and MMR updated" });
  } catch (error) {
    console.error("Complete Match API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
