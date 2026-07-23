import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dota 2 Mongolia - Matchmaking & Betting",
  description: "Монголын Dota 2 тоглогчдод зориулсан бооцоот тоглолт, лобби систем.",
};

import { getSession } from "@/lib/auth";
import { Ping } from "@/components/Ping";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session: any = await getSession();

  return (
    <html lang="mn">
      <body className={`${inter.variable} antialiased min-h-screen bg-background text-foreground flex flex-col`}>
        <Ping />
        <nav className="border-b border-secondary/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              DOTA 2 MONGOLIA
            </a>
            <div className="flex gap-4">
              <a href="/lobbies" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">Лоббинууд</a>
              {session ? (
                <a href="/dashboard" className="px-4 py-2 text-sm font-medium bg-secondary hover:bg-secondary/80 text-white rounded-md transition-colors">Профайл / Хэтэвч</a>
              ) : (
                <>
                  <a href="/login" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">Нэвтрэх</a>
                  <a href="/register" className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-md transition-colors">Бүртгүүлэх</a>
                </>
              )}
            </div>
          </div>
        </nav>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <footer className="border-t border-secondary/50 py-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Dota 2 Mongolia. Бүх эрх хуулиар хамгаалагдсан.
        </footer>
      </body>
    </html>
  );
}
