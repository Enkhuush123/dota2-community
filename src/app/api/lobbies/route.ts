import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      where: { 
        status: { in: ["PENDING", "LOBBY_CREATED"] } 
      },
      include: {
        players: {
          include: { user: { select: { username: true, rank: true } } }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
    }

    const { stakeAmount } = await req.json();

    if (stakeAmount === undefined || stakeAmount < 0) {
      return NextResponse.json({ error: "Бооцооны дүн буруу байна" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.balance < stakeAmount) {
      return NextResponse.json({ error: "Үлдэгдэл хүрэлцэхгүй байна" }, { status: 400 });
    }

    // Лобби нэр болон нууц үг үүсгэх
    const lobbyName = `MNG-${Math.floor(1000 + Math.random() * 9000)}`;
    const lobbyPassword = Math.random().toString(36).slice(-6);

    const match = await prisma.match.create({
      data: {
        lobbyName,
        lobbyPassword,
        stakeAmount,
        players: {
          create: {
            userId: session.userId
          }
        }
      }
    });

    // Бооцооны мөнгийг хасах
    if (stakeAmount > 0) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: session.userId },
          data: { balance: { decrement: stakeAmount } }
        }),
        prisma.transaction.create({
          data: {
            userId: session.userId,
            amount: stakeAmount,
            type: "BET_DEDUCT",
            status: "COMPLETED",
            description: `Лобби үүсгэсэн: ${lobbyName}`
          }
        })
      ]);
    }

    return NextResponse.json({ success: true, match });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
