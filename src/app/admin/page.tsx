"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Clock, Banknote, ShieldAlert } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/admin/transactions");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setTransactions(data.transactions || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError("Мэдээлэл татахад алдаа гарлаа");
      setLoading(false);
    }
  };

  const handleAction = async (transactionId: string, action: "APPROVE" | "REJECT") => {
    if (!confirm(`Энэ гүйлгээг ${action === "APPROVE" ? "БАТЛАХ" : "ТАТГАЛЗАХ"}-даа итгэлтэй байна уу?`)) {
      return;
    }
    
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, action })
      });
      
      if (res.ok) {
        toast.success("Шилжүүлэг амжилттай");
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
      } else {
        const data = await res.json();
        toast.error(data.error || "Алдаа гарлаа");
      }
    } catch (e) {
      console.error(e);
      toast.error("Алдаа гарлаа");
    }
  };

  if (loading) return (
    <div className="flex-1 flex justify-center items-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShieldAlert className="text-red-500 w-8 h-8" />
          Админ Самбар
        </h1>
      </div>

      {error && <div className="p-4 mb-6 bg-red-900/30 text-red-400 rounded-lg border border-red-800/50">{error}</div>}

      <div className="bg-secondary/10 rounded-2xl border border-secondary/50 overflow-hidden">
        <div className="p-6 border-b border-secondary/50 bg-secondary/5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="text-yellow-500 w-5 h-5" /> 
            Хүлээгдэж буй гүйлгээнүүд ({transactions.length})
          </h2>
          <p className="text-sm text-gray-400 mt-1">Орлого болон Зарлагын хүсэлтүүдийг шалгаж баталгаажуулах</p>
        </div>

        {transactions.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            Одоогоор хүлээгдэж буй гүйлгээ алга байна.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/20 text-gray-300">
                <tr>
                  <th className="p-4">Төрөл</th>
                  <th className="p-4">Хэрэглэгч</th>
                  <th className="p-4">Дүн</th>
                  <th className="p-4">Мэдээлэл / Банк</th>
                  <th className="p-4">Огноо</th>
                  <th className="p-4 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary/30">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-secondary/5 transition-colors">
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        t.type === "DEPOSIT" ? "bg-green-500/10 text-green-400 border border-green-500/20" : 
                        "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {t.type === "DEPOSIT" ? "Орлого" : "Зарлага"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold">{t.user.username}</div>
                      <div className="text-xs text-gray-500">Үлдэгдэл: ₮{t.user.balance}</div>
                    </td>
                    <td className="p-4 font-bold text-lg">
                      ₮{t.amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      {t.type === "WITHDRAWAL" ? (
                        <div className="text-xs space-y-1">
                          <div><span className="text-gray-500">Банк:</span> {t.bankName}</div>
                          <div><span className="text-gray-500">Данс:</span> <span className="font-mono text-white">{t.accountNumber}</span></div>
                          <div><span className="text-gray-500">Нэр:</span> {t.accountName}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">
                          {t.description || "-"}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-xs text-gray-400">
                      {new Date(t.createdAt).toLocaleString("mn-MN")}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAction(t.id, "APPROVE")}
                          className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded transition-colors border border-green-500/20"
                          title="Батлах"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAction(t.id, "REJECT")}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded transition-colors border border-red-500/20"
                          title="Татгалзах"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
