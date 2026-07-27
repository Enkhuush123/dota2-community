"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Swords, Clock, Skull, Shield } from "lucide-react";

export default function MatchAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!matchId) return;
    
    const fetchMatch = async () => {
      try {
        const res = await fetch(`https://api.opendota.com/api/matches/${matchId}`);
        if (!res.ok) {
          throw new Error("Тоглолтын мэдээлэл олдсонгүй эсвэл OpenDota-д хараахан бүртгэгдээгүй байна.");
        }
        const data = await res.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setMatchData(data);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 animate-pulse">Тоглолтын анализыг OpenDota-с татаж байна...</p>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-16 text-center">
        <div className="bg-red-900/20 border border-red-900/50 rounded-2xl p-8 max-w-lg mx-auto">
          <Skull className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Мэдээлэл олдсонгүй</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Буцах
          </button>
        </div>
      </div>
    );
  }

  const radiantPlayers = matchData.players.filter((p: any) => p.isRadiant);
  const direPlayers = matchData.players.filter((p: any) => !p.isRadiant);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <button 
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Буцах
      </button>

      {/* Header */}
      <div className="bg-secondary/20 border border-secondary/50 rounded-3xl p-6 md:p-10 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black mb-2">
              {matchData.radiant_win ? (
                <span className="text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">RADIANT ХОЖСОН</span>
              ) : (
                <span className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">DIRE ХОЖСОН</span>
              )}
            </h1>
            <p className="text-gray-400 text-lg">Match ID: {matchData.match_id}</p>
          </div>
          
          <div className="flex items-center gap-8 bg-background/50 px-8 py-4 rounded-2xl border border-secondary/30">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1 flex items-center justify-center gap-1"><Swords className="w-4 h-4"/> Оноо</p>
              <p className="text-3xl font-black">
                <span className="text-green-500">{matchData.radiant_score}</span>
                <span className="text-gray-600 mx-2">:</span>
                <span className="text-red-500">{matchData.dire_score}</span>
              </p>
            </div>
            <div className="w-px h-12 bg-secondary/50"></div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1 flex items-center justify-center gap-1"><Clock className="w-4 h-4"/> Хугацаа</p>
              <p className="text-2xl font-bold">{formatDuration(matchData.duration)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radiant Team */}
        <div className="bg-green-950/10 border border-green-900/30 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-green-900/20 px-6 py-4 border-b border-green-900/30 flex justify-between items-center">
            <h2 className="text-xl font-bold text-green-500 flex items-center gap-2">
              <Shield className="w-5 h-5" /> THE RADIANT
            </h2>
            <span className="text-2xl font-black text-green-500/50">{matchData.radiant_score}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-green-950/30 text-green-500/70">
                <tr>
                  <th className="p-4 font-medium">Тоглогч</th>
                  <th className="p-4 font-medium">K / D / A</th>
                  <th className="p-4 font-medium">Net Worth</th>
                  <th className="p-4 font-medium">GPM / XPM</th>
                  <th className="p-4 font-medium">Hero Dmg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-900/20">
                {radiantPlayers.map((p: any) => (
                  <tr key={p.account_id || p.player_slot} className="hover:bg-green-900/10 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-base text-white">{p.personaname || "Unknown"}</div>
                      <div className="text-xs text-gray-500">Lvl {p.level}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold">
                        <span className="text-green-400">{p.kills}</span> / 
                        <span className="text-red-400"> {p.deaths}</span> / 
                        <span className="text-gray-300"> {p.assists}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-yellow-500">{(p.net_worth || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-gray-300">
                        <span className="text-yellow-400">{p.gold_per_min}</span> / <span className="text-blue-400">{p.xp_per_min}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{(p.hero_damage || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dire Team */}
        <div className="bg-red-950/10 border border-red-900/30 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-red-900/20 px-6 py-4 border-b border-red-900/30 flex justify-between items-center">
            <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
              <Shield className="w-5 h-5" /> THE DIRE
            </h2>
            <span className="text-2xl font-black text-red-500/50">{matchData.dire_score}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-red-950/30 text-red-500/70">
                <tr>
                  <th className="p-4 font-medium">Тоглогч</th>
                  <th className="p-4 font-medium">K / D / A</th>
                  <th className="p-4 font-medium">Net Worth</th>
                  <th className="p-4 font-medium">GPM / XPM</th>
                  <th className="p-4 font-medium">Hero Dmg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-900/20">
                {direPlayers.map((p: any) => (
                  <tr key={p.account_id || p.player_slot} className="hover:bg-red-900/10 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-base text-white">{p.personaname || "Unknown"}</div>
                      <div className="text-xs text-gray-500">Lvl {p.level}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold">
                        <span className="text-green-400">{p.kills}</span> / 
                        <span className="text-red-400"> {p.deaths}</span> / 
                        <span className="text-gray-300"> {p.assists}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-yellow-500">{(p.net_worth || 0).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-gray-300">
                        <span className="text-yellow-400">{p.gold_per_min}</span> / <span className="text-blue-400">{p.xp_per_min}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{(p.hero_damage || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
