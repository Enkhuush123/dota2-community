const Dota2 = require('dota2');
const CMsgClientHello = Dota2.schema.CMsgClientHello;

const msg = new CMsgClientHello({
  engine: 1,
  client_session_need: 104,
  client_launcher: 0,
});
console.log(msg);
