// @ts-nocheck
import * as dotenv from 'dotenv';
import SteamUser from 'steam-user';
import { Dota2User } from 'dota2-user';
import { fetchSteamGuardCode } from '../src/bot/imapHelper';

dotenv.config();

const accounts = JSON.parse(process.env.STEAM_ACCOUNTS || '[]');
const acc = accounts[0]; // botacc_011

let client = new SteamUser();
let dota2 = new Dota2User(client);

client.logOn({
  accountName: acc.username,
  password: acc.password,
});

let firstGuardCodeUsed = false;

client.on('steamGuard', async (domain: any, callback: any) => {
  console.log(`Steam Guard code required! (Domain: ${domain || 'Email/App'})`);
  if (acc.guardCode && !firstGuardCodeUsed) {
    console.log(`Using provided guardCode: ${acc.guardCode}`);
    firstGuardCodeUsed = true;
    callback(acc.guardCode);
  } else {
    console.log(`Waiting for IMAP email...`);
    let code = null;
    for (let i = 0; i < 6; i++) {
      await new Promise(res => setTimeout(res, 10000));
      code = await fetchSteamGuardCode(acc.username);
      if (code) {
        console.log(`Automatically fetched code from email: ${code}`);
        callback(code);
        return;
      }
    }
    console.error(`Failed to fetch guardCode from email!`);
  }
});

client.on('loggedOn', () => {
  console.log('Logged on!');
  client.setPersona(SteamUser.EPersonaState.Online);
  client.gamesPlayed([570]);
});

client.on('appLaunched', (appid) => {
  if (appid === 570) {
    console.log('appLaunched fired! dota2-user will now _connect()');
  }
});

dota2.on('connectedToGC', () => {
  console.log('Got ClientWelcome from GC! dota2-user WORKED!');
  process.exit(0);
});

dota2.on('disconnectedFromGC', (reason: any) => {
  console.log('Disconnected from GC:', reason);
});

client.on('error', (err: any) => {
  console.error('Steam error:', err);
  process.exit(1);
});
