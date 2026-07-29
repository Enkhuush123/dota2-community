import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClientLobbies from "./ClientLobbies";

export const dynamic = "force-dynamic";

export default async function LobbiesPage() {
  const session: any = await getSession();
  
  let fullUser = null;
  if (session?.userId) {
    fullUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        rank: true,
        position: true,
        role: true,
      }
    });
  }

  return <ClientLobbies sessionUser={fullUser} />;
}
