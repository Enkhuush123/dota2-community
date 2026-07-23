import * as dotenv from 'dotenv';
dotenv.config();

// @ts-expect-error no types available
import SteamUser from 'steam-user';
// @ts-expect-error no types available
import Dota2 from 'dota2';
import { prisma } from '../lib/prisma'; // Assumes running from src/bot using tsx

const STEAM_USERNAME = process.env.STEAM_USERNAME;
const STEAM_PASSWORD = process.env.STEAM_PASSWORD;

if (!STEAM_USERNAME || !STEAM_PASSWORD) {
  console.error("Steam credentials missing in .env (STEAM_USERNAME, STEAM_PASSWORD)");
  process.exit(1);
}

const client = new SteamUser();
const dota2 = new Dota2.Dota2Client(client, true, true);

let isGcReady = false;

// 1. Log into Steam
client.logOn({
  accountName: STEAM_USERNAME,
  password: STEAM_PASSWORD,
});

client.on('loggedOn', () => {
  console.log(`[Steam] Logged into Steam as ${client.steamID?.getSteam3RenderedID()}`);
  client.setPersona(SteamUser.EPersonaState.Online);
  // Start Dota 2
  client.gamesPlayed([570]);
});

client.on('error', (err: any) => {
  console.error('[Steam] Error:', err);
});

// 2. Connect to GC
dota2.on('ready', () => {
  console.log('[Dota 2] Connected to Game Coordinator (GC)');
  isGcReady = true;
});

dota2.on('unready', () => {
  console.log('[Dota 2] Disconnected from GC');
  isGcReady = false;
});

// 3. Polling DB for Lobbies
setInterval(async () => {
  if (!isGcReady) return;

  try {
    // Find a pending lobby that hasn't been created in GC yet
    // To keep it simple, we'll mark them as "CREATED_IN_GC" once created
    // But our schema has "PENDING", "ONGOING", "COMPLETED", "CANCELLED".
    // We can use a combination or add a boolean, but let's just use "ONGOING" when the bot creates it.
    
    const pendingMatches = await prisma.match.findMany({
      where: { status: "PENDING" },
      include: { players: true }
    });

    for (const match of pendingMatches) {
      // Create the lobby if it has enough players or just create immediately upon request
      // We will create the lobby immediately so players can see it in game.
      // To avoid creating it multiple times, we'll change status to "LOBBY_CREATED".
      
      console.log(`[Bot] Found pending match to create: ${match.lobbyName}`);
      
      const options = {
        game_name: match.lobbyName,
        pass_key: match.lobbyPassword,
        server_region: 3, // SE Asia (or whatever is closest for Mongolia)
        game_mode: 1, // All Pick
        allow_cheats: false,
        fill_with_bots: false,
        allow_spectating: true,
        penalty_level: 0,
        visibility: 0 // 0 = Public, 1 = Friends, 2 = Unlisted
      };

      dota2.createPracticeLobby(options, async (err: any, response: any) => {
        if (err) {
          console.error(`[Bot] Failed to create lobby ${match.lobbyName}:`, err);
        } else {
          console.log(`[Bot] Successfully created lobby: ${match.lobbyName}`);
          // Update status so we don't recreate it
          await prisma.match.update({
            where: { id: match.id },
            data: { status: "LOBBY_CREATED" } // We add this new status in our logic
          });
        }
      });
    }

  } catch (error) {
    console.error("[Bot] Polling error:", error);
  }
}, 10000); // Check every 10 seconds

// Handlers for GC messages
dota2.on('practiceLobbyUpdate', async (lobby: any) => {
  if (!lobby || !lobby.game_name) return;

  try {
    const match = await prisma.match.findFirst({
      where: { lobbyName: lobby.game_name, status: "LOBBY_CREATED" },
      include: { players: { include: { user: true } } }
    });

    if (!match) return;

    // Check if match outcome is decided (2 = Radiant Victory, 3 = Dire Victory)
    const matchOutcome = lobby.match_outcome;
    if (matchOutcome === 2 || matchOutcome === 3) {
      console.log(`[Bot] Match ${match.lobbyName} finished! Outcome: ${matchOutcome}`);
      
      const winnerTeam = matchOutcome === 2 ? "RADIANT" : "DIRE";

      // Mark who was on which team based on lobby.members
      const members = lobby.members || [];
      const teamMap = new Map<string, string>(); // account_id -> RADIANT/DIRE
      for (const member of members) {
        if (member.team === 0) teamMap.set(member.account_id.toString(), "RADIANT");
        if (member.team === 1) teamMap.set(member.account_id.toString(), "DIRE");
      }

      // Update match status and winner
      await prisma.match.update({
        where: { id: match.id },
        data: { status: "COMPLETED", winnerTeam }
      });

      // Distribute winnings
      const totalPot = match.stakeAmount * match.players.length;
      const fee = totalPot * 0.10; // 10% platform fee
      const distributablePot = totalPot - fee;

      const winningPlayers: any[] = [];
      const allPlayers = match.players;

      // Update MatchPlayer teams in DB and determine winners
      for (const p of allPlayers) {
        const dota2Id = p.user.dota2Id;
        const playerTeam = dota2Id ? teamMap.get(dota2Id) : undefined;
        
        if (playerTeam) {
          await prisma.matchPlayer.update({
            where: { id: p.id },
            data: { team: playerTeam }
          });
          
          if (playerTeam === winnerTeam) {
            winningPlayers.push(p);
          }
        }
      }

      if (winningPlayers.length > 0 && distributablePot > 0) {
        const rewardPerPlayer = distributablePot / winningPlayers.length;

        for (const p of winningPlayers) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: p.userId },
              data: { balance: { increment: rewardPerPlayer } }
            }),
            prisma.transaction.create({
              data: {
                userId: p.userId,
                amount: rewardPerPlayer,
                type: "BET_WIN",
                status: "COMPLETED",
                description: `Лобби хожил: ${match.lobbyName}`
              }
            })
          ]);
        }
        console.log(`[Bot] Distributed ₮${rewardPerPlayer} to ${winningPlayers.length} winners.`);
      }

      // Destroy lobby
      dota2.destroyLobby(() => console.log(`[Bot] Destroyed lobby ${match.lobbyName}`));
    }
  } catch (error) {
    console.error("[Bot] Error processing lobby update:", error);
  }
});
