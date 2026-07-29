import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const directUrl = "postgresql://postgres.ezqhfdmqjejowcnqvgez:80651328En%3F@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?connection_limit=5";
  const pool = new Pool({ connectionString: directUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findFirst();
    if (!user) return console.log("No user");
    console.log("Found user:", user.username);
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
