"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Bell } from "lucide-react";

export function InvitePoller() {
  const router = useRouter();
  const [invites, setInvites] = useState<any[]>([]);

  const fetchInvites = async () => {
    try {
      const res = await fetch("/api/invites");
      if (res.ok) {
        const data = await res.json();
        setInvites(data.invites || []);
      }
    } catch {}
  };

  useEffect(() => {
    // Poll every 5 seconds
    const int = setInterval(fetchInvites, 5000);
    setTimeout(() => fetchInvites(), 0); // initial fetch
    return () => clearInterval(int);
  }, []);

  const handleAction = async (inviteId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      const res = await fetch("/api/invites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action })
      });
      if (res.ok) {
        const data = await res.json();
        if (action === "ACCEPT" && data.matchId) {
          router.push(`/lobbies?join=${data.matchId}`);
        }
        fetchInvites();
      }
    } catch {}
  };

  if (invites.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {invites.map((invite) => (
        <div key={invite.id} className="bg-secondary border border-primary/50 shadow-lg shadow-primary/20 rounded-lg p-4 animate-in slide-in-from-right-8">
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 bg-primary/20 rounded-full">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm">Урилга ирлээ!</h4>
              <p className="text-sm text-gray-300 mt-1">
                <span className="font-bold text-primary">{invite.sender.username}</span> таныг <span className="font-bold">&quot;{invite.match.lobbyName}&quot;</span> лобби руу урьж байна.
              </p>
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => handleAction(invite.id, "ACCEPT")}
                  className="flex-1 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors"
                >
                  <Check className="w-3 h-3" /> Орох
                </button>
                <button 
                  onClick={() => handleAction(invite.id, "DECLINE")}
                  className="flex-1 py-1.5 bg-background hover:bg-red-900/40 text-gray-300 hover:text-red-300 border border-secondary text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" /> Татгалзах
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
