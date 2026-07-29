import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ClientActiveMatch from "./ClientActiveMatch";

export const dynamic = "force-dynamic";

export default async function ActiveMatchPage({ params }: { params: { id: string } }) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      players: {
        include: { user: true }
      }
    }
  });

  if (!match) {
    return notFound();
  }

  // We will pass the initial match data to a Client component that polls for updates
  return (
    <div className="min-h-screen bg-[#030712] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ClientActiveMatch initialMatch={match} />
      </div>
    </div>
  );
}
