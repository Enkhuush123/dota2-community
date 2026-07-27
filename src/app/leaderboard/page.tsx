"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Star, Target, Flame, TrendingUp } from "lucide-react";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-5 bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 rounded-full mb-6 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
          <Trophy className="w-12 h-12 text-yellow-500" />
        </div>
        <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
          Leaderboard
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Лоббид хамгийн их MMR цуглуулж, өндөр амжилт үзүүлсэн шилдэг 50 тоглогчдын жагсаалт.
        </p>
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-secondary/50 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Glow effect in background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-secondary/40 text-gray-300 text-sm uppercase tracking-wider">
              <tr>
                <th className="p-5 font-semibold w-20 text-center">Байр</th>
                <th className="p-5 font-semibold">Тоглогч</th>
                <th className="p-5 font-semibold">MMR</th>
                <th className="p-5 font-semibold">Win Rate</th>
                <th className="p-5 font-semibold">W / L</th>
                <th className="p-5 font-semibold text-right">Олсон Ашиг</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                let rankIcon = null;
                let rowClass = "border-b border-secondary/30 hover:bg-secondary/30 transition-all duration-300 hover:scale-[1.01] origin-left";
                
                if (index === 0) {
                  rankIcon = <Medal className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] mx-auto" />;
                  rowClass += " bg-yellow-500/5";
                } else if (index === 1) {
                  rankIcon = <Medal className="w-7 h-7 text-gray-300 drop-shadow-[0_0_10px_rgba(209,213,219,0.8)] mx-auto" />;
                  rowClass += " bg-gray-400/5";
                } else if (index === 2) {
                  rankIcon = <Medal className="w-6 h-6 text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.8)] mx-auto" />;
                  rowClass += " bg-amber-600/5";
                } else {
                  rankIcon = <span className="text-gray-400 font-bold text-lg">{index + 1}</span>;
                }

                const totalGames = user.wins + user.losses;
                const winRate = totalGames > 0 ? Math.round((user.wins / totalGames) * 100) : 0;
                
                // Color formatting for win rate
                let winRateColor = "text-gray-400";
                if (winRate >= 60) winRateColor = "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]";
                else if (winRate >= 50) winRateColor = "text-yellow-400";
                else if (totalGames > 0 && winRate < 50) winRateColor = "text-red-400";

                return (
                  <tr key={user.id} className={rowClass}>
                    <td className="p-5 text-center align-middle">{rankIcon}</td>
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl 
                          ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-[0_0_15px_rgba(209,213,219,0.4)]' :
                            index === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-[0_0_15px_rgba(217,119,6,0.4)]' :
                            'bg-secondary border border-secondary text-primary'}`}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg flex items-center gap-2">
                            {user.username}
                            {index === 0 && <span title="1-р байр"><Medal className="w-4 h-4 text-yellow-500" /></span>}
                            {user.winStreak >= 3 && (
                              <span className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20" title="Дараалж хожсон">
                                🔥 {user.winStreak}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-2">
                            {user.rank} <span className="w-1 h-1 rounded-full bg-gray-600"></span> {user.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 font-black text-xl text-white">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        {user.mmr || 1000}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className={`font-bold text-lg ${winRateColor}`}>
                        {winRate}%
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5 mt-1 max-w-[80px]">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${winRate}%` }}></div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-background/50 rounded-xl font-bold border border-secondary/50">
                        <span className="text-green-400">W: {user.wins}</span>
                        <span className="text-gray-600">/</span>
                        <span className="text-red-400">L: {user.losses}</span>
                      </div>
                    </td>
                    <td className="p-5 text-right font-black text-lg text-emerald-400">
                      {user.totalEarned > 0 ? `+ ₮${user.totalEarned.toLocaleString()}` : "₮0"}
                    </td>
                  </tr>
                );
              })}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Target className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg">Одоогоор тоглогч бүртгүүлээгүй байна</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
