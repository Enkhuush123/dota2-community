import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        user: {
          select: { username: true, balance: true, trustScore: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session: any = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { transactionId, action } = await req.json(); // action: "APPROVE" or "REJECT"
    if (!transactionId || !action) {
      return NextResponse.json({ error: "Мэдээлэл дутуу байна" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction || transaction.status !== "PENDING") {
      return NextResponse.json({ error: "Гүйлгээ олдсонгүй эсвэл аль хэдийн шийдвэрлэгдсэн байна" }, { status: 400 });
    }

    if (action === "APPROVE") {
      if (transaction.type === "DEPOSIT") {
        // Батлах үед орлого бол хэрэглэгчийн балансыг нэмнэ
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: transactionId },
            data: { status: "COMPLETED" }
          }),
          prisma.user.update({
            where: { id: transaction.userId },
            data: { balance: { increment: transaction.amount } }
          })
        ]);
      } else if (transaction.type === "WITHDRAWAL") {
        // Зарлага бол балансаас аль хэдийн хасагдсан тул зөвхөн төлөв өөрчилнө
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { status: "COMPLETED" }
        });
      }
    } else if (action === "REJECT") {
      if (transaction.type === "DEPOSIT") {
        // Орлого татгалзвал зүгээр л төлөв өөрчилнө
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { status: "REJECTED" }
        });
      } else if (transaction.type === "WITHDRAWAL") {
        // Зарлага татгалзвал хэрэглэгчийн мөнгийг буцааж олгоно
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: transactionId },
            data: { status: "REJECTED" }
          }),
          prisma.user.update({
            where: { id: transaction.userId },
            data: { balance: { increment: transaction.amount } }
          })
        ]);
      }
    } else {
      return NextResponse.json({ error: "Буруу үйлдэл байна" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
