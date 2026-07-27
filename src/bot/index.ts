import 'dotenv/config';
import { fetchSteamGuardCode } from './imapHelper';

// @ts-expect-error no types available
import SteamUser from 'steam-user';
// @ts-expect-error no types available
import Dota2 from 'dota2';
import { Dota2User } from 'dota2-user';
import { prisma } from '../lib/prisma';

// Patch node-dota2 to support visibility, since it's missing in their hardcoded schema
if (Dota2._lobbyOptions) {
  Dota2._lobbyOptions.visibility = "number";
}
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';

// Ensure data directory exists
const steamDataPath = path.join(process.cwd(), 'steam_data');
if (!fs.existsSync(steamDataPath)) {
  fs.mkdirSync(steamDataPath);
}

const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Dota 2 Bots are running!\n');
});

server.on('error', (e: any) => {
  if (e.code === 'EADDRINUSE') {
    console.warn(`[HTTP] Port ${PORT} is in use, skipping dummy server...`);
  } else {
    console.error(`[HTTP] Error:`, e);
  }
});

server.listen(PORT, () => {
  console.log(`[HTTP] Dummy server listening on port ${PORT}`);
});

// 2. Parse STEAM_ACCOUNTS from .env
const steamAccountsStr = process.env.STEAM_ACCOUNTS;
let accounts: any[] = [];
if (steamAccountsStr) {
  try {
    accounts = JSON.parse(steamAccountsStr);
  } catch {
    console.error("[Bot] Failed to parse STEAM_ACCOUNTS JSON.");
  }
}

// Fallback for single account from old .env format if STEAM_ACCOUNTS is not present
if (accounts.length === 0 && process.env.STEAM_USERNAME && process.env.STEAM_PASSWORD) {
  accounts.push({
    username: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    guardCode: process.env.STEAM_GUARD_CODE
  });
}

if (accounts.length === 0) {
  console.error("[Bot] No Steam accounts provided. Please set STEAM_ACCOUNTS in .env");
  process.exit(1);
}

console.log(`[Bot] Initializing ${accounts.length} bots...`);

// 3. Define Bot class to encapsulate each bot's state
class DotaBot {
  public client: any;
  public dota2: any;
  public dota2User: any;
  public isGcReady: boolean = false;
  public steamId: string | null = null;
  public username: string;
  private password: string;
  private guardCode: string | undefined;

  constructor(account: any) {
    this.username = account.username;
    this.password = account.password;
    this.guardCode = account.guardCode || account.guard_code;

    this.client = new SteamUser({ 
      dataDirectory: path.join(steamDataPath, this.username)
    });

    // MOCK 1: Route outgoing legacy GC messages
    // We MUST ignore message 84 (ClientGamesPlayed) because steam-user v4 uses 5404
    this.client.send = (header: any, body: any, callback: any) => {
      if (header && (header.msg === 84 || header === 84)) return; // Ignore legacy 84
      if (this.client._send) {
        this.client._send(header, body, callback);
      }
    };

    this.dota2 = new Dota2.Dota2Client(this.client, true, true);
    this.dota2User = new Dota2User(this.client);

    // MOCK 2: Route incoming GC messages
    // In steam-user v4, the 'message' event emits a raw Buffer, so dota2's SteamGameCoordinator
    // drops it (body.appid is undefined). We use receivedFromGC to manually inject the messages.
    this.client.on('receivedFromGC', (appid: number, msgType: number, payload: Buffer, callback: any) => {
      if (appid === 570 && this.dota2._gc) {
        // console.log(`[Dota2-${this.username}] <- Received GC msg ${msgType}`);
        try {
          this.dota2._gc.emit('message', { msg: msgType, proto: {} }, payload, callback);
        } catch (err) {
          console.error(`[Dota2-${this.username}] Error processing GC message ${msgType}:`, err);
        }
      }
    });

    // MOCK 3: Intercept _gc.send directly to bypass node-steam CMsgGCClient wrapper
    this.dota2._gc.send = (header: any, body: Buffer, callback: any) => {
      // Fix steam-user v4 callback signature mismatch
      const wrappedCallback = callback ? (appid: number, msgType: number, payload: Buffer) => {
        callback({ msg: msgType }, payload);
      } : undefined;
      this.client.sendToGC(570, header.msg, {}, body, wrappedCallback);
    };

    this.setupListeners();
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      let isDone = false;
      const done = () => {
        if (!isDone) {
          isDone = true;
          resolve();
        }
      };
      this.dota2.once('ready', done);
      this.client.once('error', done);
      // Wait up to 2 minutes max per bot so we don't get stuck forever
      setTimeout(done, 120000); 
      this.login();
    });
  }

  private login() {
    this.client.logOn({
      accountName: this.username,
      password: this.password,
    });
  }

  private setupListeners() {
    this.client.on('loggedOn', () => {
      this.steamId = this.client.steamID?.getSteam3RenderedID();
      console.log(`[Steam-${this.username}] Logged in as ${this.steamId}`);
      this.client.setPersona(SteamUser.EPersonaState.Online, "MNG_BOT_" + this.username);
      
      // Request free license for Dota 2 in case the account is brand new
      this.client.requestFreeLicense([570], (err, grantedApps, grantedPackages) => {
        if (err) {
          console.log(`[Steam-${this.username}] Error requesting free license:`, err);
        } else if (grantedApps && grantedApps.length > 0) {
          console.log(`[Steam-${this.username}] Granted free license for apps:`, grantedApps);
        }
        
        // 1. Tell Steam we are playing Dota 2 (Sends modern 5404 message)
        this.client.gamesPlayed([570]);
      });
    });

    // 2. Wait for Steam to acknowledge we are playing Dota 2
    this.client.on('appLaunched', (appid: number) => {
      if (appid === 570) {
        console.log(`[Steam-${this.username}] appLaunched 570, waiting for GC...`);
        // We DO NOT call this.dota2.launch() here!
        // dota2-user will automatically detect appLaunched and handle the GC connection natively.
      }
    });

    this.dota2User.on('connectedToGC', () => {
      console.log(`[Dota2-${this.username}] dota2-user connected! GC is ready.`);
    });

    this.client.on('debug', (msg: string) => {
      if (msg.includes('GC')) {
        console.log(`[Steam-${this.username} Debug] ${msg}`);
      }
    });

    this.client.on('error', (err: any) => {
      console.error(`[Steam-${this.username}] Error:`, err);
    });

    this.client.on('steamGuard', async (domain: any, callback: any) => {
      console.log(`[Steam-${this.username}] Steam Guard code required! (Domain: ${domain || 'Email/App'})`);
      if (this.guardCode) {
        console.log(`[Steam-${this.username}] Using provided guardCode: ${this.guardCode}`);
        callback(this.guardCode);
        this.guardCode = undefined; // Clear it so we don't infinitely retry an invalid code
      } else {
        console.log(`[Steam-${this.username}] No guardCode provided in .env, waiting for IMAP email...`);
        let code = null;
        for (let i = 0; i < 6; i++) { // Poll 6 times, every 10 seconds
          await new Promise(res => setTimeout(res, 10000));
          code = await fetchSteamGuardCode(this.username);
          if (code) {
            console.log(`[Steam-${this.username}] 🎉 Automatically fetched code from email: ${code}`);
            callback(code);
            return;
          }
        }
        console.error(`[Steam-${this.username}] ❌ Failed to fetch guardCode from email after 60 seconds!`);
      }
    });

    this.dota2.on('ready', () => {
      console.log(`[Dota2-${this.username}] Connected to Game Coordinator (GC)`);
      this.isGcReady = true;
    });

    this.dota2.on('unready', () => {
      console.log(`[Dota2-${this.username}] Disconnected from GC`);
      this.isGcReady = false;
    });

    this.dota2.on('practiceLobbyUpdate', async (lobby: any) => {
      await this.handleLobbyUpdate(lobby);
    });
  }

  private async handleLobbyUpdate(lobby: any) {
    if (!lobby || !lobby.game_name) return;

    try {
      const matchOutcome = lobby.match_outcome;
      // ONLY query the database if the match is actually finished!
      // Checking this first saves 99% of Prisma queries and prevents connection exhaustion.
      if (matchOutcome === 2 || matchOutcome === 3) {
        const match = await prisma.match.findFirst({
          where: { lobbyName: lobby.game_name, status: "LOBBY_CREATED" },
          include: { players: { include: { user: true } } }
        });

        if (!match) return;

        console.log(`[Dota2-${this.username}] Match ${match.lobbyName} finished! Outcome: ${matchOutcome}`);
        
        const winnerTeam = matchOutcome === 2 ? "RADIANT" : "DIRE";
        
        try {
          const BOT_SECRET = process.env.BOT_SECRET_KEY || "fallback_secret_key_123";
          
          // Send request to our Next.js API to handle MMR and balance distribution
          const res = await fetch(`http://localhost:${process.env.PORT || 3000}/api/bot/match/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              matchId: match.id,
              winnerTeam,
              dota2MatchId: lobby.match_id ? lobby.match_id.toString() : undefined,
              secretKey: BOT_SECRET
            })
          });
          
          if (!res.ok) {
            const errBody = await res.text();
            console.error(`[Dota2-${this.username}] API error completing match:`, errBody);
          } else {
            console.log(`[Dota2-${this.username}] API successfully processed match completion!`);
          }
        } catch (apiError) {
          console.error(`[Dota2-${this.username}] Failed to call completion API:`, apiError);
        }

        this.dota2.destroyLobby(() => console.log(`[Dota2-${this.username}] Destroyed lobby ${match.lobbyName}`));
      }
    } catch (error) {
      console.error(`[Dota2-${this.username}] Error processing lobby update:`, error);
    }
  }

  public async createLobby(match: any) {
    console.log(`[Dota2-${this.username}] Creating lobby: ${match.lobbyName}`);
    
    // Assign this bot to the match in DB
    await prisma.match.update({
      where: { id: match.id },
      data: { botAccountId: this.steamId }
    });

    const options = {
      game_name: match.lobbyName,
      pass_key: match.lobbyPassword,
      server_region: 5, // 5 = Singapore
      game_mode: 1, 
      allow_cheats: false,
      fill_with_bots: false,
      allow_spectating: true,
      visibility: 0
    };

    this.dota2.createPracticeLobby(options, async (err: any, response: any) => {
      // node-dota2 has a bug where it checks `response.result` instead of `response.eresult`
      const actualErr = err || (response && response.eresult !== 1 ? response.eresult : null);
      if (actualErr) {
        console.error(`[Dota2-${this.username}] Failed to create lobby ${match.lobbyName}:`, actualErr, response);
        // We might have failed because we are stuck in a lobby. Try leaving again.
        this.dota2.leavePracticeLobby(() => {});
        // If failed, unassign bot so another can try
        await prisma.match.update({
          where: { id: match.id },
          data: { botAccountId: null }
        });
      } else {
        console.log(`[Dota2-${this.username}] Successfully created lobby: ${match.lobbyName}`);
        
        // Temporarily comment out moving to broadcaster to see if 0 players hides the lobby
        // this.dota2.joinPracticeLobbyBroadcastChannel(1, () => {
        console.log(`[Dota2-${this.username}] Staying in default slot to keep lobby visible...`);
        
        // Automatically invite all players to the lobby!
        if (match.players) {
          match.players.forEach((p: any) => {
            const steamId = p.user?.steamId || p.steamId;
            if (steamId) {
              console.log(`[Dota2-${this.username}] Inviting player ${steamId} to lobby...`);
              this.dota2.inviteToLobby(steamId);
            }
          });
        }
        // });

        await prisma.match.update({
          where: { id: match.id },
          data: { status: "LOBBY_CREATED" }
        });
      }
    });
  }
}

// 4. Initialize all bots sequentially with stagger to prevent Steam login rate limits
const bots: DotaBot[] = [];
(async () => {
  for (let i = 0; i < accounts.length; i++) {
    console.log(`[Bot] Initializing bot ${i + 1}/${accounts.length}...`);
    const bot = new DotaBot(accounts[i]);
    bots.push(bot);
    await bot.start();
    if (i < accounts.length - 1) {
      console.log(`[Bot] Waiting 30 seconds before next bot to avoid Steam rate limits...`);
      // Stagger logins by 30 seconds to avoid Steam's AccountLoginDeniedThrottle (IP ban)
      await new Promise(res => setTimeout(res, 30000));
    }
  }
})();

// 5. Orchestrator: Check for pending matches and assign to free bots
setInterval(async () => {
  try {
    const pendingMatches = await prisma.match.findMany({
      where: { status: "PENDING" },
      include: { players: { include: { user: true } } }
    });

    if (pendingMatches.length === 0) return;

    // Find busy bot IDs
    const activeMatches = await prisma.match.findMany({
      where: { status: { in: ["LOBBY_CREATED", "ONGOING"] } }
    });
    
    const busyBotIds = new Set(activeMatches.map(m => m.botAccountId).filter(id => id !== null));

    for (const match of pendingMatches) {
      // Find a free bot that is GC ready
      const freeBot = bots.find(b => b.isGcReady && b.steamId && !busyBotIds.has(b.steamId));
      
      if (freeBot) {
        // Mark bot as busy locally immediately so we don't assign it again in this loop
        busyBotIds.add(freeBot.steamId as string);
        await freeBot.createLobby(match);
      } else {
        console.log(`[Orchestrator] No free bots available for match ${match.lobbyName}`);
        break; // No free bots left, wait for next cycle
      }
    }
  } catch (error) {
    console.error("[Orchestrator] Polling error:", error);
  }
}, 10000);
