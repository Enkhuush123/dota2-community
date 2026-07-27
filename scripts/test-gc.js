require('dotenv').config();
const SteamUser = require('steam-user');
const protobuf = require('protobufjs');
const fs = require('fs');

let client = new SteamUser();

const accounts = JSON.parse(process.env.STEAM_ACCOUNTS || '[]');
const acc = accounts[0];

client.logOn({
  accountName: acc.username,
  password: acc.password,
});

client.on('loggedOn', () => {
  console.log('Logged on!');
  client.setPersona(SteamUser.EPersonaState.Online);
  client.gamesPlayed([570]);
});

// We need to load dota2 protobufs to create a proper ClientHello
const Dota2 = require('dota2');

client.on('appLaunched', (appid) => {
  if (appid === 570) {
    console.log('Launched 570. Sending GC hello in 2 seconds...');
    setTimeout(() => {
      // 4006 is k_EMsgGCClientHello
      const payload = new Dota2.schema.CMsgClientHello({
        engine: 1, // 1 is Source 2
        client_session_need: 104,
        client_launcher: 0,
      }).toBuffer();
      
      console.log('Payload bytes:', payload.length);
      client.sendToGC(570, 4006, {}, payload);
    }, 2000);
  }
});

client.on('receivedFromGC', (appid, msgType, payload) => {
  console.log(`Received GC message from ${appid}: ${msgType}`);
  process.exit(0);
});

client.on('error', (err) => {
  console.error('Steam error:', err);
  process.exit(1);
});
