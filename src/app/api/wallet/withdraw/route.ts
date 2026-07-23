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

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    
    if (!user || user.balance < amount) {
      return NextResponse.json({ error: "Үлдэгдэл хүрэлцэхгүй байна" }, { status: 400 });
    }

    // Хүсэлт үүсгэх ба балансаас хасах 
    // Бодит амьдрал дээр transaction (DB) ашиглаж хасах нь зөв. Энд хялбарчилж хасаад үүсгэе.
    
    const [transaction, updatedUser] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: session.userId,
          amount,
          type: "WITHDRAWAL",
          status: "PENDING", // Админ баталгаажуулсны дараа мөнгө шилжүүлэгдэнэ
          description,
        },
      }),
      prisma.user.update({
        where: { id: session.userId },
        data: { balance: { decrement: amount } },
      })
    ]);

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
