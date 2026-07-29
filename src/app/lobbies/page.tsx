"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Users, Swords, Plus, ArrowRightLeft, LogOut, Copy, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { LobbyChat } from "@/components/LobbyChat";

export default function LobbiesPage() {
  const router = useRouter();
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL, FREE, BET

  useEffect(() => {
    fetch("/api/user").then(res => res.json()).then(data => setUser(data.user)).catch(() => {});
    fetchLobbies();

    // Auto-refresh lobbies every 5 seconds
    const interval = setInterval(fetchLobbies, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchLobbies() {
    try {
      const res = await fetch("/api/lobbies");
      const data = await res.json();
      setLobbies(data.matches || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLobby = async (matchId: string, team: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("/api/lobbies/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, team }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setTimeout(() => setError(""), 3000);
      } else {
        fetchLobbies();
        fetch("/api/user").then(r => r.json()).then(d => setUser(d.user)).catch(()=>{});
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchTeam = async (matchId: string, team: string) => {
    try {
      const res = await fetch("/api/lobbies/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, team }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setTimeout(() => setError(""), 3000);
      } else {
        fetchLobbies();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeaveLobby = (matchId: string) => {
    toast("Энэ лоббиноос гарах уу?", {
      description: "Бооцооны мөнгө буцаагдах болно.",
      action: {
        label: "Гарах",
        onClick: async () => {
          try {
            const res = await fetch("/api/lobbies/leave", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ matchId }),
            });
            if (res.ok) {
              toast.success("Лоббиноос гарлаа");
              fetchLobbies();
              fetch("/api/user").then(r => r.json()).then(d => setUser(d.user)).catch(()=>{});
            } else {
              const data = await res.json();
              setError(data.error);
              toast.error(data.error);
              setTimeout(() => setError(""), 3000);
            }
          } catch (e) {
            console.error(e);
            toast.error("Алдаа гарлаа");
          }
        }
      },
      cancel: { label: "Цуцлах", onClick: () => {} }
    });
  };

  const handleDeleteLobby = async (matchId: string) => {
    toast("Админ устгал хийх үү?", {
      description: "Энэ лоббиг бүрмөсөн устгах болно.",
      action: {
        label: "Устгах",
        onClick: async () => {
          try {
            const res = await fetch(`/api/lobbies/delete`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ matchId }),
            });
            if (res.ok) {
              toast.success("Лобби устгагдлаа");
              fetchLobbies();
            } else {
              const data = await res.json();
              toast.error(data.error || "Алдаа гарлаа");
            }
          } catch (e) {
            console.error(e);
            toast.error("Алдаа гарлаа");
          }
        }
      },
      cancel: { label: "Цуцлах", onClick: () => {} }
    });
  };

  if (loading) return (
    <div className="flex-1 flex justify-center items-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const filteredLobbies = lobbies.filter(lobby => {
    if (filter === "FREE") return lobby.stakeAmount === 0;
    if (filter === "BET") return lobby.stakeAmount > 0;
    return true;
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Идэвхтэй Лоббинууд</h1>
        
        {user ? (
          <a href="/lobbies/create?type=free" className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Лобби үүсгэх рүү очих
          </a>
        ) : (
          <a href="/login" className="px-4 py-2 bg-primary text-white rounded-md text-sm">Лобби үүсгэхийн тулд нэвтэрнэ үү</a>
        )}
      </div>

      <div className="flex gap-4 mb-6 border-b border-secondary/50 pb-2">
        <button onClick={() => setFilter("ALL")} className={`px-4 py-2 font-medium text-sm ${filter === "ALL" ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}>Бүх Лобби</button>
        <button onClick={() => setFilter("FREE")} className={`px-4 py-2 font-medium text-sm ${filter === "FREE" ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}>Энгийн Лобби</button>
        <button onClick={() => setFilter("BET")} className={`px-4 py-2 font-medium text-sm ${filter === "BET" ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-white"}`}>Бооцоотой Лобби</button>
      </div>

      {error && <div className="mb-6 p-4 bg-red-900/40 text-red-400 rounded-lg text-sm border border-red-900 text-center">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {filteredLobbies.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 border border-secondary/50 rounded-xl bg-secondary/10">
            Одоогоор хүлээгдэж буй лобби алга байна. Та эхнийхийг нь үүсгэнэ үү!
          </div>
        ) : (
          filteredLobbies.map(lobby => {
            const isJoined = lobby.players.some((p: any) => p.user.username === user?.username);
            const myPlayer = lobby.players.find((p: any) => p.user.username === user?.username);
            
            const radiantPlayers = lobby.players.filter((p: any) => p.team === "RADIANT");
            const direPlayers = lobby.players.filter((p: any) => p.team === "DIRE");

            return (
              <div key={lobby.id} className="bg-secondary/20 border border-secondary/50 rounded-2xl p-6 hover:bg-secondary/30 transition-colors shadow-lg">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6 border-b border-secondary/50 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{lobby.lobbyName}</h3>
                    <p className="text-sm text-gray-400 flex items-center gap-2 mt-2">
                      <Swords className="w-4 h-4" /> 
                      Бооцоо: <span className={lobby.stakeAmount > 0 ? "text-yellow-400 font-bold" : "text-white"}>
                        {lobby.stakeAmount > 0 ? `₮${lobby.stakeAmount.toLocaleString()}` : "Энгийн (Үнэгүй)"}
                      </span>
                    </p>
                  </div>
                  <div className="bg-background/80 px-4 py-2 rounded-lg text-sm font-medium border border-secondary flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> {lobby.players.length} / 10
                  </div>
                </div>

                {/* Dota 2 Lobby View */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  
                  {/* Radiant */}
                  <div className="bg-green-950/20 border border-green-900/50 rounded-xl overflow-hidden">
                    <div className="bg-green-900/40 py-2 px-4 border-b border-green-900/50 text-green-400 font-bold text-center text-sm tracking-wider">
                      RADIANT
                    </div>
                    <div className="p-3 space-y-2">
                      {radiantPlayers.map((p: any) => (
                        <div key={p.id} className={`flex justify-between items-center text-sm px-3 py-2 rounded border ${p.user.username === user?.username ? "bg-green-900/40 border-green-500 text-white font-bold" : "bg-background/50 border-transparent text-gray-300"}`}>
                          <span>{p.user.username}</span>
                          <span className="text-xs opacity-70">{p.user.rank}</span>
                        </div>
                      ))}
                      {[...Array(5 - radiantPlayers.length)].map((_, i) => (
                        <div key={i} className="flex justify-center items-center text-sm px-3 py-2 bg-background/20 rounded border border-dashed border-green-900/30 text-green-900/50">
                          Хоосон
                        </div>
                      ))}
                    </div>
                    
                    {/* Actions */}
                    <div className="p-3 pt-0">
                      {isJoined ? (
                        myPlayer?.team !== "RADIANT" ? (
                          <button onClick={() => handleSwitchTeam(lobby.id, "RADIANT")} disabled={radiantPlayers.length >= 5} className="w-full py-2 text-xs font-bold text-green-400 border border-green-900/50 hover:bg-green-900/30 rounded flex justify-center items-center gap-1 disabled:opacity-50">
                            <ArrowRightLeft className="w-3 h-3"/> Энэ баг руу орох
                          </button>
                        ) : (
                           <div className="w-full py-2 text-xs font-bold text-green-500 text-center">Та энэ багт байна</div>
                        )
                      ) : (
                        <button onClick={() => handleJoinLobby(lobby.id, "RADIANT")} disabled={radiantPlayers.length >= 5} className="w-full py-2 text-xs font-bold bg-green-900/60 hover:bg-green-800 text-green-100 rounded disabled:opacity-50 transition-colors">
                          Radiant-д орох
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dire */}
                  <div className="bg-red-950/20 border border-red-900/50 rounded-xl overflow-hidden">
                    <div className="bg-red-900/40 py-2 px-4 border-b border-red-900/50 text-red-400 font-bold text-center text-sm tracking-wider">
                      DIRE
                    </div>
                    <div className="p-3 space-y-2">
                      {direPlayers.map((p: any) => (
                        <div key={p.id} className={`flex justify-between items-center text-sm px-3 py-2 rounded border ${p.user.username === user?.username ? "bg-red-900/40 border-red-500 text-white font-bold" : "bg-background/50 border-transparent text-gray-300"}`}>
                          <span>{p.user.username}</span>
                          <span className="text-xs opacity-70">{p.user.rank}</span>
                        </div>
                      ))}
                      {[...Array(5 - direPlayers.length)].map((_, i) => (
                        <div key={i} className="flex justify-center items-center text-sm px-3 py-2 bg-background/20 rounded border border-dashed border-red-900/30 text-red-900/50">
                          Хоосон
                        </div>
                      ))}
                    </div>
                    
                    {/* Actions */}
                    <div className="p-3 pt-0">
                      {isJoined ? (
                        myPlayer?.team !== "DIRE" ? (
                          <button onClick={() => handleSwitchTeam(lobby.id, "DIRE")} disabled={direPlayers.length >= 5} className="w-full py-2 text-xs font-bold text-red-400 border border-red-900/50 hover:bg-red-900/30 rounded flex justify-center items-center gap-1 disabled:opacity-50">
                            <ArrowRightLeft className="w-3 h-3"/> Энэ баг руу орох
                          </button>
                        ) : (
                           <div className="w-full py-2 text-xs font-bold text-red-500 text-center">Та энэ багт байна</div>
                        )
                      ) : (
                        <button onClick={() => handleJoinLobby(lobby.id, "DIRE")} disabled={direPlayers.length >= 5} className="w-full py-2 text-xs font-bold bg-red-900/60 hover:bg-red-800 text-red-100 rounded disabled:opacity-50 transition-colors">
                          Dire-д орох
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer / Password / Leave */}
                {isJoined && (
                  <>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/lobbies?join=${lobby.id}`);
                          toast.success("Урих линк хуулагдлаа! Найз руугаа явуулаарай.");
                        }}
                        className="flex-1 text-center py-3 bg-secondary hover:bg-secondary/80 rounded-lg border border-secondary text-sm font-medium transition-colors flex items-center justify-center gap-2 text-gray-300"
                      >
                        <Copy className="w-4 h-4"/> Найзаа урих (Линк хуулах)
                      </button>
                      <button onClick={() => handleLeaveLobby(lobby.id)} className="px-6 py-3 bg-red-900/40 hover:bg-red-800 border border-red-900/50 text-red-300 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                        <LogOut className="w-4 h-4"/> Гарах
                      </button>
                    </div>
                    
                    <div className="mt-4 text-center py-2 bg-primary/20 text-primary-hover rounded-lg border border-primary/30 text-sm font-medium">
                      Лобби нууц үг: <span className="font-bold tracking-widest">{lobby.lobbyPassword}</span>
                    </div>

                    <div className="mt-8">
                      <LobbyChat matchId={lobby.id} />
                    </div>
                  </>
                )}
                
                {user?.role === "ADMIN" && (
                  <button onClick={() => handleDeleteLobby(lobby.id)} className="w-full mt-4 py-2 bg-background/50 hover:bg-background text-red-400 border border-red-900/30 rounded text-xs transition-colors font-medium">
                    Админ: Энэ лоббиг устгах
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
