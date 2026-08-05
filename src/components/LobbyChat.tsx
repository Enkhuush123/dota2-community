"use client";

import { useEffect, useState, useRef } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { getRankFromMMR } from "@/lib/ranks";
import { toast } from "sonner";

export function LobbyChat({ matchId }: { matchId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/lobbies/${matchId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {
      console.error("Failed to fetch messages");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/lobbies/${matchId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        setContent("");
        await fetchMessages();
      } else {
        const data = await res.json();
        toast.error(data.error || "Алдаа гарлаа");
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-3 relative z-10">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-white">Шууд Чат</h3>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/30 text-sm">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            Энд чат алга байна. Анхны мессежийг илгээнэ үү!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <img 
                src={getRankFromMMR(msg.user.mmr || 1000).iconUrl} 
                alt="Rank" 
                className="w-6 h-6 object-contain shrink-0 mt-0.5" 
                title={getRankFromMMR(msg.user.mmr || 1000).name}
              />
              <div>
                <div className="flex items-baseline gap-2">
                  <a href={`/profile/${msg.userId}`} className="font-bold text-sm text-white/90 hover:text-primary transition-colors cursor-pointer">{msg.user.username}</a>
                  <span className="text-[10px] text-white/40">{format(new Date(msg.createdAt), 'HH:mm')}</span>
                </div>
                <div className="text-sm text-white/70 mt-0.5 break-words">
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-black/40 border-t border-white/[0.05] relative z-10">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Мессеж бичих..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="w-10 flex items-center justify-center bg-primary text-white rounded-xl disabled:opacity-50 hover:bg-primary-hover transition-colors shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
