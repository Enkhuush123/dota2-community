"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Shield, Trophy, Activity, ArrowUpRight, ArrowDownRight, Star } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [depositMsg, setDepositMsg] = useState("");

  useEffect(() => {
    fetch("/api/user")
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const handleDeposit = async () => {
    if (!amount) return;
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount), description: "Дансаар шилжүүлэх хүсэлт" }),
      });
      if (res.ok) {
        setDepositMsg("Хүсэлт илгээгдлээ. Та данс руу мөнгөө шилжүүлнэ үү.");
        setAmount("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWithdraw = async () => {
    if (!amount) return;
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount), description: "Татах хүсэлт" }),
      });
      if (res.ok) {
        setDepositMsg("Татах хүсэлт амжилттай илгээгдлээ.");
        setAmount("");
        // Reload user to see new balance
        const u = await fetch("/api/user").then(r => r.json());
        setUser(u.user);
      } else {
        const data = await res.json();
        setDepositMsg(data.error || "Алдаа гарлаа");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rank: user.rank, position: user.position, dota2Id: user.dota2Id }),
      });
      if (res.ok) {
        alert("Профайл амжилттай шинэчлэгдлээ.");
      } else {
        alert("Алдаа гарлаа");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Уншиж байна...</div>;
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Профайл болон Хэтэвч</h1>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          Системээс гарах
        </button>
      </div>

      {(() => {
        const totalMatches = user?._count?.matches || 0;
        const recentMatchesCount = user?.matches?.length || 0;
        let wins = 0;
        let losses = 0;
        user?.matches?.forEach((m: any) => {
          if (m.match.winnerTeam) {
            if (m.match.winnerTeam === m.team) wins++;
            else losses++;
          }
        });
        const winRate = recentMatchesCount > 0 ? Math.round((wins / recentMatchesCount) * 100) : 0;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-secondary/30 p-6 rounded-xl border border-secondary flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg"><Wallet className="text-primary" /></div>
              <div>
                <p className="text-sm text-gray-400">Үлдэгдэл</p>
                <p className="text-2xl font-bold text-white">₮{user?.balance?.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-secondary/30 p-6 rounded-xl border border-secondary flex items-center gap-4">
              <div className="p-3 bg-accent/20 rounded-lg"><Shield className="text-accent" /></div>
              <div>
                <p className="text-sm text-gray-400">Ранк / Байрлал</p>
                <p className="text-lg font-bold text-white">{user?.rank} | {user?.position}</p>
              </div>
            </div>
            
            <div className="bg-secondary/30 p-6 rounded-xl border border-secondary flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg"><Trophy className="text-yellow-500" /></div>
              <div>
                <p className="text-sm text-gray-400">Тоглолт / Win Rate (Сүүлийн {recentMatchesCount})</p>
                <p className="text-xl font-bold text-white">{totalMatches} <span className="text-sm font-normal text-gray-400">({winRate}%)</span></p>
              </div>
            </div>

            <div className="bg-secondary/30 p-6 rounded-xl border border-secondary flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg"><Star className="text-green-500" /></div>
              <div>
                <p className="text-sm text-gray-400">Итгэлцлийн хувь</p>
                <p className="text-2xl font-bold text-white">{user?.trustScore}%</p>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="bg-secondary/20 p-6 rounded-xl border border-secondary/50 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Профайл шинэчлэх</h2>
        <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm mb-1 text-gray-400">Rank (Цол)</label>
            <select 
              value={user?.rank || ""} 
              onChange={e => setUser({...user, rank: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-secondary rounded-md focus:outline-none focus:border-primary"
            >
              <option value="Herald">Herald</option>
              <option value="Guardian">Guardian</option>
              <option value="Crusader">Crusader</option>
              <option value="Archon">Archon</option>
              <option value="Legend">Legend</option>
              <option value="Ancient">Ancient</option>
              <option value="Divine">Divine</option>
              <option value="Immortal">Immortal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-400">Position (Байрлал)</label>
            <select 
              value={user?.position || ""} 
              onChange={e => setUser({...user, position: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-secondary rounded-md focus:outline-none focus:border-primary"
            >
              <option value="Carry (Pos 1)">Carry (Pos 1)</option>
              <option value="Mid (Pos 2)">Mid (Pos 2)</option>
              <option value="Offlane (Pos 3)">Offlane (Pos 3)</option>
              <option value="Soft Support (Pos 4)">Soft Support (Pos 4)</option>
              <option value="Hard Support (Pos 5)">Hard Support (Pos 5)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-400">Dota 2 Account ID</label>
            <input 
              type="text" 
              value={user?.dota2Id || ""} 
              onChange={e => setUser({...user, dota2Id: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-secondary rounded-md focus:outline-none focus:border-primary"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button type="submit" className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-md font-medium transition-colors">
              Хадгалах
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wallet Actions */}
        <div className="bg-secondary/20 p-6 rounded-xl border border-secondary/50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5"/> Хэтэвч удирдлага</h2>
          
          <div className="space-y-4">
            {depositMsg && <div className="p-3 bg-green-900/30 text-green-400 rounded border border-green-800/50 text-sm">{depositMsg}</div>}
            
            <div>
              <label className="block text-sm mb-1">Мөнгөн дүн (₮)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-background/50 border border-secondary rounded-md focus:outline-none focus:border-primary" 
                placeholder="Жишээ нь: 5000"
              />
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handleDeposit}
                className="flex-1 flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-white py-2 rounded-md font-medium transition-colors"
              >
                <ArrowUpRight className="w-4 h-4"/> Орлого хийх
              </button>
              <button 
                onClick={handleWithdraw}
                className="flex-1 flex justify-center items-center gap-2 bg-secondary hover:bg-secondary/80 text-white py-2 rounded-md font-medium transition-colors border border-gray-600"
              >
                <ArrowDownRight className="w-4 h-4"/> Зарлага гаргах
              </button>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-background/50 rounded-lg text-sm text-gray-400 border border-secondary/50">
            <strong>Дансны мэдээлэл:</strong> <br />
            Хаан банк: 5000000000 (Болд) <br />
            Гүйлгээний утга дээр өөрийн бүртгүүлсэн нэр буюу <strong>{user?.username}</strong> -г бичнэ үү. Админ шалгаад таны балансыг нэмэх болно.
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-secondary/20 p-6 rounded-xl border border-secondary/50">
          <h2 className="text-xl font-bold mb-4">Гүйлгээний түүх</h2>
          <div className="space-y-3">
            {user?.transactions?.length === 0 ? (
              <p className="text-gray-400 text-sm">Гүйлгээний түүх хоосон байна.</p>
            ) : (
              user?.transactions?.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center p-3 bg-background/50 rounded border border-secondary/30">
                  <div>
                    <p className="font-medium">
                      {tx.type === "DEPOSIT" ? "Орлого" : tx.type === "WITHDRAWAL" ? "Зарлага" : tx.type}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString("mn-MN")}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === "DEPOSIT" ? "text-green-400" : "text-red-400"}`}>
                      {tx.type === "DEPOSIT" ? "+" : "-"} ₮{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">{tx.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-secondary/20 p-6 rounded-xl border border-secondary/50 mb-8">
        <h2 className="text-xl font-bold mb-4">Сүүлийн тоглолтууд (Match History)</h2>
        <div className="space-y-3">
          {user?.matches?.length === 0 ? (
            <p className="text-gray-400 text-sm">Та одоогоор тоглолт хийгээгүй байна.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/40 text-gray-300">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Лобби</th>
                    <th className="p-3">Бооцоо</th>
                    <th className="p-3">Баг</th>
                    <th className="p-3">Төлөв</th>
                    <th className="p-3 rounded-tr-lg">Үр дүн</th>
                  </tr>
                </thead>
                <tbody>
                  {user?.matches?.map((m: any) => (
                    <tr key={m.id} className="border-b border-secondary/30 hover:bg-secondary/10">
                      <td className="p-3 font-medium">{m.match.lobbyName}</td>
                      <td className="p-3 text-green-400">₮{m.match.stakeAmount}</td>
                      <td className="p-3">{m.team || "Тодорхойгүй"}</td>
                      <td className="p-3">{m.match.status}</td>
                      <td className="p-3">
                        {m.match.winnerTeam ? (
                          m.match.winnerTeam === m.team ? (
                            <span className="text-green-500 font-bold">ХОЖСОН</span>
                          ) : (
                            <span className="text-red-500 font-bold">ХОЖИГДСОН</span>
                          )
                        ) : (
                          <span className="text-gray-400">Хүлээгдэж байна</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
