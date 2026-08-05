// @ts-nocheck
import * as dotenv from 'dotenv';
import SteamUser from 'steam-user';
const Dota2 = require('dota2');
import { fetchSteamGuardCode } from '../src/bot/imapHelper';

dotenv.config();

const accounts = JSON.parse(process.env.STEAM_ACCOUNTS || '[]');
const acc = accounts[3]; // botacc_044

let client = new SteamUser();
let dota2 = new Dota2.Dota2Client(client, true, true);

// MOCKS
client.send = (header: any, body: any, callback: any) => {
  if (header && (header.msg === 84 || header === 84)) return;
  if (client._send) client._send(header, body, callback);
};

client.on('receivedFromGC', (appid: number, msgType: number, payload: Buffer, callback: any) => {
  if (appid === 570 && dota2._gc) {
    console.log(`<- Received GC msg ${msgType}`);
    if (msgType === 4004) {
      console.log(`ClientWelcome payload length: ${payload.length}`);
      try {
        Dota2.schema.CMsgClientWelcome.decode(payload);
        console.log('Successfully decoded CMsgClientWelcome!');
      } catch (err) {
        console.error('CMsgClientWelcome.decode ERROR:', err);
      }
    }
    dota2._gc.emit('message', { msg: msgType, proto: {} }, payload, callback);
  }
});

dota2._gc.send = (header: any, body: Buffer, callback: any) => {
  console.log(`-> Sending GC msg ${header.msg}`);
  let protoBufHeader = header.proto || {};
  client.sendToGC(570, header.msg, protoBufHeader, body, callback);
};

client.logOn({
  accountName: acc.username,
  password: acc.password,
});

let firstGuardCodeUsed = false;

client.on('steamGuard', async (domain: any, callback: any) => {
  console.log(`Steam Guard code required! (Domain: ${domain || 'Email/App'})`);
  if (acc.guardCode && !firstGuardCodeUsed) {
    firstGuardCodeUsed = true;
    callback(acc.guardCode);
  } else {
    let code = await fetchSteamGuardCode(acc.username);
    callback(code);
  }
});

client.on('loggedOn', () => {
  console.log('Logged on!');
  client.setPersona(SteamUser.EPersonaState.Online);
  client.gamesPlayed([570]);
});

client.on('appLaunched', (appid) => {
  if (appid === 570) {
    console.log('appLaunched fired! dota2.launch()');
    dota2.launch();
  }
});

dota2.on('ready', () => {
  console.log('Got ClientWelcome from GC! node-dota2 WORKED!');
  process.exit(0);
});

client.on('error', (err: any) => {
  console.error('Steam error:', err);
  process.exit(1);
});
