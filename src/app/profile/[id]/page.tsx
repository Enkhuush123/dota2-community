import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getRankFromMMR } from "@/lib/ranks";
import { format } from "date-fns";
import { Trophy, Swords, Flame, Calendar, Activity, Link as LinkIcon, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Find user in local DB
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      matches: {
        include: { match: true }
      },
      reviewsReceived: true,
    }
  });

  if (!user) return notFound();

  // Fetch OpenDota stats if dota2Id exists
  let dotaStats = null;
  let recentMatches = [];
  let dotaWl = null;

  let heroes: Record<number, string> = {};

  if (user.dota2Id) {
    try {
      const [resPlayer, resMatches, resWl, resHeroes] = await Promise.all([
        fetch(`https://api.opendota.com/api/players/${user.dota2Id}`, { next: { revalidate: 3600 } }),
        fetch(`https://api.opendota.com/api/players/${user.dota2Id}/recentMatches`, { next: { revalidate: 3600 } }),
        fetch(`https://api.opendota.com/api/players/${user.dota2Id}/wl`, { next: { revalidate: 3600 } }),
        fetch(`https://api.opendota.com/api/heroes`, { next: { revalidate: 86400 } })
      ]);
      
      if (resPlayer.ok) dotaStats = await resPlayer.json();
      if (resMatches.ok) recentMatches = await resMatches.json();
      if (resWl.ok) dotaWl = await resWl.json();
      if (resHeroes.ok) {
        const heroesArray = await resHeroes.json();
        heroesArray.forEach((h: any) => {
          heroes[h.id] = h.name.replace('npc_dota_hero_', '');
        });
      }
    } catch (e) {
      console.error("OpenDota fetch failed");
    }
  }

  const rank = getRankFromMMR(user.mmr || 1000);
  const platformWinrate = user.wins + user.losses > 0 
    ? Math.round((user.wins / (user.wins + user.losses)) * 100) 
    : 0;
  
  const dotaWinrate = dotaWl && (dotaWl.win + dotaWl.lose > 0)
    ? Math.round((dotaWl.win / (dotaWl.win + dotaWl.lose)) * 100)
    : null;

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Profile Header */}
      <div className="bg-secondary/20 border border-secondary/50 rounded-3xl p-8 mb-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        
        {/* Avatar & Rank */}
        <div className="relative">
          <div className="w-32 h-32 bg-gray-800 rounded-full border-4 border-[#030712] flex items-center justify-center text-4xl font-black text-white shadow-2xl relative z-10 overflow-hidden">
            {dotaStats?.profile?.avatarfull ? (
              <img src={dotaStats.profile.avatarfull} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-black rounded-full border-4 border-[#030712] flex items-center justify-center shadow-lg z-20" title={rank.name}>
            <img src={rank.iconUrl} alt="Rank" className="w-12 h-12 object-contain" />
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-black text-white mb-2">{user.username}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium">
            <span className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
              <Swords className="w-4 h-4" /> {user.position}
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <Calendar className="w-4 h-4" /> Нэгдсэн: {format(new Date(user.createdAt), 'yyyy-MM-dd')}
            </span>
            {user.dota2Id ? (
              <a href={`https://www.opendota.com/players/${user.dota2Id}`} target="_blank" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors">
                <LinkIcon className="w-4 h-4" /> OpenDota
              </a>
            ) : (
              <span className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20">
                <AlertTriangle className="w-4 h-4" /> Steam холбогдоогүй
              </span>
            )}
          </div>
        </div>

        {/* Trust Score */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-center min-w-[200px]">
          <div className="text-gray-400 text-sm font-bold uppercase mb-2">Итгэлцлийн оноо</div>
          <div className="text-5xl font-black text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">
            {user.trustScore}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats */}
        <div className="space-y-8">
          
          {/* Platform Stats */}
          <div className="bg-secondary/20 border border-secondary/50 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Платформын Стат
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="text-gray-500 text-xs font-bold uppercase mb-1">Нийт Хожил</div>
                <div className="text-2xl font-black text-white">{user.wins}</div>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="text-gray-500 text-xs font-bold uppercase mb-1">Нийт Хожигдол</div>
                <div className="text-2xl font-black text-white">{user.losses}</div>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="text-gray-500 text-xs font-bold uppercase mb-1">Winrate</div>
                <div className="text-2xl font-black text-green-400">{platformWinrate}%</div>
              </div>
              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                <div className="text-gray-500 text-xs font-bold uppercase mb-1">Win Streak</div>
                <div className="text-2xl font-black text-orange-400 flex items-center gap-1">
                  <Flame className="w-5 h-5" /> {user.winStreak}
                </div>
              </div>
            </div>
          </div>

          {/* Official Dota Stats */}
          {dotaWl && (
            <div className="bg-blue-950/20 border border-blue-900/50 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-blue-400 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5" /> Dota 2 албан ёсны Стат
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <div className="text-gray-500 text-xs font-bold uppercase mb-1">Нийт Тоглолт</div>
                  <div className="text-2xl font-black text-white">{dotaWl.win + dotaWl.lose}</div>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <div className="text-gray-500 text-xs font-bold uppercase mb-1">Winrate</div>
                  <div className="text-2xl font-black text-blue-400">{dotaWinrate}%</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Recent Matches */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-secondary/20 border border-secondary/50 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Сүүлийн 10 тоглолт (OpenDota)</h3>
            
            {recentMatches.length > 0 ? (
              <div className="space-y-3">
                {recentMatches.slice(0, 10).map((rm: any) => {
                  const isWin = (rm.player_slot < 128 && rm.radiant_win) || (rm.player_slot >= 128 && !rm.radiant_win);
                  return (
                    <div key={rm.match_id} className="flex items-center gap-4 p-4 bg-black/40 border border-white/5 rounded-xl hover:bg-black/60 transition-colors">
                      <div className="w-12 h-12 bg-gray-800 rounded-lg overflow-hidden shrink-0">
                        <img 
                          src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroes[rm.hero_id] || rm.hero_id}.png`} 
                          alt={`Hero ${rm.hero_id}`} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${isWin ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {isWin ? "ХОЖСОН" : "ХОЖИГДСОН"}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">Match ID: {rm.match_id}</span>
                        </div>
                        <div className="text-sm font-medium text-white flex gap-4">
                          <span>KDA: <span className="text-gray-400">{rm.kills}/{rm.deaths}/{rm.assists}</span></span>
                          <span>GPM/XPM: <span className="text-yellow-500">{rm.gold_per_min}</span> / <span className="text-blue-400">{rm.xp_per_min}</span></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-xl bg-black/20">
                {user.dota2Id ? "OpenDota-с мэдээлэл олдсонгүй эсвэл profile private байна." : "Steam хаяг холбогдоогүй байна."}
              </div>
            )}
          </div>
          
        </div>

      </div>

    </div>
  );
}
