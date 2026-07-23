import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, password, rank, position, dota2Id } = await req.json();

    if (!username || !password || !rank || !position || !dota2Id) {
      return NextResponse.json(
        { error: "Бүх талбарыг бөглөнө үү (Dota 2 ID заавал)" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Нэвтрэх нэр бүртгэлтэй байна" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        rank,
        position,
        dota2Id,
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Дотоод алдаа гарлаа" },
      { status: 500 }
    );
  }
}
