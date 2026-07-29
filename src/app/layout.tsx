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
import { InvitePoller } from "@/components/InvitePoller";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from 'sonner';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session: any = await getSession();

  return (
    <html lang="mn" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('dota-theme') === 'radiant') {
                  document.documentElement.classList.add('theme-radiant');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased min-h-screen bg-background text-foreground flex flex-col`}>
        <Toaster richColors position="top-center" theme="dark" />
        <Ping />
        <InvitePoller />
        <nav className="border-b border-secondary/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              DOTA 2 MONGOLIA
            </a>
            <div className="flex gap-4">
              <a href="/leaderboard" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">Шилдэг</a>
              <a href="/online" className="px-4 py-2 text-sm font-medium text-green-400 hover:text-green-300 transition-colors flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Онлайн
              </a>
              <a href="/active-matches" className="px-4 py-2 text-sm font-medium hover:text-red-400 transition-colors flex items-center gap-1 text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Live Лобби
              </a>
              <a href="/lobbies" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">Бүх Лобби</a>
              <div className="px-4 py-2 text-sm font-medium text-white/30 cursor-not-allowed flex items-center gap-1">
                Тэмцээн <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50">Удахгүй</span>
              </div>
              {session ? (
                <a href="/dashboard" className="px-4 py-2 text-sm font-medium bg-secondary hover:bg-secondary/80 text-white rounded-md transition-colors">Профайл / Хэтэвч</a>
              ) : (
                <>
                  <a href="/login" className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors">Нэвтрэх</a>
                  <a href="/register" className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-md transition-colors">Бүртгүүлэх</a>
                </>
              )}
              <div className="ml-2 pl-2 border-l border-white/10 flex items-center">
                <ThemeToggle />
              </div>
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
