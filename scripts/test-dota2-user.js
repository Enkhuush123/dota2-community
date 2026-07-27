require('dotenv').config();
const SteamUser = require('steam-user');
const { Dota2User } = require('dota2-user');

const accounts = JSON.parse(process.env.STEAM_ACCOUNTS || '[]');
const acc = accounts[0];

let client = new SteamUser();
let dota2 = new Dota2User(client);

client.logOn({
  accountName: acc.username,
  password: acc.password,
});

client.on('loggedOn', () => {
  console.log('Logged on!');
  client.setPersona(SteamUser.EPersonaState.Online);
  client.gamesPlayed([570]);
});

dota2.on('connectedToGC', () => {
  console.log('Got ClientWelcome from GC!');
  process.exit(0);
});

dota2.on('disconnectedFromGC', (reason) => {
  console.log('Disconnected from GC:', reason);
});

client.on('error', (err) => {
  console.error('Steam error:', err);
  process.exit(1);
});
