"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", password: "", rank: "Herald", position: "Mid", dota2Id: "" });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Алдаа гарлаа");
      }

      // Success, redirect to login
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-secondary/20 p-8 rounded-2xl border border-secondary/50">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Бүртгүүлэх
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-primary/20 text-primary-hover p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Нэвтрэх нэр</label>
              <input
                name="username"
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-secondary rounded-md shadow-sm bg-background/50 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Нууц үг</label>
              <input
                name="password"
                type="password"
                required
                className="appearance-none block w-full px-3 py-2 border border-secondary rounded-md shadow-sm bg-background/50 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ранк (Rank)</label>
                <select 
                  name="rank" 
                  required
                  className="appearance-none block w-full px-3 py-2 border border-secondary rounded-md shadow-sm bg-background/50 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="">Сонгох...</option>
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
                <label className="block text-sm font-medium mb-1">Байрлал (Role)</label>
                <select 
                  name="position" 
                  required
                  className="appearance-none block w-full px-3 py-2 border border-secondary rounded-md shadow-sm bg-background/50 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="">Сонгох...</option>
                  <option value="Carry (Pos 1)">Carry (Pos 1)</option>
                  <option value="Mid (Pos 2)">Mid (Pos 2)</option>
                  <option value="Offlane (Pos 3)">Offlane (Pos 3)</option>
                  <option value="Soft Supp (Pos 4)">Soft Supp (Pos 4)</option>
                  <option value="Hard Supp (Pos 5)">Hard Supp (Pos 5)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Dota 2 Account ID (Friend ID)</label>
              <input 
                name="dota2Id"
                type="text" 
                required
                className="w-full px-4 py-2 bg-background border border-secondary rounded-lg focus:outline-none focus:border-primary transition-colors"
                placeholder="Жишээ: 123456789"
                onChange={e => setForm({...form, dota2Id: e.target.value})}
              />
              <p className="text-xs text-gray-400 mt-1">Тоглолтын үр дүнг зөв хүнд нь өгөхийн тулд заавал шаардлагатай.</p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-colors disabled:opacity-50"
            >
              {loading ? "Түр хүлээнэ үү..." : "Бүртгүүлэх"}
            </button>
          </div>
        </form>
        <div className="text-center text-sm">
          Бүртгэлтэй юу?{" "}
          <a href="/login" className="font-medium text-accent hover:text-blue-400">
            Нэвтрэх
          </a>
        </div>
      </div>
    </div>
  );
}
