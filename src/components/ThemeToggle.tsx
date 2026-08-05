"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("dire");

  useEffect(() => {
    const savedTheme = localStorage.getItem("dota-theme");
    if (savedTheme === "radiant") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme("radiant");
      document.documentElement.classList.add("theme-radiant");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "dire") {
      setTheme("radiant");
      document.documentElement.classList.add("theme-radiant");
      localStorage.setItem("dota-theme", "radiant");
    } else {
      setTheme("dire");
      document.documentElement.classList.remove("theme-radiant");
      localStorage.setItem("dota-theme", "dire");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-black/20 hover:bg-black/40 border border-white/5 transition-colors flex items-center justify-center"
      title={theme === "dire" ? "Radiant горимд шилжих" : "Dire горимд шилжих"}
    >
      {theme === "dire" ? (
        <Sun className="w-4 h-4 text-primary" />
      ) : (
        <Moon className="w-4 h-4 text-accent" />
      )}
    </button>
  );
}
