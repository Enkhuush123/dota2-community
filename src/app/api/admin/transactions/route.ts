export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Middleware-like check
async function isAdmin() {
  const session: any = await getSession();
  if (!session || !session.userId) return false;
  
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  return user?.role === "ADMIN";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { username: true } } }
  });

  return NextResponse.json({ transactions });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { transactionId, status } = await req.json(); // status: COMPLETED or REJECTED

    const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!tx || tx.status !== "PENDING") {
      return NextResponse.json({ error: "Invalid transaction" }, { status: 400 });
    }

    if (status === "COMPLETED" && tx.type === "DEPOSIT") {
      // Add balance to user
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transactionId },
          data: { status: "COMPLETED" }
        }),
        prisma.user.update({
          where: { id: tx.userId },
          data: { balance: { increment: tx.amount } }
        })
      ]);
    } else if (status === "COMPLETED" && tx.type === "WITHDRAWAL") {
      // Balance was already deducted during request, just mark as completed
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "COMPLETED" }
      });
    } else if (status === "REJECTED") {
      // If withdrawal rejected, refund balance
      if (tx.type === "WITHDRAWAL") {
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: transactionId },
            data: { status: "REJECTED" }
          }),
          prisma.user.update({
            where: { id: tx.userId },
            data: { balance: { increment: tx.amount } }
          })
        ]);
      } else {
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { status: "REJECTED" }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
