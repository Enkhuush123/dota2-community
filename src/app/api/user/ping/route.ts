import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST() {
  try {
    const session: any = await getSession();
    if (session && session.userId) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { lastSeen: new Date() }
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
