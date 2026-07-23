"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Swords, Plus, ArrowLeft } from "lucide-react";

function CreateLobbyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "free";
  
  const [type, setType] = useState(initialType); // "free" or "bet"
  const [stakeAmount, setStakeAmount] = useState(initialType === "bet" ? "1000" : "0");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalStake = type === "free" ? 0 : parseFloat(stakeAmount);
    
    if (type === "bet" && finalStake <= 0) {
      setError("Бооцооны дүн буруу байна.");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const res = await fetch("/api/lobbies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stakeAmount: finalStake }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      router.push("/lobbies");
    } catch (err: any) {
      setError(err.message);
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Буцах
      </button>

      <div className="bg-secondary/20 border border-secondary/50 p-8 rounded-2xl">
        <h1 className="text-3xl font-bold mb-6">Шинэ Лобби үүсгэх</h1>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => { setType("free"); setStakeAmount("0"); }}
            className={`flex-1 py-3 font-bold rounded-lg transition-colors border ${type === "free" ? "bg-primary border-primary text-white" : "bg-background/50 border-secondary text-gray-400"}`}
          >
            Энгийн Лобби
          </button>
          <button 
            onClick={() => { setType("bet"); setStakeAmount("1000"); }}
            className={`flex-1 py-3 font-bold rounded-lg transition-colors border ${type === "bet" ? "bg-primary border-primary text-white" : "bg-background/50 border-secondary text-gray-400"}`}
          >
            Бооцоотой Лобби
          </button>
        </div>

        {error && <div className="mb-6 p-4 bg-red-900/40 text-red-400 rounded-lg text-sm border border-red-900">{error}</div>}

        <form onSubmit={handleCreateLobby} className="space-y-6">
          {type === "bet" && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Бооцооны дүн (₮)</label>
              <input 
                type="number" 
                value={stakeAmount}
                onChange={e => setStakeAmount(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-secondary rounded-lg focus:outline-none focus:border-primary text-lg"
                min="1000"
                step="1000"
              />
              <p className="text-xs text-gray-500 mt-2">Хамгийн багадаа 1,000₮. Лобби руу орсон хүн бүрээс энэ дүнгээр хасагдаж шагналын санд орно.</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={isCreating}
            className="w-full py-4 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCreating ? "Үүсгэж байна..." : type === "free" ? <><Plus className="w-5 h-5"/> Энгийн Лобби үүсгэх</> : <><Swords className="w-5 h-5"/> Бооцоотой Лобби үүсгэх</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CreateLobbyPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex justify-center items-center">Уншиж байна...</div>}>
      <CreateLobbyForm />
    </Suspense>
  );
}
