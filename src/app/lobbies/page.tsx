"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Swords, Plus } from "lucide-react";

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

  const handleJoinLobby = async (matchId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("/api/lobbies/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
      } else {
        fetchLobbies();
        // refresh user balance
        fetch("/api/user").then(r => r.json()).then(d => setUser(d.user)).catch(()=>{});
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLobby = async (matchId: string) => {
    if (!confirm("Энэ лоббиг устгах уу? Орсон хүмүүсийн мөнгө буцаагдах болно.")) return;
    try {
      const res = await fetch("/api/lobbies/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      if (res.ok) {
        fetchLobbies();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="flex-1 flex justify-center items-center">Уншиж байна...</div>;

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

      {error && <div className="mb-6 p-4 bg-primary/20 text-primary-hover rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLobbies.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 border border-secondary/50 rounded-xl bg-secondary/10">
            Одоогоор хүлээгдэж буй лобби алга байна. Та эхнийхийг нь үүсгэнэ үү!
          </div>
        ) : (
          filteredLobbies.map(lobby => {
            const isJoined = lobby.players.some((p: any) => p.user.username === user?.username);
            
            return (
              <div key={lobby.id} className="bg-secondary/20 border border-secondary/50 rounded-xl p-6 hover:bg-secondary/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{lobby.lobbyName}</h3>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <Swords className="w-4 h-4" /> Бооцоо: <span className={lobby.stakeAmount > 0 ? "text-green-400 font-bold" : "text-white"}>{lobby.stakeAmount > 0 ? `₮${lobby.stakeAmount.toLocaleString()}` : "Энгийн"}</span>
                    </p>
                  </div>
                  <div className="bg-background/80 px-3 py-1 rounded-full text-xs font-medium border border-secondary flex items-center gap-1">
                    <Users className="w-3 h-3" /> {lobby.players.length} / 10
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {lobby.players.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center text-sm px-2 py-1 bg-background/30 rounded">
                      <span>{p.user.username}</span>
                      <span className="text-xs text-gray-400">{p.user.rank}</span>
                    </div>
                  ))}
                  {[...Array(10 - lobby.players.length)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center text-sm px-2 py-1 bg-background/10 rounded border border-dashed border-secondary/50 text-gray-600">
                      <span>Хоосон</span>
                    </div>
                  ))}
                </div>

                {isJoined ? (
                  <div className="w-full text-center py-2 bg-green-900/30 text-green-400 rounded border border-green-800/50 text-sm font-medium">
                    Нууц үг: <span className="font-bold tracking-widest">{lobby.lobbyPassword}</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleJoinLobby(lobby.id)}
                    disabled={lobby.players.length >= 10}
                    className="w-full py-2 bg-accent hover:bg-accent/80 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {lobby.players.length >= 10 ? "Дүүрсэн" : "Нэгдэх"}
                  </button>
                )}
                
                {user?.role === "ADMIN" && (
                  <button onClick={() => handleDeleteLobby(lobby.id)} className="w-full mt-2 py-2 bg-red-900/40 hover:bg-red-800 text-red-300 rounded text-xs transition-colors">
                    Админ: Лобби устгах
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
