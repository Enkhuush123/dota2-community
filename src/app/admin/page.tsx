"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const res = await fetch("/api/admin/transactions");
      if (!res.ok) {
        if (res.status === 401) router.push("/");
        return;
      }
      const data = await res.json();
      setTransactions(data.transactions);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (id: string, status: string) => {
    try {
      await fetch("/api/admin/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id, status }),
      });
      fetchTransactions();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="flex-1 flex justify-center items-center">Уншиж байна...</div>;

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Админ Самбар</h1>
      
      <div className="bg-secondary/20 p-6 rounded-xl border border-secondary/50">
        <h2 className="text-xl font-bold mb-4">Гүйлгээний Хүсэлтүүд (Зөвхөн PENDING)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/40 text-gray-300">
              <tr>
                <th className="p-3">Хэрэглэгч</th>
                <th className="p-3">Төрөл</th>
                <th className="p-3">Дүн</th>
                <th className="p-3">Огноо</th>
                <th className="p-3 text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {transactions.filter(t => t.status === "PENDING").map((tx: any) => (
                <tr key={tx.id} className="border-b border-secondary/30">
                  <td className="p-3">{tx.user?.username}</td>
                  <td className="p-3">
                    {tx.type === "DEPOSIT" ? <span className="text-green-400">Орлого</span> : <span className="text-red-400">Зарлага</span>}
                  </td>
                  <td className="p-3 font-bold">₮{tx.amount}</td>
                  <td className="p-3">{new Date(tx.createdAt).toLocaleString("mn-MN")}</td>
                  <td className="p-3 text-right flex justify-end gap-2">
                    <button onClick={() => handleAction(tx.id, "COMPLETED")} className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"><Check className="w-4 h-4"/></button>
                    <button onClick={() => handleAction(tx.id, "REJECTED")} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"><X className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
              {transactions.filter(t => t.status === "PENDING").length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-gray-400">Хүлээгдэж буй хүсэлт алга байна.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
