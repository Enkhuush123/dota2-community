import { prisma } from "./src/lib/prisma";

async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return console.log("No user");
    
    console.log("Found user:", user.username);
    
    const match = await prisma.match.create({
      data: {
        lobbyName: "TEST-LOBBY",
        lobbyPassword: "123",
        stakeAmount: 0,
        players: {
          create: {
            userId: user.id,
            team: "RADIANT"
          }
        }
      }
    });
    console.log("Match created:", match.id);
    
    await prisma.matchPlayer.deleteMany({ where: { matchId: match.id }});
    await prisma.match.delete({ where: { id: match.id }});
    console.log("Cleanup done.");
    
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
