"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { mn } from "date-fns/locale";
import { Swords, Trophy, Users, Loader2, Activity } from "lucide-react";
import Link from "next/link";

const HERO_IMAGES_BASE_URL = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/";

// Basic fallback mapping for common heroes if we don't fetch from OpenDota.
// In a full implementation, we would fetch https://api.opendota.com/api/heroes and match by id.
// We will just use a generic icon if heroId is present but not mapped.
// Since hero images usually use the internal name (e.g. npc_dota_hero_antimage -> antimage.png),
// we will just show the hero ID for now, or a generic placeholder.

export default function ClientActiveMatch({ initialMatch }: { initialMatch: any }) {
  const [match, setMatch] = useState(initialMatch);

  useEffect(() => {
    // Poll every 3 seconds to get live updates
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/lobbies/${match.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.match) {
            setMatch(data.match);
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [match.id]);

  const radiantPlayers = match.players.filter((p: any) => p.team === "RADIANT");
  const direPlayers = match.players.filter((p: any) => p.team === "DIRE");

  const getGameStateDisplay = (state: string) => {
    switch (state) {
      case "WAITING": return "Хүлээгдэж байна";
      case "HERO_SELECTION": return "Баатар Сонголт";
      case "STRATEGY_TIME": return "Стратегийн Цаг";
      case "PRE_GAME": return "Тоглолт Эхлэхээс Өмнө";
      case "IN_PROGRESS": return "Тоглолт Явагдаж Байна";
      case "POST_GAME": return "Тоглолт Дууссан";
      default: return "Тодорхойгүй";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 lg:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
            <Swords className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-white">{match.lobbyName}</h1>
              <div className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold uppercase tracking-wider border border-red-500/20 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                LIVE
              </div>
            </div>
            <p className="text-white/40">
              Үүсгэсэн: {formatDistanceToNow(new Date(match.createdAt), { addSuffix: true, locale: mn })}
            </p>
          </div>
        </div>

        <div className="flex gap-4 relative z-10 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-black/40 rounded-2xl p-4 border border-white/5 text-center">
            <div className="text-xs text-white/40 uppercase font-bold mb-1">Бооцоо</div>
            <div className="font-black text-xl text-green-400">
              {match.stakeAmount > 0 ? `₮${match.stakeAmount.toLocaleString()}` : "Үнэгүй"}
            </div>
          </div>
          <div className="flex-1 md:flex-none bg-black/40 rounded-2xl p-4 border border-white/5 text-center">
            <div className="text-xs text-white/40 uppercase font-bold mb-1">Төлөв</div>
            <div className="font-black text-lg text-white">
              {getGameStateDisplay(match.gameState)}
            </div>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* RADIANT */}
        <div className="bg-gradient-to-b from-green-500/10 to-transparent border border-green-500/20 rounded-3xl p-6 lg:p-8">
          <div className="flex justify-between items-center mb-8 border-b border-green-500/20 pb-4">
            <h2 className="text-2xl font-black text-green-500 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_15px_#22c55e]"></div>
              RADIANT
            </h2>
            <div className="text-green-500/50 font-bold">{radiantPlayers.length}/5 Тоглогч</div>
          </div>

          <div className="space-y-4">
            {radiantPlayers.map((player: any) => (
              <div key={player.id} className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                {/* Hero Icon or Placeholder */}
                <div className="w-16 h-16 bg-gray-800 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center shrink-0">
                  {player.heroId ? (
                    <div className="text-xs text-white/50 text-center font-bold">Hero<br/>{player.heroId}</div>
                  ) : (
                    <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-white truncate">{player.user.username}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-white/50">{player.user.rank}</span>
                    <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-white/50">{player.user.position}</span>
                  </div>
                </div>
              </div>
            ))}
            {radiantPlayers.length === 0 && (
              <div className="text-center py-10 text-white/30 italic">Тоглогч ороогүй байна</div>
            )}
          </div>
        </div>

        {/* DIRE */}
        <div className="bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-3xl p-6 lg:p-8">
          <div className="flex justify-between items-center mb-8 border-b border-red-500/20 pb-4">
            <h2 className="text-2xl font-black text-red-500 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_15px_#ef4444]"></div>
              DIRE
            </h2>
            <div className="text-red-500/50 font-bold">{direPlayers.length}/5 Тоглогч</div>
          </div>

          <div className="space-y-4">
            {direPlayers.map((player: any) => (
              <div key={player.id} className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                {/* Hero Icon or Placeholder */}
                <div className="w-16 h-16 bg-gray-800 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center shrink-0">
                  {player.heroId ? (
                    <div className="text-xs text-white/50 text-center font-bold">Hero<br/>{player.heroId}</div>
                  ) : (
                    <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-white truncate">{player.user.username}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-white/50">{player.user.rank}</span>
                    <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-white/50">{player.user.position}</span>
                  </div>
                </div>
              </div>
            ))}
            {direPlayers.length === 0 && (
              <div className="text-center py-10 text-white/30 italic">Тоглогч ороогүй байна</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
