import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: {
        players: {
          include: { user: true }
        }
      }
    });

    if (!match) {
      return NextResponse.json({ error: "Лобби олдсонгүй" }, { status: 404 });
    }

    return NextResponse.json({ match });
  } catch (error) {
    return NextResponse.json({ error: "Дотоод алдаа гарлаа" }, { status: 500 });
  }
}
