"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Swords,
  Shield,
  Trophy,
  Users,
  UserPlus,
  Send,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [lobbies, setLobbies] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => {});
    fetch("/api/players")
      .then((res) => res.json())
      .then((data) => setPlayers(data.players || []))
      .catch(() => {});
    fetch("/api/lobbies")
      .then((res) => res.json())
      .then((data) => setLobbies(data.matches?.slice(0, 4) || []))
      .catch(() => {});
  }, []);

  const handleReview = async (targetId: string, isPositive: boolean) => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("/api/players/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, isPositive }),
      });
      if (res.ok) {
        const data = await fetch("/api/players").then((r) => r.json());
        setPlayers(data.players || []);
      } else {
        const errData = await res.json();
        alert(errData.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getTrustColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full relative py-24 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10"></div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
        >
          Монголын <span className="text-primary">Dota 2</span> <br />
          Платформ
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10"
        >
          Автомат лобби систем, найдвартай тооцоолол, шударга өрсөлдөөн. Өөрийн
          ур чадвараа баталж, бодит шагнал хожоорой.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <a
            href="/lobbies/create?type=free"
            className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-white rounded-lg font-bold text-lg transition-all border border-gray-700"
          >
            Энгийн Лобби үүсгэх
          </a>
          <a
            href="/lobbies/create?type=bet"
            className="px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold text-lg transition-all shadow-[0_0_20px_rgba(212,56,56,0.4)] flex items-center gap-2 justify-center"
          >
            <Swords className="w-5 h-5" /> Бооцоотой Лобби үүсгэх
          </a>
        </motion.div>
      </section>

      {/* Features */}
      <section className="w-full max-w-6xl mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard
          icon={<Swords className="w-10 h-10 text-primary" />}
          title="Автомат Лобби"
          description="Манай систем автоматаар Dota 2 лобби үүсгэж, нууц үг өгөх ба үр дүнг автоматаар тооцоолно."
        />
        <FeatureCard
          icon={<Shield className="w-10 h-10 text-accent" />}
          title="Найдвартай Систем"
          description="Мөнгөө байршуулах болон татаж авах үйл явц нь хурдан бөгөөд 100% баталгаатай."
        />
        <FeatureCard
          icon={<Trophy className="w-10 h-10 text-yellow-500" />}
          title="Тэмцээн Уралдаан"
          description="Өдөр тутмын урамшуулал, чансаа (leaderboard) болон долоо хоног бүрийн тэмцээнүүд."
        />
      </section>

      {/* Main Content (Grid) */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-24 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent Lobbies */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" /> Сүүлийн Лоббинууд
            </h2>
            <a href="/lobbies" className="text-sm text-primary hover:underline">
              Бүх лоббиг харах →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lobbies.length === 0 ? (
              <p className="text-gray-400 col-span-2">
                Одоогоор лобби алга байна.
              </p>
            ) : (
              lobbies.map((lobby) => (
                <div
                  key={lobby.id}
                  className="bg-secondary/20 p-5 rounded-xl border border-secondary/50 hover:bg-secondary/40 transition-colors flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg">{lobby.lobbyName}</h3>
                    <span className="text-xs px-2 py-1 bg-background/80 rounded border border-secondary flex items-center gap-1">
                      <Users className="w-3 h-3" /> {lobby.players.length}/10
                    </span>
                  </div>
                  <div>
                    <p className="text-sm mb-4">
                      Бооцоо:{" "}
                      {lobby.stakeAmount > 0 ? (
                        <span className="text-green-400 font-bold">
                          ₮{lobby.stakeAmount}
                        </span>
                      ) : (
                        <span className="text-gray-400">Энгийн</span>
                      )}
                    </p>
                    <a
                      href="/lobbies"
                      className="block text-center w-full py-2 bg-background/50 hover:bg-accent hover:border-transparent text-white rounded text-sm transition-colors border border-secondary/50"
                    >
                      Орж харах
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Online Players */}
        <div className="lg:col-span-1">
          <div className="bg-secondary/10 rounded-2xl border border-secondary/50 p-6 h-full min-h-[400px]">
            <div className="flex items-center gap-2 mb-6 border-b border-secondary/50 pb-4">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <h2 className="text-xl font-bold">Онлайн Тоглогчид</h2>
            </div>

            <div className="space-y-4">
              {players.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  Одоогоор тоглогч алга байна.
                </p>
              ) : (
                players.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-background/50 rounded-lg border border-secondary/30"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{p.username}</span>
                        {p.isOnline ? (
                          <span
                            className="w-2 h-2 rounded-full bg-green-500"
                            title="Online"
                          ></span>
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full bg-gray-600"
                            title="Offline"
                          ></span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold ${getTrustColor(p.trustScore)}`}
                      >
                        {p.trustScore}% Trust
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-3">
                      {p.rank} • {p.position}
                    </div>

                    {user && user.id !== p.id && (
                      <div className="flex gap-2">
                        <button className="flex-1 py-1 bg-secondary/50 hover:bg-secondary rounded text-xs border border-gray-700 transition-colors flex items-center justify-center gap-1">
                          <Send className="w-3 h-3" /> Урих
                        </button>
                        <button
                          onClick={() => handleReview(p.id, true)}
                          className="px-2 py-1 bg-green-900/30 hover:bg-green-800 text-green-400 rounded text-xs border border-green-900 transition-colors"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleReview(p.id, false)}
                          className="px-2 py-1 bg-red-900/30 hover:bg-red-800 text-red-400 rounded text-xs border border-red-900 transition-colors"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-secondary/30 border border-secondary p-8 rounded-2xl flex flex-col items-center text-center hover:bg-secondary/50 transition-colors">
      <div className="mb-6 p-4 bg-background rounded-full shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
