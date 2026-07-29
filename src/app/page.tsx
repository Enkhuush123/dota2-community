"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Swords,
  Trophy,
  Users,
  Send,
  Activity,
  ChevronRight,
  
} from "lucide-react";
import { toast } from "sonner";
import { getRankFromMMR } from "@/lib/ranks";

export default function Home() {
  
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [myLobbyId, setMyLobbyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/online")
      .then((res) => res.json())
      .then((data) => setOnlineUsers(data.users?.slice(0, 5) || []))
      .catch(() => {});
      
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => setLeaderboard(data.users?.slice(0, 5) || []))
      .catch(() => {});
      
    fetch("/api/lobbies")
      .then((res) => res.json())
      .then((data) => setLobbies(data.matches?.slice(0, 4) || []))
      .catch(() => {});
      
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.matches) {
          const active = data.user.matches.find((m: any) => m.match.status === "PENDING" || m.match.status === "LOBBY_CREATED");
          if (active) setMyLobbyId(active.matchId);
        }
      })
      .catch(() => {});
  }, []);

  const handleInvite = async (userId: string) => {
    if (!myLobbyId) {
      toast.error("Та эхлээд лоббинд орсон байх шаардлагатай.");
      return;
    }
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId, matchId: myLobbyId })
      });
      if (res.ok) {
        toast.success("Урилга илгээгдлээ");
      } else {
        const data = await res.json();
        toast.error(data.error || "Алдаа гарлаа");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Animation variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };
  
  const itemVars: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-x-hidden bg-[#030712] pb-12">
      {/* Abstract Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-full bg-accent/20 blur-[120px]" style={{ animationDuration: '7s' }}></div>
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] rounded-full bg-yellow-500/10 blur-[80px]"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 flex flex-col lg:flex-row items-center gap-12 xl:gap-20">
        
        {/* Left Side: Hero Text & Buttons */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 text-center lg:text-left pt-10 lg:pt-0"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-8">
            Монголын <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent relative">
              Dota 2
              <div className="absolute -inset-2 bg-primary/20 blur-2xl -z-10 rounded-full"></div>
            </span> <br className="hidden lg:block"/>
            Платформ
          </h1>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/lobbies/create?type=bet"
              className="relative group px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 overflow-hidden shadow-[0_0_40px_-10px_rgba(212,56,56,0.6)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <Swords className="w-5 h-5 relative z-10" /> 
              <span className="relative z-10">Бооцоотой Тоглох</span>
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/lobbies/create?type=free"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold text-lg transition-all flex items-center justify-center backdrop-blur-sm"
            >
              Энгийн Лобби
            </motion.a>
          </div>
        </motion.div>

        {/* Right Side: Data Widgets */}
        <motion.div 
          variants={containerVars}
          initial="hidden"
          animate="show"
          className="flex-1 w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6"
        >
          {/* Widget 1: Online Players (Spans 1 col, high height) */}
          <motion.div variants={itemVars} className="md:row-span-2 flex flex-col bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-green-500/20"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <Activity className="w-5 h-5 text-green-400 animate-pulse" /> Онлайн
              </h2>
              <a href="/online" className="text-xs font-bold text-green-400 hover:text-green-300 flex items-center">Бүгд <ChevronRight className="w-3 h-3"/></a>
            </div>

            <div className="space-y-3 flex-1 relative z-10">
              {onlineUsers.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">Одоогоор хүн алга.</p>
              ) : (
                onlineUsers.map((u) => (
                  <div key={u.id} className="p-3 bg-black/20 rounded-xl border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                        <a href={`/profile/${u.id}`} className="font-bold text-sm text-white/90 hover:text-primary transition-colors cursor-pointer">{u.username}</a>
                      </div>
                      <span className="text-xs font-bold text-white/50">
                        {u.trustScore}%
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded border border-white/5">
                        <img src={getRankFromMMR(u.mmr || 1000).iconUrl} alt="Rank" className="w-4 h-4 object-contain" />
                        <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">
                          {getRankFromMMR(u.mmr || 1000).name}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleInvite(u.id)}
                        className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Урих
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Widget 2: Recent Lobbies */}
          <motion.div variants={itemVars} className="flex flex-col bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-primary/20"></div>
            
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <Swords className="w-4 h-4 text-primary" /> Лоббинууд
              </h2>
              <a href="/lobbies" className="text-xs font-bold text-primary hover:text-primary-hover flex items-center">Бүгд <ChevronRight className="w-3 h-3"/></a>
            </div>
            
            <div className="space-y-2 relative z-10">
              {lobbies.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-2">Лобби алга байна.</p>
              ) : (
                lobbies.slice(0, 3).map((lobby) => (
                  <div key={lobby.id} className="flex items-center justify-between p-2.5 bg-black/20 rounded-xl border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-xs text-white/90 truncate">{lobby.lobbyName}</h3>
                      <div className="text-[10px] text-white/40 mt-0.5">
                        {lobby.stakeAmount > 0 ? <span className="text-green-400">₮{lobby.stakeAmount}</span> : "Энгийн"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] flex items-center gap-1 text-white/50 bg-white/5 px-1.5 py-0.5 rounded">
                        <Users className="w-3 h-3" /> {lobby.players.length}/10
                      </span>
                      <a href={`/lobbies?join=${lobby.id}`} className="w-6 h-6 flex items-center justify-center bg-primary/20 hover:bg-primary text-primary hover:text-white rounded-lg transition-colors">
                        <ChevronRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Widget 3: Leaderboard */}
          <motion.div variants={itemVars} className="flex flex-col bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-yellow-500/20"></div>
            
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <Trophy className="w-4 h-4 text-yellow-500" /> Шилдэг 
              </h2>
              <a href="/leaderboard" className="text-xs font-bold text-yellow-500 hover:text-yellow-400 flex items-center">Бүгд <ChevronRight className="w-3 h-3"/></a>
            </div>

            <div className="space-y-2 relative z-10">
              {leaderboard.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-2">Мэдээлэл алга байна.</p>
              ) : (
                leaderboard.slice(0, 3).map((u, i) => (
                  <div key={u.id} className="flex items-center gap-3 p-2 bg-black/20 rounded-xl border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                      i === 0 ? "bg-gradient-to-br from-yellow-300 to-yellow-600 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]" :
                      i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-black" :
                      i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white" :
                      "bg-white/10 text-white/50"
                    }`}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={`/profile/${u.id}`} className="font-bold text-xs text-white/90 truncate flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                        <img src={getRankFromMMR(u.mmr || 1000).iconUrl} alt="Rank" className="w-3.5 h-3.5 object-contain" />
                        {u.username}
                      </a>
                    </div>
                    <div className="text-xs font-bold text-green-400">
                      {u.wins} <span className="text-[10px] text-white/30 font-normal">W</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* Active Matches Section (Bottom) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Идэвхтэй Лоббинууд
          </h2>
          <a href="/active-matches" className="text-sm font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
            Бүгдийг харах <ChevronRight className="w-4 h-4" />
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lobbies.filter(l => l.status === "LOBBY_CREATED" || l.status === "ONGOING").length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white/[0.02] border border-white/[0.05] rounded-3xl">
              <p className="text-white/40">Одоогоор явагдаж буй лобби алга байна.</p>
            </div>
          ) : (
            lobbies.filter(l => l.status === "LOBBY_CREATED" || l.status === "ONGOING").slice(0, 3).map((match) => (
              <div key={match.id} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 hover:border-red-500/50 transition-colors relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-red-500/20"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h3 className="font-bold text-white text-lg">{match.lobbyName}</h3>
                    <p className="text-xs text-white/40">Тоглогч: {match.players.length}/10</p>
                  </div>
                  <div className="px-2.5 py-1 bg-red-500/10 text-red-400 rounded text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
                    Live
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="text-sm font-bold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                    {match.stakeAmount > 0 ? `₮${match.stakeAmount}` : "Үнэгүй"}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {match.players.map((p: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/70">
                        {p.user.username}
                      </span>
                    ))}
                  </div>
                </div>

                <a href={`/lobbies?join=${match.id}`} className="block w-full py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl text-center transition-colors relative z-10">
                  Орох
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
