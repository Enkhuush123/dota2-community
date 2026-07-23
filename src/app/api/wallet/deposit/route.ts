export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Нэвтрээгүй байна" }, { status: 401 });
    }

    const { amount, description } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Хүчинтэй дүн оруулна уу" }, { status: 400 });
    }

    // Хүсэлт үүсгэх
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.userId,
        amount,
        type: "DEPOSIT",
        status: "PENDING", // Админ баталгаажуулсны дараа COMPLETED болно
        description,
      },
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
