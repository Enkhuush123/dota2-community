"use client";

import { useEffect, useState } from "react";
import { Users, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function OnlinePlayersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myLobbyId, setMyLobbyId] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<Record<string, string>>({});

  const fetchOnlineUsers = async () => {
    try {
      const res = await fetch("/api/online");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (_e) {
    } finally {
      setLoading(false);
    }
  };

  const checkMyLobby = async () => {
    try {
      // Find a lobby that I am currently in
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        const me = data.user;
        if (me && me.matches && me.matches.length > 0) {
          // Assume the latest pending/ongoing match is the current lobby
          const activeMatch = me.matches.find((m: any) => m.match.status === "PENDING" || m.match.status === "LOBBY_CREATED");
          if (activeMatch) {
            setMyLobbyId(activeMatch.matchId);
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    setTimeout(() => {
      fetchOnlineUsers();
      checkMyLobby();
    }, 0);
    
    const int = setInterval(fetchOnlineUsers, 10000); // refresh every 10s
    return () => clearInterval(int);
  }, []);

  const handleInvite = async (userId: string) => {
    if (!myLobbyId) {
      toast.error("Та эхлээд лоббинд орсон байх шаардлагатай.");
      return;
    }

    setInviteStatus(prev => ({ ...prev, [userId]: "Илгээж байна..." }));

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId, matchId: myLobbyId })
      });
      
      if (res.ok) {
        setInviteStatus(prev => ({ ...prev, [userId]: "Урилга илгээгдлээ" }));
        toast.success("Урилга илгээгдлээ");
        setTimeout(() => {
          setInviteStatus(prev => ({ ...prev, [userId]: "" }));
        }, 3000);
      } else {
        const data = await res.json();
        toast.error(data.error || "Алдаа гарлаа");
        setInviteStatus(prev => ({ ...prev, [userId]: "" }));
      }
    } catch {
      toast.error("Алдаа гарлаа");
      setInviteStatus(prev => ({ ...prev, [userId]: "" }));
    }
  };

  if (loading) return (
    <div className="flex-1 flex justify-center items-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-green-500/20 rounded-full">
          <Users className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Онлайн тоглогчид</h1>
          <p className="text-gray-400">Сүүлийн 5 минутанд идэвхтэй байсан тоглогчид</p>
        </div>
      </div>

      {!myLobbyId && (
        <div className="mb-6 p-4 bg-blue-900/30 text-blue-300 border border-blue-800 rounded-lg text-sm">
          Та өөрөө лоббинд ороогүй байгаа тул хүмүүсийг урих боломжгүй байна. Лобби цэс рүү орж лобби үүсгэх эсвэл нэгдэнэ үү.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-secondary/20 border border-secondary/50 rounded-xl p-4 flex flex-col justify-between hover:bg-secondary/30 transition-colors shadow">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></div>
                  <span className="font-bold text-lg">{user.username}</span>
                  {user.winStreak >= 3 && (
                    <span className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20" title="Дараалж хожсон">
                      🔥 {user.winStreak}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-green-400">
                  {user.trustScore}% Trust
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-1">{user.rank} | {user.position}</p>
              <p className="text-sm font-bold text-primary mb-4">MMR: {user.mmr || 1000}</p>
            </div>
            
            <button 
              onClick={() => handleInvite(user.id)}
              disabled={!myLobbyId || !!inviteStatus[user.id]}
              className="w-full py-2 bg-primary hover:bg-primary-hover disabled:bg-secondary disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {inviteStatus[user.id] === "Урилга илгээгдлээ" ? (
                <><CheckCircle2 className="w-4 h-4"/> Илгээгдсэн</>
              ) : inviteStatus[user.id] ? (
                inviteStatus[user.id]
              ) : (
                <><Send className="w-4 h-4"/> Лобби руу урих</>
              )}
            </button>
          </div>
        ))}
        {users.length === 0 && (
          <div className="col-span-full py-10 text-center text-gray-500 border border-secondary/30 rounded-xl bg-secondary/10">
            Одоогоор өөр хүн онлайн алга байна.
          </div>
        )}
      </div>
    </div>
  );
}
