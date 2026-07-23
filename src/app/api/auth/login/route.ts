export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Нэр, нууц үгээ оруулна уу" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Нэвтрэх нэр эсвэл нууц үг буруу" },
        { status: 400 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Нэвтрэх нэр эсвэл нууц үг буруу" },
        { status: 400 }
      );
    }

    const token = signJwt({ userId: user.id, username: user.username });
    const cookieStore = await cookies();
    
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Дотоод алдаа гарлаа" },
      { status: 500 }
    );
  }
}
