import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { mn } from "date-fns/locale";
import { Activity, Swords, Users, Shield, Trophy } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ActiveMatchesPage() {
  const matches = await prisma.match.findMany({
    where: {
      status: { in: ["LOBBY_CREATED", "ONGOING"] },
    },
    include: {
      players: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Шууд Лоббинууд</h1>
            <p className="text-white/50">Яг одоо тоглож буй болон үүссэн лоббинууд</p>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
            <Swords className="w-12 h-12 text-white/20 mb-4" />
            <h3 className="text-xl font-bold text-white/70 mb-2">Одоогоор идэвхтэй лобби алга байна</h3>
            <p className="text-white/40">Та шинэ лобби үүсгээд тоглолтыг эхлүүлэх боломжтой</p>
            <Link href="/lobbies/create?type=bet" className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors">
              Шинэ Лобби Үүсгэх
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <div key={match.id} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden hover:border-primary/50 transition-colors group relative">
                {/* Status Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">LIVE</span>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      <Swords className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{match.lobbyName}</h3>
                      <p className="text-xs text-white/40">
                        {formatDistanceToNow(new Date(match.createdAt), { addSuffix: true, locale: mn })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                      <div className="text-[10px] text-white/40 uppercase font-bold mb-1 flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Бооцоо
                      </div>
                      <div className="font-bold text-green-400 text-sm">
                        {match.stakeAmount > 0 ? `₮${match.stakeAmount.toLocaleString()}` : "Үнэгүй"}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                      <div className="text-[10px] text-white/40 uppercase font-bold mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Тоглогчид
                      </div>
                      <div className="font-bold text-white/90 text-sm">
                        {match.players.length}/10
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Radiant Team */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                        <span className="text-xs font-bold text-green-500 uppercase">Radiant</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {match.players.filter(p => p.team === "RADIANT").map((p, i) => (
                          <a href={`/profile/${p.user.id}`} key={i} className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-[10px] hover:bg-green-500/20 transition-colors cursor-pointer">
                            {p.user.username}
                          </a>
                        ))}
                        {match.players.filter(p => p.team === "RADIANT").length === 0 && (
                          <div className="text-xs text-white/30 italic">Тоглогч ороогүй</div>
                        )}
                      </div>
                    </div>

                    {/* Dire Team */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
                        <span className="text-xs font-bold text-red-500 uppercase">Dire</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {match.players.filter(p => p.team === "DIRE").map((p, i) => (
                          <a href={`/profile/${p.user.id}`} key={i} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[10px] hover:bg-red-500/20 transition-colors cursor-pointer">
                            {p.user.username}
                          </a>
                        ))}
                        {match.players.filter(p => p.team === "DIRE").length === 0 && (
                          <div className="text-xs text-white/30 italic">Тоглогч ороогүй</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link href={`/active-matches/${match.id}`} className="mt-6 w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-500/20">
                    <Activity className="w-4 h-4" /> Шууд Үзэх (Live)
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
